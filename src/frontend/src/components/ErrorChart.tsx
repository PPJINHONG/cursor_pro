import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { dashboardApi, ErrorData } from '../services/api';

interface ErrorChartProps {
  startDate: string;
  endDate: string;
}

const ErrorChart: React.FC<ErrorChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<ErrorData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const errorData = await dashboardApi.getErrors(
        startDate,
        endDate
      );
      
      setData(errorData);
    } catch (err) {
      setError('에러 데이터를 불러오는데 실패했습니다.');
      console.error('Error data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const COLORS = ['#52c41a', '#1890ff', '#faad14', '#f5222d', '#722ed1'];

  const chartData = Object.entries(data).map(([status, count]) => ({
    name: status,
    value: count
  }));

  if (loading) {
    return <div className="loading">에러 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (chartData.length === 0) {
    return <div className="loading">에러 데이터가 없습니다.</div>;
  }

  const totalErrors = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-container">
      <h3>상태 코드 분포</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value}건`, '요청 수']}
            />
            <Legend />
          </PieChart>
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
            {totalErrors.toLocaleString()}건
          </div>
        </div>
        {chartData.map((item, index) => (
          <div key={item.name} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
              {item.name} 상태
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: COLORS[index % COLORS.length] 
            }}>
              {item.value.toLocaleString()}건
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorChart; 