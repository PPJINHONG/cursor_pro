import React, { useState } from 'react';
import TrafficChart from './TrafficChart';
import UsageChart from './UsageChart';
import ErrorChart from './ErrorChart';
import BottleneckChart from './BottleneckChart';
import RealTimeLogs from './RealTimeLogs';
import PatternAnalysis from './PatternAnalysis';
import EndpointDetail from './EndpointDetail';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const [dateInput, setDateInput] = useState({
    start: twoHoursAgo.toISOString().slice(0, 16),
    end: now.toISOString().slice(0, 16)
  });
  const [dateRange, setDateRange] = useState({
    start: twoHoursAgo.toISOString().slice(0, 16),
    end: now.toISOString().slice(0, 16)
  });
  const [intervalType, setIntervalType] = useState<'1h' | '30m' | '15m' | '5m' | '1h+'>('1h');

  const tabs = [
    { id: 'overview', name: '개요' },
    { id: 'patterns', name: '패턴 분석' },
    { id: 'endpoint', name: '엔드포인트 분석' },
    { id: 'realtime', name: '실시간 로그' }
  ];

  const handleDateInputChange = (field: 'start' | 'end', value: string) => {
    setDateInput(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    setDateRange({ ...dateInput });
    const start = new Date(dateInput.start);
    const end = new Date(dateInput.end);
    const diffMinutes = (end.getTime() - start.getTime()) / 60000;
    if (diffMinutes >= 60) setIntervalType('1h+');
    else if (diffMinutes >= 30) setIntervalType('30m');
    else if (diffMinutes >= 15) setIntervalType('15m');
    else setIntervalType('5m');
  };

  const handleQuickRange = (minutes: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    setDateInput({
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16)
    });
    setDateRange({
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16)
    });
    if (minutes === 60) setIntervalType('1h');
    else if (minutes === 30) setIntervalType('30m');
    else if (minutes === 15) setIntervalType('15m');
    else setIntervalType('5m');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📈 로그 분석 대시보드</h1>
        <div className="date-controls">
          <div className="date-input-group">
            <label>시작일:</label>
            <input
              type="datetime-local"
              value={dateInput.start}
              onChange={(e) => handleDateInputChange('start', e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>종료일:</label>
            <input
              type="datetime-local"
              value={dateInput.end}
              onChange={(e) => handleDateInputChange('end', e.target.value)}
            />
          </div>
          <button className="refresh-btn" style={{ marginLeft: 8 }} onClick={handleApply}>
            적용
          </button>
          <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
            <button className="refresh-btn" style={{ background: '#e0e7ef', color: '#1e293b' }} onClick={() => handleQuickRange(60)}>최근 1시간</button>
            <button className="refresh-btn" style={{ background: '#e0e7ef', color: '#1e293b' }} onClick={() => handleQuickRange(30)}>30분</button>
            <button className="refresh-btn" style={{ background: '#e0e7ef', color: '#1e293b' }} onClick={() => handleQuickRange(15)}>15분</button>
            <button className="refresh-btn" style={{ background: '#e0e7ef', color: '#1e293b' }} onClick={() => handleQuickRange(5)}>5분</button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            <div className="chart-container">
              <TrafficChart startDate={dateRange.start} endDate={dateRange.end} />
            </div>
            <div className="chart-container">
              <ErrorChart startDate={dateRange.start} endDate={dateRange.end} />
            </div>
            <div className="chart-container">
              <BottleneckChart startDate={dateRange.start} endDate={dateRange.end} />
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="analysis-container">
            <PatternAnalysis startDate={dateRange.start} endDate={dateRange.end} intervalType={intervalType} />
          </div>
        )}

        {activeTab === 'endpoint' && (
          <div className="endpoint-container">
            <EndpointDetail startTime={dateRange.start} endTime={dateRange.end} intervalType={intervalType} />
          </div>
        )}

        {activeTab === 'realtime' && (
          <div className="realtime-container">
            <RealTimeLogs />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 