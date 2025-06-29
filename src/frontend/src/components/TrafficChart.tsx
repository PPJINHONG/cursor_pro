import React, { useState, useEffect } from 'react';
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
import { dashboardApi, TrafficData } from '../services/api';

const TrafficChart: React.FC = () => {
  const [data, setData] = useState<TrafficData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 3); // 최근 3일
      
      const trafficData = await dashboardApi.getTraffic(
        start.toISOString(),
        end.toISOString(),
        5
      );
      
      setData(trafficData);
    } catch (err) {
      setError('트래픽 데이터를 불러오는데 실패했습니다.');
      console.error('Traffic data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">트래픽 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="chart-container">
      <h3>트래픽 분포</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTime}
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip 
              labelFormatter={formatTime}
              formatter={(value: number) => [`${value}건`, '요청 수']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#1890ff" 
              strokeWidth={2}
              dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
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