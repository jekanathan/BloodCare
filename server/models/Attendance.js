const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true },
  checkIn: { type: String },  // "09:00"
  checkOut: { type: String }, // "17:30"
  status: { type: String, enum: ['Present', 'Late', 'Absent', 'Half Day'], default: 'Present' },
  notes: { type: String },
}, { timestamps: true });

attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);