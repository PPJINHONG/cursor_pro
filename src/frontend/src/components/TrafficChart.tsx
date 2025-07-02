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

interface TrafficChartProps {
  startDate: string;
  endDate: string;
}

const TrafficChart: React.FC<TrafficChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<TrafficData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('TrafficChart: API 호출 시작', { 
        start: startDate, 
        end: endDate,
        url: 'http://localhost:8000/api/stats/traffic'
      });
      
      // 직접 fetch로 테스트
      const testUrl = `http://localhost:8000/api/stats/traffic?start=${startDate}&end=${endDate}&interval=5`;
      console.log('TrafficChart: 테스트 URL', testUrl);
      
      const trafficData = await dashboardApi.getTraffic(
        startDate,
        endDate,
        1
      );
      
      console.log('TrafficChart: API 응답 성공', trafficData);
      setData(trafficData);
    } catch (err) {
      console.error('TrafficChart: API 호출 실패', err);
      console.error('TrafficChart: 에러 타입', typeof err);
      console.error('TrafficChart: 에러 객체', err);
      
      let errorMessage = '트래픽 데이터를 불러오는데 실패했습니다';
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage += `: ${JSON.stringify(err)}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

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
      <div className="chart-wrapper" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => {
                const date = new Date(value);
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                return `${h}:${m}`;
              }}
              tick={{ fontSize: 11, fontStyle: 'normal' }}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip 
              labelFormatter={formatTime}
              formatter={(value: number) => [`${value}건`, '요청 수']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px', 
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>총 요청</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {data.reduce((sum, item) => sum + item.count, 0).toLocaleString()}건
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>평균 요청</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.count, 0) / data.length).toFixed(1) : 0}건/시간
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>최대 요청</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
            {data.length > 0 ? Math.max(...data.map(item => item.count)) : 0}건
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficChart; 