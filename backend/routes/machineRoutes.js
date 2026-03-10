const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');

// GET all machines
router.get('/', machineController.getAllMachines);

// GET machine by ID
router.get('/:machineId', machineController.getMachineById);

// GET machine telemetry (with optional date range)
router.get('/:machineId/telemetry', machineController.getMachineTelemetry);

// GET compute baseline for machine
router.get('/:machineId/baseline', machineController.computeBaseline);

// POST detect anomalies
router.post('/:machineId/detect-anomalies', machineController.detectAnomalies);

// POST classify failure risk
router.post('/classify-risk', machineController.classifyFailureRisk);

// POST contact service vendor
router.post('/:machineId/contact-vendor', machineController.contactVendor);

// POST notify engineering team
router.post('/:machineId/notify-engineering', machineController.notifyEngineering);

// POST run complete diagnostics
router.post('/:machineId/diagnostics', machineController.runDiagnostics);

// Monitoring controls
router.post('/:machineId/monitoring/start', machineController.startMonitoring);
router.post('/:machineId/monitoring/stop', machineController.stopMonitoring);
router.get('/:machineId/monitoring/status', machineController.getMonitoringStatus);

module.exports = router;
