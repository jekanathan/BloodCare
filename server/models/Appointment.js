const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  donor:     { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true },

  // Denormalized snapshot so the appointment still reads fine even if the
  // blood bank record is later edited/removed.
  bloodBankName:    { type: String },
  bloodBankAddress: { type: String },

  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g. "10:00 AM"

  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  cancelledAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);