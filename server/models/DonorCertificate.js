const mongoose = require('mongoose');

const donorCertificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: true, unique: true }, // e.g. BC-CERT-2026-000123
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  donorName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  totalDonationsAtIssue: { type: Number, default: 0 },
  bloodBankName: { type: String, default: 'BloodCare Network' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['valid', 'revoked'], default: 'valid' },
}, { timestamps: true });

module.exports = mongoose.model('DonorCertificate', donorCertificateSchema);