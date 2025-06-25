import time
import random
import requests
from datetime import datetime

ENDPOINTS = [
    ("/api/user/list", "GET"),
    ("/api/user/create", "POST"),
    ("/api/order/checkout", "POST"),
    ("/api/product/view", "GET"),
    ("/api/auth/login", "POST"),
]

TARGET_API = "http://host.docker.internal:8000/log/ingest"  # FastAPI 수신 엔드포인트

def generate_log():
    url, method = random.choice(ENDPOINTS)
    latency = random.randint(20, 500)  # ms
    status = random.choices([200, 200, 200, 404, 500], weights=[70, 10, 10, 5, 5])[0]
    log = {
        "timestamp": datetime.now().isoformat(),
        "method": method,
        "url": url,
        "status": status,
        "latency_ms": latency
    }
    return log

def send_log(log):
    try:
        response = requests.post(TARGET_API, json=log)
        print(f"Sent: {log['method']} {log['url']} → {log['status']} [{log['latency_ms']}ms] / Resp: {response.status_code}")
    except Exception as e:
        print("❌ Failed to send log:", e)

if __name__ == "__main__":
    while True:
        log = generate_log()
        send_log(log)
        time.sleep(random.uniform(0.2, 1.5))  # 0.2~1.5초 간격으로 전송
