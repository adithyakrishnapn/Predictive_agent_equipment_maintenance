import axios from 'axios';
import moment from 'moment';
import logger from '../utils/logger.js';
import emailService from './emailService.js';
import appointmentService from './appointmentService.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class MLServiceClient {
  /**
   * Get equipment telemetry data for a specific date range
   * @param {string} machine_id - Machine identifier
   * @param {object} date_range - {start_date, end_date}
   * @returns {Promise<object>} Time-series sensor data
   */
  static async get_equipment_telemetry(machine_id, date_range = null) {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/telemetry/${machine_id}`);
      let telemetryData = response.data.telemetry || [];

      // Filter by date range if provided
      if (date_range && date_range.start_date && date_range.end_date) {
        const startDate = moment(date_range.start_date);
        const endDate = moment(date_range.end_date);
        
        telemetryData = telemetryData.filter(record => {
          const recordDate = moment(record.date);
          return recordDate.isBetween(startDate, endDate, null, '[]');
        });
      }

      return {
        machine_id,
        date_range: date_range || 'all',
        record_count: telemetryData.length,
        telemetry_data: telemetryData,
        parameters: ['temperature', 'helium_pressure', 'vibration', 'error_count', 'scan_volume']
      };
    } catch (error) {
      logger.error(`Error fetching telemetry for ${machine_id}:`, error.message);
      throw new Error(`Failed to fetch telemetry for ${machine_id}`);
    }
  }

  /**
   * Compute baseline (normal operating ranges) from historical data
   * @param {string} machine_id - Machine identifier
   * @param {number} lookback_days - Number of days to look back
   * @returns {Promise<object>} Normal operating ranges
   */
  static async compute_baseline(machine_id, lookback_days = 30) {
    try {
      // Pull all telemetry first, then anchor lookback to the latest available record date.
      const telemetry = await this.get_equipment_telemetry(machine_id);
      const allData = telemetry.telemetry_data;

      if (allData.length === 0) {
        throw new Error(`No telemetry data available for ${machine_id}`);
      }

      const latestRecordDate = moment.max(allData.map(record => moment(record.date)));
      const startDate = latestRecordDate.clone().subtract(lookback_days, 'days');
      const data = allData.filter(record => {
        const recordDate = moment(record.date);
        return recordDate.isBetween(startDate, latestRecordDate, null, '[]');
      });

      if (data.length === 0) {
        throw new Error(`No historical data available for ${machine_id}`);
      }

      // Calculate statistics for each parameter
      const calculateStats = (values) => {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return {
          mean: parseFloat(mean.toFixed(2)),
          std_dev: parseFloat(stdDev.toFixed(2)),
          min: Math.min(...values),
          max: Math.max(...values),
          normal_range: {
            lower: parseFloat((mean - 2 * stdDev).toFixed(2)),
            upper: parseFloat((mean + 2 * stdDev).toFixed(2))
          }
        };
      };

      const baseline = {
        machine_id,
        lookback_days,
        data_points: data.length,
        computed_at: new Date().toISOString(),
        parameters: {
          temperature: calculateStats(data.map(d => d.temperature)),
          helium_pressure: calculateStats(data.map(d => d.helium_pressure)),
          vibration: calculateStats(data.map(d => d.vibration)),
          error_count: calculateStats(data.map(d => d.error_count)),
          scan_volume: calculateStats(data.map(d => d.scan_volume))
        }
      };

      logger.info(`Baseline computed for ${machine_id} using ${lookback_days} days`);
      return baseline;
    } catch (error) {
      logger.error(`Error computing baseline for ${machine_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Detect anomalies by comparing current readings against baseline
   * @param {string} machine_id - Machine identifier
   * @param {object} current_readings - Current sensor values
   * @param {object} baseline - Baseline computed from historical data
   * @returns {Promise<object>} Flagged parameters and anomaly report
   */
  static async detect_anomalies(machine_id, current_readings, baseline) {
    try {
      const anomalies = [];
      const flagged_parameters = [];

      // Check each parameter against baseline
      const checkParameter = (param, value) => {
        const baselineParam = baseline.parameters[param];
        const { lower, upper } = baselineParam.normal_range;
        const mean = baselineParam.mean;

        if (value < lower || value > upper) {
          const deviation = Math.abs(value - mean) / baselineParam.std_dev;
          const severity = deviation > 3 ? 'critical' : deviation > 2 ? 'high' : 'medium';

          anomalies.push({
            parameter: param,
            current_value: value,
            expected_range: `${lower} - ${upper}`,
            deviation_from_mean: parseFloat(deviation.toFixed(2)),
            severity
          });

          flagged_parameters.push(param);
        }
      };

      checkParameter('temperature', current_readings.temperature);
      checkParameter('helium_pressure', current_readings.helium_pressure);
      checkParameter('vibration', current_readings.vibration);
      checkParameter('error_count', current_readings.error_count);

      const anomaly_detected = anomalies.length > 0;

      return {
        machine_id,
        timestamp: new Date().toISOString(),
        anomaly_detected,
        total_anomalies: anomalies.length,
        flagged_parameters,
        anomalies,
        current_readings,
        baseline_used: {
          lookback_days: baseline.lookback_days,
          data_points: baseline.data_points
        },
        recommendation: anomaly_detected ? 
          'Further investigation required - anomalous behavior detected' : 
          'All parameters within normal range'
      };
    } catch (error) {
      logger.error(`Error detecting anomalies for ${machine_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Classify failure risk tier with reasoning
   * @param {object} anomaly_report - Report from detect_anomalies
   * @returns {Promise<object>} Risk tier and detailed reasoning
   */
  static async classify_failure_risk(anomaly_report) {
    try {
      const { machine_id, anomalies, flagged_parameters } = anomaly_report;

      // Get ML prediction
      const mlPrediction = await axios.get(`${ML_SERVICE_URL}/machine/${machine_id}`);
      const prediction = mlPrediction.data;

      // Determine risk tier based on anomalies and ML prediction
      let risk_tier = 'Low';
      let confidence_level = 0;
      let predicted_failure_type = 'None';
      let reasoning = [];

      if (anomalies.length === 0) {
        risk_tier = 'Low';
        confidence_level = 95;
        reasoning.push('No anomalies detected in current readings');
      } else {
        const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
        const highAnomalies = anomalies.filter(a => a.severity === 'high').length;

        if (criticalAnomalies > 0 || prediction.risk_level === 'Critical') {
          risk_tier = 'Critical';
          confidence_level = 90;
          predicted_failure_type = this._determineFailureType(flagged_parameters);
          reasoning.push(`${criticalAnomalies} critical anomalies detected`);
          reasoning.push(`ML model predicts ${prediction.risk_level} risk`);
        } else if (highAnomalies > 0 || prediction.risk_level === 'Maintenance') {
          risk_tier = 'High';
          confidence_level = 80;
          predicted_failure_type = this._determineFailureType(flagged_parameters);
          reasoning.push(`${highAnomalies} high-severity anomalies detected`);
        } else {
          risk_tier = 'Medium';
          confidence_level = 70;
          reasoning.push('Minor anomalies detected, monitoring recommended');
        }
      }

      return {
        machine_id,
        risk_tier,
        confidence_level,
        predicted_failure_type,
        health_score: prediction.health_score || 100,
        predicted_failure_days: prediction.predicted_failure_days || null,
        reasoning,
        flagged_parameters,
        ml_risk_level: prediction.risk_level,
        timestamp: new Date().toISOString(),
        recommended_action: this._getRecommendedAction(risk_tier, predicted_failure_type)
      };
    } catch (error) {
      logger.error('Error classifying failure risk:', error.message);
      throw error;
    }
  }

  /**
   * Contact service vendor with fault details
   * @param {string} machine_id - Machine identifier
   * @param {string} fault_summary - Description of the fault
   * @param {string} urgency - Urgency level (low, medium, high, critical)
   * @param {string} preferred_window - Preferred service window
   * @returns {Promise<object>} Vendor contact confirmation
   */
  static async contact_service_vendor(machine_id, fault_summary, urgency, preferred_window) {
    try {
      logger.info(`Contacting vendor for ${machine_id} - Urgency: ${urgency}`);

      // Send email to vendor
      const emailResult = await emailService.contactServiceVendor(
        machine_id,
        fault_summary,
        urgency,
        preferred_window
      );

      return {
        success: true,
        machine_id,
        vendor_contacted: true,
        vendor_email: emailResult.vendor_email,
        fault_summary,
        urgency,
        preferred_window,
        scheduled_window: emailResult.scheduled_window,
        contact_timestamp: new Date().toISOString(),
        message_id: emailResult.messageId
      };
    } catch (error) {
      logger.error(`Error contacting vendor for ${machine_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Get scan schedule for a machine
   * @param {string} machine_id - Machine identifier
   * @param {object} date_range - {start_date, end_date}
   * @returns {Promise<object>} Booked patient appointments
   */
  static async get_scan_schedule(machine_id, date_range = null) {
    try {
      return await appointmentService.getMachineSchedule(machine_id, date_range);
    } catch (error) {
      logger.error(`Error fetching schedule for ${machine_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Reschedule appointment to a new slot
   * @param {string} appointment_id - Appointment identifier
   * @param {string} new_slot - New date/time slot
   * @returns {Promise<object>} Rescheduling confirmation
   */
  static async reschedule_appointment(appointment_id, new_slot) {
    try {
      return await appointmentService.rescheduleAppointment(appointment_id, new_slot);
    } catch (error) {
      logger.error(`Error rescheduling appointment ${appointment_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Notify engineering team of critical issues
   * @param {string} machine_id - Machine identifier
   * @param {object} risk_report - Risk classification report
   * @param {string} recommended_action - Recommended action
   * @returns {Promise<object>} Notification confirmation
   */
  static async notify_engineering_team(machine_id, risk_report, recommended_action) {
    try {
      // Get affected appointments
      const schedule = await this.get_scan_schedule(machine_id);
      
      // Prepare comprehensive risk report for email
      const emailRiskReport = {
        predicted_failure_type: risk_report.predicted_failure_type,
        confidence_level: risk_report.confidence_level,
        estimated_cost_prevention: 60000,
        estimated_cost_breakdown: 1300000, // 300000 + 1000000
        health_score: risk_report.health_score,
        risk_level: risk_report.risk_tier,
        impact_on_patients: {
          affected_appointments: schedule.appointments.length,
          patients_count: schedule.appointments.length,
          time_period: `Next ${risk_report.predicted_failure_days || 7} days`
        }
      };

      // Send email notification
      const emailResult = await emailService.notifyEngineeringTeam(
        machine_id,
        emailRiskReport,
        recommended_action
      );

      logger.info(`Engineering team notified for ${machine_id}`);

      return {
        success: true,
        machine_id,
        notification_sent: true,
        recipients: emailResult.recipients,
        risk_tier: risk_report.risk_tier,
        timestamp: emailResult.timestamp,
        affected_patients: schedule.appointments.length,
        message_id: emailResult.messageId
      };
    } catch (error) {
      logger.error(`Error notifying engineering team for ${machine_id}:`, error.message);
      throw error;
    }
  }

  /**
   * Helper: Determine failure type based on flagged parameters
   */
  static _determineFailureType(flagged_parameters) {
    if (flagged_parameters.includes('helium_pressure')) {
      return 'Helium System Failure';
    } else if (flagged_parameters.includes('temperature')) {
      return 'Cooling System Failure';
    } else if (flagged_parameters.includes('vibration')) {
      return 'Mechanical Component Failure';
    } else if (flagged_parameters.includes('error_count')) {
      return 'Software/Control System Error';
    }
    return 'General Equipment Degradation';
  }

  /**
   * Helper: Get recommended action based on risk
   */
  static _getRecommendedAction(risk_tier, failure_type) {
    const actions = {
      'Critical': `Immediate shutdown and emergency maintenance required for ${failure_type}`,
      'High': `Schedule urgent preventive maintenance within 24 hours for ${failure_type}`,
      'Medium': `Plan preventive maintenance within 7 days for ${failure_type}`,
      'Low': 'Continue normal monitoring'
    };
    return actions[risk_tier] || 'Monitor equipment parameters';
  }

  /**
   * Get prediction for all machines
   */
  static async getAllMachines() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/machines`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching all machines from ML service:', error.message);
      throw new Error('Failed to fetch machine predictions');
    }
  }

  /**
   * Get health prediction for a specific machine
   */
  static async getMachineHealth(machineId) {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/machine/${machineId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching machine ${machineId} from ML service:`, error.message);
      throw new Error(`Failed to fetch machine ${machineId} health data`);
    }
  }

  /**
   * Start monitoring for a machine in the ML service.
   */
  static async startMonitoring(machineId) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/monitoring/${machineId}/start`);
      return response.data;
    } catch (error) {
      logger.error(`Error starting monitoring for ${machineId}:`, error.message);
      throw new Error(`Failed to start monitoring for ${machineId}`);
    }
  }

  /**
   * Stop monitoring for a machine in the ML service.
   */
  static async stopMonitoring(machineId) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/monitoring/${machineId}/stop`);
      return response.data;
    } catch (error) {
      logger.error(`Error stopping monitoring for ${machineId}:`, error.message);
      throw new Error(`Failed to stop monitoring for ${machineId}`);
    }
  }

  /**
   * Get monitoring status for a machine from the ML service.
   */
  static async getMonitoringStatus(machineId) {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/monitoring/${machineId}/status`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching monitoring status for ${machineId}:`, error.message);
      throw new Error(`Failed to fetch monitoring status for ${machineId}`);
    }
  }

  /**
   * Check if ML service is healthy
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/`, { timeout: 5000 });
      return {
        status: 'connected',
        message: response.data.message || 'ML Service is running'
      };
    } catch (error) {
      logger.error('ML Service health check failed:', error.message);
      return {
        status: 'disconnected',
        message: 'ML Service is not available'
      };
    }
  }
}

export default MLServiceClient;
