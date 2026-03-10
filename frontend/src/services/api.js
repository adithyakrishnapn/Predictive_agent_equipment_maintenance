import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Machines
export const machineAPI = {
  getAllMachines: () => apiClient.get('/machines'),
  getMachineById: (machineId) => apiClient.get(`/machines/${machineId}`),
  getTelemetry: (machineId, filters = {}) => 
    apiClient.get(`/machines/${machineId}/telemetry`, { params: filters }),
  getBaseline: (machineId, lookback_days = 30) =>
    apiClient.get(`/machines/${machineId}/baseline`, { params: { lookback_days } }),
  detectAnomalies: (machineId, data) =>
    apiClient.post(`/machines/${machineId}/detect-anomalies`, data),
  classifyRisk: (data) =>
    apiClient.post(`/machines/classify-risk`, data),
  contactVendor: (machineId, data) =>
    apiClient.post(`/machines/${machineId}/contact-vendor`, data),
  notifyEngineering: (machineId, data) =>
    apiClient.post(`/machines/${machineId}/notify-engineering`, data),
  runDiagnostics: (machineId, data) =>
    apiClient.post(`/machines/${machineId}/diagnostics`, data),
  startMonitoring: (machineId) =>
    apiClient.post(`/machines/${machineId}/monitoring/start`),
  stopMonitoring: (machineId) =>
    apiClient.post(`/machines/${machineId}/monitoring/stop`),
  getMonitoringStatus: (machineId) =>
    apiClient.get(`/machines/${machineId}/monitoring/status`)
};

// Appointments
export const appointmentAPI = {
  getAllAppointments: () => apiClient.get('/appointments'),
  getSchedule: (machineId, filters = {}) =>
    apiClient.get(`/appointments/schedule/${machineId}`, { params: filters }),
  createAppointment: (data) =>
    apiClient.post('/appointments', data),
  rescheduleAppointment: (appointmentId, data) =>
    apiClient.put(`/appointments/${appointmentId}/reschedule`, data),
  cancelAppointment: (appointmentId) =>
    apiClient.put(`/appointments/${appointmentId}/cancel`, {})
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getCosts: () => apiClient.get('/analytics/costs'),
  getInsights: () => apiClient.get('/analytics/insights'),
  getReliability: (period = 30) => apiClient.get('/analytics/reliability', { params: { period } }),
  getMachineReliability: (machineId, period = 30) => 
    apiClient.get(`/analytics/reliability/${machineId}`, { params: { period } })
};

// Wrapper functions for backward compatibility and convenience
export const getReliabilityMetrics = async (period = 30) => {
  const response = await analyticsAPI.getReliability(period);
  return response.data?.data || response.data;
};

export const getMachineReliabilityMetrics = async (machineId, period = 30) => {
  const response = await analyticsAPI.getMachineReliability(machineId, period);
  return response.data?.data || response.data;
};

// Alerts
export const alertAPI = {
  testEmail: () => axios.get('http://localhost:5000/api/alerts/test-email')
};

export default apiClient;
