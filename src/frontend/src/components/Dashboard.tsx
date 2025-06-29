import React, { useState, useEffect } from 'react';
import TrafficChart from './TrafficChart';
import UsageChart from './UsageChart';
import ErrorChart from './ErrorChart';
import BottleneckChart from './BottleneckChart';
import RealTimeLogs from './RealTimeLogs';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 3);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const formatLastRefresh = () => {
    return lastRefresh.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>로그 분석 대시보드</h1>
        <p>실시간 로그 데이터 분석 및 모니터링</p>
        
        <div className="date-controls">
          <label>
            시작일
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            종료일
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button onClick={handleRefresh} className="refresh-btn">
            새로고침
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            마지막 업데이트: {formatLastRefresh()}
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        <TrafficChart />
        <UsageChart />
        <ErrorChart />
        <BottleneckChart />
        <RealTimeLogs />
      </div>
    </div>
  );
};

export default Dashboard; 