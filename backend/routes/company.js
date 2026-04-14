const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'shipfast_dev_secret_2024';

// In-memory fallback
const memCompanies = [];
const useDB = () => mongoose.connection.readyState === 1;
const signTok = (id) => jwt.sign({ companyId: String(id) }, JWT_SECRET, { expiresIn: '7d' });
const strip = (c) => { const o = c.toObject ? c.toObject() : { ...c }; delete o.password; return o; };

// ── Protect middleware (company JWT) ──────────────────────
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  try {
    const { companyId } = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (useDB()) {
      const CourierCompany = require('../models/CourierCompany');
      req.company = await CourierCompany.findById(companyId);
    } else {
      req.company = memCompanies.find(c => String(c._id) === String(companyId));
    }
    if (!req.company) return res.status(401).json({ success: false, message: 'Company not found.' });
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ── POST /api/company/register ────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, courierCode, logoColor } = req.body;
    if (!name || !email || !password || !courierCode)
      return res.status(400).json({ success: false, message: 'Name, email, password and courier code are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    const norm = email.toLowerCase().trim();
    const code = courierCode.toUpperCase().trim();

    if (useDB()) {
      const CourierCompany = require('../models/CourierCompany');
      const exists = await CourierCompany.findOne({ $or: [{ email: norm }, { courierCode: code }] });
      if (exists) {
        const f = exists.email === norm ? 'Email' : 'Courier code';
        return res.status(409).json({ success: false, message: `${f} already registered.` });
      }
      const company = await CourierCompany.create({ name: name.trim(), email: norm, password, phone: phone||'', address: address||'', courierCode: code, logoColor: logoColor||'#4361ee' });
      return res.status(201).json({ success: true, message: 'Company registered!', data: { token: signTok(company._id), company: strip(company) } });
    }

    if (memCompanies.find(c => c.email === norm))
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    if (memCompanies.find(c => c.courierCode === code))
      return res.status(409).json({ success: false, message: 'Courier code already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const company = { _id: 'mc_'+Date.now(), name: name.trim(), email: norm, password: hashed, phone: phone||'', address: address||'', courierCode: code, logoColor: logoColor||'#4361ee', isActive: true, totalDelivered: 0, createdAt: new Date() };
    memCompanies.push(company);
    res.status(201).json({ success: true, message: 'Company registered!', data: { token: signTok(company._id), company: strip(company) } });
  } catch(err) {
    console.error('Company register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

// ── POST /api/company/login ───────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const norm = email.toLowerCase().trim();
    let company, hash;

    if (useDB()) {
      const CourierCompany = require('../models/CourierCompany');
      company = await CourierCompany.findOne({ email: norm }).select('+password');
      if (!company) return res.status(401).json({ success: false, message: 'No company found with this email.' });
      hash = company.password;
    } else {
      company = memCompanies.find(c => c.email === norm);
      if (!company) return res.status(401).json({ success: false, message: 'No company found with this email.' });
      hash = company.password;
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Incorrect password.' });

    res.json({ success: true, message: `Welcome back, ${company.name}!`, data: { token: signTok(company._id), company: strip(company) } });
  } catch(err) {
    console.error('Company login error:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

// ── GET /api/company/me ───────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: { company: strip(req.company) } });
});

// ── PUT /api/company/profile ──────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, logoColor } = req.body;
    if (useDB()) {
      const CourierCompany = require('../models/CourierCompany');
      const updated = await CourierCompany.findByIdAndUpdate(req.company._id, { name, phone, address, logoColor }, { new: true });
      return res.json({ success: true, data: { company: strip(updated) } });
    }
    const c = memCompanies.find(c => String(c._id) === String(req.company._id));
    if (c) { Object.assign(c, { name: name||c.name, phone: phone||c.phone, address: address||c.address, logoColor: logoColor||c.logoColor }); }
    res.json({ success: true, data: { company: strip(c) } });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// ── GET /api/company/list ─────────────────────────────────
// Public: users can see registered courier companies
router.get('/list', async (req, res) => {
  try {
    if (useDB()) {
      const CourierCompany = require('../models/CourierCompany');
      const list = await CourierCompany.find({ isActive: true }).select('name courierCode logoColor phone address totalDelivered createdAt');
      return res.json({ success: true, data: list });
    }
    const list = memCompanies.filter(c => c.isActive).map(({ password, ...rest }) => rest);
    res.json({ success: true, data: list });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
});

router.protect = protect;
module.exports = router;
