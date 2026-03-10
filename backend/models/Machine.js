import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['MRI', 'CT'],
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  location: {
    department: String,
    room: String,
    floor: String
  },
  installation_date: {
    type: Date,
    required: true
  },
  last_maintenance_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'critical', 'offline'],
    default: 'operational'
  },
  current_health_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  current_risk_level: {
    type: String,
    enum: ['Normal', 'Monitor', 'Maintenance', 'Critical'],
    default: 'Normal'
  },
  maintenance_history: [{
    date: Date,
    type: String,
    vendor: String,
    cost: Number,
    description: String,
    technician: String
  }],
  notes: String
}, {
  timestamps: true
});

// Index for faster queries
machineSchema.index({ machine_id: 1 });
machineSchema.index({ status: 1 });
machineSchema.index({ current_risk_level: 1 });

export default mongoose.model('Machine', machineSchema);
