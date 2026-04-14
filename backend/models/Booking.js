const mongoose = require('mongoose');

const STATUS_ORDER = ['pending','accepted','picked_up','in_transit','delivered'];

const bookingSchema = new mongoose.Schema({
  shipment: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Shipment',
    required: true,
    // NOTE: unique is NOT set here — we use a compound index below instead
    // so that (shipment + company) is unique but null shipments don't conflict
  },
  company: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'CourierCompany',
    required: true,
  },
  courierCode:   { type: String, required: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryAgent', default: null },
  status: {
    type:    String,
    enum:    ['pending','accepted','rejected','picked_up','in_transit','delivered'],
    default: 'pending',
  },
  rejectionReason: { type: String, default: '' },
  deliveredAt:     { type: Date, default: null },
  statusHistory: [{
    status:    String,
    note:      String,
    changedAt: { type: Date, default: Date.now },
  }],
  snapshot: {
    trackingId:    String,
    originPincode: String,
    destPincode:   String,
    weight:        Number,
    totalCost:     Number,
    zone:          String,
    estimatedDays: Number,
    isCOD:         Boolean,
    codAmount:     Number,
  },
}, { timestamps: true });

// ── Compound unique index: one booking per (shipment, company) pair ──
// This prevents duplicate bookings for the same shipment from the same company
// but does NOT create a global unique index on shipment alone (which caused null conflicts)
bookingSchema.index({ shipment: 1, company: 1 }, { unique: true, sparse: true });

bookingSchema.methods.canTransitionTo = function(newStatus) {
  if (newStatus === 'rejected') return this.status === 'pending';
  const cur = STATUS_ORDER.indexOf(this.status);
  const nxt = STATUS_ORDER.indexOf(newStatus);
  return cur !== -1 && nxt === cur + 1;
};

module.exports = mongoose.model('Booking', bookingSchema);
