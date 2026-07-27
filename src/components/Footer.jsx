import React from 'react';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid var(--color-card-border, #e2e8f0)',
      marginTop: '4rem',
      padding: '2.5rem 0',
      color: 'var(--color-text-secondary, #475569)',
      fontSize: '0.875rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/images/evago_logo.jpg" 
            alt="EVAGO" 
            style={{ height: '32px', width: 'auto', borderRadius: '4px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary-dark, #0f172a)' }}>
              EVAGO
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary, #94a3b8)' }}>
              Conference travel, organized.
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary, #94a3b8)', textAlign: 'right' }}>
          &copy; {new Date().getFullYear()} EVAGO. All rights reserved. &bull; Premium Business Travel Assistant
        </div>
      </div>
    </footer>
  );
};
