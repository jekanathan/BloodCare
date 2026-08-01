const mongoose = require('mongoose');

const hospitalStaffSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  fullName: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String },
  staffType: { type: String, enum: ['Doctor', 'Nurse', 'Lab Technician', 'Administrative', 'Support'], default: 'Nurse' },
  phone: { type: String },
  email: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  emergencyDuty: { type: Boolean, default: false },

  dutySchedule: [{
    date: { type: Date, required: true },
    shift: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  }],

  attendance: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day'], default: 'Present' },
    checkIn: { type: String },
    checkOut: { type: String },
  }],

  leaveRequests: [{
    leaveType: { type: String, enum: ['Sick', 'Annual', 'Casual', 'Other'], default: 'Annual' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    requestedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('HospitalStaff', hospitalStaffSchema);