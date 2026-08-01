const mongoose = require('mongoose');

const bagVerificationSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  bloodBag: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBag' },
  bagId: { type: String, required: true },
  bagStatusAtVerification: { type: String },
  result: { type: String, enum: ['Valid', 'Invalid', 'Unsafe'], required: true },
  verifiedBy: { type: String },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('BagVerification', bagVerificationSchema);