const MLServiceClient = require('../services/mlService');
const logger = require('../utils/logger');

/**
 * Resolve current readings from request body or latest telemetry record.
 */
async function resolveCurrentReadings(machineId, requestReadings) {
  if (requestReadings) {
    return requestReadings;
  }

  const telemetryResponse = await MLServiceClient.get_equipment_telemetry(machineId);
  const telemetryData = telemetryResponse.telemetry_data || [];

  if (telemetryData.length === 0) {
    throw new Error(`No telemetry data available for ${machineId}`);
  }

  const latestRecord = telemetryData.reduce((latest, record) => {
    if (!latest) return record;
    return new Date(record.date) > new Date(latest.date) ? record : latest;
  }, null);

  return {
    temperature: latestRecord.temperature,
    helium_pressure: latestRecord.helium_pressure,
    vibration: latestRecord.vibration,
    error_count: latestRecord.error_count
  };
}

/**
 * Get all machines with ML predictions
 */
exports.getAllMachines = async (req, res, next) => {
  try {
    const mlData = await MLServiceClient.getAllMachines();
    
    res.status(200).json({
      success: true,
      count: mlData.machines?.length || 0,
      data: mlData.machines || []
    });
  } catch (error) {
    logger.error('Error in getAllMachines:', error);
    next(error);
  }
};

/**
 * Get machine by ID with ML health prediction
 */
exports.getMachineById = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const mlPrediction = await MLServiceClient.getMachineHealth(machineId);
    
    res.status(200).json({
      success: true,
      data: mlPrediction
    });
  } catch (error) {
    logger.error(`Error in getMachineById ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Get machine telemetry data with optional date range
 */
exports.getMachineTelemetry = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { start_date, end_date } = req.query;
    
    const date_range = (start_date && end_date) ? { start_date, end_date } : null;
    const telemetryData = await MLServiceClient.get_equipment_telemetry(machineId, date_range);
    
    res.status(200).json({
      success: true,
      data: telemetryData
    });
  } catch (error) {
    logger.error(`Error fetching telemetry for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Compute baseline for a machine
 */
exports.computeBaseline = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { lookback_days = 30 } = req.query;
    
    const baseline = await MLServiceClient.compute_baseline(machineId, parseInt(lookback_days));
    
    res.status(200).json({
      success: true,
      data: baseline
    });
  } catch (error) {
    logger.error(`Error computing baseline for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Detect anomalies in current readings
 */
exports.detectAnomalies = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { current_readings, lookback_days = 30 } = req.body;

    const readings = await resolveCurrentReadings(machineId, current_readings);
    
    // Compute baseline
    const baseline = await MLServiceClient.compute_baseline(machineId, parseInt(lookback_days));
    
    // Detect anomalies
    const anomalyReport = await MLServiceClient.detect_anomalies(machineId, readings, baseline);
    
    res.status(200).json({
      success: true,
      data: anomalyReport
    });
  } catch (error) {
    logger.error(`Error detecting anomalies for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Classify failure risk
 */
exports.classifyFailureRisk = async (req, res, next) => {
  try {
    const { anomaly_report } = req.body;
    
    if (!anomaly_report) {
      return res.status(400).json({
        success: false,
        error: 'anomaly_report required in request body'
      });
    }
    
    const riskClassification = await MLServiceClient.classify_failure_risk(anomaly_report);
    
    res.status(200).json({
      success: true,
      data: riskClassification
    });
  } catch (error) {
    logger.error('Error classifying failure risk:', error);
    next(error);
  }
};

/**
 * Contact service vendor
 */
exports.contactVendor = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { fault_summary, urgency, preferred_window } = req.body;
    
    if (!fault_summary || !urgency) {
      return res.status(400).json({
        success: false,
        error: 'fault_summary and urgency required'
      });
    }
    
    const result = await MLServiceClient.contact_service_vendor(
      machineId,
      fault_summary,
      urgency,
      preferred_window || 'ASAP'
    );
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Vendor contacted successfully'
    });
  } catch (error) {
    logger.error(`Error contacting vendor for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Notify engineering team
 */
exports.notifyEngineering = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { risk_report, recommended_action } = req.body;
    
    if (!risk_report || !recommended_action) {
      return res.status(400).json({
        success: false,
        error: 'risk_report and recommended_action required'
      });
    }
    
    const result = await MLServiceClient.notify_engineering_team(
      machineId,
      risk_report,
      recommended_action
    );
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Engineering team notified successfully'
    });
  } catch (error) {
    logger.error(`Error notifying engineering team for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Complete diagnostic workflow
 */
exports.runDiagnostics = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const { current_readings, notify = false } = req.body;

    const readings = await resolveCurrentReadings(machineId, current_readings);
    
    logger.info(`Running complete diagnostics for ${machineId}`);
    
    // Step 1: Compute baseline
    const baseline = await MLServiceClient.compute_baseline(machineId, 30);
    
    // Step 2: Detect anomalies
    const anomalyReport = await MLServiceClient.detect_anomalies(machineId, readings, baseline);
    
    // Step 3: Classify risk
    const riskClassification = await MLServiceClient.classify_failure_risk(anomalyReport);
    
    // Step 4: If critical or high risk, notify engineering team
    let notification = null;
    if (notify && (riskClassification.risk_tier === 'Critical' || riskClassification.risk_tier === 'High')) {
      notification = await MLServiceClient.notify_engineering_team(
        machineId,
        riskClassification,
        riskClassification.recommended_action
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        machine_id: machineId,
        baseline,
        anomaly_report: anomalyReport,
        risk_classification: riskClassification,
        notification,
        diagnostic_timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error running diagnostics for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Start continuous monitoring for a machine via ML service
 */
exports.startMonitoring = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const monitoring = await MLServiceClient.startMonitoring(machineId);

    res.status(200).json({
      success: true,
      data: monitoring,
      message: `Monitoring started for ${machineId}`
    });
  } catch (error) {
    logger.error(`Error starting monitoring for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Stop continuous monitoring for a machine via ML service
 */
exports.stopMonitoring = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const monitoring = await MLServiceClient.stopMonitoring(machineId);

    res.status(200).json({
      success: true,
      data: monitoring,
      message: `Monitoring stopped for ${machineId}`
    });
  } catch (error) {
    logger.error(`Error stopping monitoring for ${req.params.machineId}:`, error);
    next(error);
  }
};

/**
 * Get continuous monitoring status for a machine via ML service
 */
exports.getMonitoringStatus = async (req, res, next) => {
  try {
    const { machineId } = req.params;
    const monitoring = await MLServiceClient.getMonitoringStatus(machineId);

    res.status(200).json({
      success: true,
      data: monitoring
    });
  } catch (error) {
    logger.error(`Error getting monitoring status for ${req.params.machineId}:`, error);
    next(error);
  }
};
