const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET dashboard analytics
router.get('/dashboard', analyticsController.getDashboard);

// GET cost analysis
router.get('/costs', analyticsController.getCostAnalysis);

// GET predictive insights
router.get('/insights', analyticsController.getPredictiveInsights);

// GET reliability metrics for all machines
router.get('/reliability', analyticsController.getAllReliabilityMetrics);

// GET reliability metrics for a specific machine
router.get('/reliability/:machineId', analyticsController.getMachineReliabilityMetrics);

module.exports = router;
