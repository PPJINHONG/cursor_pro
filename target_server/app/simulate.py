# simulate.py — 좀 더 깔끔하고 가볍게
import time
import random
import json
from datetime import datetime

# 시뮬레이션용 API 엔드포인트 리스트
ENDPOINTS = [
    ("/api/user/list", "GET"),
    ("/api/user/create", "POST"),
    ("/api/order/checkout", "POST"),
    ("/api/product/view", "GET"),
    ("/api/auth/login", "POST"),
]

ACCESS_LOG_FILE = "/var/log/access.log"  # Fluent Bit이 tail할 위치

def simulate_request():
    path, method = random.choice(ENDPOINTS)

    # 응답 지연(랜덤) 시뮬
    start = time.time()
    time.sleep(random.uniform(0.01, 0.5))
    latency = int((time.time() - start) * 1000)
    status = random.choices([200, 404, 500], weights=[80, 10, 10])[0]

    # naive ISO 포맷 (타임존 정보 없이)
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")

    log = {
        "timestamp": ts,
        "method":    method,
        "path":      path,
        "status":    status,
        "latency_ms": latency,
        "client_ip": "127.0.0.1"
    }

    with open(ACCESS_LOG_FILE, "a") as f:
        f.write(json.dumps(log, ensure_ascii=False) + "\n")

    print(f"[SIM] {method} {path} → {status} ({latency}ms)")

if __name__ == "__main__":
    # 무한 루프 대신 간단히 쓰고 싶으면 for문 사용해도 됩니다
    while True:
        simulate_request()
        time.sleep(random.uniform(0.3, 1.2))
