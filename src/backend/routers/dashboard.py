from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import List, Optional
from datetime import datetime
from database import AsyncSessionLocal
from models import LogEntry

router = APIRouter(prefix="/stats")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.get("/traffic", summary="트래픽 분포 분석")
async def traffic(
    start: datetime = Query(..., description="조회 시작 시각 (ISO)"),
    end: datetime = Query(..., description="조회 종료 시각 (ISO)"),
    interval: int = Query(5, description="집계 주기(분)"),
    db: AsyncSession = Depends(get_db),
):
    sql = text("""
        SELECT
          date_trunc('hour', timestamp)
            + floor(date_part('minute', timestamp)/:interval)* :interval * interval '1 minute'
            AS bucket,
          count(*) AS count
        FROM logs
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY bucket
        ORDER BY bucket
    """)
    result = await db.execute(sql, {"start": start, "end": end, "interval": interval})
    return [{"timestamp": row.bucket.isoformat(), "count": row.count} for row in result]


@router.get("/usage", summary="엔드포인트별 사용 현황")
async def usage(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            LogEntry.path,
            func.count().label("count"),
            func.avg(LogEntry.latency_ms).label("avg_ms"),
        )
        .where(LogEntry.timestamp.between(start, end))
        .group_by(LogEntry.path)
        .order_by(func.count().desc())
    )
    result = await db.execute(stmt)
    return [
        {"path": row.path, "count": row.count, "avg_ms": float(row.avg_ms)}
        for row in result
    ]


@router.get("/errors", summary="상태 코드 분포")
async def errors(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            (LogEntry.status / 100 * 100).label("category"),
            func.count().label("count"),
        )
        .where(LogEntry.timestamp.between(start, end))
        .group_by(text("category"))
    )
    result = await db.execute(stmt)
    return {f"{int(row.category)}xx": row.count for row in result}


@router.get("/bottlenecks", summary="성능 병목 식별")
async def bottlenecks(
    start: datetime = Query(...),
    end: datetime = Query(...),
    top_n: int = Query(5, description="상위 N개"),
    db: AsyncSession = Depends(get_db),
):
    sql = text("""
        SELECT
          path,
          avg(latency_ms) AS avg_ms,
          percentile_cont(0.9) WITHIN GROUP (ORDER BY latency_ms) AS p90_ms
        FROM logs
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY path
        ORDER BY avg_ms DESC
        LIMIT :top_n
    """)
    result = await db.execute(sql, {"start": start, "end": end, "top_n": top_n})
    return [
        {"path": row.path, "avg_ms": float(row.avg_ms), "p90_ms": float(row.p90_ms)}
        for row in result
    ]


@router.get("/anomalies", summary="이상 요청 탐지")
async def anomalies(
    start: datetime = Query(...),
    end: datetime = Query(...),
    threshold: int = Query(100, description="에러 건수 기준"),
    db: AsyncSession = Depends(get_db),
):
    sql = text("""
        SELECT path, status, count(*) AS count
        FROM logs
        WHERE timestamp BETWEEN :start AND :end
          AND status >= 400
        GROUP BY path, status
        HAVING count(*) > :threshold
    """)
    result = await db.execute(sql, {"start": start, "end": end, "threshold": threshold})
    return [
        {"path": row.path, "status": row.status, "count": row.count}
        for row in result
    ]


@router.websocket("/logs/ws")
async def websocket_logs(websocket: WebSocket):
    """
    실시간 로그 스트림 (클라이언트 요청마다 최신 로그 1건 전송 예시)
    실제 운영 시에는 Redis Pub/Sub, Kafka, LISTEN/NOTIFY 등으로 대체하세요.
    """
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()  # 클라이언트 ping 용
            async with AsyncSessionLocal() as db:
                stmt = select(LogEntry).order_by(LogEntry.id.desc()).limit(1)
                res = await db.execute(stmt)
                recent = res.scalar_one_or_none()
                if recent:
                    await websocket.send_json({
                        "timestamp": recent.timestamp.isoformat(),
                        "method": recent.method,
                        "path": recent.path,
                        "status": recent.status,
                        "latency_ms": recent.latency_ms,
                        "client_ip": recent.client_ip,
                    })
    except WebSocketDisconnect:
        pass
