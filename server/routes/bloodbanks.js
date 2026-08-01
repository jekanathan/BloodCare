const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const BloodBank = require('../models/BloodBank');
const User = require('../models/User');

// ── File upload setup — same pattern as bloodbankAuth.js ───────────────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'bloodbanks');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.fieldname}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const uploadFields = upload.fields([
  { name: 'bloodBankLicense', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
]);

// ─── POST /api/bloodbanks/register ──────────────────────────────────────────
// Admin manually registers a blood bank — created as 'approved' immediately
// since the admin is directly vouching for it (no separate approval step).
router.post('/register', auth, (req, res) => {
  uploadFields(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ message: uploadErr.message || 'File upload failed' });
    }

    try {
      const {
        contactPerson, designation, email, phone,
        bankName, registrationNumber, type, establishedYear,
        licenseNumber, licenseExpiry, address, district, province,
        password,
      } = req.body;

      if (!contactPerson || !email || !phone || !bankName || !registrationNumber || !address || !district || !province || !password) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const existingReg = await BloodBank.findOne({ registrationNumber });
      if (existingReg) {
        return res.status(400).json({ message: 'This registration number is already registered.' });
      }

      const user = new User({
        name: contactPerson,
        email: email.toLowerCase(),
        password,
        role: 'blood_bank',
        status: 'approved', // admin-created → active immediately
      });
      await user.save();

      try {
        const bloodBank = new BloodBank({
          user: user._id,
          contactPerson,
          designation,
          email: email.toLowerCase(),
          phone,
          bankName,
          registrationNumber,
          type,
          establishedYear: establishedYear || undefined,
          licenseNumber,
          licenseExpiry: licenseExpiry || undefined,
          address,
          district,
          province,
          documents: {
            bloodBankLicense: req.files?.bloodBankLicense ? `/uploads/bloodbanks/${req.files.bloodBankLicense[0].filename}` : undefined,
            registrationCertificate: req.files?.registrationCertificate ? `/uploads/bloodbanks/${req.files.registrationCertificate[0].filename}` : undefined,
            taxRegistration: req.files?.taxRegistration ? `/uploads/bloodbanks/${req.files.taxRegistration[0].filename}` : undefined,
          },
          status: 'approved',
          approvedBy: req.user.id,
          approvedAt: new Date(),
        });
        await bloodBank.save();

        res.status(201).json({
          message: 'Blood bank registered and approved successfully.',
          bloodBank,
        });
      } catch (bbErr) {
        await User.findByIdAndDelete(user._id);
        throw bbErr;
      }
    } catch (err) {
      console.error('Admin blood bank register error:', err);
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return res.status(400).json({ message: `This ${field} is already registered.` });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
});

// ─── GET /api/bloodbanks ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [{ bankName: { $regex: search, $options: 'i' } }, { district: { $regex: search, $options: 'i' } }];
    const total = await BloodBank.countDocuments(query);
    const bloodBanks = await BloodBank.find(query).populate('user', 'email createdAt').populate('approvedBy', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ bloodBanks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id).populate('user', 'email').populate('approvedBy', 'name');
    if (!bloodBank) return res.status(404).json({ message: 'Blood bank not found' });
    res.json(bloodBank);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const bloodBank = await BloodBank.findById(req.params.id);
    if (!bloodBank) return res.status(404).json({ message: 'Blood bank not found' });
    bloodBank.status = status;
    if (status === 'approved') { bloodBank.approvedBy = req.user.id; bloodBank.approvedAt = new Date(); }
    await bloodBank.save();
    await User.findByIdAndUpdate(bloodBank.user, { status });
    res.json({ message: `Blood Bank ${status} successfully`, bloodBank });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const bloodBank = await BloodBank.findByIdAndDelete(req.params.id);
    if (!bloodBank) return res.status(404).json({ message: 'Blood bank not found' });
    await User.findByIdAndDelete(bloodBank.user);
    res.json({ message: 'Blood bank deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;