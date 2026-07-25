// server/routes/hospitalPartnerships.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Partnership = require('../models/Partnership');
const SharedBloodRequest = require('../models/SharedBloodRequest');
const Hospital = require('../models/Hospital');

router.get('/available-hospitals', auth, async (req, res) => {
  try {
    const existing = await Partnership.find({
      $or: [{ requestingHospital: req.user.id }, { partnerHospital: req.user.id }],
    });
    const excludedIds = existing.flatMap(p => [p.requestingHospital.toString(), p.partnerHospital.toString()]);
    excludedIds.push(req.user.id);

    const hospitals = await Hospital.find({ status: 'approved', _id: { $nin: excludedIds } })
      .select('hospitalName district province phone email');
    res.json({ hospitals });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const partnerships = await Partnership.find({
      $or: [{ requestingHospital: req.user.id }, { partnerHospital: req.user.id }],
    })
      .populate('requestingHospital', 'hospitalName district province phone email')
      .populate('partnerHospital', 'hospitalName district province phone email')
      .sort({ createdAt: -1 });

    res.json({
      partnerships: partnerships.map(p => ({
        _id: p._id,
        isRequester: p.requestingHospital._id.toString() === req.user.id,
        requestingHospital: p.requestingHospital,
        partnerHospital: p.partnerHospital,
        status: p.status,
        agreementStartDate: p.agreementStartDate,
        agreementEndDate: p.agreementEndDate,
        contactPerson: p.contactPerson,
        documents: p.documents,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { partnerHospitalId, agreementStartDate, agreementEndDate, contactPerson, notes } = req.body;
    if (!partnerHospitalId) return res.status(400).json({ message: 'Partner hospital is required.' });

    const partnership = new Partnership({
      requestingHospital: req.user.id, partnerHospital: partnerHospitalId,
      agreementStartDate, agreementEndDate, contactPerson, notes, status: 'pending',
    });
    await partnership.save();
    res.status(201).json({ message: 'Partnership request sent', partnership });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/respond', auth, async (req, res) => {
  try {
    const { decision } = req.body;
    const partnership = await Partnership.findOne({ _id: req.params.id, partnerHospital: req.user.id });
    if (!partnership) return res.status(404).json({ message: 'Partnership request not found for your hospital.' });

    partnership.status = decision;
    partnership.respondedAt = new Date();
    await partnership.save();
    res.json({ message: `Partnership ${decision}`, partnership });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/terminate', auth, async (req, res) => {
  try {
    const partnership = await Partnership.findOne({
      _id: req.params.id,
      $or: [{ requestingHospital: req.user.id }, { partnerHospital: req.user.id }],
    });
    if (!partnership) return res.status(404).json({ message: 'Partnership not found.' });
    partnership.status = 'terminated';
    await partnership.save();
    res.json({ message: 'Partnership terminated', partnership });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/:id/documents', auth, async (req, res) => {
  try {
    const { type, name, fileUrl } = req.body;
    const partnership = await Partnership.findOne({
      _id: req.params.id,
      $or: [{ requestingHospital: req.user.id }, { partnerHospital: req.user.id }],
    });
    if (!partnership) return res.status(404).json({ message: 'Partnership not found.' });
    partnership.documents.push({ type, name, fileUrl });
    await partnership.save();
    res.status(201).json({ message: 'Document added', partnership });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.get('/shared-requests', auth, async (req, res) => {
  try {
    const requests = await SharedBloodRequest.find({
      $or: [{ fromHospital: req.user.id }, { toHospital: req.user.id }],
    })
      .populate('fromHospital', 'hospitalName')
      .populate('toHospital', 'hospitalName')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map(r => ({
        _id: r._id,
        isSender: r.fromHospital._id.toString() === req.user.id,
        fromHospital: r.fromHospital,
        toHospital: r.toHospital,
        bloodGroup: r.bloodGroup, units: r.units, priority: r.priority, reason: r.reason,
        status: r.status, createdAt: r.createdAt,
      })),
    });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/shared-requests', auth, async (req, res) => {
  try {
    const { toHospitalId, partnershipId, bloodGroup, units, priority, reason } = req.body;
    if (!toHospitalId || !bloodGroup || !units) return res.status(400).json({ message: 'Partner hospital, blood group, and units are required.' });

    const request = new SharedBloodRequest({
      fromHospital: req.user.id, toHospital: toHospitalId, partnership: partnershipId,
      bloodGroup, units, priority, reason, status: 'pending',
    });
    await request.save();
    res.status(201).json({ message: 'Shared blood request sent', request });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/shared-requests/:id/respond', auth, async (req, res) => {
  try {
    const { decision } = req.body;
    const request = await SharedBloodRequest.findOne({ _id: req.params.id, toHospital: req.user.id });
    if (!request) return res.status(404).json({ message: 'Request not found for your hospital.' });
    request.status = decision;
    request.respondedAt = new Date();
    await request.save();
    res.json({ message: `Request ${decision}`, request });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/shared-requests/:id/complete', auth, async (req, res) => {
  try {
    const request = await SharedBloodRequest.findOne({
      _id: req.params.id,
      $or: [{ fromHospital: req.user.id }, { toHospital: req.user.id }],
    });
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();
    res.json({ message: 'Marked as completed', request });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;