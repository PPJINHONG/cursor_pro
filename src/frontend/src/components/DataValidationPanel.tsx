import React from 'react';
import { DataValidationResult, ValidationStats } from '../utils/dataValidation';

interface DataValidationPanelProps {
  validationResult: DataValidationResult;
  stats?: ValidationStats;
  title: string;
}

const DataValidationPanel: React.FC<DataValidationPanelProps> = ({ 
  validationResult, 
  stats, 
  title 
}) => {
  const getQualityColor = (score: number) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getQualityText = (score: number) => {
    if (score >= 90) return '우수';
    if (score >= 70) return '보통';
    return '불량';
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '16px', 
        fontWeight: '600',
        color: validationResult.isValid ? '#059669' : '#dc2626'
      }}>
        {title} - 데이터 검증 결과
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 기본 정보 */}
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
            기본 정보
          </h4>
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            <div>총 레코드: <strong>{validationResult.totalRecords.toLocaleString()}</strong></div>
            <div>검증 상태: 
              <span style={{ 
                color: validationResult.isValid ? '#059669' : '#dc2626',
                fontWeight: '600',
                marginLeft: '4px'
              }}>
                {validationResult.isValid ? '✅ 유효' : '❌ 무효'}
              </span>
            </div>
            <div>요약: {validationResult.summary}</div>
          </div>
        </div>

        {/* 데이터 품질 */}
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
            데이터 품질
          </h4>
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            <div>
              완전성: 
              <span style={{ 
                color: getQualityColor(validationResult.dataQuality.completeness),
                fontWeight: '600',
                marginLeft: '4px'
              }}>
                {validationResult.dataQuality.completeness}% ({getQualityText(validationResult.dataQuality.completeness)})
              </span>
            </div>
            <div>
              일관성: 
              <span style={{ 
                color: getQualityColor(validationResult.dataQuality.consistency),
                fontWeight: '600',
                marginLeft: '4px'
              }}>
                {validationResult.dataQuality.consistency}% ({getQualityText(validationResult.dataQuality.consistency)})
              </span>
            </div>
            <div>
              정확성: 
              <span style={{ 
                color: getQualityColor(validationResult.dataQuality.accuracy),
                fontWeight: '600',
                marginLeft: '4px'
              }}>
                {validationResult.dataQuality.accuracy}% ({getQualityText(validationResult.dataQuality.accuracy)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      {stats && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
            통계 요약
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '12px',
            fontSize: '13px'
          }}>
            <div>
              <div style={{ color: '#6b7280' }}>총 요청</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>
                {stats.totalRequests.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>성공률</div>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: stats.successRate >= 95 ? '#059669' : stats.successRate >= 90 ? '#f59e0b' : '#dc2626'
              }}>
                {stats.successRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>평균 응답시간</div>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: stats.avgResponseTime <= 200 ? '#059669' : stats.avgResponseTime <= 500 ? '#f59e0b' : '#dc2626'
              }}>
                {stats.avgResponseTime.toFixed(0)}ms
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>에러 수</div>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '16px',
                color: stats.errorCount === 0 ? '#059669' : '#dc2626'
              }}>
                {stats.errorCount.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280' }}>엔드포인트</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>
                {stats.uniqueEndpoints}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이상치 목록 */}
      {validationResult.anomalies.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>
            감지된 이상치 ({validationResult.anomalies.length}개)
          </h4>
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '6px', 
            padding: '12px',
            fontSize: '13px',
            lineHeight: '1.4'
          }}>
            {validationResult.anomalies.map((anomaly, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                • {anomaly}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataValidationPanel; 