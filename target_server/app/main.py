from fastapi import FastAPI, Request
import time
import random
import logging
import uvicorn
import json
import os
from simulate import run_simulation
from fastapi.responses import HTMLResponse, JSONResponse
import subprocess
import signal

app = FastAPI()

# 로그 디렉토리 및 파일 설정
log_dir = "/var/log"
log_file = os.path.join(log_dir, "access.log")

# 디렉토리 없으면 생성
os.makedirs(log_dir, exist_ok=True)

# 로거 설정
logger = logging.getLogger("custom.access")
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

# 기존 시뮬레이터 실행/중지 로직을 확장: 여러 프로세스 관리
sim_process = None
sim2_process = None
sim3_process = None

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = int((time.time() - start_time) * 1000)
    # /api/로 시작하는 엔드포인트만 로그 기록
    if request.url.path.startswith("/api/"):
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

@app.post("/run-simulate")
def run_simulate():
    run_simulation(10)  # 10회 실행, 필요시 조정
    return {"result": "simulation done"}

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
    <head>
        <title>시뮬레이션 컨트롤</title>
        <style>
            body { font-family: sans-serif; background: #f7f7f7; }
            .container { max-width: 500px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px; }
            h2 { text-align: center; }
            .sim-block { margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
            .sim-block:last-child { border-bottom: none; }
            button { padding: 10px 24px; font-size: 1rem; border-radius: 6px; border: none; background: #1976d2; color: #fff; cursor: pointer; margin-top: 8px; margin-right: 8px; }
            button:hover { background: #1565c0; }
            .desc { color: #444; font-size: 0.97rem; margin-top: 8px; }
            .stop-btn { background: #b71c1c; }
            .stop-btn:hover { background: #8a1616; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>시뮬레이션 컨트롤 패널</h2>
            <div class="sim-block">
                <b>기본 시뮬레이션</b><br/>
                <span class="desc">정상(200) 응답이 주로 발생하는 일반적인 서비스 상황을 시뮬레이션합니다.</span><br/>
                <button onclick="fetch('/start-simulate', {method: 'POST'}).then(r=>r.json()).then(d=>alert(d.result))">start</button>
                <button class='stop-btn' onclick="fetch('/stop-simulate', {method: 'POST'}).then(r=>r.json()).then(d=>alert(d.result))">stop</button>
            </div>
            <div class="sim-block">
                <b>에러율 높은 시뮬레이션</b><br/>
                <span class="desc">200(정상) 응답이 적고, 404/500 에러가 더 자주 발생하는 환경을 시뮬레이션합니다.</span><br/>
                <button onclick="fetch('/start-simulate2', {method: 'POST'}).then(r=>r.json()).then(d=>alert(d.result))"> start</button>
                <button class='stop-btn' onclick="fetch('/stop-simulate2', {method: 'POST'}).then(r=>r.json()).then(d=>alert(d.result))">stop</button>
            </div>
            <div class="sim-block">
                <b>특정 API 장애 집중 시뮬레이션</b><br/>
                <span class="desc">/api/order/checkout, /api/auth/login에서만 500 에러가 집중적으로 발생하는 상황을 시뮬레이션합니다.</span><br/>
                <button onclick="fetch('/start-simulate3', {method: 'POST'}).then(r=>r.json()).then(d=>alert(d.result))">start</button>
                <button class='stop-btn' onclick="fetch('/stop-simulate3', {method: 'POST'}).then(r=>r.json()).then(d=>alert(d.result))">stop</button>
            </div>
            <div style="text-align:center; margin-top:24px;">
                <button style="background:#333;" onclick="fetch('/stop-all-simulate', {method: 'POST'}).then(r=>r.json()).then(d=>alert(d.result))">all stop</button>
            </div>
        </div>
    </body>
    </html>
    """

@app.post("/start-simulate")
def start_simulate():
    global sim_process
    if sim_process and sim_process.poll() is None:
        return JSONResponse({"result": "기본 시뮬이 이미 실행 중입니다."})
    sim_process = subprocess.Popen(["python", "simulate.py"])
    return JSONResponse({"result": "기본 시뮬레이션 시작됨."})

@app.post("/start-simulate2")
def start_simulate2():
    global sim2_process
    if sim2_process and sim2_process.poll() is None:
        return JSONResponse({"result": "에러율↑ 시뮬이 이미 실행 중입니다."})
    sim2_process = subprocess.Popen(["python", "simulate2.py"])
    return JSONResponse({"result": "에러율↑ 시뮬레이션 시작됨."})

@app.post("/start-simulate3")
def start_simulate3():
    global sim3_process
    if sim3_process and sim3_process.poll() is None:
        return JSONResponse({"result": "특정 장애 시뮬이 이미 실행 중입니다."})
    sim3_process = subprocess.Popen(["python", "simulate3.py"])
    return JSONResponse({"result": "특정 장애 시뮬레이션 시작됨."})

@app.post("/stop-simulate")
def stop_simulate():
    global sim_process, sim2_process, sim3_process
    stopped = []
    for proc, name in zip([sim_process, sim2_process, sim3_process], ["기본", "에러율↑", "특정 장애"]):
        if proc and proc.poll() is None:
            proc.terminate()
            proc.wait(timeout=5)
            stopped.append(name)
    sim_process = sim2_process = sim3_process = None
    if stopped:
        return JSONResponse({"result": f"{', '.join(stopped)} 시뮬 중지됨."})
    return JSONResponse({"result": "실행 중인 시뮬이 없습니다."})

@app.post("/stop-simulate2")
def stop_simulate2():
    global sim2_process
    if sim2_process and sim2_process.poll() is None:
        sim2_process.terminate()
        sim2_process.wait(timeout=5)
        sim2_process = None
        return JSONResponse({"result": "에러율↑ 시뮬 중지됨."})
    return JSONResponse({"result": "에러율↑ 시뮬이 실행 중이 아닙니다."})

@app.post("/stop-simulate3")
def stop_simulate3():
    global sim3_process
    if sim3_process and sim3_process.poll() is None:
        sim3_process.terminate()
        sim3_process.wait(timeout=5)
        sim3_process = None
        return JSONResponse({"result": "특정 장애 시뮬 중지됨."})
    return JSONResponse({"result": "특정 장애 시뮬이 실행 중이 아닙니다."})

@app.post("/stop-all-simulate")
def stop_all_simulate():
    global sim_process, sim2_process, sim3_process
    stopped = []
    for proc, name in zip([sim_process, sim2_process, sim3_process], ["기본", "에러율↑", "특정 장애"]):
        if proc and proc.poll() is None:
            proc.terminate()
            proc.wait(timeout=5)
            stopped.append(name)
    sim_process = sim2_process = sim3_process = None
    if stopped:
        return JSONResponse({"result": f"{', '.join(stopped)} 시뮬 중지됨."})
    return JSONResponse({"result": "실행 중인 시뮬이 없습니다."})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)
