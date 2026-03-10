import React from 'react';
import '../styles/DiagnosticStep.css';

export default function DiagnosticStep({ title, status, data }) {
  const statusIcon = {
    pending: '⏳',
    completed: '✅',
    error: '❌',
    skipped: '⊘'
  };

  return (
    <div className={`diagnostic-step ${status}`}>
      <div className="step-header">
        <span className="step-icon">{statusIcon[status] || '❓'}</span>
        <h3>{title}</h3>
        <span className={`step-status ${status}`}>{status}</span>
      </div>

      {data && (
        <div className="step-data">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
