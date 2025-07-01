from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers.ingest import router as ingest_router
from routers.dashboard import router as stats_router
from database import init_db
import logging
import time

# 로그 레벨을 DEBUG로 설정
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# 모든 요청을 로그로 출력하는 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"🔍 요청 시작: {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"✅ 요청 완료: {request.method} {request.url} - {response.status_code} ({process_time:.3f}s)")
    
    return response

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("✅ Database initialized successfully.")

# 로그 수집 (/log/ingest) — ingest_router 에 이미 prefix="/log" 있음
app.include_router(ingest_router)

# 통계/대시보드 엔드포인트 (/api/…)
app.include_router(stats_router, prefix="/api")
