// server/routes/staffHR.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Shift = require('../models/Shift');
const Staff = require('../models/Staff');

// ══════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ══════════════════════════════════════════════════════════════════════════
router.get('/attendance', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      query.date = { $gte: d, $lt: next };
    }
    const records = await Attendance.find(query).populate('staff', 'name employeeId department').sort({ date: -1 });
    res.json({ records });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/attendance', auth, async (req, res) => {
  try {
    const { staff, date, checkIn, checkOut, status, notes } = req.body;
    if (!staff || !date) return res.status(400).json({ message: 'Staff and date are required.' });

    const record = await Attendance.findOneAndUpdate(
      { staff, date: new Date(date) },
      { checkIn, checkOut, status: status || 'Present', notes },
      { new: true, upsert: true }
    );
    res.status(201).json({ message: 'Attendance recorded', record });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/attendance/:id', auth, async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// LEAVE MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/leave', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const records = await Leave.find(query).populate('staff', 'name employeeId department').sort({ createdAt: -1 });
    res.json({ records });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/leave', auth, async (req, res) => {
  try {
    const { staff, leaveType, startDate, endDate, reason } = req.body;
    if (!staff || !startDate || !endDate) return res.status(400).json({ message: 'Staff, start date and end date are required.' });
    const record = new Leave({ staff, leaveType, startDate, endDate, reason, status: 'Pending' });
    await record.save();
    res.status(201).json({ message: 'Leave request created', record });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/leave/:id/decision', auth, async (req, res) => {
  try {
    const { decision } = req.body; // 'Approved' | 'Rejected'
    const record = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: decision, reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Leave request not found' });
    res.json({ message: `Leave ${decision.toLowerCase()}`, record });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/leave/:id', auth, async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// SHIFT MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/shifts', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      query.date = { $gte: d, $lt: next };
    }
    const shifts = await Shift.find(query).populate('staff', 'name employeeId department').sort({ date: -1 });
    res.json({ shifts });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/shifts', auth, async (req, res) => {
  try {
    const { staff, date, shiftType, startTime, endTime, notes } = req.body;
    if (!staff || !date || !shiftType) return res.status(400).json({ message: 'Staff, date and shift type are required.' });
    const shift = new Shift({ staff, date, shiftType, startTime, endTime, notes });
    await shift.save();
    res.status(201).json({ message: 'Shift assigned', shift });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/shifts/:id', auth, async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// DEPARTMENTS — grouped view from existing Staff.department field
// ══════════════════════════════════════════════════════════════════════════
router.get('/departments', auth, async (req, res) => {
  try {
    const staff = await Staff.find().select('name department staffType status');
    const grouped = {};
    staff.forEach(s => {
      const dept = s.department || 'Unassigned';
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push({ _id: s._id, name: s.name, staffType: s.staffType, status: s.status });
    });
    const departments = Object.entries(grouped).map(([name, members]) => ({
      name,
      totalStaff: members.length,
      activeStaff: members.filter(m => m.status === 'active').length,
      members,
    }));
    res.json({ departments });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;