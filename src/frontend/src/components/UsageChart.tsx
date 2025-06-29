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
import { UsageData } from '../services/api';

interface UsageChartProps {
  data: UsageData[];
}

const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
  // 데이터가 없으면 로딩 메시지 표시
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <div className="no-data">사용 현황 데이터가 없습니다.</div>
      </div>
    );
  }

  // API 경로를 짧게 표시하는 함수
  const formatPath = (path: string) => {
    if (path.length > 20) {
      return path.substring(0, 20) + '...';
    }
    return path;
  };

  // 차트 데이터 포맷팅
  const chartData = data.map(item => ({
    ...item,
    shortPath: formatPath(item.path),
    fullPath: item.path,
    count: item.count,
    avgMs: Math.round(item.avg_ms)
  }));

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
            label={{ value: '호출 횟수', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            label={{ value: '평균 응답시간 (ms)', angle: 90, position: 'insideRight' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'count') return [`${value}회`, '호출 횟수'];
              if (name === 'avgMs') return [`${value}ms`, '평균 응답시간'];
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
            dataKey="count" 
            fill="#8884d8" 
            name="호출 횟수"
            radius={[4, 4, 0, 0]}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="avgMs" 
            stroke="#ff7300" 
            strokeWidth={2}
            dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="평균 응답시간"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* 요약 통계 */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="label">총 API 호출:</span>
          <span className="value">{data.reduce((sum, item) => sum + item.count, 0).toLocaleString()}회</span>
        </div>
        <div className="summary-item">
          <span className="label">평균 응답시간:</span>
          <span className="value">
            {data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.avg_ms, 0) / data.length) : 0}ms
          </span>
        </div>
        <div className="summary-item">
          <span className="label">가장 인기 API:</span>
          <span className="value">
            {data.length > 0 ? formatPath(data[0].path) : '-'}
          </span>
        </div>
        <div className="summary-item">
          <span className="label">가장 느린 API:</span>
          <span className="value">
            {data.length > 0 ? formatPath(data.reduce((max, item) => item.avg_ms > max.avg_ms ? item : max).path) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UsageChart; 