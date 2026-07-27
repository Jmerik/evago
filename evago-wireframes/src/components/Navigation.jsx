import React from 'react';
import './Navigation.css';

export const Navigation = ({ currentView, onViewChange }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container container flex justify-between items-center">
        <div className="navbar-brand">
          EVAGO
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
