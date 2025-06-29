from fastapi import FastAPI, Request
import time
import random
import logging
import uvicorn
import json
import os

app = FastAPI()

# 로그 디렉토리 및 파일 설정
log_dir = "/var/log"
log_file = os.path.join(log_dir, "access.log")

# 디렉토리 없으면 생성
os.makedirs(log_dir, exist_ok=True)

# 로거 설정
logger = logging.getLogger("uvicorn.access")
logger.setLevel(logging.INFO)

# 중복 방지를 위해 기존 핸들러 제거
logger.handlers.clear()

# stdout 출력용 핸들러
stream_handler = logging.StreamHandler()
stream_handler.setFormatter(logging.Formatter('%(message)s'))
logger.addHandler(stream_handler)

# 파일 저장용 핸들러 (Fluent Bit가 읽는 로그 파일)
try:
    file_handler = logging.FileHandler(log_file, mode='a')
    file_handler.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(file_handler)
except Exception as e:
    logger.warning(f"❌ Failed to attach file handler to {log_file}: {e}")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = int((time.time() - start_time) * 1000)
    log_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "latency_ms": process_time
    }
    logger.info(json.dumps(log_data))
    return response

@app.get("/api/user/list")
async def get_users():
    time.sleep(random.uniform(0.01, 0.3))
    return {"users": ["alice", "bob", "carol"]}

@app.post("/api/user/create")
async def create_user():
    time.sleep(random.uniform(0.05, 0.4))
    return {"status": "created"}

@app.post("/api/order/checkout")
async def checkout():
    time.sleep(random.uniform(0.1, 0.5))
    return {"status": "ordered"}

@app.get("/api/product/view")
async def view_product():
    time.sleep(random.uniform(0.05, 0.3))
    return {"product": "apple"}

@app.post("/api/auth/login")
async def login():
    time.sleep(random.uniform(0.05, 0.4))
    return {"token": "abcd1234"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
