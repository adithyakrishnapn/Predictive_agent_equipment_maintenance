import MLServiceClient from '../services/mlService.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

/**
 * Create and process alert
 */
export const createAlert = async (req, res, next) => {
  try {
    const { machine_id, alert_type, severity, notify = false } = req.body;
    
    if (!machine_id || !alert_type || !severity) {
      return res.status(400).json({
        success: false,
        error: 'machine_id, alert_type, and severity required'
      });
    }
    
    // Get machine health
    const machineHealth = await MLServiceClient.getMachineHealth(machine_id);
    
    const alert = {
      alert_id: `ALERT-${Date.now()}`,
      machine_id,
      alert_type,
      severity,
      health_score: machineHealth.health_score,
      risk_level: machineHealth.risk_level,
      timestamp: new Date().toISOString(),
      status: 'new'
    };
    
    // If critical and notify flag is set, send emails
    if (notify && (severity === 'critical' || severity === 'high')) {
      const riskReport = {
        predicted_failure_type: 'Equipment Degradation',
        confidence_level: 85,
        estimated_cost_prevention: 60000,
        estimated_cost_breakdown: 1300000,
        health_score: machineHealth.health_score,
        risk_level: machineHealth.risk_level,
        impact_on_patients: {
          affected_appointments: 0,
          patients_count: 0,
          time_period: 'Next 7 days'
        }
      };
      
      await MLServiceClient.notify_engineering_team(
        machine_id,
        riskReport,
        machineHealth.recommendation || 'Schedule maintenance immediately'
      );
    }
    
    logger.info(`Alert created: ${alert.alert_id}`);
    
    res.status(201).json({
      success: true,
      data: alert,
      notification_sent: notify && (severity === 'critical' || severity === 'high')
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    next(error);
  }
};

/**
 * Test email configuration
 */
export const testEmail = async (req, res, next) => {
  try {
    const isConfigured = await emailService.verifyConnection();
    
    res.status(200).json({
      success: true,
      email_configured: isConfigured,
      vendor_email: process.env.VENDOR_EMAIL,
      engineering_email: process.env.ENGINEERING_TEAM_EMAIL
    });
  } catch (error) {
    logger.error('Error testing email:', error);
    next(error);
  }
};
