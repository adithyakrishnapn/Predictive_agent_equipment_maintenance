import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard.jsx';
import MachineDetail from './pages/MachineDetail.jsx';
import CostAnalysis from './pages/CostAnalysis.jsx';
import Appointments from './pages/Appointments.jsx';
import Reliability from './pages/Reliability.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState('MRI_001');
  const [apiUrl] = useState('http://localhost:5000/api');
  const [dashboardProcessingStarted, setDashboardProcessingStarted] = useState(false);
  const [machineProcessingById, setMachineProcessingById] = useState({});

  const setMachineProcessingStarted = (machineId, started) => {
    setMachineProcessingById((prev) => ({
      ...prev,
      [machineId]: started
    }));
  };

  const navigateTo = (page, machineId = null) => {
    setCurrentPage(page);
    if (machineId) setSelectedMachineId(machineId);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🏥 Hospital Equipment Monitoring</h1>
        </div>
        <div className="navbar-menu">
          <button 
            className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-btn ${currentPage === 'machines' ? 'active' : ''}`}
            onClick={() => navigateTo('machines')}
          >
            Machines
          </button>
          <button 
            className={`nav-btn ${currentPage === 'reliability' ? 'active' : ''}`}
            onClick={() => navigateTo('reliability')}
          >
            Reliability Metrics
          </button>
          <button 
            className={`nav-btn ${currentPage === 'cost-analysis' ? 'active' : ''}`}
            onClick={() => navigateTo('cost-analysis')}
          >
            Cost Analysis
          </button>
          <button 
            className={`nav-btn ${currentPage === 'appointments' ? 'active' : ''}`}
            onClick={() => navigateTo('appointments')}
          >
            Appointments
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard
            apiUrl={apiUrl}
            onSelectMachine={navigateTo}
            defaultMachineId={selectedMachineId}
            hasProcessingStarted={dashboardProcessingStarted}
            setHasProcessingStarted={setDashboardProcessingStarted}
          />
        )}
        {currentPage === 'machines' && (
          <MachineDetail
            apiUrl={apiUrl}
            machineId={selectedMachineId}
            onBack={() => navigateTo('dashboard')}
            hasProcessingStarted={!!machineProcessingById[selectedMachineId]}
            setHasProcessingStarted={(started) => setMachineProcessingStarted(selectedMachineId, started)}
          />
        )}
        {currentPage === 'reliability' && <Reliability />}
        {currentPage === 'cost-analysis' && <CostAnalysis apiUrl={apiUrl} />}
        {currentPage === 'appointments' && <Appointments apiUrl={apiUrl} />}
      </main>
    </div>
  );
}
