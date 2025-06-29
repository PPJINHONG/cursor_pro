import React, { useState, useEffect, useCallback } from 'react';
import { dashboardApi, TrafficData, UsageData, ErrorData, BottleneckData } from '../services/api';
import TrafficChart from './TrafficChart';
import UsageChart from './UsageChart';
import ErrorChart from './ErrorChart';
import BottleneckChart from './BottleneckChart';
import RealTimeLogs from './RealTimeLogs';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [errorData, setErrorData] = useState<ErrorData>({});
  const [bottleneckData, setBottleneckData] = useState<BottleneckData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // 30초

  // 기본 날짜 범위 (최근 3일)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 3);
    return {
      start: start.toISOString().split('T')[0] + 'T00:00:00',
      end: end.toISOString().split('T')[0] + 'T23:59:59'
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = dateRange;

      const [traffic, usage, errors, bottlenecks] = await Promise.all([
        dashboardApi.getTraffic(start, end, 5),
        dashboardApi.getUsage(start, end),
        dashboardApi.getErrors(start, end),
        dashboardApi.getBottlenecks(start, end, 5)
      ]);

      setTrafficData(traffic);
      setUsageData(usage);
      setErrorData(errors);
      setBottleneckData(bottlenecks);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">{error}</div>
        <button onClick={fetchDashboardData}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>로그 분석 대시보드</h1>
        <div className="dashboard-controls">
          <div className="date-range">
            <label>
              시작일:
              <input
                type="datetime-local"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </label>
            <label>
              종료일:
              <input
                type="datetime-local"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </label>
          </div>
          <div className="refresh-controls">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              자동 새로고침
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="refresh-interval-select"
              >
                <option value={10}>10초</option>
                <option value={30}>30초</option>
                <option value={60}>1분</option>
                <option value={300}>5분</option>
              </select>
            )}
            <button onClick={fetchDashboardData} className="manual-refresh-btn">
              새로고침
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* 트래픽 분포 분석 */}
        <div className="dashboard-card">
          <h2>트래픽 분포 분석</h2>
          <TrafficChart data={trafficData} />
        </div>

        {/* 엔드포인트별 사용 현황 */}
        <div className="dashboard-card">
          <h2>엔드포인트별 사용 현황</h2>
          <UsageChart data={usageData} />
        </div>

        {/* 상태 코드 분포 */}
        <div className="dashboard-card">
          <h2>상태 코드 분포</h2>
          <ErrorChart data={errorData} />
        </div>

        {/* 성능 병목 식별 */}
        <div className="dashboard-card">
          <h2>성능 병목 식별</h2>
          <BottleneckChart data={bottleneckData} />
        </div>
      </div>

      {/* 실시간 로그 */}
      <div className="realtime-section">
        <RealTimeLogs />
      </div>
    </div>
  );
};

export default Dashboard; 