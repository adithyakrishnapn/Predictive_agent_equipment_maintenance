import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/MachineDetail.css';

export default function MachineDetail({
  apiUrl,
  machineId,
  onMachineChange,
  onBack,
  hasProcessingStarted,
  setHasProcessingStarted
}) {
  const [machine, setMachine] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [machineOptions, setMachineOptions] = useState([]);

  useEffect(() => {
    const fetchMachineOptions = async () => {
      try {
        const res = await fetch(`${apiUrl}/machines`);
        if (!res.ok) return;
        const data = await res.json();
        const ids = (data.data || []).map((m) => m.machine_id).filter(Boolean);
        setMachineOptions(ids);
      } catch {
        // Keep detail page functional even when options cannot be loaded.
      }
    };

    fetchMachineOptions();
  }, [apiUrl]);

  useEffect(() => {
    // Preserve processing state across tab switches and only clear when not started.
    if (hasProcessingStarted) {
      fetchMachineData();
      return;
    }

    setMachine(null);
    setTelemetry([]);
    setBaseline(null);
    setIsMonitoring(false);
    setLoading(false);
    setError(null);
    setActionMessage('Click Begin Processing to start monitoring and run automation.');
  }, [machineId, hasProcessingStarted]);

  const fetchMachineData = async () => {
    try {
      setLoading(true);
      const [machineRes, telemetryRes, baselineRes] = await Promise.all([
        fetch(`${apiUrl}/machines/${machineId}`),
        fetch(`${apiUrl}/machines/${machineId}/telemetry`),
        fetch(`${apiUrl}/machines/${machineId}/baseline`)
      ]);

      const machineData = await machineRes.json();
      const telemetryData = await telemetryRes.json();
      const baselineData = await baselineRes.json();

      setMachine(machineData.data);
      setTelemetry((telemetryData.data?.telemetry_data || []).slice(-50)); // Last 50 records
      setBaseline(baselineData.data?.parameters);

      const monitorRes = await fetch(`${apiUrl}/machines/${machineId}/monitoring/status`);
      if (monitorRes.ok) {
        const monitorData = await monitorRes.json();
        setIsMonitoring(!!monitorData.data?.is_monitoring);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching machine data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async (notify = true) => {
    const diagnosticsRes = await fetch(`${apiUrl}/machines/${machineId}/diagnostics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notify })
    });

    if (!diagnosticsRes.ok) {
      throw new Error('Failed to run diagnostics');
    }

    const diagnosticsData = await diagnosticsRes.json();
    return diagnosticsData.data;
  };

  const handleRunDiagnostics = async () => {
    try {
      setActionLoading(true);
      setActionMessage('');
      const diagnostics = await runDiagnostics(true);
      const riskTier = diagnostics?.risk_classification?.risk_tier || 'Unknown';
      setActionMessage(`Diagnostics complete. Risk tier: ${riskTier}.`);
      await fetchMachineData();
    } catch (err) {
      setActionMessage(`Diagnostics failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContactVendor = async () => {
    try {
      setActionLoading(true);
      setActionMessage('');

      const diagnostics = await runDiagnostics(false);
      const risk = diagnostics?.risk_classification;

      const vendorRes = await fetch(`${apiUrl}/machines/${machineId}/contact-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fault_summary: risk?.predicted_failure_type || 'Anomalous telemetry pattern detected',
          urgency: (risk?.risk_tier || 'High').toLowerCase(),
          preferred_window: 'ASAP'
        })
      });

      if (!vendorRes.ok) {
        throw new Error('Failed to contact vendor');
      }

      setActionMessage('Vendor contacted successfully.');
    } catch (err) {
      setActionMessage(`Contact vendor failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotifyEngineering = async () => {
    try {
      setActionLoading(true);
      setActionMessage('');

      const diagnostics = await runDiagnostics(false);
      const riskClassification = diagnostics?.risk_classification;

      const notifyRes = await fetch(`${apiUrl}/machines/${machineId}/notify-engineering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_report: riskClassification,
          recommended_action: riskClassification?.recommended_action || 'Schedule urgent maintenance'
        })
      });

      if (!notifyRes.ok) {
        throw new Error('Failed to notify engineering');
      }

      setActionMessage('Engineering notified and email workflow triggered.');
    } catch (err) {
      setActionMessage(`Notify engineering failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      setActionLoading(true);
      setActionMessage('');
      const res = await fetch(`${apiUrl}/machines/${machineId}/monitoring/start`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to start monitoring');
      }
      setIsMonitoring(true);
      setActionMessage('Monitoring started from ML service.');
    } catch (err) {
      setActionMessage(`Start monitoring failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBeginProcessing = async () => {
    try {
      setActionLoading(true);
      setLoading(true);
      setError(null);
      setActionMessage('Starting monitoring and processing...');

      const startRes = await fetch(`${apiUrl}/machines/${machineId}/monitoring/start`, { method: 'POST' });
      if (!startRes.ok) {
        throw new Error('Failed to start monitoring');
      }
      setIsMonitoring(true);

      const diagnostics = await runDiagnostics(false);
      const riskClassification = diagnostics?.risk_classification || {};

      const vendorRes = await fetch(`${apiUrl}/machines/${machineId}/contact-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fault_summary: riskClassification.predicted_failure_type || 'Automated processing initiated for machine check',
          urgency: (riskClassification.risk_tier || 'High').toLowerCase(),
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
          risk_report: riskClassification,
          recommended_action: riskClassification.recommended_action || 'Schedule urgent maintenance'
        })
      });
      if (!notifyRes.ok) {
        throw new Error('Failed to send engineering email');
      }

      await fetchMachineData();
      setHasProcessingStarted(true);
      setActionMessage('Processing complete. Data loaded and emails sent.');
    } catch (err) {
      setError(err.message);
      setActionMessage(`Begin processing failed: ${err.message}`);
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    try {
      setActionLoading(true);
      setActionMessage('');
      const res = await fetch(`${apiUrl}/machines/${machineId}/monitoring/stop`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to stop monitoring');
      }
      setIsMonitoring(false);
      setActionMessage('Monitoring stopped from ML service.');
    } catch (err) {
      setActionMessage(`Stop monitoring failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">Processing machine workflow...</div>;

  const telemetryChartData = telemetry.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    temperature: t.temperature || 0,
    pressure: t.helium_pressure || 0,
    vibration: t.vibration || 0,
    errors: t.error_count || 0
  }));

  return (
    <div className="machine-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
        <div className="machine-selector-wrap">
          <label htmlFor="machine-selector">Machine</label>
          <select
            id="machine-selector"
            className="machine-selector"
            value={machineId}
            onChange={(e) => onMachineChange?.(e.target.value)}
          >
            {machineOptions.length === 0 && <option value={machineId}>{machineId}</option>}
            {machineOptions.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
        <h2>{machineId}</h2>
        <span className={`monitoring-pill ${isMonitoring ? 'active' : 'inactive'}`}>
          {isMonitoring ? 'Monitoring: ON' : 'Monitoring: OFF'}
        </span>
      </div>

      {!hasProcessingStarted && (
        <div className="empty-state-card">
          <h3>No data loaded yet</h3>
          <p>Start monitoring and processing to fetch telemetry and run email automation.</p>
          <button className="action-btn primary" onClick={handleBeginProcessing} disabled={actionLoading}>
            Begin Processing
          </button>
        </div>
      )}

      {error && <div className="error">Error: {error}</div>}

      {/* Status Cards */}
      {hasProcessingStarted && machine && <div className="status-grid">
        <div className={`status-card risk-${machine.risk_level?.toLowerCase()}`}>
          <div className="status-label">Risk Level</div>
          <div className="status-value">{machine.risk_level || 'Unknown'}</div>
        </div>

        <div className="status-card">
          <div className="status-label">Health Score</div>
          <div className="status-value" style={{ color: machine.health_score > 70 ? '#4CAF50' : '#ff9800' }}>
            {machine.health_score || 0}%
          </div>
        </div>

        <div className="status-card">
          <div className="status-label">Predicted Failure Days</div>
          <div className="status-value">
            {machine.predicted_failure_days !== null ? machine.predicted_failure_days : 'N/A'}
          </div>
        </div>

        <div className="status-card">
          <div className="status-label">Pressure Trend</div>
          <div className="status-value">{machine.pressure_trend || 'N/A'}</div>
        </div>

        <div className="status-card">
          <div className="status-label">Last Update</div>
          <div className="status-value" style={{ fontSize: '0.9em' }}>
            {new Date(machine.last_update || Date.now()).toLocaleString()}
          </div>
        </div>

        <div className="status-card">
          <div className="status-label">Machine Type</div>
          <div className="status-value">{machine.machine_type || 'MRI'}</div>
        </div>
      </div>}

      {/* Baseline Parameters */}
      {hasProcessingStarted && baseline && (
        <div className="baseline-section">
          <h3>Operating Baseline (Normal Range)</h3>
          <div className="baseline-grid">
            {baseline.temperature && (
              <div className="baseline-item">
                <div className="baseline-param">Temperature</div>
                <div className="baseline-range">
                  Mean: {baseline.temperature.mean?.toFixed(2)}°C
                  <br />
                  Range: {baseline.temperature.normal_range?.lower?.toFixed(2)}° - {baseline.temperature.normal_range?.upper?.toFixed(2)}°
                </div>
              </div>
            )}
            {baseline.helium_pressure && (
              <div className="baseline-item">
                <div className="baseline-param">Pressure</div>
                <div className="baseline-range">
                  Mean: {baseline.helium_pressure.mean?.toFixed(2)} PSI
                  <br />
                  Range: {baseline.helium_pressure.normal_range?.lower?.toFixed(2)} - {baseline.helium_pressure.normal_range?.upper?.toFixed(2)}
                </div>
              </div>
            )}
            {baseline.vibration && (
              <div className="baseline-item">
                <div className="baseline-param">Vibration</div>
                <div className="baseline-range">
                  Mean: {baseline.vibration.mean?.toFixed(2)} mm/s
                  <br />
                  Range: {baseline.vibration.normal_range?.lower?.toFixed(2)} - {baseline.vibration.normal_range?.upper?.toFixed(2)}
                </div>
              </div>
            )}
            {baseline.error_count && (
              <div className="baseline-item">
                <div className="baseline-param">Error Count</div>
                <div className="baseline-range">
                  Mean: {baseline.error_count.mean?.toFixed(2)}
                  <br />
                  Range: {baseline.error_count.normal_range?.lower?.toFixed(2)} - {baseline.error_count.normal_range?.upper?.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Telemetry Charts */}
      {hasProcessingStarted && telemetryChartData.length > 0 && (
        <>
          <div className="chart-section">
            <h3>Temperature Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={telemetryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#FF7043" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <h3>Helium Pressure Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={telemetryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pressure" stroke="#42A5F5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <h3>Vibration & Error Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={telemetryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="vibration" stroke="#AB47BC" dot={false} />
                <Line type="monotone" dataKey="errors" stroke="#F44336" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="actions-section">
        <h3>Maintenance Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={handleRunDiagnostics} disabled={actionLoading}>
            Run Diagnostics
          </button>
          <button className="action-btn warning" onClick={handleContactVendor} disabled={actionLoading}>
            Contact Vendor
          </button>
          <button className="action-btn danger" onClick={handleNotifyEngineering} disabled={actionLoading}>
            Notify Engineering
          </button>
          <button className="action-btn primary" onClick={handleStartMonitoring} disabled={actionLoading || isMonitoring || !hasProcessingStarted}>
            Start Monitoring
          </button>
          <button className="action-btn danger" onClick={handleStopMonitoring} disabled={actionLoading || !isMonitoring || !hasProcessingStarted}>
            Stop Monitoring
          </button>
        </div>
        {actionMessage && <p className="action-message">{actionMessage}</p>}
      </div>
    </div>
  );
}
