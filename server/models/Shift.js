const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true },
  shiftType: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);