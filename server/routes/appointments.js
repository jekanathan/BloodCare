const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donor = require('../models/Donor');
const BloodBank = require('../models/BloodBank');
const Appointment = require('../models/Appointment');

// ─── GET /api/appointments/blood-banks ─────────────────────────────────────
// Real, approved blood banks a donor can book an appointment with.
router.get('/blood-banks', auth, async (req, res) => {
  try {
    const banks = await BloodBank.find({ status: 'approved' })
      .select('bankName address district phone')
      .sort({ bankName: 1 });

    res.json({
      bloodBanks: banks.map(b => ({
        _id: b._id,
        name: b.bankName,
        address: b.address || '',
        district: b.district || '',
        phone: b.phone || '',
      })),
    });
  } catch (err) {
    console.error('List blood banks error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/appointments/my ───────────────────────────────────────────────
// Donor's own appointments (confirmed + past), newest first.
router.get('/my', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const appointments = await Appointment.find({ donor: donor._id })
      .sort({ date: 1 })
      .populate('bloodBank', 'bankName address');

    res.json({
      appointments: appointments.map(a => ({
        _id: a._id,
        bank: a.bloodBank?.bankName || a.bloodBankName || 'Blood Bank',
        address: a.bloodBank?.address || a.bloodBankAddress || '',
        date: a.date,
        time: a.time,
        status: a.status,
      })),
    });
  } catch (err) {
    console.error('List my appointments error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/appointments ─────────────────────────────────────────────────
// Book a donation appointment at a blood bank.
router.post('/', auth, async (req, res) => {
  try {
    const { bloodBankId, date, time } = req.body;
    if (!bloodBankId || !date || !time) {
      return res.status(400).json({ message: 'Blood bank, date and time are required' });
    }

    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const bank = await BloodBank.findById(bloodBankId);
    if (!bank) return res.status(404).json({ message: 'Blood bank not found' });

    const appointment = await Appointment.create({
      donor: donor._id,
      bloodBank: bank._id,
      bloodBankName: bank.bankName,
      bloodBankAddress: bank.address,
      date,
      time,
      status: 'confirmed',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`bloodbank:${bank._id}`).emit('new_appointment', {
        donorName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        date,
        time,
        message: `🩸 New donation appointment booked by ${donor.fullName}`,
      });
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        _id: appointment._id,
        bank: bank.bankName,
        address: bank.address || '',
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
      },
    });
  } catch (err) {
    console.error('Book appointment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/appointments/:id/cancel ─────────────────────────────────────
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const appointment = await Appointment.findOne({ _id: req.params.id, donor: donor._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    await appointment.save();

    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;