const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const BloodBag = require('../models/BloodBag');
const logActivity = require('../utils/logActivity');

// ─── GET /api/blood-requests/my ──────────────────────────────────────────────
// Hospital portal: returns only this logged-in hospital's own requests.
router.get('/my', auth, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ hospital: req.user.id })
      .populate('allocatedBags', 'bagId bloodGroup component status')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map(r => ({
        _id: r._id,
        patient: { name: r.patientName, age: r.patientAge, ward: r.patientWard },
        bloodGroup: r.bloodGroup,
        units: r.unitsRequired,
        priority: r.priority,
        status: r.status,
        crossMatch: r.crossMatch,
        allocatedBags: r.allocatedBags,
        patientTesting: r.patientTesting,
        dispatchDriver: r.dispatchDriver,
        dispatchVehicle: r.dispatchVehicle,
        dispatchETA: r.dispatchETA,
        receivedBy: r.receivedBy,
        requestedBy: r.requestedBy,
        notes: r.notes,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
        dispatchedAt: r.dispatchedAt,
        deliveredAt: r.deliveredAt,
      })),
    });
  } catch (err) {
    console.error('Get my blood requests error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/pre-transfusion-test ─────────────────────
router.patch('/:id/pre-transfusion-test', auth, async (req, res) => {
  try {
    const {
      bloodGroupConfirmed, antibodyScreening, compatibilityResult,
      patientIdVerified, bloodBagVerified, vitalsChecked, consentObtained,
      performedBy, notes,
    } = req.body;

    const request = await BloodRequest.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!request) return res.status(404).json({ message: 'Request not found for your hospital.' });

    request.patientTesting = {
      bloodGroupConfirmed, antibodyScreening, compatibilityResult,
      patientIdVerified: !!patientIdVerified, bloodBagVerified: !!bloodBagVerified,
      vitalsChecked: !!vitalsChecked, consentObtained: !!consentObtained,
      performedBy, notes, testedAt: new Date(),
    };
    await request.save();

    res.json({ message: 'Pre-transfusion test results saved', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/blood-requests ─────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('hospital', 'hospitalName phone district')
      .populate('allocatedBags', 'bagId bloodGroup component status')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map(r => ({
        _id: r._id,
        hospital: {
          hospitalName: r.hospital?.hospitalName || 'Unknown',
          phone: r.hospital?.phone,
          district: r.hospital?.district,
        },
        patient: {
          name: r.patientName,
          age: r.patientAge,
          ward: r.patientWard,
        },
        bloodGroup: r.bloodGroup,
        units: r.unitsRequired,
        priority: r.priority,
        status: r.status,
        crossMatch: r.crossMatch,
        crossMatchLabOfficer: r.crossMatchLabOfficer,
        crossMatchNotes: r.crossMatchNotes,
        crossMatchedAt: r.crossMatchedAt,
        allocatedBags: r.allocatedBags,
        allocatedAt: r.allocatedAt,
        dispatchDriver: r.dispatchDriver,
        dispatchVehicle: r.dispatchVehicle,
        dispatchETA: r.dispatchETA,
        receivedBy: r.receivedBy,
        receivedAt: r.receivedAt,
        cancelledAt: r.cancelledAt,
        cancellationReason: r.cancellationReason,
        requestedBy: r.requestedBy,
        notes: r.notes,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
        dispatchedAt: r.dispatchedAt,
        deliveredAt: r.deliveredAt,
      })),
    });
  } catch (err) {
    console.error('Get blood requests error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/blood-requests/hospitals ──────────────────────────────────────
router.get('/hospitals', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ status: 'approved' }).select('hospitalName');
    res.json({ hospitals: hospitals.map(h => ({ _id: h._id, name: h.hospitalName })) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/blood-requests ────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { hospitalId, patientId, patientName, patientAge, patientWard, bloodGroup, unitsRequired, priority, requestedBy, notes } = req.body;
    const finalHospitalId = hospitalId || req.user.id; // hospital portal: self-submits, no dropdown needed

    if (!finalHospitalId || !bloodGroup || !unitsRequired) {
      return res.status(400).json({ message: 'Hospital, blood group, and units are required' });
    }

    const request = new BloodRequest({
      hospital: finalHospitalId,
      patient: patientId || undefined,
      patientName, patientAge: patientAge ? parseInt(patientAge) : undefined, patientWard,
      bloodGroup, unitsRequired: parseInt(unitsRequired),
      priority: priority || 'Normal',
      requestedBy, notes,
    });
    await request.save();

    logActivity(
      finalHospitalId, 'blood-request', 'submitted',
      `Submitted ${priority || 'Normal'} request for ${unitsRequired} unit(s) of ${bloodGroup}${patientName ? ` for ${patientName}` : ''}`,
      request._id
    );

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_blood_request', {
        requestId: request._id, bloodGroup, units: unitsRequired, priority,
      });
    }

    res.status(201).json({ message: 'Blood request created', request });
  } catch (err) {
    console.error('Create blood request error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/blood-requests/:id/inventory-check ────────────────────────────
router.get('/:id/inventory-check', auth, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const availableBags = await BloodBag.find({ bloodGroup: request.bloodGroup, status: 'Safe' })
      .populate('bloodBank', 'bankName district');

    const byBank = {};
    availableBags.forEach(b => {
      const key = b.bloodBank?._id?.toString() || 'unknown';
      if (!byBank[key]) byBank[key] = { bloodBankId: key, bloodBankName: b.bloodBank?.bankName || 'Unknown', district: b.bloodBank?.district, count: 0 };
      byBank[key].count += 1;
    });

    const totalAvailable = availableBags.length;
    res.json({
      bloodGroup: request.bloodGroup,
      unitsRequired: request.unitsRequired,
      totalAvailable,
      sufficient: totalAvailable >= request.unitsRequired,
      lowStock: totalAvailable < request.unitsRequired,
      byBloodBank: Object.values(byBank),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/cross-match ──────────────────────────────
router.patch('/:id/cross-match', auth, async (req, res) => {
  try {
    const { result, labOfficer, notes } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.crossMatch = result;
    request.crossMatchLabOfficer = labOfficer;
    request.crossMatchNotes = notes;
    request.crossMatchedAt = new Date();
    await request.save();

    res.json({ message: `Cross match ${result}`, request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/blood-requests/:id/available-bags ─────────────────────────────
router.get('/:id/available-bags', auth, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const bags = await BloodBag.find({ bloodGroup: request.bloodGroup, status: 'Safe' })
      .populate('bloodBank', 'bankName')
      .sort({ expiryDate: 1 }); // FEFO — first expire, first out

    res.json({ bags });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/blood-requests/:id/allocate ──────────────────────────────────
router.post('/:id/allocate', auth, async (req, res) => {
  try {
    const { bagIds } = req.body;
    if (!bagIds?.length) return res.status(400).json({ message: 'Select at least one blood bag.' });

    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const bags = await BloodBag.find({ _id: { $in: bagIds } });
    const notSafe = bags.find(b => b.status !== 'Safe');
    if (notSafe) return res.status(400).json({ message: `Bag ${notSafe.bagId} is not Safe and cannot be allocated.` });

    await BloodBag.updateMany({ _id: { $in: bagIds } }, { status: 'Reserved' });

    request.allocatedBags = [...new Set([...(request.allocatedBags || []).map(String), ...bagIds])];
    request.allocatedAt = new Date();
    request.status = 'processing';
    await request.save();

    res.json({ message: `${bagIds.length} bag(s) allocated`, request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/release-allocation ───────────────────────
router.patch('/:id/release-allocation', auth, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    await BloodBag.updateMany({ _id: { $in: request.allocatedBags } }, { status: 'Safe' });
    request.allocatedBags = [];
    request.allocatedAt = undefined;
    await request.save();

    res.json({ message: 'Allocation released', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/approve ──────────────────────────────────
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'approved';
    request.approvedAt = new Date();
    await request.save();

    res.json({ message: 'Request approved', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/reject ───────────────────────────────────
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'rejected';
    if (reason) request.notes = `${request.notes || ''}\nRejection reason: ${reason}`.trim();
    await request.save();

    res.json({ message: 'Request rejected', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/cancel ───────────────────────────────────
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.allocatedBags?.length) {
      await BloodBag.updateMany({ _id: { $in: request.allocatedBags } }, { status: 'Safe' });
    }

    request.status = 'cancelled';
    request.cancelledAt = new Date();
    request.cancelledBy = req.user.id;
    request.cancellationReason = reason;
    await request.save();

    // Log against the request's own hospital, not req.user.id — this route
    // can be called by roles other than the requesting hospital.
    logActivity(
      request.hospital, 'blood-request', 'cancelled',
      `Cancelled request for ${request.unitsRequired} unit(s) of ${request.bloodGroup}${reason ? ` — ${reason}` : ''}`,
      request._id
    );

    res.json({ message: 'Request cancelled', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/dispatch ─────────────────────────────────
router.patch('/:id/dispatch', auth, async (req, res) => {
  try {
    const { driver, vehicle, eta } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.allocatedBags?.length) {
      await BloodBag.updateMany({ _id: { $in: request.allocatedBags } }, { status: 'Issued' });
    }

    request.status = 'dispatched';
    request.dispatchedAt = new Date();
    request.dispatchDriver = driver;
    request.dispatchVehicle = vehicle;
    request.dispatchETA = eta || undefined;
    await request.save();

    res.json({ message: 'Request marked as dispatched', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-requests/:id/deliver ──────────────────────────────────
router.patch('/:id/deliver', auth, async (req, res) => {
  try {
    const { receivedBy } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'delivered';
    request.deliveredAt = new Date();
    request.fulfilledAt = new Date();
    request.receivedBy = receivedBy;
    request.receivedAt = new Date();
    await request.save();

    logActivity(
      request.hospital, 'blood-request', 'delivered',
      `Confirmed receipt of ${request.unitsRequired} unit(s) of ${request.bloodGroup}, received by ${receivedBy}`,
      request._id
    );

    res.json({ message: 'Request marked as delivered', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;