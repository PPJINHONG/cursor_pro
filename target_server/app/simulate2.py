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
    # 200:40%, 404:30%, 500:30%
    status = random.choices([200, 404, 500], weights=[40, 30, 30])[0]
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
    print(f"[SIM2] {method} {path} → {status} ({latency}ms)")

def run_simulation(n=1):
    for _ in range(n):
        simulate_request()
        time.sleep(3)

if __name__ == "__main__":
    while True:
        simulate_request()
        time.sleep(3) 