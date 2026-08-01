const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Refrigerator', 'Blood Mixer', 'Centrifuge', 'Incubator', 'Other'], default: 'Other' },
  serialNumber: { type: String },
  purchaseDate: { type: Date },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  status: { type: String, enum: ['Working', 'Maintenance', 'Out of Service'], default: 'Working' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);