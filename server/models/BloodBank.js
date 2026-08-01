const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  registrationNumber: { type: String, unique: true, sparse: true },
  licenseNumber: { type: String },
  licenseExpiry: { type: Date },
  establishedYear: { type: Number },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  district: { type: String },
  province: { type: String },
  contactPerson: { type: String },
  designation: { type: String },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('BloodBank', bloodBankSchema);