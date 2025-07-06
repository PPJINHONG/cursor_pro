서버 로그 데이터 분석
https://cursor-project.solomontech-cloud.kr/

dir - /src

로그 수집 대상 서버
https://cursor-project.solomontech-cloud.kr:444/

dir - /target_server ,  /fluentbit

# 📊 데이터 분석 시스템 (Log Analytics Platform)

실시간 API로그 수집, 분석, 시각화 및 AI 인사이트를 제공하는 종합 데이터 분석 시스템입니다.

## 시스템 아키텍처

### 서버 구성 / 폴더 구조
- **1번 서버**: Target Server + Fluent Bit (로그 수집) /target_server  /fluntbit
- **2번 서버**: Frontend + Backend + Database (분석 및 시각화) /src

### 전체 플로우
```
Target Server → Fluent Bit → Data Analysis System FastAPI Backend → Data Analysis System PostgreSQL → React Frontend
```
<img width="664" alt="image" src="https://github.com/user-attachments/assets/b2886205-0d10-43e0-b05b-e1b94cbd6ba3" />

## 기술 스택

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

### Infrastructure,deploy
- **Docker**: 컨테이너화
- **Docker Compose**: 멀티 컨테이너 오케스트레이션
- **Fluent Bit**: 로그 수집 및 전송
- **AWS** : AWS route53, ACM , NLB , EC2 ,NATGW


### 배포 환경
<img width="794" alt="image" src="https://github.com/user-attachments/assets/9b6035b3-90d7-4540-a2c8-47984fce75d0" />



##  주요 기능

### 1. 실시간 로그 수집
- **Target Server**: api로그 발생지 API 서버
- **Fluent Bit**: 로그 파일 모니터링 및 데이터 분석 서버로 전송
- **데이터분석시스템**:  구성한 엔드포인트로 로그 수집 및 시각화

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

## AI 기능 상세

### AI 분석 엔드포인트
```python
# /api/stats/ai/analyze
- 최근 5분 로그 통계 수집 (openai api 비용을 위해 최근 5분 로그만 ai가 분석)
- OpenAI GPT-3.5-turbo로 분석 요청
- JSON 형태로 구조화된 인사이트 반환
```

### AI 채팅 기능
```python
# /api/stats/ai/chat
- 사용자 질문 + 최근 30분 로그 데이터 결합
- 프로젝트 관련 질문만 답변 (필터링)
- 실시간 통계 기반 정확한 답변
```


## 데이터분석시스템 DB 

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

##  API 엔드포인트

### 서버 1 (Target Server - 로그 생성)
**포트**: 8081
```bash
# 테스트용 API 엔드포인트들
GET  /api/users          # 사용자 목록 조회
GET  /api/users/{id}     # 특정 사용자 조회
POST /api/users          # 사용자 생성
PUT  /api/users/{id}     # 사용자 정보 수정
DELETE /api/users/{id}   # 사용자 삭제

GET  /api/products       # 상품 목록 조회
GET  /api/products/{id}  # 특정 상품 조회
POST /api/products       # 상품 생성
PUT  /api/products/{id}  # 상품 정보 수정
DELETE /api/products/{id} # 상품 삭제

# 에러 발생 테스트용
GET  /api/error/500      # 500 에러 발생
GET  /api/error/404      # 404 에러 발생
GET  /api/slow           # 느린 응답 테스트
```

### 서버 2 (FastAPI Backend - 로그 수집 및 분석)
**포트**: 8000

```bash
#### 로그 수집
POST /log/ingest` - Fluent Bit에서 전송하는 로그 데이터 수집

#### 데이터 분석 API
GET /api/stats/traffic` - 트래픽 분석 (시간대별 요청 분포)
GET /api/stats/usage` - 엔드포인트별 사용량 분석
GET /api/stats/errors` - 상태 코드별 에러 분포
GET /api/stats/bottlenecks` - 성능 병목 탐지 (느린 API 식별)
GET /api/stats/anomalies` - 이상 징후 감지
GET /api/stats/recommendations` - 성능 개선 권장사항
GET /api/stats/patterns` - 트래픽 패턴 분석
GET /api/stats/endpoint-detail` - 특정 엔드포인트 상세 분석
GET /api/stats/error-heatmap` - 시간대별/엔드포인트별 에러율 히트맵
GET /api/stats/slow-endpoints` - 평균 응답시간이 가장 느린 엔드포인트 TOP N

#### AI 기능
POST /api/stats/ai/analyze` - 최근 5분 로그 AI 자동 분석
POST /api/stats/ai/chat` - AI 채팅 (로그/성능 관련 질의응답)

#### 실시간 기능
WebSocket /api/stats/logs/ws` - 실시간 로그 스트림

#### 기타 유틸리티
GET /api/stats/recent-logs` - 최근 로그 조회
GET /api/stats/endpoints` - 사용 가능한 엔드포인트 목록
GET /api/stats/status-endpoint-top` - 상태코드별 엔드포인트별 호출수 TOP
```

