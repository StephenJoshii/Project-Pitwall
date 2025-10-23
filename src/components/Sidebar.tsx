import React from 'react'

interface Props {
  activePage: 'race' | 'season'
  onNavigate: (page: 'race' | 'season') => void
}

export default function Sidebar({ activePage, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">🏎️ Pitwall</h1>
        <p className="tagline">F1 Telemetry Dashboard</p>
      </div>
      
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activePage === 'race' ? 'active' : ''}`}
          onClick={() => onNavigate('race')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Race Analysis</span>
        </button>
        
        <button
          className={`nav-item ${activePage === 'season' ? 'active' : ''}`}
          onClick={() => onNavigate('season')}
        >
          <span className="nav-icon">🏆</span>
          <span className="nav-label">Season Overview</span>
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <div className="data-sources">
          <p className="data-label">Data Sources:</p>
          <a href="https://api.jolpi.ca/ergast/f1" target="_blank" rel="noopener noreferrer" className="data-link">
            Jolpica F1 API
          </a>
          <a href="https://openf1.org" target="_blank" rel="noopener noreferrer" className="data-link">
            OpenF1 API
          </a>
        </div>
      </div>
    </aside>
  )
}
