const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { protect } = require('./company');

const useDB = () => mongoose.connection.readyState === 1;

// ── GET /api/bookings ─────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    if (!useDB()) {
      return res.json({ success: true, data: { bookings: [], stats: { total:0, pending:0, accepted:0, active:0, delivered:0, rejected:0 } } });
    }

    const Booking  = require('../models/Booking');
    const Shipment = require('../models/Shipment');

    // ── Step 1: clean up any existing null-shipment bookings (from previous bad inserts) ──
    await Booking.deleteMany({ shipment: null }).catch(() => {});

    // ── Step 2: find shipments for this courier code that don't have a booking yet ──
    const existingShipmentIds = await Booking.find({ company: req.company._id }).distinct('shipment');

    const newShipments = await Shipment.find({
      courierCode: req.company.courierCode,          // exact match
      _id:         { $exists: true, $ne: null },     // must have a real _id
      $expr:       { $ne: [{ $ifNull: ['$_id', null] }, null] }, // extra guard
      status:      { $in: ['booked','picked_up','in_transit','delivered'] },
    }).lean();                                        // plain objects, faster

    // Filter: only those not already tracked, and with a valid ObjectId
    const truly_new = newShipments.filter(s => {
      if (!s._id) return false;
      const idStr = String(s._id);
      return !existingShipmentIds.some(eid => String(eid) === idStr);
    });

    // ── Step 3: insert new bookings one by one to avoid bulk failures ──
    for (const s of truly_new) {
      try {
        await Booking.create({
          shipment:    s._id,
          company:     req.company._id,
          courierCode: req.company.courierCode,
          status:      'pending',
          statusHistory: [{ status:'pending', note:'Received from ShipFast', changedAt: s.createdAt || new Date() }],
          snapshot: {
            trackingId:    s.trackingId || '',
            originPincode: s.origin?.pincode || '',
            destPincode:   s.destination?.pincode || '',
            weight:        s.package?.weight || 0,
            totalCost:     s.rateSelected?.totalCost || 0,
            zone:          s.rateSelected?.zone || '',
            estimatedDays: s.rateSelected?.estimatedDays || 0,
            isCOD:         s.isCOD || false,
            codAmount:     s.codAmount || 0,
          },
        });
      } catch (insertErr) {
        // Skip duplicates silently — may already exist from a parallel request
        if (insertErr.code !== 11000) {
          console.warn('Booking insert warning:', insertErr.message);
        }
      }
    }

    // ── Step 4: return all bookings for this company ──
    const bookings = await Booking.find({ company: req.company._id })
      .populate('assignedAgent', 'name phone vehicleType isAvailable')
      .populate('shipment', 'trackingId status origin destination package rateSelected isCOD codAmount')
      .sort({ createdAt: -1 });

    const stats = {
      total:     bookings.length,
      pending:   bookings.filter(b => b.status === 'pending').length,
      accepted:  bookings.filter(b => b.status === 'accepted').length,
      active:    bookings.filter(b => ['picked_up','in_transit'].includes(b.status)).length,
      delivered: bookings.filter(b => b.status === 'delivered').length,
      rejected:  bookings.filter(b => b.status === 'rejected').length,
    };

    res.json({ success: true, data: { bookings, stats } });

  } catch (err) {
    console.error('Get bookings error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings: ' + err.message });
  }
});

