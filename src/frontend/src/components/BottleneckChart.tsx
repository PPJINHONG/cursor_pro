import React from 'react';
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
import { BottleneckData } from '../services/api';

interface BottleneckChartProps {
  data: BottleneckData[];
}

const BottleneckChart: React.FC<BottleneckChartProps> = ({ data }) => {
  // 데이터가 없으면 로딩 메시지 표시
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="no-data">병목 분석 데이터가 없습니다.</div>
      </div>
    );
  }

  // API 경로를 짧게 표시하는 함수
  const formatPath = (path: string) => {
    if (path.length > 25) {
      return path.substring(0, 25) + '...';
    }
    return path;
  };

  // 차트 데이터 포맷팅
  const chartData = data.map(item => ({
    ...item,
    shortPath: formatPath(item.path),
    fullPath: item.path,
    avgMs: Math.round(item.avg_ms),
    p90Ms: Math.round(item.p90_ms)
  }));

  // 성능 등급 계산
  const getPerformanceGrade = (avgMs: number): { grade: string; color: string; description: string } => {
    if (avgMs < 100) return { grade: 'A', color: '#52c41a', description: '우수' };
    if (avgMs < 200) return { grade: 'B', color: '#1890ff', description: '양호' };
    if (avgMs < 500) return { grade: 'C', color: '#faad14', description: '보통' };
    if (avgMs < 1000) return { grade: 'D', color: '#fa8c16', description: '느림' };
    return { grade: 'F', color: '#f5222d', description: '매우 느림' };
  };

  // 총 평균 응답시간 계산
  const totalAvgMs = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.avg_ms, 0) / data.length)
    : 0;

  // 가장 느린 API 찾기
  const slowestApi = data.length > 0 
    ? data.reduce((max, item) => item.avg_ms > max.avg_ms ? item : max)
    : null;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="shortPath" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            yAxisId="left"
            label={{ value: '응답시간 (ms)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'avgMs') return [`${value}ms`, '평균 응답시간'];
              if (name === 'p90Ms') return [`${value}ms`, 'P90 응답시간'];
              return [value, name];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return `API: ${payload[0].payload.fullPath}`;
              }
              return label;
            }}
          />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="avgMs" 
            fill="#8884d8" 
            name="평균 응답시간"
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="p90Ms" 
            stroke="#ff7300" 
            strokeWidth={2}
            dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="P90 응답시간"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 요약 통계 */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="label">전체 평균:</span>
          <span className="value">{totalAvgMs}ms</span>
        </div>
        <div className="summary-item">
          <span className="label">가장 느린 API:</span>
          <span className="value">
            {slowestApi ? formatPath(slowestApi.path) : '-'}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">최고 응답시간:</span>
          <span className="value error">
            {slowestApi ? Math.round(slowestApi.avg_ms) : 0}ms
          </span>
        </div>
        <div className="summary-item">
          <span className="label">분석 대상:</span>
          <span className="value">{data.length}개 API</span>
        </div>
      </div>

      {/* 상세 성능 테이블 */}
      <div className="bottleneck-details">
        <h4>상세 성능 분석</h4>
        <div className="bottleneck-table">
          <div className="table-header">
            <span className="header-path">API 경로</span>
            <span className="header-avg">평균 (ms)</span>
            <span className="header-p90">P90 (ms)</span>
            <span className="header-grade">등급</span>
            <span className="header-status">상태</span>
          </div>
          {data.map((item, index) => {
            const grade = getPerformanceGrade(item.avg_ms);
            return (
              <div key={index} className="table-row">
                <span className="row-path" title={item.path}>
                  {formatPath(item.path)}
                </span>
                <span className="row-avg">{Math.round(item.avg_ms)}ms</span>
                <span className="row-p90">{Math.round(item.p90_ms)}ms</span>
                <span className="row-grade" style={{ color: grade.color }}>
                  {grade.grade}
                </span>
                <span className="row-status" style={{ color: grade.color }}>
                  {grade.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 성능 개선 제안 */}
      <div className="performance-suggestions">
        <h4>성능 개선 제안</h4>
        <div className="suggestions-list">
          {data.filter(item => item.avg_ms > 200).map((item, index) => (
            <div key={index} className="suggestion-item">
              <span className="suggestion-api">{formatPath(item.path)}</span>
              <span className="suggestion-reason">
                평균 {Math.round(item.avg_ms)}ms로 느림 - 캐싱 또는 DB 최적화 권장
              </span>
            </div>
          ))}
          {data.filter(item => item.avg_ms > 200).length === 0 && (
            <div className="suggestion-item good">
              <span className="suggestion-reason">모든 API가 양호한 성능을 보이고 있습니다! 🎉</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottleneckChart; 