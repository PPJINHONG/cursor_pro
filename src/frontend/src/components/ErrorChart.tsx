import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { ErrorData } from '../services/api';

interface ErrorChartProps {
  data: ErrorData;
}

const ErrorChart: React.FC<ErrorChartProps> = ({ data }) => {
  // 데이터가 없으면 로딩 메시지 표시
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="chart-container">
        <div className="no-data">에러 분포 데이터가 없습니다.</div>
      </div>
    );
  }

  // 차트 데이터 포맷팅
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: key,
    value: value,
    color: getStatusColor(key)
  }));

  // 상태 코드별 색상 정의
  function getStatusColor(status: string): string {
    switch (status) {
      case '200xx':
        return '#52c41a'; // 성공 - 초록색
      case '300xx':
        return '#1890ff'; // 리다이렉트 - 파란색
      case '400xx':
        return '#faad14'; // 클라이언트 에러 - 주황색
      case '500xx':
        return '#f5222d'; // 서버 에러 - 빨간색
      default:
        return '#d9d9d9'; // 기타 - 회색
    }
  }

  // 상태 코드별 설명
  function getStatusDescription(status: string): string {
    switch (status) {
      case '200xx':
        return '성공 (2xx)';
      case '300xx':
        return '리다이렉트 (3xx)';
      case '400xx':
        return '클라이언트 에러 (4xx)';
      case '500xx':
        return '서버 에러 (5xx)';
      default:
        return status;
    }
  }

  // 총 요청 수 계산
  const totalRequests = Object.values(data).reduce((sum, count) => sum + count, 0);

  // 성공률 계산
  const successRate = data['200xx'] ? ((data['200xx'] / totalRequests) * 100).toFixed(1) : '0.0';

  // 에러율 계산
  const errorRate = data['400xx'] || data['500xx'] 
    ? (((data['400xx'] || 0) + (data['500xx'] || 0)) / totalRequests * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${getStatusDescription(name)} ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}건`, '요청 수']}
            labelFormatter={(label) => getStatusDescription(label)}
          />
          <Legend 
            formatter={(value) => getStatusDescription(value)}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* 요약 통계 */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="label">총 요청:</span>
          <span className="value">{totalRequests.toLocaleString()}건</span>
        </div>
        <div className="summary-item">
          <span className="label">성공률:</span>
          <span className="value success">{successRate}%</span>
        </div>
        <div className="summary-item">
          <span className="label">에러율:</span>
          <span className="value error">{errorRate}%</span>
        </div>
        <div className="summary-item">
          <span className="label">가장 많은 에러:</span>
          <span className="value">
            {Object.entries(data)
              .filter(([key]) => key !== '200xx')
              .sort(([,a], [,b]) => b - a)[0]?.[0] || '-'}
          </span>
        </div>
      </div>

      {/* 상세 통계 테이블 */}
      <div className="error-details">
        <h4>상세 통계</h4>
        <div className="error-table">
          {Object.entries(data).map(([status, count]) => (
            <div key={status} className="error-row">
              <span className="error-status">{getStatusDescription(status)}</span>
              <span className="error-count">{count.toLocaleString()}건</span>
              <span className="error-percentage">
                {((count / totalRequests) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErrorChart; 