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
  LabelList
} from 'recharts';
import { dashboardApi, BottleneckData } from '../services/api';

interface BottleneckChartProps {
  startDate: string;
  endDate: string;
}

const BottleneckChart: React.FC<BottleneckChartProps> = ({ startDate, endDate }) => {
  const [data, setData] = useState<BottleneckData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const bottleneckData = await dashboardApi.getBottlenecks(
        startDate,
        endDate,
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
  }, [startDate, endDate]);

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
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            barCategoryGap={"20%"}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="path"
              tick={false}
              axisLine={false}
              interval={0}
              height={40}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)} ms`} />
            <Bar dataKey="avg_ms" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32}>
              <LabelList 
                dataKey="avg_ms"
                position="top"
                content={({ x, y, width, height, value, index }) => {
                  if (
                    typeof x === 'number' &&
                    typeof y === 'number' &&
                    typeof width === 'number' &&
                    typeof height === 'number' &&
                    typeof index === 'number' &&
                    data && data[index]
                  ) {
                    const entry = data[index];
                    return (
                      <g>
                        {/* ms value above bar */}
                        <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={12} fill="#222" fontFamily="monospace">
                          {Math.round(value as number)}ms
                        </text>
                        {/* endpoint below bar */}
                        <text x={x + width / 2} y={y + height + 16} textAnchor="middle" fontSize={12} fill="#666" fontFamily="monospace">
                          {entry.path}
                        </text>
                      </g>
                    );
                  }
                  return null;
                }}
              />
            </Bar>
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BottleneckChart; 