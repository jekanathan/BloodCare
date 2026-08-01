// server/routes/hospitalStaff.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const HospitalStaff = require('../models/HospitalStaff');

router.get('/', auth, async (req, res) => {
  try {
    const staff = await HospitalStaff.find({ hospital: req.user.id }).sort({ createdAt: -1 });
    res.json({ staff });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fullName, designation, department, staffType, phone, email, emergencyDuty } = req.body;
    if (!fullName || !designation) return res.status(400).json({ message: 'Name and designation are required.' });

    const staff = new HospitalStaff({ hospital: req.user.id, fullName, designation, department, staffType, phone, email, emergencyDuty });
    await staff.save();
    res.status(201).json({ message: 'Staff member added', staff });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const staff = await HospitalStaff.findOneAndUpdate({ _id: req.params.id, hospital: req.user.id }, req.body, { new: true });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Updated', staff });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const staff = await HospitalStaff.findOneAndDelete({ _id: req.params.id, hospital: req.user.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/:id/duty', auth, async (req, res) => {
  try {
    const { date, shift } = req.body;
    const staff = await HospitalStaff.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    staff.dutySchedule.push({ date, shift });
    await staff.save();
    res.status(201).json({ message: 'Duty assigned', staff });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/:id/attendance', auth, async (req, res) => {
  try {
    const { date, status, checkIn, checkOut } = req.body;
    const staff = await HospitalStaff.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    staff.attendance.push({ date, status, checkIn, checkOut });
    await staff.save();
    res.status(201).json({ message: 'Attendance recorded', staff });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/:id/leave', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const staff = await HospitalStaff.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    staff.leaveRequests.push({ leaveType, startDate, endDate, reason, status: 'Pending' });
    await staff.save();
    res.status(201).json({ message: 'Leave request added', staff });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/leave/:leaveId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const staff = await HospitalStaff.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    const leave = staff.leaveRequests.id(req.params.leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    leave.status = status;
    await staff.save();
    res.json({ message: `Leave ${status.toLowerCase()}`, staff });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;