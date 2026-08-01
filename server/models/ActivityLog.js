const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  module: {
    type: String,
    enum: ['patient', 'blood-request', 'staff', 'donor-testing', 'blood-testing',
      'emergency', 'transfusion', 'partnership', 'verification'],
    required: true,
  },
  action: { type: String, required: true }, // e.g. 'created','updated','deleted','discharged'
  description: { type: String, required: true }, // human-readable summary shown in the UI
  entityId: { type: mongoose.Schema.Types.ObjectId }, // the patient/request/etc this log is about
}, { timestamps: true });

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);