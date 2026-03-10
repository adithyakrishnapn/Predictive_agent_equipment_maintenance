import React from 'react';
import '../styles/StatCard.css';

export default function StatCard({ title, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}></div>
      <div className="stat-content">
        <p className="stat-title">{title}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}
