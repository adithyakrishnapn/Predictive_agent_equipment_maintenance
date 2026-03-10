import express from 'express';
import * as alertController from '../controllers/alertController.js';

const router = express.Router();

// POST create new alert
router.post('/', alertController.createAlert);

// GET test email configuration
router.get('/test-email', alertController.testEmail);

export default router;
