import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import '../styles/Dashboard.css';

export default function Dashboard({
  apiUrl,
  onSelectMachine,
  defaultMachineId = 'MRI_001',
  hasProcessingStarted,
  setHasProcessingStarted
}) {
  const [machines, setMachines] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  useEffect(() => {
    // Keep state across page switches; only fetch if processing already started.
    if (hasProcessingStarted) {
      fetchDashboardData();
      return;
    }

    setMachines([]);
    setDashboard(null);
    setLoading(false);
    setError(null);
    setActionMessage('');
  }, [hasProcessingStarted]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [machinesRes, dashRes] = await Promise.all([
        fetch(`${apiUrl}/machines`),
        fetch(`${apiUrl}/analytics/dashboard`)
      ]);

      const machinesData = await machinesRes.json();
      const dashData = await dashRes.json();

      setMachines(machinesData.data || []);
      setDashboard(dashData.data || {});
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBeginProcessing = async () => {
    try {
      setActionLoading(true);
      setLoading(true);
      setError(null);
      setActionMessage('Starting monitoring and automation...');

      const machineId = defaultMachineId || 'MRI_001';

      const startRes = await fetch(`${apiUrl}/machines/${machineId}/monitoring/start`, { method: 'POST' });
      if (!startRes.ok) {
        throw new Error('Failed to start monitoring');
      }

      const diagnosticsRes = await fetch(`${apiUrl}/machines/${machineId}/diagnostics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notify: false })
      });
      if (!diagnosticsRes.ok) {
        throw new Error('Failed to run diagnostics');
      }

      const diagnosticsJson = await diagnosticsRes.json();
      const risk = diagnosticsJson?.data?.risk_classification || {};

      const vendorRes = await fetch(`${apiUrl}/machines/${machineId}/contact-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fault_summary: risk.predicted_failure_type || 'Automated equipment review initiated',
          urgency: (risk.risk_tier || 'High').toLowerCase(),
          preferred_window: 'ASAP'
        })
      });
      if (!vendorRes.ok) {
        throw new Error('Failed to send vendor email');
      }

      const notifyRes = await fetch(`${apiUrl}/machines/${machineId}/notify-engineering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_report: risk,
          recommended_action: risk.recommended_action || 'Schedule urgent maintenance'
        })
      });
      if (!notifyRes.ok) {
        throw new Error('Failed to send engineering email');
      }

      await fetchDashboardData();
      setHasProcessingStarted(true);
      setActionMessage('Processing complete. Dashboard data loaded and emails sent.');
    } catch (err) {
      setError(err.message);
      setActionMessage(`Begin processing failed: ${err.message}`);
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">Processing dashboard workflow...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  if (!hasProcessingStarted) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Equipment Health Overview</h2>
        </div>
        <div className="dashboard-empty-state">
          <h3>No dashboard data loaded yet</h3>
          <p>Click Begin Processing to start monitoring, trigger automation emails, and load analytics.</p>
          <button className="refresh-btn" onClick={handleBeginProcessing} disabled={actionLoading}>
            Begin Processing
          </button>
          {actionMessage && <p className="dashboard-action-message">{actionMessage}</p>}
        </div>
      </div>
    );
  }

  const machinesData = dashboard?.machines || {
    total: machines.length,
    critical: machines.filter(m => m.risk_level === 'Critical').length,
    maintenance: machines.filter(m => m.risk_level === 'Maintenance').length,
    healthy: machines.filter(m => m.risk_level === 'Normal').length,
    averageHealth: Math.round(machines.reduce((sum, m) => sum + (m.health_score || 0), 0) / machines.length) || 0
  };

  const riskDistribution = [
    { name: 'Healthy', value: machinesData.healthy, fill: '#4CAF50' },
    { name: 'Maintenance', value: machinesData.maintenance, fill: '#FFC107' },
    { name: 'Critical', value: machinesData.critical, fill: '#F44336' }
  ];

  const healthData = machines.map(m => ({
    name: m.machine_id,
    health: m.health_score || 0,
    risk: m.risk_level
  }));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Equipment Health Overview</h2>
        <button className="refresh-btn" onClick={fetchDashboardData}>Refresh</button>
      </div>
      {actionMessage && <p className="dashboard-action-message">{actionMessage}</p>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card total">
          <div className="kpi-value">{machinesData.total}</div>
          <div className="kpi-label">Total Devices</div>
        </div>

        <div className="kpi-card healthy">
          <div className="kpi-value">{machinesData.healthy}</div>
          <div className="kpi-label">Healthy</div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-value">{machinesData.maintenance}</div>
          <div className="kpi-label">Need Maintenance</div>
        </div>

        <div className="kpi-card critical">
          <div className="kpi-value">{machinesData.critical}</div>
          <div className="kpi-label">Critical</div>
        </div>

        <div className="kpi-card avg-health">
          <div className="kpi-value">{machinesData.averageHealth}%</div>
          <div className="kpi-label">Avg Health Score</div>
        </div>

        <div className="kpi-card appointments">
          <div className="kpi-value">{dashboard?.appointments?.today || 0}</div>
          <div className="kpi-label">Today's Appointments</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Risk Distribution Pie Chart */}
        <div className="chart-card">
          <h3>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Health Scores Bar Chart */}
        <div className="chart-card">
          <h3>Machine Health Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="health" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine List */}
      <div className="machines-section">
        <h3>All Equipment</h3>
        <div className="machines-list">
          {machines.map(machine => (
            <div key={machine.machine_id} className={`machine-row risk-${machine.risk_level?.toLowerCase()}`}>
              <div className="machine-col machine-name">
                <strong>{machine.machine_id}</strong>
              </div>
              <div className="machine-col">
                <div className="health-bar">
                  <div className="health-fill" style={{ width: `${machine.health_score || 0}%` }}></div>
                </div>
                <span className="health-text">{machine.health_score || 0}%</span>
              </div>
              <div className="machine-col">
                <span className={`risk-badge risk-${machine.risk_level?.toLowerCase()}`}>
                  {machine.risk_level || 'Unknown'}
                </span>
              </div>
              <div className="machine-col">
                <span className="failure-days">
                  {machine.predicted_failure_days !== null ? 
                    `${machine.predicted_failure_days} days` : 
                    'N/A'}
                </span>
              </div>
              <div className="machine-col">
                <button 
                  className="detail-btn"
                  onClick={() => onSelectMachine('machines', machine.machine_id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
