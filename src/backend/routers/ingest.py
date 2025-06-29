# src/backend/routers/ingest.py
import json
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from models import LogEntry
from schemas import LogCreate
from database import AsyncSessionLocal

router = APIRouter(prefix="/log")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/ingest", status_code=201)
async def ingest_logs(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Flexible ingestion:
    - Supports full JSON body (object or list)
    - Supports JSON with 'records' key
    - Fallback to newline-delimited JSON
    """
    body = await request.body()
    try:
        text = body.decode("utf-8").strip()
    except UnicodeDecodeError:
        text = ""

    logs_data = []
    # 1) Try parsing entire body as JSON
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            if 'records' in parsed and isinstance(parsed['records'], list):
                logs_data = parsed['records']
            else:
                logs_data = [parsed]
        elif isinstance(parsed, list):
            logs_data = parsed
    except json.JSONDecodeError:
        pass

    # 2) Fallback: newline-delimited JSON objects
    if not logs_data:
        for line in text.splitlines():
            try:
                obj = json.loads(line)
                logs_data.append(obj)
            except json.JSONDecodeError:
                continue

    # Process and store
    stored = 0
    for item in logs_data:
        try:
            log = LogCreate(**item)
        except Exception:
            continue
        entry = LogEntry(**log.dict())
        db.add(entry)
        stored += 1

    if stored > 0:
        await db.commit()

    return {"message": f"{stored} logs stored"}