// ── PUT /api/bookings/:id/accept ──────────────────────────
router.put('/:id/accept', protect, async (req, res) => {
  try {
    if (!useDB()) return res.status(503).json({ success: false, message: 'Database required.' });
    const Booking = require('../models/Booking');
    const b = await Booking.findOne({ _id: req.params.id, company: req.company._id });
    if (!b) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (b.status !== 'pending') return res.status(400).json({ success: false, message: `Cannot accept — current status is "${b.status}". Only pending bookings can be accepted.` });

    b.status = 'accepted';
    b.statusHistory.push({ status: 'accepted', note: req.body.note || 'Accepted by company' });
    await b.save();

    // Mirror back to Shipment
    await require('../models/Shipment').findByIdAndUpdate(b.shipment, { status: 'booked' }).catch(() => {});

    const populated = await Booking.findById(b._id)
      .populate('assignedAgent', 'name phone vehicleType')
      .populate('shipment', 'trackingId status origin destination');
    res.json({ success: true, message: 'Booking accepted!', data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to accept booking.' });
  }
});

// ── PUT /api/bookings/:id/reject ──────────────────────────
router.put('/:id/reject', protect, async (req, res) => {
  try {
    if (!useDB()) return res.status(503).json({ success: false, message: 'Database required.' });
    const Booking = require('../models/Booking');
    const b = await Booking.findOne({ _id: req.params.id, company: req.company._id });
    if (!b) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (b.status !== 'pending') return res.status(400).json({ success: false, message: `Cannot reject — status is "${b.status}".` });

    b.status = 'rejected';
    b.rejectionReason = req.body.reason || 'Rejected by company';
    b.statusHistory.push({ status: 'rejected', note: b.rejectionReason });
    await b.save();

    await require('../models/Shipment').findByIdAndUpdate(b.shipment, { status: 'cancelled' }).catch(() => {});

    const populated = await Booking.findById(b._id).populate('shipment', 'trackingId status');
    res.json({ success: true, message: 'Booking rejected.', data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject booking.' });
  }
});

// ── PUT /api/bookings/:id/assign-agent ───────────────────
router.put('/:id/assign-agent', protect, async (req, res) => {
  try {
    if (!useDB()) return res.status(503).json({ success: false, message: 'Database required.' });
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ success: false, message: 'agentId is required.' });

    const Booking       = require('../models/Booking');
    const DeliveryAgent = require('../models/DeliveryAgent');

    const b = await Booking.findOne({ _id: req.params.id, company: req.company._id });
    if (!b) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (b.status !== 'accepted') return res.status(400).json({ success: false, message: 'Agent can only be assigned to accepted bookings.' });

    const agent = await DeliveryAgent.findOne({ _id: agentId, company: req.company._id });
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found.' });
    if (!agent.isAvailable) return res.status(400).json({ success: false, message: `${agent.name} is not available.` });

    // Free previous agent if any
    if (b.assignedAgent) {
      await DeliveryAgent.findByIdAndUpdate(b.assignedAgent, { isAvailable: true, currentBooking: null });
    }

    b.assignedAgent = agent._id;
    b.statusHistory.push({ status: 'accepted', note: `Agent assigned: ${agent.name}` });
    await b.save();

    agent.isAvailable    = false;
    agent.currentBooking = b._id;
    await agent.save();

    const populated = await Booking.findById(b._id)
      .populate('assignedAgent', 'name phone vehicleType')
      .populate('shipment', 'trackingId status origin destination');
    res.json({ success: true, message: `${agent.name} assigned!`, data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to assign agent.' });
  }
});

// ── PUT /api/bookings/:id/status ─────────────────────────
router.put('/:id/status', protect, async (req, res) => {
  try {
    if (!useDB()) return res.status(503).json({ success: false, message: 'Database required.' });
    const { status, note } = req.body;
    const ALLOWED = ['picked_up','in_transit','delivered'];
    if (!ALLOWED.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${ALLOWED.join(', ')}` });

    const Booking        = require('../models/Booking');
    const DeliveryAgent  = require('../models/DeliveryAgent');
    const Shipment       = require('../models/Shipment');
    const CourierCompany = require('../models/CourierCompany');

    const b = await Booking.findOne({ _id: req.params.id, company: req.company._id });
    if (!b) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (!b.canTransitionTo(status))
      return res.status(400).json({ success: false, message: `Cannot move from "${b.status}" to "${status}". Follow the correct order: accepted → picked_up → in_transit → delivered.` });
    if (!b.assignedAgent)
      return res.status(400).json({ success: false, message: 'Please assign a delivery agent before updating status.' });

    b.status = status;
    b.statusHistory.push({ status, note: note || `Marked as ${status.replace('_', ' ')}` });

    if (status === 'delivered') {
      b.deliveredAt = new Date();
      await DeliveryAgent.findByIdAndUpdate(b.assignedAgent, { isAvailable: true, currentBooking: null, $inc: { totalDeliveries: 1 } });
      await CourierCompany.findByIdAndUpdate(req.company._id, { $inc: { totalDelivered: 1 } });
    }
    await b.save();

    // Mirror status to the ShipFast Shipment
    const sfStatus = { picked_up: 'picked_up', in_transit: 'in_transit', delivered: 'delivered' }[status];
    await Shipment.findByIdAndUpdate(b.shipment, { status: sfStatus }).catch(() => {});

    const populated = await Booking.findById(b._id)
      .populate('assignedAgent', 'name phone vehicleType')
      .populate('shipment', 'trackingId status origin destination');
    res.json({ success: true, message: `Status updated to ${status.replace('_',' ')}`, data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

module.exports = router;
