from fastapi import FastAPI
from routers.ingest import router as ingest_router
from routers.dashboard import router as stats_router
from database import init_db
import logging

logging.basicConfig(level=logging.INFO)
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    await init_db()
    logging.info("✅ Database initialized successfully.")

# 로그 수집 (/log/ingest) — ingest_router 에 이미 prefix="/log" 있음
app.include_router(ingest_router)

# 통계/대시보드 엔드포인트 (/api/…)
app.include_router(stats_router, prefix="/api")
