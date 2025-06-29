import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrafficData } from '../services/api';

interface TrafficChartProps {
  data: TrafficData[];
}

const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  // 데이터가 없으면 로딩 메시지 표시
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="no-data">트래픽 데이터가 없습니다.</div>
      </div>
    );
  }

  // 시간 포맷팅 함수
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 차트 데이터 포맷팅
  const chartData = data.map(item => ({
    ...item,
    time: formatTime(item.timestamp),
    requests: item.count
  }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ value: '요청 수', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}건`, '요청 수']}
            labelFormatter={(label) => `시간: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="requests" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="요청 수"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* 요약 통계 */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="label">총 요청:</span>
          <span className="value">{data.reduce((sum, item) => sum + item.count, 0).toLocaleString()}건</span>
        </div>
        <div className="summary-item">
          <span className="label">평균 요청:</span>
          <span className="value">
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.count, 0) / data.length).toFixed(1) : 0}건/시간
          </span>
        </div>
        <div className="summary-item">
          <span className="label">최대 요청:</span>
          <span className="value">
            {data.length > 0 ? Math.max(...data.map(item => item.count)) : 0}건
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrafficChart; 