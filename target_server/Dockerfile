FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 시뮬레이션 스크립트 복사
COPY app/ /app/

# 로그 디렉토리 보장
RUN mkdir -p /var/log \
 && touch /var/log/access.log

# 시뮬레이터 실행
CMD ["python", "main.py"]