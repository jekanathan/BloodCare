const mongoose = require('mongoose');

const partnershipSchema = new mongoose.Schema({
  requestingHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  partnerHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },

  status: { type: String, enum: ['pending', 'active', 'rejected', 'expired', 'terminated'], default: 'pending' },

  agreementStartDate: { type: Date },
  agreementEndDate: { type: Date },

  contactPerson: { name: String, designation: String, email: String, phone: String },

  documents: [{
    type: { type: String, enum: ['MOU', 'Contract', 'SLA'] },
    name: { type: String },
    fileUrl: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  }],

  respondedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Partnership', partnershipSchema);