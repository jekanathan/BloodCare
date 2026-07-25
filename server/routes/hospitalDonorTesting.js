// server/routes/hospitalDonorTesting.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donor = require('../models/Donor');

// ─── GET /api/hospital-donor-testing/appointments ──────────────────────────
router.get('/appointments', auth, async (req, res) => {
  try {
    const { scope } = req.query; // 'pending' | 'today' | 'all'
    const query = {
      'testingBooking.facilityType': 'hospital',
      'testingBooking.facilityId': req.user.id,
    };

    if (scope === 'pending') query.testingStatus = 'testing_booked';
    if (scope === 'today') {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      query['testingBooking.appointmentDate'] = { $gte: start, $lte: end };
    }

    const donors = await Donor.find(query)
      .select('fullName phone email bloodGroup nic dateOfBirth gender testingStatus testingBooking testingResult')
      .sort({ 'testingBooking.appointmentDate': 1 });

    res.json({ donors });
  } catch (err) {
    console.error('Get donor appointments error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/hospital-donor-testing/:donorId/complete-test ──────────────
router.patch('/:donorId/complete-test', auth, async (req, res) => {
  try {
    const {
      hemoglobin, bloodPressure, weight, temperature, pulseRate, confirmedBloodGroup,
      hiv, hepatitisB, hepatitisC, syphilis, malaria, doctorRemarks, finalStatus,
    } = req.body;

    if (!finalStatus) return res.status(400).json({ message: 'Final status is required.' });

    const donor = await Donor.findById(req.params.donorId);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    if (donor.testingBooking?.facilityType !== 'hospital' || String(donor.testingBooking?.facilityId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'This donor did not book testing at your hospital.' });
    }

    const decision = finalStatus === 'Eligible' ? 'accepted' : 'rejected';

    donor.testingResult = {
      decision,
      reason: finalStatus !== 'Eligible' ? (doctorRemarks || finalStatus) : undefined,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      hemoglobin, bloodPressure, weight, temperature, pulseRate, confirmedBloodGroup,
      hiv, hepatitisB, hepatitisC, syphilis, malaria, doctorRemarks, finalStatus,
    };

    donor.testingStatus = decision === 'accepted' ? 'active' : 'testing_rejected';
    donor.isEligible = decision === 'accepted';

    await donor.save();

    res.json({ message: `Donor marked as ${finalStatus}`, donor });
  } catch (err) {
    console.error('Complete donor test error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
