import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
  LineChart
} from 'recharts';
import { dashboardApi, UsageData } from '../services/api';

interface UsageChartProps {
  startDate: string;
  endDate: string;
}

const UsageChart: React.FC<UsageChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usageData = await dashboardApi.getUsage(
        startDate,
        endDate
      );
      
      setData(usageData.slice(0, 10)); // 상위 10개만 표시
    } catch (err) {
      setError('사용 현황 데이터를 불러오는데 실패했습니다.');
      console.error('Usage data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatPath = (path: string) => {
    if (path.length > 20) {
      return path.substring(0, 20) + '...';
    }
    return path;
  };

  if (loading) {
    return <div className="loading">사용 현황 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>엔드포인트별 사용 현황</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setChartType('bar')}
            style={{
              padding: '5px 10px',
              background: chartType === 'bar' ? '#1890ff' : '#f0f0f0',
              color: chartType === 'bar' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            막대 차트
          </button>
          <button
            onClick={() => setChartType('line')}
            style={{
              padding: '5px 10px',
              background: chartType === 'line' ? '#1890ff' : '#f0f0f0',
              color: chartType === 'line' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            선 차트
          </button>
        </div>
      </div>
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="path" 
                tickFormatter={formatPath}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'count' ? `${value}건` : `${value}ms`,
                  name === 'count' ? '요청 수' : '평균 응답시간'
                ]}
                labelFormatter={formatPath}
              />
              <Bar dataKey="count" fill="#1890ff" name="요청 수" />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value: string) => {
                  const date = new Date(value);
                  const h = date.getHours().toString().padStart(2, '0');
                  const m = date.getMinutes().toString().padStart(2, '0');
                  const s = date.getSeconds().toString().padStart(2, '0');
                  if (m === '00' && s === '00') {
                    return `${h}:${m}:${s}`;
                  }
                  return `${m}:${s}`;
                }}
                tick={{ fontSize: 11, fontStyle: 'normal' }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'count' ? `${value}건` : `${value}ms`,
                  name === 'count' ? '요청 수' : '평균 응답시간'
                ]}
                labelFormatter={formatPath}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#1890ff" 
                strokeWidth={2}
                dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="요청 수"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsageChart; 