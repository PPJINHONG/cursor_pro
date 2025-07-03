import React, { useState } from 'react';

const SYSTEM_PROMPT = `당신은 이 프로젝트의 운영/로그/엔드포인트/에러/성능 분석 전문가입니다. 프로젝트와 무관한 질문에는 "이 프로젝트와 관련된 질문만 답변할 수 있습니다."라고 답하세요.`;

const AIChatPrompt: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLastPrompt(input);
    try {
      const res = await fetch('/api/stats/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data.result || data.ai_result || '');
    } catch (e: any) {
      setError(e.message || 'AI 응답 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) handleSend();
  };

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #2563eb',
      borderRadius: 10,
      padding: 24,
      marginBottom: 32,
      boxShadow: '0 2px 12px rgba(37,99,235,0.08)',
      maxWidth: 900,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: '#2563eb', marginBottom: 10 }}>AI Chat Prompt</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>
        로그/엔드포인트/시간대/에러율 관련 궁금한 점을 자유롭게 질문하세요.<br/>
        <span style={{ color: '#ef4444' }}>※ 프로젝트와 무관한 질문은 답변하지 않습니다.</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예) 최근 에러율이 높은 엔드포인트는?"
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 15,
            outline: 'none',
            background: '#f8fafc',
            transition: 'border-color 0.2s',
          }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '0 22px',
            fontWeight: 600,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            height: 44,
            transition: 'background 0.2s',
          }}
        >
          {loading ? '분석 중...' : '질문'}
        </button>
      </div>
      {error && <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 8 }}>{error}</div>}
      {result && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 18,
          marginTop: 8,
          color: '#1e293b',
          fontSize: 15,
          lineHeight: 1.7,
          whiteSpace: 'pre-line',
        }}>
          <div style={{ fontWeight: 600, color: '#2563eb', marginBottom: 6 }}>AI 답변</div>
          {result}
        </div>
      )}
    </div>
  );
};

export default AIChatPrompt; 