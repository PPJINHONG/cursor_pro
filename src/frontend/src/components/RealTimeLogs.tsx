import React, { useState, useEffect } from 'react';
import { dashboardApi, LogEntry } from '../services/api';
import './RealTimeLogs.css';

const RealTimeLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [maxLogs, setMaxLogs] = useState(50);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRecentLogs = async () => {
    try {
      setLoading(true);
      const recentLogs = await dashboardApi.getRecentLogs(maxLogs);
      setLogs(recentLogs);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('최근 로그 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentLogs();
  }, [maxLogs]);

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRecentLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, maxLogs]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return '#52c41a';
    if (status >= 300 && status < 400) return '#1890ff';
    if (status >= 400 && status < 500) return '#faad14';
    return '#f5222d';
  };

  const getMethodColor = (method: string): string => {
    switch (method.toUpperCase()) {
      case 'GET': return '#52c41a';
      case 'POST': return '#1890ff';
      case 'PUT': return '#faad14';
      case 'DELETE': return '#f5222d';
      default: return '#666';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    return lastUpdate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="realtime-logs">
      <div className="logs-header">
        <h3>최근 로그</h3>
        <div className="logs-controls">
          <div className="connection-status">
            <span className={`status-dot ${autoRefresh ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {autoRefresh ? '자동 새로고침 활성화' : '수동 모드'}
            </span>
          </div>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 새로고침
          </label>
          <select
            value={maxLogs}
            onChange={(e) => setMaxLogs(Number(e.target.value))}
            className="max-logs-select"
          >
            <option value={20}>최근 20개</option>
            <option value={50}>최근 50개</option>
            <option value={100}>최근 100개</option>
          </select>
          <button onClick={fetchRecentLogs} className="refresh-logs-btn" disabled={loading}>
            {loading ? '새로고침 중...' : '새로고침'}
          </button>
          <button onClick={clearLogs} className="clear-logs-btn">
            로그 지우기
          </button>
        </div>
      </div>

      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="no-logs">
            {loading ? '로그를 불러오는 중...' : '로그가 없습니다.'}
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log, index) => (
              <div key={log.id} className="log-item">
                <div className="log-time">{formatTime(log.timestamp)}</div>
                <div 
                  className="log-method"
                  style={{ backgroundColor: getMethodColor(log.method) }}
                >
                  {log.method}
                </div>
                <div className="log-path">{log.path}</div>
                <div 
                  className="log-status"
                  style={{ color: getStatusColor(log.status) }}
                >
                  {log.status}
                </div>
                <div className="log-latency">{log.latency_ms}ms</div>
                <div className="log-ip">{log.client_ip}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="logs-footer">
        <span>총 {logs.length}개 로그</span>
        {lastUpdate && (
          <span className="last-update">
            마지막 업데이트: {formatLastUpdate()}
          </span>
        )}
        {autoRefresh && (
          <span className="live-indicator">● 자동 새로고침</span>
        )}
      </div>
    </div>
  );
};

export default RealTimeLogs; 