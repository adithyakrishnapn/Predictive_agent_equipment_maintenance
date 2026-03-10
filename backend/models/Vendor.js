import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  company: {
    type: String,
    required: true
  },
  specialization: [{
    type: String,
    enum: ['MRI', 'CT', 'General Imaging', 'Emergency Repair']
  }],
  contact: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: String
  },
  service_rate: {
    type: Number,
    required: true
  },
  response_time: {
    type: String, // e.g., "24 hours", "Same day"
    default: "24-48 hours"
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  availability: [{
    day: String,
    time_slots: [String]
  }],
  certifications: [String],
  is_active: {
    type: Boolean,
    default: true
  },
  service_history: [{
    machine_id: String,
    date: Date,
    service_type: String,
    cost: Number,
    rating: Number,
    notes: String
  }]
}, {
  timestamps: true
});

vendorSchema.index({ specialization: 1 });
vendorSchema.index({ is_active: 1 });

export default mongoose.model('Vendor', vendorSchema);
