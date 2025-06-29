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
  Line
} from 'recharts';
import { dashboardApi, BottleneckData } from '../services/api';

const BottleneckChart: React.FC = () => {
  const [data, setData] = useState<BottleneckData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 3); // 최근 3일
      
      const bottleneckData = await dashboardApi.getBottlenecks(
        start.toISOString(),
        end.toISOString(),
        10
      );
      
      setData(bottleneckData);
    } catch (err) {
      setError('병목 데이터를 불러오는데 실패했습니다.');
      console.error('Bottleneck data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPath = (path: string) => {
    if (path.length > 25) {
      return path.substring(0, 25) + '...';
    }
    return path;
  };

  const getPerformanceGrade = (avgMs: number): string => {
    if (avgMs < 100) return 'A';
    if (avgMs < 300) return 'B';
    if (avgMs < 500) return 'C';
    if (avgMs < 1000) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return '#52c41a';
      case 'B': return '#1890ff';
      case 'C': return '#faad14';
      case 'D': return '#fa8c16';
      case 'F': return '#f5222d';
      default: return '#666';
    }
  };

  if (loading) {
    return <div className="loading">병목 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="loading">병목 데이터가 없습니다.</div>;
  }

  return (
    <div className="chart-container">
      <h3>성능 병목 분석</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
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
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value}ms`, 
                name === 'avg_ms' ? '평균 응답시간' : 'P90 응답시간'
              ]}
              labelFormatter={formatPath}
            />
            <Bar dataKey="avg_ms" fill="#1890ff" name="평균 응답시간" />
            <Bar dataKey="p90_ms" fill="#faad14" name="P90 응답시간" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* 상세 테이블 */}
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
          상세 성능 분석
        </h4>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 0.5fr',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '10px 12px',
          background: '#e6f7ff',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <div>API 경로</div>
          <div style={{ textAlign: 'center' }}>평균 (ms)</div>
          <div style={{ textAlign: 'center' }}>P90 (ms)</div>
          <div style={{ textAlign: 'center' }}>등급</div>
        </div>
        {data.map((item, index) => {
          const grade = getPerformanceGrade(item.avg_ms);
          return (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 0.5fr',
              gap: '10px',
              padding: '10px 12px',
              background: 'white',
              borderRadius: '4px',
              borderLeft: `4px solid ${getGradeColor(grade)}`,
              alignItems: 'center',
              fontSize: '14px',
              marginBottom: '5px'
            }}>
              <div style={{ fontWeight: '500', color: '#333' }}>
                {item.path}
              </div>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#666' }}>
                {Math.round(item.avg_ms)}ms
              </div>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#666' }}>
                {Math.round(item.p90_ms)}ms
              </div>
              <div style={{ 
                textAlign: 'center', 
                fontWeight: 'bold', 
                fontSize: '16px',
                color: getGradeColor(grade)
              }}>
                {grade}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BottleneckChart; 