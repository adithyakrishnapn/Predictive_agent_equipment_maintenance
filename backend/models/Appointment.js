const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_id: {
    type: String,
    required: true,
    unique: true
  },
  machine_id: {
    type: String,
    required: true,
    ref: 'Machine'
  },
  patient: {
    name: String,
    id: String,
    contact: String
  },
  scheduled_time: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  scan_type: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'],
    default: 'scheduled'
  },
  referring_doctor: String,
  department: String,
  notes: String,
  rescheduled_from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  cancellation_reason: String
}, {
  timestamps: true
});

// Indexes for efficient queries
appointmentSchema.index({ machine_id: 1, scheduled_time: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduled_time: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
