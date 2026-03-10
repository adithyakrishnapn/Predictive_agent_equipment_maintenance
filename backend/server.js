const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import Routes
const machineRoutes = require('./routes/machineRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    ml_service: process.env.ML_SERVICE_URL
  });
});

// API Routes
app.use('/api/machines', machineRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hospital Predictive Maintenance Backend API',
    version: '2.0.0',
    dataSource: 'JSON and ML Service',
    endpoints: {
      machines: '/api/machines',
      appointments: '/api/appointments',
      analytics: '/api/analytics',
      alerts: '/api/alerts',
      health: '/health'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`ML Service URL: ${process.env.ML_SERVICE_URL}`);
  logger.info('Using JSON-based data storage');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;
