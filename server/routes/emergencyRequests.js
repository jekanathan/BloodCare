// server/routes/emergencyRequests.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ─── Schema ────────────────────────────────────────────────────────────────
const emergencyRequestSchema = new mongoose.Schema({
  bloodGroup:   { type: String, required: true },
  hospital:     { type: String, required: true },
  units:        { type: Number, required: true },
  urgency:      { type: String, enum: ['Emergency','Urgent','Normal'], default: 'Emergency' },
  radius:       { type: Number, default: 10 },
  status:       { type: String, enum: ['active','fulfilled','cancelled'], default: 'active' },
  confirmedDonor: {
    donorId:   String,
    name:      String,
    phone:     String,
    blood:     String,
    distance:  Number,
  },
  donorRequests: [{
    donorId:   String,
    name:      String,
    phone:     String,
    blood:     String,
    distance:  Number,
    lat:       Number,
    lng:       Number,
    status:    { type: String, enum: ['sent','accepted','rejected','cancelled'], default: 'sent' },
    sentAt:    { type: Date, default: Date.now },
  }],
  confirmedBloodBank: {
    bloodBankId:    String,
    name:           String,
    phone:          String,
    unitsAvailable: Number,
    distance:       Number,
  },
  bloodBankRequests: [{
    bloodBankId:    String,
    name:           String,
    phone:          String,
    unitsAvailable: Number,
    distance:       Number,
    status:         { type: String, enum: ['sent','accepted','rejected','cancelled'], default: 'sent' },
    sentAt:         { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const EmergencyRequest = mongoose.models.EmergencyRequest
  || mongoose.model('EmergencyRequest', emergencyRequestSchema);

// ─── POST /api/emergency-requests ──────────────────────────────────────────
// Create a new emergency request & send to all nearby donors
router.post('/', async (req, res) => {
  try {
    const { bloodGroup, hospital, units, urgency, radius, donors } = req.body;

    if (!bloodGroup || !hospital || !units || !donors || !Array.isArray(donors)) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Build donorRequests array
    const donorRequests = donors.map(d => ({
      donorId:  d.id?.toString() || d._id?.toString(),
      name:     d.name,
      phone:    d.phone,
      blood:    d.blood,
      distance: d.distance,
      lat:      d.lat,
      lng:      d.lng,
      status:   'sent',
      sentAt:   new Date(),
    }));

    const emergencyRequest = new EmergencyRequest({
      bloodGroup,
      hospital,
      units: parseInt(units),
      urgency,
      radius: parseInt(radius),
      donorRequests,
    });

    await emergencyRequest.save();

    // ── Socket.IO: notify each donor in real-time ─────────────────────────
    const io = req.app.get('io');
    if (io) {
      donorRequests.forEach(donor => {
        // emit to donor-specific room (donor portal listens on `donor:${donorId}`)
        io.to(`donor:${donor.donorId}`).emit('emergency_request', {
          requestId:  emergencyRequest._id,
          bloodGroup,
          hospital,
          units,
          urgency,
          message:    `🚨 Emergency! ${hospital} needs ${units} unit(s) of ${bloodGroup} blood urgently!`,
        });
      });

      // Also broadcast to admin room for live dashboard update
      io.to('admin_room').emit('new_emergency_request', {
        requestId:    emergencyRequest._id,
        bloodGroup,
        hospital,
        units,
        urgency,
        donorCount:   donorRequests.length,
        createdAt:    emergencyRequest.createdAt,
      });
    }

    res.status(201).json({
      success:    true,
      message:    `Emergency request created. ${donorRequests.length} donors notified.`,
      requestId:  emergencyRequest._id,
      donorCount: donorRequests.length,
    });

  } catch (err) {
    console.error('Emergency request error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── POST /api/emergency-requests/:id/send-to-donor ───────────────────────
// Re-send / send request to a single donor
router.post('/:id/send-to-donor', async (req, res) => {
  try {
    const { donor } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Check if donor already in list
    const existing = request.donorRequests.find(d => d.donorId === donor.id?.toString());
    if (existing) {
      existing.status = 'sent';
      existing.sentAt = new Date();
    } else {
      request.donorRequests.push({
        donorId:  donor.id?.toString(),
        name:     donor.name,
        phone:    donor.phone,
        blood:    donor.blood,
        distance: donor.distance,
        lat:      donor.lat,
        lng:      donor.lng,
        status:   'sent',
        sentAt:   new Date(),
      });
    }

    request.updatedAt = new Date();
    await request.save();

    // Socket.IO notification
    const io = req.app.get('io');
    if (io) {
      io.to(`donor:${donor.id}`).emit('emergency_request', {
        requestId:  request._id,
        bloodGroup: request.bloodGroup,
        hospital:   request.hospital,
        units:      request.units,
        urgency:    request.urgency,
        message:    `🚨 Emergency! ${request.hospital} needs ${request.units} unit(s) of ${request.bloodGroup} blood!`,
      });
    }

    res.json({ success: true, message: `Request sent to ${donor.name}` });

  } catch (err) {
    console.error('Send to donor error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── POST /api/emergency-requests/:id/confirm ─────────────────────────────
// Confirm a donor for this emergency request
router.post('/:id/confirm', async (req, res) => {
  try {
    const { donor } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Set confirmed donor
    request.confirmedDonor = {
      donorId:  donor.id?.toString(),
      name:     donor.name,
      phone:    donor.phone,
      blood:    donor.blood,
      distance: donor.distance,
    };

    // Update all donor statuses
    request.donorRequests.forEach(d => {
      if (d.donorId === donor.id?.toString()) {
        d.status = 'accepted';
      } else if (d.status === 'sent') {
        d.status = 'cancelled';
      }
    });

    request.status    = 'fulfilled';
    request.updatedAt = new Date();
    await request.save();

    // Socket.IO: notify admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('emergency_fulfilled', {
        requestId:     request._id,
        confirmedDonor: request.confirmedDonor,
        bloodGroup:    request.bloodGroup,
        hospital:      request.hospital,
      });
    }

    res.json({
      success: true,
      message: `${donor.name} confirmed as donor`,
      requestId: request._id,
    });

  } catch (err) {
    console.error('Confirm donor error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── GET /api/emergency-requests ──────────────────────────────────────────
// List all emergency requests (admin dashboard)
router.get('/', async (req, res) => {
  try {
    const requests = await EmergencyRequest.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// District -> approximate lat/lng centroid, used to plot approved donors
// on the map (Donor model stores district, not exact coordinates).
const DISTRICT_COORDS = {
  Colombo:[6.9271,79.8612], Gampaha:[7.0917,79.9999], Kalutara:[6.5854,79.9607],
  Kandy:[7.2906,80.6337], Matale:[7.4675,80.6234], 'Nuwara Eliya':[6.9497,80.7891],
  Galle:[6.0535,80.2210], Matara:[5.9485,80.5353], Hambantota:[6.1241,81.1185],
  Jaffna:[9.6615,80.0255], Kilinochchi:[9.3961,80.3982], Mannar:[8.9810,79.9044],
  Vavuniya:[8.7514,80.4971], Mullaitivu:[9.2671,80.8142],
  Batticaloa:[7.7170,81.6924], Ampara:[7.2975,81.6747], Trincomalee:[8.5874,81.2152],
  Kurunegala:[7.4818,80.3609], Puttalam:[8.0362,79.8283],
  Anuradhapura:[8.3114,80.4037], Polonnaruwa:[7.9403,81.0188],
  Badulla:[6.9934,81.0550], Monaragala:[6.8714,81.3507],
  Ratnapura:[6.6828,80.3992], Kegalle:[7.2513,80.3464],
};

// Haversine distance in km between two lat/lng points.
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── GET /api/emergency-requests/hospitals ──────────────────────────────────
// Approved hospitals, for the Emergency Page's hospital dropdown.
router.get('/hospitals', async (req, res) => {
  try {
    const Hospital = require('../models/Hospital');
    const hospitals = await Hospital.find({ status: 'approved' }).select('hospitalName');
    res.json({ success: true, hospitals: hospitals.map(h => ({ _id: h._id, name: h.hospitalName })) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── GET /api/emergency-requests/search-donors ──────────────────────────────
// Real approved donors matching the requested blood group, with distance
// from the hospital (Colombo coordinates as the default hospital location,
// since hospitals don't yet store exact lat/lng).
router.get('/search-donors', async (req, res) => {
  try {
    const Donor = require('../models/Donor');
    const { bloodGroup, radius } = req.query;
    if (!bloodGroup) return res.status(400).json({ success: false, message: 'bloodGroup is required' });

    const hospitalLat = 6.9218, hospitalLng = 79.8654; // National Hospital Colombo, as the reference point

    const donors = await Donor.find({ status: 'approved', bloodGroup, testingStatus: 'active' })
      .select('fullName phone district lastDonationDate bloodGroup');

    const withDistance = donors
      .map(d => {
        const coords = DISTRICT_COORDS[d.district] || DISTRICT_COORDS['Colombo'];
        // Add small deterministic jitter so donors in the same district don't all stack on one point
        const jitterLat = ((d._id.toString().charCodeAt(0) % 10) - 5) * 0.01;
        const jitterLng = ((d._id.toString().charCodeAt(1) % 10) - 5) * 0.01;
        const lat = coords[0] + jitterLat;
        const lng = coords[1] + jitterLng;
        const distance = Math.round(distanceKm(hospitalLat, hospitalLng, lat, lng) * 10) / 10;
        return {
          id: d._id, name: d.fullName, blood: d.bloodGroup, phone: d.phone,
          lat, lng, distance,
          lastDonation: d.lastDonationDate ? new Date(d.lastDonationDate).toISOString().split('T')[0] : null,
        };
      })
      .filter(d => !radius || d.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.json({ success: true, donors: withDistance });
  } catch (err) {
    console.error('Search donors error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});


// ─── GET /api/emergency-requests/search-bloodbanks ──────────────────────────
// Approved blood banks that currently have stock of the requested blood group,
// based on real Inventory records (sums all batches per bank).
router.get('/search-bloodbanks', async (req, res) => {
  try {
    const BloodBank = require('../models/BloodBank');
    const Inventory = require('../models/Inventory');
    const { bloodGroup, radius } = req.query;
    if (!bloodGroup) return res.status(400).json({ success: false, message: 'bloodGroup is required' });

    const hospitalLat = 6.9218, hospitalLng = 79.8654; // National Hospital Colombo, reference point

    // Sum available units per blood bank for this blood group
    const stockByBank = await Inventory.aggregate([
      { $match: { bloodGroup } },
      { $group: { _id: '$bloodBank', totalUnits: { $sum: '$units' } } },
      { $match: { totalUnits: { $gt: 0 } } },
    ]);

    if (stockByBank.length === 0) {
      return res.json({ success: true, bloodBanks: [] });
    }

    const bankIds = stockByBank.map(s => s._id);
    const banks = await BloodBank.find({ _id: { $in: bankIds }, status: 'approved' })
      .select('bankName phone district');

    const stockMap = {};
    stockByBank.forEach(s => { stockMap[s._id.toString()] = s.totalUnits; });

    const withDistance = banks
      .map(b => {
        const coords = DISTRICT_COORDS[b.district] || DISTRICT_COORDS['Colombo'];
        const jitterLat = ((b._id.toString().charCodeAt(0) % 10) - 5) * 0.01;
        const jitterLng = ((b._id.toString().charCodeAt(1) % 10) - 5) * 0.01;
        const lat = coords[0] + jitterLat;
        const lng = coords[1] + jitterLng;
        const distance = Math.round(distanceKm(hospitalLat, hospitalLng, lat, lng) * 10) / 10;
        return {
          id: b._id, name: b.bankName, phone: b.phone, district: b.district,
          lat, lng, distance,
          unitsAvailable: stockMap[b._id.toString()] || 0,
          blood: bloodGroup,
        };
      })
      .filter(b => !radius || b.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    res.json({ success: true, bloodBanks: withDistance });
  } catch (err) {
    console.error('Search blood banks error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── POST /api/emergency-requests/:id/send-to-bloodbank ────────────────────
router.post('/:id/send-to-bloodbank', async (req, res) => {
  try {
    const { bloodBank } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!request.bloodBankRequests) request.bloodBankRequests = [];
    const existing = request.bloodBankRequests.find(b => b.bloodBankId === bloodBank.id?.toString());
    if (existing) {
      existing.status = 'sent';
      existing.sentAt = new Date();
    } else {
      request.bloodBankRequests.push({
        bloodBankId: bloodBank.id?.toString(),
        name: bloodBank.name,
        phone: bloodBank.phone,
        unitsAvailable: bloodBank.unitsAvailable,
        distance: bloodBank.distance,
        status: 'sent',
        sentAt: new Date(),
      });
    }
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`bloodbank:${bloodBank.id}`).emit('emergency_request', {
        requestId: request._id, bloodGroup: request.bloodGroup, hospital: request.hospital,
        units: request.units, urgency: request.urgency,
        message: `🚨 Emergency! ${request.hospital} needs ${request.units} unit(s) of ${request.bloodGroup} blood!`,
      });
    }

    res.json({ success: true, message: `Request sent to ${bloodBank.name}` });
  } catch (err) {
    console.error('Send to blood bank error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── POST /api/emergency-requests/:id/confirm-bloodbank ────────────────────
router.post('/:id/confirm-bloodbank', async (req, res) => {
  try {
    const { bloodBank } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.confirmedBloodBank = {
      bloodBankId: bloodBank.id?.toString(),
      name: bloodBank.name,
      phone: bloodBank.phone,
      unitsAvailable: bloodBank.unitsAvailable,
      distance: bloodBank.distance,
    };
    request.status = 'fulfilled';
    request.updatedAt = new Date();
    await request.save();

    res.json({ success: true, message: `${bloodBank.name} confirmed for blood supply`, requestId: request._id });
  } catch (err) {
    console.error('Confirm blood bank error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;