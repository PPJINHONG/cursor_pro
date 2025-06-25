from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from models import LogEntry
from schemas import LogCreate
from database import AsyncSessionLocal

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/ingest")
async def ingest_log(log: LogCreate, db: AsyncSession = Depends(get_db)):
    log_entry = LogEntry(**log.dict())
    db.add(log_entry)
    await db.commit()
    return {"message": "Log received"}
