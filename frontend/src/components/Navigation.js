import React from 'react';
import '../styles/Navigation.css';

export default function Navigation({ currentPage, setCurrentPage }) {
  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">🏥 Equipment Care</h1>
      </div>

      <ul className="nav-menu">
        <li>
          <button
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 Dashboard
          </button>
        </li>
        <li>
          <button
            className={`nav-link ${currentPage === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('diagnostics')}
          >
            🔍 Diagnostics
          </button>
        </li>
        <li>
          <button
            className={`nav-link ${currentPage === 'appointments' ? 'active' : ''}`}
            onClick={() => setCurrentPage('appointments')}
          >
            📅 Appointments
          </button>
        </li>
      </ul>

      <div className="nav-footer">
        <p className="api-status">✓ API Connected</p>
      </div>
    </nav>
  );
}
