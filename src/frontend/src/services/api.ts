import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TrafficData {
  timestamp: string;
  count: number;
}

export interface UsageData {
  path: string;
  count: number;
  avg_ms: number;
}

export interface ErrorData {
  [key: string]: number; // e.g., "200xx": 247, "404xx": 27, "500xx": 36
}

export interface BottleneckData {
  path: string;
  avg_ms: number;
  p90_ms: number;
}

export interface AnomalyData {
  path: string;
  status: number;
  count: number;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  latency_ms: number;
  client_ip: string;
}

export const dashboardApi = {
  // 트래픽 분포 분석
  getTraffic: async (start: string, end: string, interval: number = 5): Promise<TrafficData[]> => {
    const response = await api.get('/api/stats/traffic', {
      params: { start, end, interval }
    });
    return response.data;
  },

  // 엔드포인트별 사용 현황
  getUsage: async (start: string, end: string): Promise<UsageData[]> => {
    const response = await api.get('/api/stats/usage', {
      params: { start, end }
    });
    return response.data;
  },

  // 상태 코드 분포
  getErrors: async (start: string, end: string): Promise<ErrorData> => {
    const response = await api.get('/api/stats/errors', {
      params: { start, end }
    });
    return response.data;
  },

  // 성능 병목 식별
  getBottlenecks: async (start: string, end: string, topN: number = 5): Promise<BottleneckData[]> => {
    const response = await api.get('/api/stats/bottlenecks', {
      params: { start, end, top_n: topN }
    });
    return response.data;
  },

  // 이상 요청 탐지
  getAnomalies: async (start: string, end: string, threshold: number = 100): Promise<AnomalyData[]> => {
    const response = await api.get('/api/stats/anomalies', {
      params: { start, end, threshold }
    });
    return response.data;
  },

  // 최근 로그 조회
  getRecentLogs: async (limit: number = 50): Promise<LogEntry[]> => {
    const response = await api.get('/api/stats/recent-logs', {
      params: { limit }
    });
    return response.data;
  },
}; 