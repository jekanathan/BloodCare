const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String, unique: true, sparse: true }, // e.g. BC-EMP-000123, auto-generated
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  department: { type: String },
  staffType: { type: String, enum: ['Admin Staff', 'Blood Bank Staff', 'Hospital Staff', 'Laboratory Staff'], default: 'Admin Staff' },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastLogin: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);