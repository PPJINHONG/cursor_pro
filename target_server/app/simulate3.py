import time
import random
import json
from datetime import datetime

ENDPOINTS = [
    ("/api/user/list", "GET"),
    ("/api/user/create", "POST"),
    ("/api/order/checkout", "POST"),
    ("/api/product/view", "GET"),
    ("/api/auth/login", "POST"),
]

ACCESS_LOG_FILE = "/var/log/access.log"

def simulate_request():
    path, method = random.choice(ENDPOINTS)
    start = time.time()
    time.sleep(random.uniform(0.01, 0.5))
    latency = int((time.time() - start) * 1000)
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
    # 특정 엔드포인트에서만 500이 많이 발생
    if path in ["/api/order/checkout", "/api/auth/login"]:
        status = random.choices([200, 404, 500], weights=[20, 10, 70])[0]  # 500이 70%
    else:
        status = random.choices([200, 404, 500], weights=[85, 10, 5])[0]   # 200이 85%
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
    print(f"[SIM3] {method} {path} → {status} ({latency}ms)")

def run_simulation(n=1):
    for _ in range(n):
        simulate_request()
        time.sleep(3)

if __name__ == "__main__":
    while True:
        simulate_request()
        time.sleep(3) 