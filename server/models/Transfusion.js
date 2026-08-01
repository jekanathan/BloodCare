const mongoose = require('mongoose');

const transfusionSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  bloodRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String },
  bloodGroup: { type: String, required: true },
  units: { type: Number, required: true },

  status: { type: String, enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'], default: 'Scheduled' },
  scheduledDate: { type: Date, required: true },
  startedAt: { type: Date },
  completedAt: { type: Date },
  administeredBy: { type: String },

  vitalsBefore: { bp: String, pulse: String, temp: String },
  vitalsAfter:  { bp: String, pulse: String, temp: String },

  adverseReaction: {
    occurred: { type: Boolean, default: false },
    type: { type: String },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
    actionTaken: { type: String },
    reportedAt: { type: Date },
  },

  followUp: {
    required: { type: Boolean, default: false },
    notes: { type: String },
    followUpDate: { type: Date },
    completed: { type: Boolean, default: false },
  },

  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Transfusion', transfusionSchema);