const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g. "Emergency Hotline"
  category: { type: String, enum: ['Hospital', 'Blood Bank', 'Ambulance', 'Medical Officer', 'Police', 'Other'], default: 'Other' },
  number: { type: String, required: true },
  notes: { type: String },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);