export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const endpoints = {
  // Machines
  getAllMachines: `${API_BASE_URL}/machines`,
  getMachineById: (machineId) => `${API_BASE_URL}/machines/${machineId}`,
  getTelemetry: (machineId) => `${API_BASE_URL}/machines/${machineId}/telemetry`,
  getBaseline: (machineId) => `${API_BASE_URL}/machines/${machineId}/baseline`,
  detectAnomalies: (machineId) => `${API_BASE_URL}/machines/${machineId}/detect-anomalies`,
  classifyRisk: `${API_BASE_URL}/machines/classify-risk`,
  contactVendor: (machineId) => `${API_BASE_URL}/machines/${machineId}/contact-vendor`,
  notifyEngineering: (machineId) => `${API_BASE_URL}/machines/${machineId}/notify-engineering`,
  runDiagnostics: (machineId) => `${API_BASE_URL}/machines/${machineId}/diagnostics`,
  startMonitoring: (machineId) => `${API_BASE_URL}/machines/${machineId}/monitoring/start`,
  stopMonitoring: (machineId) => `${API_BASE_URL}/machines/${machineId}/monitoring/stop`,
  monitoringStatus: (machineId) => `${API_BASE_URL}/machines/${machineId}/monitoring/status`,

  // Appointments
  getAllAppointments: `${API_BASE_URL}/appointments`,
  getSchedule: (machineId) => `${API_BASE_URL}/appointments/schedule/${machineId}`,
  createAppointment: `${API_BASE_URL}/appointments`,
  rescheduleAppointment: (appointmentId) => `${API_BASE_URL}/appointments/${appointmentId}/reschedule`,

  // Analytics
  getDashboard: `${API_BASE_URL}/analytics/dashboard`,
  getCosts: `${API_BASE_URL}/analytics/costs`,
  getInsights: `${API_BASE_URL}/analytics/insights`,

  // Alerts
  testEmail: `${API_BASE_URL}/alerts/test-email`
};
