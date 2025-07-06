서버 로그 데이터 분석
http://cursor-project.solomontech-cloud.kr/

로그 수집 대상 서버
http://cursor-project.solomontech-cloud.kr:8081/


# 📊 데이터 분석 시스템 (Log Analytics Platform)

실시간 로그 수집, 분석, 시각화 및 AI 인사이트를 제공하는 종합 데이터 분석 시스템입니다.

## 🏗️ 시스템 아키텍처

### 서버 구성
- **1번 서버**: Target Server + Fluent Bit (로그 수집)
- **2번 서버**: Frontend + Backend + Database (분석 및 시각화)

### 전체 플로우
```
Target Server (8081) → Fluent Bit → FastAPI Backend → PostgreSQL → React Frontend
```

## 🛠️ 기술 스택

### Backend
- **FastAPI**: 고성능 Python 웹 프레임워크
- **PostgreSQL**: 메인 데이터베이스
- **SQLAlchemy**: ORM 및 데이터베이스 관리
- **OpenAI GPT-3.5-turbo**: AI 분석 및 인사이트 생성
- **WebSocket**: 실시간 로그 스트리밍

### Frontend
- **React 19**: 사용자 인터페이스
- **TypeScript**: 타입 안전성
- **Recharts**: 데이터 시각화 차트
- **Axios**: HTTP 클라이언트
- **Nginx**: 프로덕션 웹 서버

### Infrastructure
- **Docker**: 컨테이너화
- **Docker Compose**: 멀티 컨테이너 오케스트레이션
- **Fluent Bit**: 로그 수집 및 전송

## 🚀 배포 구성

### 1번 서버 (로그 수집)
```yaml
# target_server/docker-compose.yaml
services:
  target-server:
    ports: ["8081:8081"]
    volumes: ["../log:/var/log"]

# fluentbit/docker-compose.yaml  
services:
  fluentbit:
    volumes: ["../log:/var/log"]
```

### 2번 서버 (분석 및 시각화)
```yaml
# src/docker-compose.yml
services:
  backend:
    ports: ["8000:8000"]
    depends_on: ["db"]
  
  db:
    image: postgres:15
    ports: ["5432:5432"]
    
  frontend:
    build: ./frontend
    ports: ["80:80"]  # Nginx
```

## 📈 주요 기능

### 1. 실시간 로그 수집
- **Target Server**: 테스트용 API 서버 (포트 8081)
- **Fluent Bit**: 로그 파일 모니터링 및 FastAPI로 전송
- **FastAPI**: `/log/ingest` 엔드포인트로 로그 수집

### 2. 데이터 분석 API
- **트래픽 분석**: 시간대별 요청 분포
- **엔드포인트 분석**: 경로별 사용량, 응답시간, 에러율
- **성능 병목 탐지**: 느린 API 식별
- **이상 징후 감지**: 비정상적인 패턴 탐지
- **실시간 스트리밍**: WebSocket 기반 로그 실시간 표시

### 3. AI 기반 인사이트
- **자동 분석**: 최근 5분 로그 데이터 기반 AI 분석
- **인사이트 생성**: 문제점, 원인, 개선사항 자동 도출
- **AI 채팅**: 로그/성능 관련 질의응답
- **실시간 권장사항**: 성능 최적화 제안

### 4. 대시보드 시각화
- **트래픽 차트**: 시간대별 요청량 추이
- **성능 지표**: 응답시간, 에러율, 처리량
- **히트맵**: 시간대별/엔드포인트별 에러율
- **실시간 로그**: 콘솔 형태의 로그 스트림

## 🤖 AI 기능 상세

### AI 분석 엔드포인트
```python
# /api/stats/ai/analyze
- 최근 5분 로그 통계 수집
- OpenAI GPT-3.5-turbo로 분석 요청
- JSON 형태로 구조화된 인사이트 반환
```

### AI 채팅 기능
```python
# /api/stats/ai/chat
- 사용자 질문 + 최근 로그 데이터 결합
- 프로젝트 관련 질문만 답변 (필터링)
- 실시간 통계 기반 정확한 답변
```

### AI 분석 결과
- **주요 인사이트**: 핵심 문제점 요약
- **추정 원인**: 근본 원인 분석
- **개선/권장 사항**: 구체적인 해결 방안
- **에러율 최상위 엔드포인트**: 우선 개선 대상

## 📊 데이터 모델

### LogEntry 테이블
```sql
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP,
    path VARCHAR(255),
    method VARCHAR(10),
    status INTEGER,
    latency_ms FLOAT,
    user_agent TEXT,
    ip_address VARCHAR(45)
);
```

## 🔧 개발 환경 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd cursol_pro
```

### 2. 환경 변수 설정
```bash
# .env 파일 생성
POSTGRES_DB=log_analytics
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
OPENAI_API_KEY=your_openai_api_key
```

### 3. 네트워크 생성
```bash
docker network create lognet
```

### 4. 서비스 실행
```bash
# 1번 서버 (로그 수집)
cd target_server && docker-compose up -d
cd ../fluentbit && docker-compose up -d

# 2번 서버 (분석 및 시각화)
cd ../src && docker-compose up -d
```

## 🌐 접속 정보

- **Frontend**: http://localhost (포트 80)
- **Backend API**: http://localhost:8000
- **Target Server**: http://localhost:8081
- **PostgreSQL**: localhost:5432

## 📋 API 엔드포인트

### 로그 수집
- `POST /log/ingest` - 로그 데이터 수집

### 분석 API
- `GET /api/stats/traffic` - 트래픽 분석
- `GET /api/stats/usage` - 엔드포인트별 사용량
- `GET /api/stats/errors` - 에러 분포
- `GET /api/stats/bottlenecks` - 성능 병목 탐지
- `GET /api/stats/anomalies` - 이상 징후 감지
- `GET /api/stats/recommendations` - 개선 권장사항

### AI 기능
- `POST /api/stats/ai/analyze` - AI 자동 분석
- `POST /api/stats/ai/chat` - AI 채팅

### 실시간
- `WebSocket /api/stats/logs/ws` - 실시간 로그 스트림

## 🔍 모니터링 및 분석

### 실시간 지표
- 요청량, 응답시간, 에러율
- 엔드포인트별 성능 분석
- 시간대별 트래픽 패턴

### AI 기반 인사이트
- 자동 문제점 탐지
- 성능 최적화 권장사항
- 예측적 분석

## 🚀 성능 최적화

- **비동기 처리**: FastAPI async/await 활용
- **데이터베이스 최적화**: 인덱싱 및 쿼리 최적화
- **캐싱**: 자주 조회되는 데이터 캐싱
- **로드 밸런싱**: Docker 기반 확장성

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**개발 완료 상태**: ✅ 프로덕션 배포 준비 완료
**최종 업데이트**: 2024년 12월
