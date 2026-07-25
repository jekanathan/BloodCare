const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const Settings = require('../models/Settings');
const auth = require('../middleware/auth');

// ── File upload setup — PDF documents saved under /uploads/bloodbanks ──────
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadFields = upload.fields([
  { name: 'bloodBankLicense', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
]);

// ─── POST /api/bloodbank-auth/register ──────────────────────────────────────
router.post('/register', (req, res) => {
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

      // Check registration is currently open
      const settings = await Settings.findOne({ key: 'main' });
      if (settings && settings.registrationOpen === false) {
        return res.status(403).json({ message: 'Registrations are currently closed. Please try again later.' });
      }

      if (!req.files?.bloodBankLicense || !req.files?.registrationCertificate) {
        return res.status(400).json({ message: 'Blood Bank License and Registration Certificate are required.' });
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
        status: 'pending',
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
            bloodBankLicense: `/uploads/bloodbanks/${req.files.bloodBankLicense[0].filename}`,
            registrationCertificate: `/uploads/bloodbanks/${req.files.registrationCertificate[0].filename}`,
            taxRegistration: req.files.taxRegistration ? `/uploads/bloodbanks/${req.files.taxRegistration[0].filename}` : undefined,
          },
          status: 'pending',
        });
        await bloodBank.save();

        res.status(201).json({
          message: 'Registration submitted successfully. Admin will review your documents and approve within 24-48 hours.',
          userId: user._id,
          bloodBankId: bloodBank._id,
        });
      } catch (bbErr) {
        await User.findByIdAndDelete(user._id);
        throw bbErr;
      }
    } catch (err) {
      console.error('Blood bank register error:', err);
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return res.status(400).json({ message: `This ${field} is already registered.` });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
});

// ─── POST /api/bloodbank-auth/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'blood_bank' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your registration is pending admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration has been rejected.' });
    }

    const bank = await BloodBank.findOne({ user: user._id });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'bloodcare_secret',
      { expiresIn: '24h' }
    );
    user.lastLogin = new Date();
    await user.save();

    res.json({ token, bank });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/bloodbank-auth/me ──────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const bank = await BloodBank.findOne({ user: req.user.id });
    res.json(bank);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;