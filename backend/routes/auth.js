const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'shipfast_dev_secret_2024';

// ── In-memory fallback (used when MongoDB is not connected) ──
const memUsers = [
  {
    _id: 'mem_1',
    name: 'Demo User',
    email: 'demo@shipfast.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // demo123
    company: 'ShipFast Demo',
    phone: '9876543210',
    plan: 'pro',
    role: 'seller',
    defaultOriginPincode: '141001',
    totalShipments: 0,
    totalSavings: 0,
    createdAt: new Date('2024-01-15')
  }
];

// ── Helpers ────────────────────────────────────────────────
const useDB   = () => mongoose.connection.readyState === 1;
const signTok = (id) => jwt.sign({ userId: String(id) }, JWT_SECRET, { expiresIn: '7d' });
const strip   = (u)  => { const { password, ...rest } = (u.toObject ? u.toObject() : u); return rest; };

// ── Middleware ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
  try {
    const { userId } = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (useDB()) {
      const User = require('../models/User');
      req.user = await User.findById(userId).select('-password');
      if (!req.user) return res.status(401).json({ success: false, message: 'User not found.' });
    } else {
      req.user = memUsers.find(u => String(u._id) === String(userId));
      if (!req.user) return res.status(401).json({ success: false, message: 'User not found.' });
    }
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    if (useDB()) {
      const User = require('../models/User');
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(409).json({ success: false, message: 'Email already registered.' });
      const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, company: company?.trim(), phone: phone?.trim() });
      return res.status(201).json({ success: true, message: 'Account created!', data: { token: signTok(user._id), user: strip(user) } });
    } else {
      if (memUsers.find(u => u.email === email.toLowerCase()))
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      const hashed = await bcrypt.hash(password, 10);
      const user = { _id: 'mem_' + Date.now(), name: name.trim(), email: email.toLowerCase().trim(), password: hashed, company: company?.trim() || '', phone: phone?.trim() || '', plan: 'free', role: 'seller', totalShipments: 0, totalSavings: 0, defaultOriginPincode: '', createdAt: new Date() };
      memUsers.push(user);
      return res.status(201).json({ success: true, message: 'Account created!', data: { token: signTok(user._id), user: strip(user) } });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    let user, match;
    
    if (useDB()) {
      const User = require('../models/User');
      user = await User.findOne({ email: email.toLowerCase() });
      console.log("USER FROM DB:", user);
      console.log("STORED PASSWORD:", user?.password);
      if (!user) return res.status(401).json({ success: false, message: 'No account found with this email.' });
      match = await user.comparePassword(password);
    } else {
      user = memUsers.find(u => u.email === email.toLowerCase());
      console.log("USER FROM MEMORY:", user); 
      if (!user) return res.status(401).json({ success: false, message: 'No account found with this email.' });
      match = await bcrypt.compare(password, user.password);
    }
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password.' });

    res.json({ success: true, message: `Welcome back, ${user.name}!`, data: { token: signTok(user._id), user: strip(user) } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get('/me', protect, (req, res) => {
  const out = req.user.toObject ? strip(req.user) : req.user;
  const { password: _, ...safe } = out;
  res.json({ success: true, data: { user: safe } });
});

// ── PUT /api/auth/profile ──────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, company, phone, defaultOriginPincode } = req.body;
    if (useDB()) {
      const User = require('../models/User');
      const updated = await User.findByIdAndUpdate(req.user._id, { name, company, phone, defaultOriginPincode }, { new: true }).select('-password');
      return res.json({ success: true, message: 'Profile updated.', data: { user: updated } });
    } else {
      const u = memUsers.find(u => String(u._id) === String(req.user._id));
      if (u) { u.name = name||u.name; u.company = company||u.company; u.phone = phone||u.phone; u.defaultOriginPincode = defaultOriginPincode||u.defaultOriginPincode; }
      const { password: _, ...safe } = u;
      return res.json({ success: true, message: 'Profile updated.', data: { user: safe } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// ── PUT /api/auth/password ─────────────────────────────────
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });

    if (useDB()) {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      const ok = await user.comparePassword(currentPassword);
      if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      user.password = newPassword;
      await user.save();
    } else {
      const u = memUsers.find(u => String(u._id) === String(req.user._id));
      const ok = await bcrypt.compare(currentPassword, u.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      u.password = await bcrypt.hash(newPassword, 10);
    }
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
});

router.protect = protect;
module.exports = router;
