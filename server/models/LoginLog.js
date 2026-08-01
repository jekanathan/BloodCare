const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  email: { type: String, required: true },
  role: { type: String },
  status: { type: String, enum: ['success', 'failed'], required: true },
  reason: { type: String }, // set when status = 'failed'
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);