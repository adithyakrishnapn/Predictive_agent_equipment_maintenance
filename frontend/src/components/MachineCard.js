import React from 'react';
import '../styles/MachineCard.css';

export default function MachineCard({ machine, onSelect, onRunDiagnostics }) {
  const getRiskColor = (risk) => {
    const riskMap = {
      'Critical': '#f44336',
      'High': '#ff9800',
      'Medium': '#ffc107',
      'Low': '#4CAF50'
    };
    return riskMap[risk] || '#888';
  };

  return (
    <div className="machine-card">
      <div className="card-header">
        <h3>{machine.machine_id}</h3>
        <span className="risk-badge" style={{ backgroundColor: getRiskColor(machine.risk_level) }}>
          {machine.risk_level}
        </span>
      </div>

      <div className="card-body">
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${machine.health_score}%` }}></div>
        </div>
        <p className="health-text">Health: {machine.health_score}%</p>

        <div className="card-details">
          <p><strong>Type:</strong> {machine.machine_type || 'Unknown'}</p>
          <p><strong>Location:</strong> {machine.room || 'Unknown'}</p>
          <p><strong>Status:</strong> {machine.status || 'Active'}</p>
        </div>
      </div>

      <div className="card-footer">
        <button className="btn btn-secondary" onClick={onSelect}>
          View Details
        </button>
        <button className="btn btn-primary" onClick={onRunDiagnostics}>
          Run Diagnostics
        </button>
      </div>
    </div>
  );
}
