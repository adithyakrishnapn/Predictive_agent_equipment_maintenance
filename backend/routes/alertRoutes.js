const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// POST create new alert
router.post('/', alertController.createAlert);

// GET test email configuration
router.get('/test-email', alertController.testEmail);

module.exports = router;
