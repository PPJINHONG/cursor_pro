export interface DataValidationResult {
  isValid: boolean;
  totalRecords: number;
  dateRange: { start: string; end: string };
  anomalies: string[];
  summary: string;
  dataQuality: {
    completeness: number; // 0-100%
    consistency: number;
    accuracy: number;
  };
}

export interface ValidationStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  errorCount: number;
  uniqueEndpoints: number;
}

// 데이터 검증 함수
export const validateTrafficData = (data: any[]): DataValidationResult => {
  const anomalies: string[] = [];
  let totalRecords = 0;
  
  if (!Array.isArray(data)) {
    return {
      isValid: false,
      totalRecords: 0,
      dateRange: { start: '', end: '' },
      anomalies: ['데이터가 배열 형태가 아닙니다'],
      summary: '데이터 형식 오류',
      dataQuality: { completeness: 0, consistency: 0, accuracy: 0 }
    };
  }

  totalRecords = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  // 날짜 범위 검증
  const timestamps = data.map(item => new Date(item.timestamp)).filter(date => !isNaN(date.getTime()));
  const dateRange = timestamps.length > 0 ? {
    start: new Date(Math.min(...timestamps.map(d => d.getTime()))).toISOString(),
    end: new Date(Math.max(...timestamps.map(d => d.getTime()))).toISOString()
  } : { start: '', end: '' };

  // 이상치 검출
  if (data.length > 0) {
    const counts = data.map(item => item.count || 0);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const std = Math.sqrt(counts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / counts.length);
    
    counts.forEach((count, index) => {
      if (Math.abs(count - mean) > 2 * std) {
        anomalies.push(`${data[index].timestamp}에 비정상적인 트래픽 감지: ${count} (평균: ${mean.toFixed(1)})`);
      }
    });
  }

  const completeness = data.length > 0 ? 100 : 0;
  const consistency = anomalies.length === 0 ? 100 : Math.max(0, 100 - anomalies.length * 10);
  const accuracy = data.every(item => typeof item.count === 'number' && item.count >= 0) ? 100 : 80;

  return {
    isValid: data.length > 0 && anomalies.length < 3,
    totalRecords,
    dateRange,
    anomalies,
    summary: `총 ${totalRecords}개 요청, ${anomalies.length}개 이상치 감지`,
    dataQuality: { completeness, consistency, accuracy }
  };
};

export const validateUsageData = (data: any[]): DataValidationResult => {
  const anomalies: string[] = [];
  
  if (!Array.isArray(data)) {
    return {
      isValid: false,
      totalRecords: 0,
      dateRange: { start: '', end: '' },
      anomalies: ['데이터가 배열 형태가 아닙니다'],
      summary: '데이터 형식 오류',
      dataQuality: { completeness: 0, consistency: 0, accuracy: 0 }
    };
  }

  const totalRecords = data.reduce((sum, item) => sum + (item.count || 0), 0);
  
  // 응답시간 이상치 검출
  data.forEach(item => {
    if (item.avg_ms > 1000) {
      anomalies.push(`${item.path}의 평균 응답시간이 1초 초과: ${item.avg_ms.toFixed(1)}ms`);
    }
  });

  const completeness = data.length > 0 ? 100 : 0;
  const consistency = anomalies.length === 0 ? 100 : Math.max(0, 100 - anomalies.length * 10);
  const accuracy = data.every(item => 
    typeof item.count === 'number' && 
    typeof item.avg_ms === 'number' && 
    item.count >= 0 && 
    item.avg_ms >= 0
  ) ? 100 : 80;

  return {
    isValid: data.length > 0,
    totalRecords,
    dateRange: { start: '', end: '' },
    anomalies,
    summary: `총 ${data.length}개 엔드포인트, ${totalRecords}개 요청`,
    dataQuality: { completeness, consistency, accuracy }
  };
};

export const validateErrorData = (data: any): DataValidationResult => {
  const anomalies: string[] = [];
  
  if (typeof data !== 'object' || data === null) {
    return {
      isValid: false,
      totalRecords: 0,
      dateRange: { start: '', end: '' },
      anomalies: ['데이터가 객체 형태가 아닙니다'],
      summary: '데이터 형식 오류',
      dataQuality: { completeness: 0, consistency: 0, accuracy: 0 }
    };
  }

  const totalRecords = Object.values(data).reduce((sum: number, count: any) => sum + (count || 0), 0);
  
  // 에러율 계산
  const errorCount = Object.entries(data)
    .filter(([key]) => key.startsWith('4') || key.startsWith('5'))
    .reduce((sum, [_, count]) => sum + (typeof count === 'number' ? count : Number(count) || 0), 0);
  
  const errorRate = totalRecords > 0 ? (errorCount / totalRecords) * 100 : 0;
  
  if (errorRate > 10) {
    anomalies.push(`에러율이 10% 초과: ${errorRate.toFixed(1)}%`);
  }

  const completeness = Object.keys(data).length > 0 ? 100 : 0;
  const consistency = anomalies.length === 0 ? 100 : Math.max(0, 100 - anomalies.length * 10);
  const accuracy = Object.values(data).every(count => typeof count === 'number' && count >= 0) ? 100 : 80;

  return {
    isValid: Object.keys(data).length > 0,
    totalRecords,
    dateRange: { start: '', end: '' },
    anomalies,
    summary: `총 ${totalRecords}개 요청, 에러율 ${errorRate.toFixed(1)}%`,
    dataQuality: { completeness, consistency, accuracy }
  };
};

// 통계 요약 생성
export const generateStatsSummary = (data: any[]): ValidationStats => {
  const totalRequests = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const successCount = data.reduce((sum, item) => {
    const status = parseInt(item.status) || 200;
    return sum + (status < 400 ? (item.count || 0) : 0);
  }, 0);
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
  
  const responseTimes = data.map(item => item.latency_ms || 0).filter(time => time > 0);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  const errorCount = data.reduce((sum, item) => {
    const status = parseInt(item.status) || 200;
    return sum + (status >= 400 ? (item.count || 0) : 0);
  }, 0);
  
  const uniqueEndpoints = new Set(data.map(item => item.path)).size;

  return {
    totalRequests,
    successRate,
    avgResponseTime,
    errorCount,
    uniqueEndpoints
  };
}; 