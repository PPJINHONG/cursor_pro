import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { dashboardApi, EndpointDetailData, EndpointListItem } from '../services/api';
import './EndpointDetail.css';

interface EndpointDetailProps {
  startTime: string;
  endTime: string;
  intervalType: '1h' | '30m' | '15m' | '5m' | '1h+';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EndpointDetail: React.FC<EndpointDetailProps> = ({ startTime, endTime, intervalType }) => {
  const [endpoints, setEndpoints] = useState<EndpointListItem[]>([]);
  const [filteredEndpoints, setFilteredEndpoints] = useState<EndpointListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [endpointData, setEndpointData] = useState<EndpointDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEndpoints, setLoadingEndpoints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 엔드포인트 목록 로드
  useEffect(() => {
    loadEndpoints();
  }, [startTime, endTime]);

  // 엔드포인트 목록이 변경될 때 기본 선택 로직 추가
  useEffect(() => {
    if (filteredEndpoints.length > 0 && !selectedEndpoint) {
      // '/api/auth/login'이 있으면 그것을, 없으면 첫 번째 엔드포인트 선택
      const loginEndpoint = filteredEndpoints.find(e => e.path === '/api/auth/login');
      if (loginEndpoint) {
        handleEndpointSelect(loginEndpoint.path);
      } else {
        handleEndpointSelect(filteredEndpoints[0].path);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEndpoints]);

  // 검색어에 따른 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEndpoints(endpoints);
    } else {
      const filtered = endpoints.filter(endpoint =>
        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEndpoints(filtered);
    }
  }, [searchTerm, endpoints]);

  // intervalType, startTime, endTime이 바뀔 때마다 선택된 엔드포인트 재조회
  useEffect(() => {
    if (selectedEndpoint) {
      handleEndpointSelect(selectedEndpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalType, startTime, endTime]);

  const getInterval = () => 1;

  const loadEndpoints = async () => {
    setLoadingEndpoints(true);
    try {
      const data = await dashboardApi.getEndpoints(startTime, endTime);
      setEndpoints(data);
      setFilteredEndpoints(data);
    } catch (err) {
      console.error('엔드포인트 목록 로드 오류:', err);
      setError('엔드포인트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingEndpoints(false);
    }
  };

  const handleEndpointSelect = async (path: string) => {
    setSelectedEndpoint(path);
    setLoading(true);
    setError(null);

    try {
      const data = await dashboardApi.getEndpointDetail(path, startTime, endTime, getInterval());
      setEndpointData(data);
    } catch (err) {
      console.error('엔드포인트 상세 분석 오류:', err);
      setError('엔드포인트 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: number) => {
    if (status >= 500) return '#ff4444';
    if (status >= 400) return '#ff8800';
    if (status >= 300) return '#ffaa00';
    return '#00aa00';
  };

  // chartData: 0값을 null로 바꿔서 gap이 생기도록 가공
  const chartData = endpointData ? endpointData.time_series.map(d => ({
    ...d,
    request_count: d.request_count === 0 ? null : d.request_count,
    avg_latency: d.avg_latency === 0 ? null : d.avg_latency,
  })) : [];

  return (
    <div className="endpoint-detail">
      <h3>🔍 엔드포인트 상세 분석</h3>
      
      <div className="endpoint-selection">
        <div className="search-section">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="엔드포인트 검색..."
            className="search-input"
          />
        </div>

        <div className="endpoint-list-container">
          <h4>📋 사용 가능한 엔드포인트</h4>
          {loadingEndpoints ? (
            <div className="loading">엔드포인트 목록을 불러오는 중...</div>
          ) : (
            <div className="endpoint-list">
              {filteredEndpoints.length === 0 ? (
                <div className="no-endpoints">
                  {searchTerm ? '검색 결과가 없습니다.' : '사용 가능한 엔드포인트가 없습니다.'}
                </div>
              ) : (
                filteredEndpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className={`endpoint-item ${selectedEndpoint === endpoint.path ? 'selected' : ''}`}
                    onClick={() => handleEndpointSelect(endpoint.path)}
                  >
                    <span className="endpoint-path">{endpoint.path}</span>
                    {selectedEndpoint === endpoint.path && loading && (
                      <span className="loading-indicator">분석 중...</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {endpointData && (
        <div className="endpoint-analysis">
          <div className="endpoint-info">
            <h4>📊 {endpointData.path}</h4>
          </div>

          {/* 요약 통계 */}
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-title">총 요청 수</div>
              <div className="stat-value">{endpointData.summary.total_requests.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">평균 응답시간</div>
              <div className="stat-value">{Math.round(endpointData.summary.avg_latency)}ms</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">에러율</div>
              <div className="stat-value">{endpointData.summary.error_rate.toFixed(2)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">성공 요청</div>
              <div className="stat-value">{endpointData.summary.total_success.toLocaleString()}</div>
            </div>
          </div>

          {/* 주기별 요청 수 */}
          <div className="chart-section">
            <h4>📈 주기별 요청 수 <span style={{fontSize:12, color:'#888'}}>({getInterval()}분 단위)</span></h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatTimestamp}
                  formatter={(value: number) => [value, '요청 수']}
                />
                <Area 
                  type="monotone" 
                  dataKey="request_count" 
                  stroke="#2563eb" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 주기별 평균 레이턴시 */}
          <div className="chart-section">
            <h4>⏱️ 주기별 평균 응답시간 <span style={{fontSize:12, color:'#888'}}>({getInterval()}분 단위)</span></h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={formatTimestamp}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={formatTimestamp}
                  formatter={(value: number) => [`${Math.round(value)}ms`, '평균 응답시간']}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_latency" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 상태 코드 분포 */}
          <div className="chart-section">
            <h4>📊 응답 상태 코드 분포</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={endpointData.status_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count, percent }) => `${status} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {endpointData.status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, '요청 수']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 상세 통계 */}
          <div className="detailed-stats">
            <h4>📋 상세 통계</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">최소 응답시간:</span>
                <span className="stat-value">{Math.round(endpointData.summary.min_latency)}ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">최대 응답시간:</span>
                <span className="stat-value">{Math.round(endpointData.summary.max_latency)}ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">중간값 응답시간:</span>
                <span className="stat-value">{Math.round(endpointData.summary.median_latency)}ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">P90 응답시간:</span>
                <span className="stat-value">{Math.round(endpointData.summary.p90_latency)}ms</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">총 에러 수:</span>
                <span className="stat-value">{endpointData.summary.total_errors.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">성공률:</span>
                <span className="stat-value">{((endpointData.summary.total_success / endpointData.summary.total_requests) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndpointDetail;