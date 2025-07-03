import React, { useState, useEffect } from 'react';
import './AIInsights.css';

const FIELD_LABELS: Record<string, { label: string; color?: string }> = {
  insights: { label: '주요 인사이트', color: '#2563eb' },
  root_cause: { label: '추정 원인', color: '#f59e42' },
  recommendation: { label: '개선/권장 사항', color: '#059669' },
  worst_endpoint: { label: '에러율 최상위 엔드포인트', color: '#ef4444' },
};

function formatDate(date: Date) {
  return date.toLocaleString('sv-SE', { hour12: false }).replace('T', ' ');
}

interface AIResultItem {
  id: number;
  timestamp: string;
  result: any;
}

const STORAGE_KEY = 'ai_insights_history_v1';

const AIInsights: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AIResultItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [idCounter, setIdCounter] = useState(1);

  // Load history from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw !== '[]') {
      try {
        const parsed: AIResultItem[] = JSON.parse(raw);
        if (parsed.length > 0) {
          setHistory(parsed);
          setIdCounter(Math.max(...parsed.map(i => i.id)) + 1);
          setExpandedId(parsed[0].id);
        }
      } catch (e) {
        // 파싱 실패 시 아무것도 하지 않음
      }
    }
    // localStorage가 없거나 빈 배열이면 아무것도 하지 않음(초기상태 유지)
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats/ai/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const now = new Date();
        const item: AIResultItem = {
          id: idCounter,
          timestamp: formatDate(now),
          result: data.ai_result,
        };
        setHistory(prev => [item, ...prev]);
        setIdCounter(idCounter + 1);
        setExpandedId(item.id); // 항상 최신 결과 펼침
      }
    } catch (e: any) {
      setError(e.message || 'AI 분석 요청 실패');
    } finally {
      setLoading(false);
    }
  };

  // 최신 결과 카드 (항상 펼침, 스타일 강조)
  const renderLatestResultCard = (item: AIResultItem, expanded: boolean) => (
    <div
      key={item.id}
      className="ai-insights-result ai-insights-latest"
      style={{
        borderLeft: '6px solid #2563eb',
        marginBottom: 18,
        background: '#fff',
        boxShadow: '0 2px 12px rgba(37,99,235,0.10)',
        border: '1.5px solid #2563eb',
        position: 'relative',
        paddingTop: 18
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, borderRadius: '0 0 8px 0', padding: '2px 14px' }}>
        Latest Analysis Result
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#2563eb' }}>AI 분석 결과</div>
        <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.timestamp}</div>
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
        {Object.entries(FIELD_LABELS).map(([key, { label, color }]) => (
          item.result[key] && (
            <div key={key} style={{ borderLeft: `4px solid ${color}`, paddingLeft: 12, marginBottom: 2 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7 }}>{item.result[key]}</div>
            </div>
          )
        ))}
      </div>
    </div>
  );

  // 히스토리 카드 (기본 닫힘, 클릭 시 펼침)
  const renderResultCard = (item: AIResultItem, expanded: boolean) => (
    <div
      key={item.id}
      className={`ai-insights-result ai-insights-history-card${expanded ? ' expanded' : ''}`}
      style={{
        borderLeft: `6px solid #2563eb`,
        marginBottom: 10,
        cursor: 'pointer',
        background: expanded ? '#f1f5f9' : '#f8fafc',
        boxShadow: expanded ? '0 2px 8px rgba(30,41,59,0.10)' : 'none',
        transition: 'background 0.15s',
      }}
      onClick={() => setExpandedId(expanded ? null : item.id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 12 : 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#2563eb' }}>
          AI 분석 결과
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{item.timestamp}</div>
      </div>
      {expanded ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
          {Object.entries(FIELD_LABELS).map(([key, { label, color }]) => (
            item.result[key] && (
              <div key={key} style={{ borderLeft: `4px solid ${color}`, paddingLeft: 12, marginBottom: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7 }}>{item.result[key]}</div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: '#374151', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.result.insights}
        </div>
      )}
    </div>
  );

  return (
    <div className="ai-insights-container">
      <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '36px 0 32px 0' }} />
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="ai-insights-btn"
        >
          {loading ? 'AI 분석 중...' : 'AI 분석 시작'}
        </button>
      </div>
      {error && (
        <div className="ai-insights-error">
          에러: {error}
        </div>
      )}
      {/* 최신 분석 결과 영역 */}
      {history.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          {renderLatestResultCard(history[0], expandedId === history[0].id)}
        </div>
      )}
      {/* 히스토리 리스트 영역 */}
      <div style={{ marginTop: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#374151', marginBottom: 10 }}>AI 분석 결과 히스토리</div>
        {history.length > 1 ? (
          history.slice(1).map(item => renderResultCard(item, expandedId === item.id))
        ) : (
          <div className="ai-insights-empty">
            최근 5분간의 로그 데이터를 기반으로 AI 인사이트를 얻으려면 [AI 분석 시작]을 클릭하세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights; 