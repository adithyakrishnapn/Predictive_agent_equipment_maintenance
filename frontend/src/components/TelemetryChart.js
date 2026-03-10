import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import '../styles/TelemetryChart.css';

export default function TelemetryChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="chart-placeholder">No telemetry data available</div>;
  }

  const formattedData = data.map(record => ({
    date: new Date(record.date).toLocaleDateString(),
    temperature: record.temperature,
    helium_pressure: record.helium_pressure,
    vibration: record.vibration,
    error_count: record.error_count
  }));

  return (
    <div className="telemetry-chart">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temperature" stroke="#ff7300" />
          <Line type="monotone" dataKey="helium_pressure" stroke="#0088fe" />
          <Line type="monotone" dataKey="vibration" stroke="#82ca9d" />
          <Line type="monotone" dataKey="error_count" stroke="#ffc658" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
