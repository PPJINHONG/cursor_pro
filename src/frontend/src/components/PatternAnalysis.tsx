import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getPatternAnalysis, getUsageData } from '../services/api';
import { validateTrafficData, generateStatsSummary } from '../utils/dataValidation';
import DataValidationPanel from './DataValidationPanel';

interface PatternAnalysisProps {
  startDate: string;
  endDate: string;
  intervalType?: '1h' | '30m' | '15m' | '5m' | '1h+';
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ startDate, endDate, intervalType = '1h' }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpointStats, setEndpointStats] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchEndpointStats();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPatternAnalysis(startDate, endDate);
      setData(result);
    } catch (err) {
      setError('패턴 분석 데이터를 불러오는데 실패했습니다.');
      console.error('Pattern analysis fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpointStats = async () => {
    const usage = await getUsageData(startDate, endDate);
    // usage: [{ path, count, avg_ms, error_count, success_count }]
    setEndpointStats(usage.map((item: any) => ({
      path: item.path,
      count: item.count,
      avg_ms: item.avg_ms,
      error_count: item.error_count ?? 0,
      success_count: item.success_count ?? 0,
      error_rate: item.count > 0 ? (item.error_count ?? 0) / item.count * 100 : 0,
      success_rate: item.count > 0 ? (item.success_count ?? 0) / item.count * 100 : 0
    })));
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        패턴 분석 데이터를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        textAlign: 'center',
        border: '1px solid #e5e7eb',
        color: '#dc2626'
      }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const validationResult = validateTrafficData(data.hourly_patterns);
  const stats = generateStatsSummary(data.hourly_patterns);

  // 시간대별 데이터 포맷팅
  const hourlyData = data.hourly_patterns.map((item: any) => ({
    ...item,
    hour: item.timestamp || `${item.hour}시`,
    errorRate: item.count > 0 ? (item.error_count / item.count * 100) : 0
  }));

  // X축 라벨 포맷터
  const timeTickFormatter = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      // value가 이미 HH:mm 형태라면 그대로 반환
      if (/^\d{2}:\d{2}$/.test(value)) return value;
      return '';
    }
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    if (intervalType === '1h' || intervalType === '1h+') {
      if (parseInt(m) % 5 === 0) return `${h}:${m}`;
      return '';
    } else {
      return `${h}:${m}`;
    }
  };

  // 요일별 데이터 포맷팅
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dailyData = data.daily_patterns.map((item: any) => ({
    ...item,
    day: dayNames[item.day_of_week] || `${item.day_of_week}일`
  }));

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
        패턴 분석
      </h2>

      {/* 분석 요약 */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
          분석 요약
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
              {data.summary.total_requests.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>총 요청 수</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: data.summary.error_rate > 5 ? '#ef4444' : '#10b981' }}>
              {data.summary.error_rate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>에러율</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: data.summary.avg_latency > 500 ? '#ef4444' : '#10b981' }}>
              {data.summary.avg_latency.toFixed(0)}ms
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>평균 응답시간</div>
          </div>
          {data.summary.peak_hour !== null && (
            <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {data.summary.peak_hour}시
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>피크 시간대</div>
            </div>
          )}
        </div>
      </div>

      {/* 엔드포인트별 통계 표 */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
          엔드포인트별 통계
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>엔드포인트</th>
                <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>총 요청수</th>
                <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>에러율(%)</th>
                <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>성공률(%)</th>
                <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>평균응답(ms)</th>
                <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>에러수</th>
                <th style={{ padding: '8px', border: '1px solid #e5e7eb' }}>성공수</th>
              </tr>
            </thead>
            <tbody>
              {endpointStats.map((row, idx) => (
                <tr key={row.path} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '8px', border: '1px solid #e5e7eb', fontFamily: 'monospace' }}>{row.path}</td>
                  <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{row.count}</td>
                  <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right', color: row.error_rate > 10 ? '#ef4444' : '#374151' }}>{row.error_rate.toFixed(1)}</td>
                  <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right', color: row.success_rate < 90 ? '#ef4444' : '#059669' }}>{row.success_rate.toFixed(1)}</td>
                  <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{row.avg_ms?.toFixed(1)}</td>
                  <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{row.error_count}</td>
                  <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right' }}>{row.success_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 인사이트 섹션 */}
      {data.insights && data.insights.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            🔍 주요 인사이트
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {data.insights.map((insight: any, index: number) => (
              <div key={index} style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: insight.severity === 'high' ? '#fecaca' : 
                           insight.severity === 'medium' ? '#fef3c7' : '#d1fae5',
                background: insight.severity === 'high' ? '#fef2f2' : 
                           insight.severity === 'medium' ? '#fffbeb' : '#f0fdf4'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  marginBottom: '4px',
                  color: insight.severity === 'high' ? '#dc2626' : 
                         insight.severity === 'medium' ? '#d97706' : '#059669'
                }}>
                  {insight.title}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '8px', color: '#374151' }}>
                  {insight.description}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  <strong>권장사항:</strong> {insight.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternAnalysis; 