import React, { useState, useEffect } from 'react';
import { getReliabilityMetrics, getMachineReliabilityMetrics } from '../services/api';
import '../styles/Reliability.css';

const Reliability = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchMetrics();
  }, [selectedMachine, period]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (selectedMachine === 'all') {
        data = await getReliabilityMetrics(period);
      } else {
        data = await getMachineReliabilityMetrics(selectedMachine, period);
      }
      
      setMetricsData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reliability metrics:', err);
      setError('Failed to load reliability metrics');
      setLoading(false);
    }
  };

  const renderSummaryMetrics = (summary) => (
    <div className="metrics-summary">
      <h2>Fleet Reliability Summary ({period} Days)</h2>
      <div className="summary-grid">
        <div className="metric-card uptime">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Average Uptime</h3>
            <div className="metric-value">{summary.average_uptime}%</div>
            <div className="metric-subtitle">{summary.total_machines} machines</div>
          </div>
        </div>

        <div className="metric-card downtime">
          <div className="metric-icon">📉</div>
          <div className="metric-content">
            <h3>Average Downtime</h3>
            <div className="metric-value">{summary.average_downtime}%</div>
          </div>
        </div>

        <div className="metric-card mtbf">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h3>Avg MTBF</h3>
            <div className="metric-value">{summary.average_mtbf.toFixed(0)} hrs</div>
            <div className="metric-subtitle">Mean Time Between Failures</div>
          </div>
        </div>

        <div className="metric-card mttr">
          <div className="metric-icon">🔧</div>
          <div className="metric-content">
            <h3>Avg MTTR</h3>
            <div className="metric-value">{summary.average_mttr.toFixed(1)} hrs</div>
            <div className="metric-subtitle">Mean Time To Repair</div>
          </div>
        </div>

        <div className="metric-card availability">
          <div className="metric-icon">✓</div>
          <div className="metric-content">
            <h3>Availability</h3>
            <div className="metric-value">{summary.average_availability}%</div>
            <div className="metric-subtitle">System Reliability</div>
          </div>
        </div>

        <div className="metric-card cost">
          <div className="metric-icon">₹</div>
          <div className="metric-content">
            <h3>Total Costs</h3>
            <div className="metric-value">₹{(summary.total_cost / 1000).toFixed(0)}K</div>
            <div className="metric-subtitle">
              Downtime: ₹{(summary.total_downtime_cost / 1000).toFixed(0)}K | 
              Maintenance: ₹{(summary.total_maintenance_cost / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMachineMetrics = (metrics) => (
    <div className="machine-metrics">
      <h2>Machine Reliability Details: {metrics.machine_id}</h2>
      <div className="period-info">Analysis Period: {metrics.period_days} days</div>
      
      <div className="metrics-grid">
        {/* Uptime Card */}
        <div className="detail-card">
          <h3>📈 Equipment Uptime</h3>
          <div className="formula">Uptime (%) = ((Total Time - Downtime) / Total Time) × 100</div>
          <div className="calculation">
            <div className="calc-row">
              <span>Total Time:</span>
              <span>{metrics.uptime.total_hours} hours</span>
            </div>
            <div className="calc-row">
              <span>Downtime:</span>
              <span>{metrics.downtime.hours} hours</span>
            </div>
            <div className="calc-row result">
              <span>Uptime:</span>
              <span className="highlight">{metrics.uptime.percentage}%</span>
            </div>
          </div>
          <div className="example">
            Example: ({metrics.uptime.total_hours} - {metrics.downtime.hours}) / {metrics.uptime.total_hours} × 100 = {metrics.uptime.percentage}%
          </div>
        </div>

        {/* Downtime Card */}
        <div className="detail-card">
          <h3>📉 Downtime</h3>
          <div className="formula">Downtime (%) = (Downtime / Total Time) × 100</div>
          <div className="calculation">
            <div className="calc-row">
              <span>Downtime:</span>
              <span>{metrics.downtime.hours} hours</span>
            </div>
            <div className="calc-row">
              <span>Total Time:</span>
              <span>{metrics.downtime.total_hours} hours</span>
            </div>
            <div className="calc-row result">
              <span>Downtime %:</span>
              <span className="highlight">{metrics.downtime.percentage}%</span>
            </div>
          </div>
          <div className="example">
            Example: {metrics.downtime.hours} / {metrics.downtime.total_hours} × 100 = {metrics.downtime.percentage}%
          </div>
        </div>

        {/* MTBF Card */}
        <div className="detail-card">
          <h3>⚡ Mean Time Between Failures (MTBF)</h3>
          <div className="formula">MTBF = Total Operating Time / Number of Failures</div>
          <div className="calculation">
            <div className="calc-row">
              <span>Operating Time:</span>
              <span>{metrics.mtbf.operating_time} hours</span>
            </div>
            <div className="calc-row">
              <span>Failures:</span>
              <span>{metrics.mtbf.failures}</span>
            </div>
            <div className="calc-row result">
              <span>MTBF:</span>
              <span className="highlight">{metrics.mtbf.hours} hours</span>
            </div>
          </div>
          <div className="example">
            Example: {metrics.mtbf.operating_time} / {metrics.mtbf.failures || 1} = {metrics.mtbf.hours} hours
          </div>
        </div>

        {/* MTTR Card */}
        <div className="detail-card">
          <h3>🔧 Mean Time To Repair (MTTR)</h3>
          <div className="formula">MTTR = Total Repair Time / Number of Repairs</div>
          <div className="calculation">
            <div className="calc-row">
              <span>Total Repair Time:</span>
              <span>{metrics.mttr.total_repair_time} hours</span>
            </div>
            <div className="calc-row">
              <span>Repairs:</span>
              <span>{metrics.mttr.repairs}</span>
            </div>
            <div className="calc-row result">
              <span>MTTR:</span>
              <span className="highlight">{metrics.mttr.hours} hours</span>
            </div>
          </div>
          <div className="example">
            Example: {metrics.mttr.total_repair_time} / {metrics.mttr.repairs || 1} = {metrics.mttr.hours} hours
          </div>
        </div>

        {/* Response Time Card */}
        <div className="detail-card">
          <h3>⏱️ Maintenance Response Time</h3>
          <div className="formula">Time taken for maintenance team to start service after failure</div>
          <div className="calculation">
            <div className="calc-row">
              <span>Appointments Analyzed:</span>
              <span>{metrics.response_time.appointments_analyzed}</span>
            </div>
            <div className="calc-row result">
              <span>Average Response:</span>
              <span className="highlight">{metrics.response_time.average_hours} hours</span>
            </div>
          </div>
          <div className="example">
            Example: Average time from failure detection to technician arrival
          </div>
        </div>

        {/* Downtime Cost Card */}
        <div className="detail-card">
          <h3>₹ Downtime Cost</h3>
          <div className="formula">Downtime Cost = Downtime Duration × Revenue Loss Per Hour</div>
          <div className="calculation">
            <div className="calc-row">
              <span>Downtime:</span>
              <span>{metrics.downtime.hours} hours</span>
            </div>
            <div className="calc-row">
              <span>Revenue Loss/Hour:</span>
              <span>₹{metrics.costs.revenue_per_hour.toLocaleString()}</span>
            </div>
            <div className="calc-row result">
              <span>Total Cost:</span>
              <span className="highlight">₹{metrics.costs.downtime_cost.toLocaleString()}</span>
            </div>
          </div>
          <div className="example">
            Example: {metrics.downtime.hours} × ₹{metrics.costs.revenue_per_hour.toLocaleString()} = ₹{metrics.costs.downtime_cost.toLocaleString()}
          </div>
        </div>

        {/* Availability Card */}
        <div className="detail-card">
          <h3>✓ Availability (System Reliability)</h3>
          <div className="formula">Availability = MTBF / (MTBF + MTTR)</div>
          <div className="calculation">
            <div className="calc-row">
              <span>MTBF:</span>
              <span>{metrics.mtbf.hours} hours</span>
            </div>
            <div className="calc-row">
              <span>MTTR:</span>
              <span>{metrics.mttr.hours} hours</span>
            </div>
            <div className="calc-row result">
              <span>Availability:</span>
              <span className="highlight">{metrics.availability.percentage}%</span>
            </div>
          </div>
          <div className="example">
            Example: {metrics.mtbf.hours} / ({metrics.mtbf.hours} + {metrics.mttr.hours}) = {metrics.availability.decimal} = {metrics.availability.percentage}%
          </div>
        </div>

        {/* Failure Rate Card */}
        <div className="detail-card">
          <h3>⚠️ Failure Rate</h3>
          <div className="formula">Failure Rate = Number of Failures / Total Operating Time</div>
          <div className="calculation">
            <div className="calc-row">
              <span>Failures:</span>
              <span>{metrics.failure_rate.failures}</span>
            </div>
            <div className="calc-row">
              <span>Operating Time:</span>
              <span>{metrics.failure_rate.operating_time} hours</span>
            </div>
            <div className="calc-row result">
              <span>Failure Rate:</span>
              <span className="highlight">{metrics.failure_rate.rate}</span>
            </div>
          </div>
          <div className="example">
            Example: {metrics.failure_rate.failures} / {metrics.failure_rate.operating_time} = {metrics.failure_rate.rate}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMachinesList = (machines) => (
    <div className="machines-list">
      <h2>Individual Machine Metrics</h2>
      <div className="machines-table-container">
        <table className="machines-table">
          <thead>
            <tr>
              <th>Machine ID</th>
              <th>Uptime %</th>
              <th>Downtime %</th>
              <th>MTBF (hrs)</th>
              <th>MTTR (hrs)</th>
              <th>Availability %</th>
              <th>Failure Rate</th>
              <th>Downtime Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.machine_id}>
                <td><strong>{machine.machine_id}</strong></td>
                <td className="uptime-cell">{machine.uptime.percentage}%</td>
                <td className="downtime-cell">{machine.downtime.percentage}%</td>
                <td>{machine.mtbf.hours}</td>
                <td>{machine.mttr.hours}</td>
                <td>{machine.availability.percentage}%</td>
                <td>{machine.failure_rate.rate.toFixed(4)}</td>
                <td>₹{(machine.costs.downtime_cost / 1000).toFixed(0)}K</td>
                <td>
                  <button 
                    className="view-btn"
                    onClick={() => setSelectedMachine(machine.machine_id)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="reliability-container">
        <div className="loading">Loading reliability metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reliability-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="reliability-container">
      <div className="reliability-header">
        <h1>Equipment Reliability Metrics</h1>
        <div className="controls">
          <div className="control-group">
            <label>Period:</label>
            <select value={period} onChange={(e) => setPeriod(parseInt(e.target.value))}>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          <div className="control-group">
            <label>View:</label>
            <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)}>
              <option value="all">All Machines (Fleet Summary)</option>
              {metricsData?.machines?.map((m) => (
                <option key={m.machine_id} value={m.machine_id}>
                  {m.machine_id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedMachine === 'all' ? (
        <>
          {metricsData?.summary && renderSummaryMetrics(metricsData.summary)}
          {metricsData?.machines && renderMachinesList(metricsData.machines)}
        </>
      ) : (
        <>
          <button className="back-btn" onClick={() => setSelectedMachine('all')}>
            ← Back to Fleet Summary
          </button>
          {metricsData && renderMachineMetrics(metricsData)}
        </>
      )}
    </div>
  );
};

export default Reliability;
