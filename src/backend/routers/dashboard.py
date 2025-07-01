from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, case
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from database import AsyncSessionLocal
from models import LogEntry

router = APIRouter(prefix="/stats")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


def convert_to_naive_datetime(dt: datetime) -> datetime:
    """타임존 정보가 있는 datetime을 타임존 정보 없는 datetime으로 변환"""
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


@router.get("/traffic", summary="트래픽 분포 분석")
async def traffic(
    start: datetime = Query(..., description="조회 시작 시각 (ISO)"),
    end: datetime = Query(..., description="조회 종료 시각 (ISO)"),
    interval: int = Query(5, description="집계 주기(분)"),
    db: AsyncSession = Depends(get_db),
):
    # 타임존 정보 제거
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
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
    result = await db.execute(sql, {"start": start_naive, "end": end_naive, "interval": interval})
    return [{"timestamp": row.bucket.isoformat(), "count": row.count} for row in result]


@router.get("/usage", summary="엔드포인트별 사용 현황")
async def usage(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    # 타임존 정보 제거
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
    stmt = (
        select(
            LogEntry.path,
            func.count().label("count"),
            func.avg(LogEntry.latency_ms).label("avg_ms"),
            func.sum(case((LogEntry.status >= 400, 1), else_=0)).label("error_count"),
            func.sum(case((LogEntry.status < 400, 1), else_=0)).label("success_count"),
        )
        .where(LogEntry.timestamp.between(start_naive, end_naive))
        .group_by(LogEntry.path)
        .order_by(func.count().desc())
    )
    result = await db.execute(stmt)
    return [
        {
            "path": row.path,
            "count": row.count,
            "avg_ms": float(row.avg_ms),
            "error_count": int(row.error_count),
            "success_count": int(row.success_count)
        }
        for row in result
    ]


@router.get("/errors", summary="상태 코드 분포")
async def errors(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    # 타임존 정보 제거
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
    stmt = (
        select(
            (LogEntry.status / 100 * 100).label("category"),
            func.count().label("count"),
        )
        .where(LogEntry.timestamp.between(start_naive, end_naive))
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
    # 타임존 정보 제거
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
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
    result = await db.execute(sql, {"start": start_naive, "end": end_naive, "top_n": top_n})
    return [
        {"path": row.path, "avg_ms": float(row.avg_ms), "p90_ms": float(row.p90_ms)}
        for row in result
    ]


@router.get("/patterns", summary="트래픽 패턴 분석")
async def analyze_patterns(
    start: datetime = Query(..., description="조회 시작 시각 (ISO)"),
    end: datetime = Query(..., description="조회 종료 시각 (ISO)"),
    db: AsyncSession = Depends(get_db),
):
    """트래픽 패턴을 분석하여 인사이트를 제공합니다."""
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
    # 시간대별 트래픽 분석
    hourly_query = select(
        func.extract('hour', LogEntry.timestamp).label('hour'),
        func.count().label('count'),
        func.avg(LogEntry.latency_ms).label('avg_latency'),
        func.count(case((LogEntry.status >= 400, 1))).label('error_count')
    ).where(
        LogEntry.timestamp >= start_naive,
        LogEntry.timestamp <= end_naive
    ).group_by(
        func.extract('hour', LogEntry.timestamp)
    ).order_by(
        func.extract('hour', LogEntry.timestamp)
    )
    
    hourly_result = await db.execute(hourly_query)
    hourly_data = hourly_result.fetchall()
    
    # 피크 시간대 분석
    peak_hour = max(hourly_data, key=lambda x: x.count) if hourly_data else None
    off_peak_hour = min(hourly_data, key=lambda x: x.count) if hourly_data else None
    
    # 요일별 트래픽 분석
    daily_query = select(
        func.extract('dow', LogEntry.timestamp).label('day_of_week'),
        func.count().label('count'),
        func.avg(LogEntry.latency_ms).label('avg_latency')
    ).where(
        LogEntry.timestamp >= start_naive,
        LogEntry.timestamp <= end_naive
    ).group_by(
        func.extract('dow', LogEntry.timestamp)
    ).order_by(
        func.extract('dow', LogEntry.timestamp)
    )
    
    daily_result = await db.execute(daily_query)
    daily_data = daily_result.fetchall()
    
    # 패턴 인사이트 생성
    insights = []
    
    if peak_hour and off_peak_hour:
        peak_ratio = peak_hour.count / off_peak_hour.count if off_peak_hour.count > 0 else 1
        insights.append({
            "type": "peak_traffic",
            "title": "피크 시간대 분석",
            "description": f"오후 {peak_hour.hour}시에 트래픽이 최고조를 보이며, 오후 {off_peak_hour.hour}시 대비 {peak_ratio:.1f}배 높습니다.",
            "recommendation": "피크 시간대에 서버 리소스를 확장하거나 로드 밸런싱을 고려하세요.",
            "severity": "medium"
        })
    
    # 에러 패턴 분석
    total_errors = sum(row.error_count for row in hourly_data)
    total_requests = sum(row.count for row in hourly_data)
    error_rate = (total_errors / total_requests * 100) if total_requests > 0 else 0
    
    if error_rate > 5:
        insights.append({
            "type": "high_error_rate",
            "title": "높은 에러율 감지",
            "description": f"전체 에러율이 {error_rate:.1f}%로 높은 수준입니다.",
            "recommendation": "에러 로그를 분석하여 근본 원인을 파악하고 수정하세요.",
            "severity": "high"
        })
    
    # 응답시간 패턴 분석
    avg_latency = sum(row.avg_latency * row.count for row in hourly_data) / total_requests if total_requests > 0 else 0
    if avg_latency > 500:
        insights.append({
            "type": "slow_response",
            "title": "느린 응답시간",
            "description": f"평균 응답시간이 {avg_latency:.0f}ms로 느린 수준입니다.",
            "recommendation": "데이터베이스 쿼리 최적화나 캐싱 전략을 검토하세요.",
            "severity": "medium"
        })
    
    return {
        "hourly_patterns": [
            {
                "hour": int(row.hour),
                "count": row.count,
                "avg_latency": float(row.avg_latency) if row.avg_latency else 0,
                "error_count": row.error_count
            } for row in hourly_data
        ],
        "daily_patterns": [
            {
                "day_of_week": int(row.day_of_week),
                "count": row.count,
                "avg_latency": float(row.avg_latency) if row.avg_latency else 0
            } for row in daily_data
        ],
        "insights": insights,
        "summary": {
            "total_requests": total_requests,
            "total_errors": total_errors,
            "error_rate": error_rate,
            "avg_latency": avg_latency,
            "peak_hour": peak_hour.hour if peak_hour else None,
            "off_peak_hour": off_peak_hour.hour if off_peak_hour else None
        }
    }


@router.get("/anomalies", summary="이상 징후 감지")
async def detect_anomalies(
    start: datetime = Query(..., description="조회 시작 시각 (ISO)"),
    end: datetime = Query(..., description="조회 종료 시각 (ISO)"),
    db: AsyncSession = Depends(get_db),
):
    """로그 데이터에서 이상 징후를 감지합니다."""
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
    # 5분 간격으로 트래픽 분석
    interval_query = select(
        func.date_trunc('minute', LogEntry.timestamp).label('interval'),
        func.count().label('count'),
        func.avg(LogEntry.latency_ms).label('avg_latency'),
        func.count(case((LogEntry.status >= 400, 1))).label('error_count')
    ).where(
        LogEntry.timestamp >= start_naive,
        LogEntry.timestamp <= end_naive
    ).group_by(
        func.date_trunc('minute', LogEntry.timestamp)
    ).order_by(
        func.date_trunc('minute', LogEntry.timestamp)
    )
    
    interval_result = await db.execute(interval_query)
    interval_data = interval_result.fetchall()
    
    # 통계 계산
    counts = [row.count for row in interval_data]
    latencies = [row.avg_latency for row in interval_data if row.avg_latency]
    
    if not counts:
        return {"anomalies": [], "summary": "분석할 데이터가 없습니다."}
    
    # 이상치 감지 (3-시그마 규칙)
    mean_count = sum(counts) / len(counts)
    std_count = (sum((x - mean_count) ** 2 for x in counts) / len(counts)) ** 0.5
    
    mean_latency = sum(latencies) / len(latencies) if latencies else 0
    std_latency = (sum((x - mean_latency) ** 2 for x in latencies) / len(latencies)) ** 0.5 if latencies else 0
    
    anomalies = []
    
    for i, row in enumerate(interval_data):
        interval_anomalies = []
        
        # 트래픽 이상치
        if abs(row.count - mean_count) > 2 * std_count:
            interval_anomalies.append({
                "type": "traffic_spike" if row.count > mean_count else "traffic_drop",
                "description": f"트래픽이 평균 대비 {abs(row.count - mean_count) / std_count:.1f}σ {'증가' if row.count > mean_count else '감소'}",
                "value": row.count,
                "expected": f"{mean_count:.1f} ± {std_count:.1f}"
            })
        
        # 응답시간 이상치
        if row.avg_latency and latencies and abs(row.avg_latency - mean_latency) > 2 * std_latency:
            interval_anomalies.append({
                "type": "slow_response",
                "description": f"응답시간이 평균 대비 {abs(row.avg_latency - mean_latency) / std_latency:.1f}σ 증가",
                "value": f"{row.avg_latency:.0f}ms",
                "expected": f"{mean_latency:.0f} ± {std_latency:.0f}ms"
            })
        
        # 에러율 이상치
        error_rate = (row.error_count / row.count * 100) if row.count > 0 else 0
        if error_rate > 10:  # 10% 이상 에러율
            interval_anomalies.append({
                "type": "high_error_rate",
                "description": f"에러율이 {error_rate:.1f}%로 높은 수준",
                "value": f"{error_rate:.1f}%",
                "expected": "< 5%"
            })
        
        if interval_anomalies:
            anomalies.append({
                "timestamp": row.interval.isoformat(),
                "anomalies": interval_anomalies
            })
    
    return {
        "anomalies": anomalies,
        "summary": {
            "total_intervals": len(interval_data),
            "anomaly_intervals": len(anomalies),
            "anomaly_rate": (len(anomalies) / len(interval_data) * 100) if interval_data else 0,
            "mean_traffic": mean_count,
            "mean_latency": mean_latency
        }
    }


@router.get("/recommendations", summary="성능 개선 권장사항")
async def get_recommendations(
    start: datetime = Query(..., description="조회 시작 시각 (ISO)"),
    end: datetime = Query(..., description="조회 종료 시각 (ISO)"),
    db: AsyncSession = Depends(get_db),
):
    """분석 결과를 바탕으로 성능 개선 권장사항을 제공합니다."""
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
    # 전체 통계 수집
    stats_query = select(
        func.count().label('total_requests'),
        func.avg(LogEntry.latency_ms).label('avg_latency'),
        func.count(case((LogEntry.status >= 400, 1))).label('error_count'),
        func.count(case((LogEntry.status >= 500, 1))).label('server_error_count')
    ).where(
        LogEntry.timestamp >= start_naive,
        LogEntry.timestamp <= end_naive
    )
    
    stats_result = await db.execute(stats_query)
    stats = stats_result.fetchone()
    
    # 엔드포인트별 성능 분석
    endpoint_query = select(
        LogEntry.path,
        func.count().label('count'),
        func.avg(LogEntry.latency_ms).label('avg_latency'),
        func.count(case((LogEntry.status >= 400, 1))).label('error_count')
    ).where(
        LogEntry.timestamp >= start_naive,
        LogEntry.timestamp <= end_naive
    ).group_by(
        LogEntry.path
    ).order_by(
        func.avg(LogEntry.latency_ms).desc()
    ).limit(10)
    
    endpoint_result = await db.execute(endpoint_query)
    endpoints = endpoint_result.fetchall()
    
    recommendations = []
    
    # 전체 성능 분석
    total_requests = stats.total_requests
    avg_latency = float(stats.avg_latency) if stats.avg_latency else 0
    error_rate = (stats.error_count / total_requests * 100) if total_requests > 0 else 0
    server_error_rate = (stats.server_error_count / total_requests * 100) if total_requests > 0 else 0
    
    if avg_latency > 500:
        recommendations.append({
            "category": "performance",
            "priority": "high",
            "title": "응답시간 최적화 필요",
            "description": f"평균 응답시간이 {avg_latency:.0f}ms로 느린 수준입니다.",
            "actions": [
                "데이터베이스 쿼리 최적화",
                "캐싱 전략 도입",
                "CDN 활용 검토",
                "서버 리소스 확장 고려"
            ],
            "impact": "사용자 경험 개선, 이탈률 감소"
        })
    
    if error_rate > 5:
        recommendations.append({
            "category": "reliability",
            "priority": "high",
            "title": "에러율 개선 필요",
            "description": f"전체 에러율이 {error_rate:.1f}%로 높은 수준입니다.",
            "actions": [
                "에러 로그 상세 분석",
                "입력값 검증 강화",
                "예외 처리 개선",
                "모니터링 강화"
            ],
            "impact": "서비스 안정성 향상, 고객 만족도 개선"
        })
    
    if server_error_rate > 1:
        recommendations.append({
            "category": "reliability",
            "priority": "critical",
            "title": "서버 에러 긴급 개선 필요",
            "description": f"서버 에러율이 {server_error_rate:.1f}%로 심각한 수준입니다.",
            "actions": [
                "즉시 서버 로그 분석",
                "데이터베이스 연결 상태 확인",
                "외부 서비스 의존성 점검",
                "롤백 또는 핫픽스 적용"
            ],
            "impact": "서비스 중단 방지, 신뢰성 회복"
        })
    
    # 느린 엔드포인트 분석
    slow_endpoints = [ep for ep in endpoints if ep.avg_latency and ep.avg_latency > 1000]
    if slow_endpoints:
        recommendations.append({
            "category": "performance",
            "priority": "medium",
            "title": "느린 엔드포인트 최적화",
            "description": f"{len(slow_endpoints)}개 엔드포인트의 응답시간이 1초를 초과합니다.",
            "actions": [
                f"'{slow_endpoints[0].path}' 엔드포인트 우선 최적화",
                "데이터베이스 인덱스 검토",
                "비동기 처리 도입 검토",
                "API 응답 구조 최적화"
            ],
            "impact": "특정 기능의 사용성 개선"
        })
    
    return {
        "recommendations": recommendations,
        "summary": {
            "total_recommendations": len(recommendations),
            "high_priority": len([r for r in recommendations if r["priority"] in ["high", "critical"]]),
            "performance_issues": len([r for r in recommendations if r["category"] == "performance"]),
            "reliability_issues": len([r for r in recommendations if r["category"] == "reliability"])
        },
        "metrics": {
            "total_requests": total_requests,
            "avg_latency": avg_latency,
            "error_rate": error_rate,
            "server_error_rate": server_error_rate
        }
    }


@router.get("/recent-logs", summary="최근 로그 조회")
async def recent_logs(
    limit: int = Query(50, description="조회할 로그 개수"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(LogEntry)
        .order_by(LogEntry.id.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "method": log.method,
            "path": log.path,
            "status": log.status,
            "latency_ms": log.latency_ms,
            "client_ip": log.client_ip,
        }
        for log in logs
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


@router.get("/status-endpoint-top", summary="상태코드별 엔드포인트별 호출수 TOP")
async def status_endpoint_top(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: AsyncSession = Depends(get_db),
):
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    sql = text('''
        SELECT status, path, COUNT(*) as count
        FROM logs
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY status, path
        ORDER BY status, count DESC
    ''')
    result = await db.execute(sql, {"start": start_naive, "end": end_naive})
    rows = result.fetchall()
    # 상태코드별로 가장 많이 호출된 엔드포인트만 추출
    top_by_status = {}
    for row in rows:
        status = str(row.status)
        if status not in top_by_status:
            top_by_status[status] = {"path": row.path, "count": row.count}
    return top_by_status


@router.get("/error-heatmap", summary="시간대별/엔드포인트별 에러율 히트맵")
async def error_heatmap(
    start: datetime = Query(...),
    end: datetime = Query(...),
    interval: int = Query(5, description="분 단위"),
    db: AsyncSession = Depends(get_db),
):
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    sql = text('''
        SELECT 
            date_trunc('minute', timestamp) as interval,
            path,
            COUNT(*) as total,
            SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as error_count
        FROM logs
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY interval, path
        ORDER BY interval, path
    ''')
    result = await db.execute(sql, {"start": start_naive, "end": end_naive})
    rows = result.fetchall()
    # 히트맵 데이터: [{interval, path, error_rate} ...]
    heatmap = []
    for row in rows:
        error_rate = (row.error_count / row.total * 100) if row.total > 0 else 0
        heatmap.append({
            "interval": row.interval.isoformat(),
            "path": row.path,
            "error_rate": error_rate
        })
    return heatmap


@router.get("/slow-endpoints", summary="평균 응답시간이 가장 느린 엔드포인트 TOP N")
async def slow_endpoints(
    start: datetime = Query(...),
    end: datetime = Query(...),
    top_n: int = Query(5),
    db: AsyncSession = Depends(get_db),
):
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    sql = text('''
        SELECT path, COUNT(*) as count, AVG(latency_ms) as avg_latency
        FROM logs
        WHERE timestamp BETWEEN :start AND :end
        GROUP BY path
        HAVING COUNT(*) > 10
        ORDER BY avg_latency DESC
        LIMIT :top_n
    ''')
    result = await db.execute(sql, {"start": start_naive, "end": end_naive, "top_n": top_n})
    rows = result.fetchall()
    return [
        {"path": row.path, "count": row.count, "avg_latency": float(row.avg_latency)}
        for row in rows
    ]


@router.get("/endpoint-detail", summary="엔드포인트별 상세 분석")
async def endpoint_detail(
    path: str = Query(..., description="분석할 엔드포인트 경로"),
    start: datetime = Query(..., description="조회 시작 시각 (ISO)"),
    end: datetime = Query(..., description="조회 종료 시각 (ISO)"),
    interval: int = Query(1, description="분석 주기(분)"),
    db: AsyncSession = Depends(get_db),
):
    """특정 엔드포인트의 상세 분석을 제공합니다."""
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
    # interval 주기별 요청 수 및 평균 레이턴시
    time_series_sql = text(f"""
        SELECT
          date_trunc('minute', timestamp)
            + floor(date_part('minute', timestamp)/:interval)* :interval * interval '1 minute' AS bucket,
          count(*) AS request_count,
          avg(latency_ms) AS avg_latency,
          sum(case when status >= 400 then 1 else 0 end) AS error_count,
          sum(case when status < 400 then 1 else 0 end) AS success_count
        FROM logs
        WHERE path = :path 
          AND timestamp BETWEEN :start AND :end
        GROUP BY bucket
        ORDER BY bucket
    """)
    
    time_series_result = await db.execute(
        time_series_sql, 
        {"path": path, "start": start_naive, "end": end_naive, "interval": interval}
    )
    raw_data = [
        {
            "timestamp": row.bucket,
            "request_count": row.request_count,
            "avg_latency": float(row.avg_latency) if row.avg_latency else 0,
            "error_count": row.error_count,
            "success_count": row.success_count,
            "error_rate": (row.error_count / row.request_count * 100) if row.request_count > 0 else 0
        }
        for row in time_series_result
    ]
    # 1. 집계 결과를 dict로 변환
    bucket_map = {row['timestamp']: row for row in raw_data}
    # 2. 시작 시각을 interval 단위로 내림 (align)
    def align_to_interval(dt, interval):
        minute = (dt.minute // interval) * interval
        return dt.replace(minute=minute, second=0, microsecond=0)
    cur = align_to_interval(start_naive, interval)
    end_point = align_to_interval(end_naive, interval)
    time_series_data = []
    while cur <= end_point:
        row = bucket_map.get(cur)
        if row:
            time_series_data.append({
                "timestamp": cur.isoformat(),
                "request_count": row["request_count"],
                "avg_latency": row["avg_latency"],
                "error_count": row["error_count"],
                "success_count": row["success_count"],
                "error_rate": row["error_rate"]
            })
        else:
            time_series_data.append({
                "timestamp": cur.isoformat(),
                "request_count": 0,
                "avg_latency": 0,
                "error_count": 0,
                "success_count": 0,
                "error_rate": 0
            })
        cur += timedelta(minutes=interval)
    
    # 상태 코드별 분포
    status_sql = text("""
        SELECT
          status,
          count(*) AS count
        FROM logs
        WHERE path = :path 
          AND timestamp BETWEEN :start AND :end
        GROUP BY status
        ORDER BY count DESC
    """)
    
    status_result = await db.execute(
        status_sql, 
        {"path": path, "start": start_naive, "end": end_naive}
    )
    status_distribution = [
        {"status": row.status, "count": row.count}
        for row in status_result
    ]
    
    # 전체 통계
    summary_sql = text("""
        SELECT
          count(*) AS total_requests,
          avg(latency_ms) AS avg_latency,
          min(latency_ms) AS min_latency,
          max(latency_ms) AS max_latency,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS median_latency,
          percentile_cont(0.9) WITHIN GROUP (ORDER BY latency_ms) AS p90_latency,
          sum(case when status >= 400 then 1 else 0 end) AS total_errors,
          sum(case when status < 400 then 1 else 0 end) AS total_success
        FROM logs
        WHERE path = :path 
          AND timestamp BETWEEN :start AND :end
    """)
    
    summary_result = await db.execute(
        summary_sql, 
        {"path": path, "start": start_naive, "end": end_naive}
    )
    summary_row = summary_result.fetchone()
    
    if summary_row:
        summary = {
            "total_requests": summary_row.total_requests,
            "avg_latency": float(summary_row.avg_latency) if summary_row.avg_latency else 0,
            "min_latency": float(summary_row.min_latency) if summary_row.min_latency else 0,
            "max_latency": float(summary_row.max_latency) if summary_row.max_latency else 0,
            "median_latency": float(summary_row.median_latency) if summary_row.median_latency else 0,
            "p90_latency": float(summary_row.p90_latency) if summary_row.p90_latency else 0,
            "total_errors": summary_row.total_errors,
            "total_success": summary_row.total_success,
            "error_rate": (summary_row.total_errors / summary_row.total_requests * 100) if summary_row.total_requests > 0 else 0
        }
    else:
        summary = {
            "total_requests": 0,
            "avg_latency": 0,
            "min_latency": 0,
            "max_latency": 0,
            "median_latency": 0,
            "p90_latency": 0,
            "total_errors": 0,
            "total_success": 0,
            "error_rate": 0
        }
    
    return {
        "path": path,
        "summary": summary,
        "time_series": time_series_data,
        "status_distribution": status_distribution
    }


@router.get("/endpoints", summary="사용 가능한 엔드포인트 목록")
async def get_endpoints(
    start: datetime = Query(..., description="조회 시작 시각 (ISO)"),
    end: datetime = Query(..., description="조회 종료 시각 (ISO)"),
    db: AsyncSession = Depends(get_db),
):
    """지정된 기간 동안 사용된 모든 엔드포인트 목록을 반환합니다."""
    start_naive = convert_to_naive_datetime(start)
    end_naive = convert_to_naive_datetime(end)
    
    stmt = (
        select(LogEntry.path)
        .where(LogEntry.timestamp.between(start_naive, end_naive))
        .group_by(LogEntry.path)
        .order_by(LogEntry.path)
    )
    result = await db.execute(stmt)
    return [{"path": row.path} for row in result]
