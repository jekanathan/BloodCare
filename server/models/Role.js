const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  color: { type: String, default: '#475569' },
  bg: { type: String, default: '#F1F5F9' },
  permissions: [{ type: String }], // flat list of permission strings, e.g. "View Donors"
  isSystemRole: { type: Boolean, default: false }, // protects "Super Admin" from deletion
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);