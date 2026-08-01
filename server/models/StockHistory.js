const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
  type: { type: String, enum: ['IN', 'OUT', 'TRANSFER', 'EXPIRED'], required: true },
  bloodGroup: { type: String, required: true },
  component: { type: String },
  units: { type: Number, required: true },
  bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
  bloodBankName: { type: String }, // denormalized for fast display, since bank may be deleted later
  toBloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
  toBloodBankName: { type: String },
  reason: { type: String },
  by: { type: String }, // display name of who performed the action
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('StockHistory', stockHistorySchema);