import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import MachineDetail from './pages/MachineDetail';
import Diagnostics from './pages/Diagnostics';
import Appointments from './pages/Appointments';
import Navigation from './components/Navigation';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  const handleSelectMachine = (machineId) => {
    setSelectedMachineId(machineId);
    setCurrentPage('machine-detail');
  };

  const handleRunDiagnostics = (machineId) => {
    setSelectedMachineId(machineId);
    setCurrentPage('diagnostics');
  };

  return (
    <div className="app">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard onSelectMachine={handleSelectMachine} onRunDiagnostics={handleRunDiagnostics} />
        )}
        {currentPage === 'machine-detail' && (
          <MachineDetail machineId={selectedMachineId} />
        )}
        {currentPage === 'diagnostics' && (
          <Diagnostics machineId={selectedMachineId} />
        )}
        {currentPage === 'appointments' && (
          <Appointments />
        )}
      </main>
    </div>
  );
}
