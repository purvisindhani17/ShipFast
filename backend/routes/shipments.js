const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const authRouter = require('./auth');
const protect  = authRouter.protect;

// ── In-memory fallback ────────────────────────────────────
const memShipments = [];

const useDB = () => mongoose.connection.readyState === 1;
const makeId = () => 'SF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2,3).toUpperCase();

// ── GET /api/shipments ────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    if (useDB()) {
      const Shipment = require('../models/Shipment');
      const list = await Shipment.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.json({ success: true, data: list });
    }
    const uid = String(req.user._id);
    const list = memShipments.filter(s => s.userId === uid).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Get shipments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch shipments.' });
  }
});

// ── POST /api/shipments/book ──────────────────────────────
router.post('/book', protect, async (req, res) => {
  try {
    const { courierCode, originPincode, destPincode, selectedRate, package: pkg, isCOD, codAmount } = req.body;
    if (!selectedRate || !originPincode || !destPincode)
      return res.status(400).json({ success: false, message: 'Missing required fields.' });

    if (useDB()) {
      const Shipment = require('../models/Shipment');
      const User     = require('../models/User');
      const s = await Shipment.create({
        user: req.user._id,
        courier: selectedRate.courier,
        courierCode: courierCode || selectedRate.code,
        origin:      { pincode: originPincode },
        destination: { pincode: destPincode },
        package:     { weight: pkg?.weight || parseFloat(req.body.weight) || 0.5, length: pkg?.length, breadth: pkg?.breadth, height: pkg?.height, volumetricWeight: pkg?.volumetricWeight, billableWeight: pkg?.billableWeight },
        rateSelected:{ totalCost: selectedRate.totalCost, zone: selectedRate.zone, estimatedDays: selectedRate.estimatedDays, breakdown: selectedRate.breakdown },
        savings:     req.body.savings || 0,
        status:      'booked',
        isCOD:       !!isCOD,
        codAmount:   codAmount || 0,
      });
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalShipments: 1 } });
      return res.status(201).json({ success: true, message: 'Shipment booked!', data: s });
    }

    // in-memory
    const s = {
      _id: makeId(), id: makeId(), userId: String(req.user._id),
      trackingId: makeId(),
      courier: selectedRate.courier, courierCode: courierCode || selectedRate.code,
      origin: { pincode: originPincode }, destination: { pincode: destPincode },
      package: pkg || {}, totalCost: selectedRate.totalCost,
      rateSelected: { totalCost: selectedRate.totalCost, zone: selectedRate.zone, estimatedDays: selectedRate.estimatedDays },
      savings: req.body.savings || 0, status: 'booked', isCOD: !!isCOD, codAmount: codAmount||0,
      createdAt: new Date()
    };
    memShipments.unshift(s);
    res.status(201).json({ success: true, message: 'Shipment booked!', data: s });
  } catch (err) {
    console.error('Book shipment error:', err);
    res.status(500).json({ success: false, message: 'Booking failed. Please try again.' });
  }
});

// ── PATCH /api/shipments/:id/status ──────────────────────
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['draft','booked','picked_up','in_transit','delivered','cancelled'];
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    if (useDB()) {
      const Shipment = require('../models/Shipment');
      const s = await Shipment.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { status }, { new: true });
      if (!s) return res.status(404).json({ success: false, message: 'Shipment not found.' });
      return res.json({ success: true, data: s });
    }
    const s = memShipments.find(s => (s._id===req.params.id||s.id===req.params.id) && s.userId===String(req.user._id));
    if (!s) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    s.status = status;
    res.json({ success: true, data: s });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Status update failed.' });
  }
});

module.exports = router;
