const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    ref: 'Machine'
  },
  alert_type: {
    type: String,
    enum: ['risk_increase', 'maintenance_due', 'critical_failure', 'offline', 'anomaly'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    health_score: Number,
    risk_level: String,
    predicted_failure_days: Number,
    metrics: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved', 'dismissed'],
    default: 'new'
  },
  acknowledged_by: {
    user_id: String,
    timestamp: Date
  },
  resolved_by: {
    user_id: String,
    timestamp: Date,
    resolution_notes: String
  },
  notifications_sent: [{
    method: String, // email, sms, push
    recipient: String,
    sent_at: Date,
    status: String
  }]
}, {
  timestamps: true
});

alertSchema.index({ machine_id: 1, status: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
