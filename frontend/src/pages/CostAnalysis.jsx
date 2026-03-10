import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import '../styles/CostAnalysis.css';

export default function CostAnalysis({ apiUrl }) {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCostAnalysis();
  }, []);

  const fetchCostAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/analytics/costs`);
      const data = await res.json();
      setCostData(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching cost analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading cost analysis...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!costData) return <div className="error">Cost data not available</div>;

  const costComparison = costData.cost_comparison || {};
  const projections = costData.projections || {};

  const comparisonData = [
    {
      name: 'Preventive\nMaintenance',
      cost: costComparison.preventive_maintenance || 60000
    },
    {
      name: 'Breakdown\nRepair',
      cost: costComparison.breakdown_repair || 300000
    },
    {
      name: 'Lost Revenue\nper Breakdown',
      cost: costComparison.lost_revenue_per_breakdown || 1000000
    }
  ];

  const savingsData = [
    {
      name: 'Without Preventive Maintenance',
      cost: (costComparison.breakdown_repair || 0) + (costComparison.lost_revenue_per_breakdown || 0)
    },
    {
      name: 'With Preventive Maintenance',
      cost: costComparison.preventive_maintenance || 60000
    }
  ];

  const roi = projections.roi_percentage || 0;
  const potentialSavings = projections.potential_savings || 0;
  const machinesAtRisk = projections.machines_at_risk || 0;

  const formatINR = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

  const formatINRCompact = (value) => {
    const amount = value || 0;
    if (amount >= 10000000) return `INR ${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `INR ${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `INR ${(amount / 1000).toFixed(0)}K`;
    return formatINR(amount);
  };

  return (
    <div className="cost-analysis">
      <div className="analysis-header">
        <h2>Cost-Benefit Analysis</h2>
        <p>Financial impact of preventive vs. reactive maintenance</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-value">{formatINRCompact(potentialSavings)}</div>
          <div className="metric-label">Potential Savings</div>
          <div className="metric-desc">Across all at-risk equipment</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{roi}%</div>
          <div className="metric-label">ROI</div>
          <div className="metric-desc">Return on investment</div>
        </div>

        <div className="metric-card warning">
          <div className="metric-value">{machinesAtRisk}</div>
          <div className="metric-label">Equipment at Risk</div>
          <div className="metric-desc">{projections.critical_machines || 0} Critical</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{formatINRCompact(costComparison.preventive_maintenance || 0)}</div>
          <div className="metric-label">Cost per Prevention</div>
          <div className="metric-desc">vs {formatINRCompact((costComparison.breakdown_repair || 0) + (costComparison.lost_revenue_per_breakdown || 0))} for breakdown</div>
        </div>
      </div>

      {/* Cost Comparison Chart */}
      <div className="chart-card">
        <h3>Cost per Event Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatINRCompact(value)}
              labelStyle={{ color: '#333' }}
            />
            <Bar dataKey="cost" fill="#42A5F5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Scenarios Chart */}
      <div className="chart-card">
        <h3>Maintenance Strategy Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={savingsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" width={200} />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatINRCompact(value)}
              labelStyle={{ color: '#333' }}
            />
            <Bar dataKey="cost" fill="#4CAF50" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost Breakdown */}
      <div className="cost-breakdown">
        <h3>Cost Breakdown</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="breakdown-label">Preventive Maintenance Cost:</span>
            <span className="breakdown-value">{formatINR(costComparison.preventive_maintenance || 0)}</span>
          </div>

          <div className="breakdown-item">
            <span className="breakdown-label">Breakdown Repair Cost:</span>
            <span className="breakdown-value">{formatINR(costComparison.breakdown_repair || 0)}</span>
          </div>

          <div className="breakdown-item">
            <span className="breakdown-label">Lost Revenue per Breakdown:</span>
            <span className="breakdown-value">{formatINR(costComparison.lost_revenue_per_breakdown || 0)}</span>
          </div>

          <div className="breakdown-item highlight">
            <span className="breakdown-label">Total Breakdown Cost:</span>
            <span className="breakdown-value">{formatINR(costComparison.total_breakdown_cost || 0)}</span>
          </div>

          <div className="breakdown-item">
            <span className="breakdown-label">Savings per Prevention:</span>
            <span className="breakdown-value">{formatINR(costComparison.savings_per_prevention || 0)}</span>
          </div>
        </div>
      </div>

      {/* Projections */}
      <div className="projections-section">
        <h3>Financial Projections</h3>
        <div className="projection-grid">
          <div className="projection-card">
            <div className="projection-label">Machines Requiring Maintenance</div>
            <div className="projection-value">{projections.maintenance_required || 0}</div>
          </div>

          <div className="projection-card critical">
            <div className="projection-label">Critical Machines</div>
            <div className="projection-value">{projections.critical_machines || 0}</div>
          </div>

          <div className="projection-card highlight">
            <div className="projection-label">Potential Savings (All At-Risk Equipment)</div>
            <div className="projection-value">{formatINRCompact(potentialSavings)}</div>
          </div>

          <div className="projection-card">
            <div className="projection-label">ROI Percentage</div>
            <div className="projection-value">{roi}%</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations">
        <h3>Recommendations</h3>
        <ul>
          <li>Implement preventive maintenance for {machinesAtRisk} equipment at risk</li>
          <li>Schedule maintenance during off-hours to minimize impact on patient care</li>
          <li>Monitor critical equipment hourly for early warning signs</li>
          <li>Budget {formatINR(costComparison.preventive_maintenance || 0)} per preventive maintenance cycle</li>
          <li>Expected ROI of {roi}% within first maintenance cycle</li>
          <li>Potential savings of {formatINRCompact(potentialSavings)} by preventing equipment failures</li>
        </ul>
      </div>
    </div>
  );
}
