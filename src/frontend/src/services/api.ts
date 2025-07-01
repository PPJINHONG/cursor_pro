import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 추가
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API 요청:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
api.interceptors.response.use(
  (response) => {
    console.log('✅ API 응답 성공:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API 응답 오류:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      response: error.response?.data
    });
    return Promise.reject(error);
  }
);

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

export interface EndpointDetailData {
  path: string;
  summary: {
    total_requests: number;
    avg_latency: number;
    min_latency: number;
    max_latency: number;
    median_latency: number;
    p90_latency: number;
    total_errors: number;
    total_success: number;
    error_rate: number;
  };
  time_series: Array<{
    timestamp: string;
    request_count: number;
    avg_latency: number;
    error_count: number;
    success_count: number;
    error_rate: number;
  }>;
  status_distribution: Array<{
    status: number;
    count: number;
  }>;
}

export interface EndpointListItem {
  path: string;
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

  // 엔드포인트별 상세 분석
  getEndpointDetail: async (path: string, start: string, end: string, interval: number = 1): Promise<EndpointDetailData> => {
    const response = await api.get('/api/stats/endpoint-detail', {
      params: { path, start, end, interval }
    });
    return response.data;
  },

  // 엔드포인트 목록 조회
  getEndpoints: async (start: string, end: string): Promise<EndpointListItem[]> => {
    const response = await api.get('/api/stats/endpoints', {
      params: { start, end }
    });
    return response.data;
  },
};

// 패턴 분석 API
export const getPatternAnalysis = async (start: string, end: string) => {
  const response = await api.get('/api/stats/patterns', {
    params: { start, end }
  });
  return response.data;
};

// 이상 징후 감지 API
export const getAnomalies = async (start: string, end: string) => {
  const response = await api.get('/api/stats/anomalies', {
    params: { start, end }
  });
  return response.data;
};

// 성능 개선 권장사항 API
export const getRecommendations = async (start: string, end: string) => {
  const response = await api.get('/api/stats/recommendations', {
    params: { start, end }
  });
  return response.data;
};

export const getUsageData = async (start: string, end: string) => {
  const response = await api.get('/api/stats/usage', {
    params: { start, end }
  });
  return response.data;
}; 