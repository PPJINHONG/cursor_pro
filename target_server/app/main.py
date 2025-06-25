from fastapi import FastAPI, Request
import time
import random
import logging
import uvicorn

app = FastAPI()

logger = logging.getLogger("uvicorn.access")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(message)s')
handler.setFormatter(formatter)
logger.handlers = [handler]
logger.setLevel(logging.INFO)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = int((time.time() - start_time) * 1000)
    log_data = {
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "latency_ms": process_time
    }
    logger.info(log_data)
    return response

@app.get("/api/user/list")
async def get_users():
    time.sleep(random.uniform(0.01, 0.3))  # 가짜 지연
    return {"users": ["alice", "bob", "carol"]}

@app.post("/api/user/create")
async def create_user():
    time.sleep(random.uniform(0.05, 0.4))
    return {"status": "created"}

@app.get("/api/product/list")
async def get_products():
    time.sleep(random.uniform(0.02, 0.5))
    return {"products": ["apple", "banana", "carrot"]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
