import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; name: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">로그 분석 대시보드</div>
      </div>
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </nav>
      {/* 추가 필터/섹션 필요시 여기에 */}
    </aside>
  );
};

export default Sidebar; 