import React from 'react';
import './Navigation.css';

export const Navigation = ({ currentView, onViewChange }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container container flex justify-between items-center">
        <div 
          className="navbar-brand flex items-center gap-3 cursor-pointer" 
          onClick={() => onViewChange('discovery')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <img 
            src="/images/evago_logo.jpg" 
            alt="EVAGO" 
            style={{ height: '36px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            <span style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '1.35rem', color: 'var(--color-primary-dark)', letterSpacing: '-0.02em' }}>
              EVAGO
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
              Conference travel, organized.
            </span>
          </div>
        </div>
        <div className="navbar-links flex gap-6">
          <button 
            className={`nav-link ${currentView === 'discovery' ? 'active' : ''}`}
            onClick={() => onViewChange('discovery')}
          >
            Discovery
          </button>
          <button 
            className={`nav-link ${currentView === 'optimization' ? 'active' : ''}`}
            onClick={() => onViewChange('optimization')}
          >
            Travel
          </button>
          <button 
            className={`nav-link ${currentView === 'travelpass' ? 'active' : ''}`}
            onClick={() => onViewChange('travelpass')}
          >
            TravelPass
          </button>
          <button 
            className={`nav-link ${currentView === 'charter' ? 'active' : ''}`}
            onClick={() => onViewChange('charter')}
          >
            Charter
          </button>
        </div>
      </div>
    </nav>
  );
};
