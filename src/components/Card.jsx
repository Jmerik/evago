import React from 'react';
import './Card.css';

export const Card = ({ children, status = 'standard', className = '', ...props }) => {
  return (
    <div className={`card card-${status} ${className}`} {...props}>
      {children}
    </div>
  );
};
