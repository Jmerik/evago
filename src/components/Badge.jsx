import React from 'react';
import './Badge.css';

export const Badge = ({ children, status = 'default', className = '' }) => {
  return (
    <span className={`badge badge-${status} ${className}`}>
      {children}
    </span>
  );
};
