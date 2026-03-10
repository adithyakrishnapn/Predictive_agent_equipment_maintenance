import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

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

export default router;
