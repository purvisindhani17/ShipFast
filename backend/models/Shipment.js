const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trackingId: { type: String, unique: true },
  courier: { type: String, required: true },
  courierCode: { type: String },
  origin: {
    pincode: { type: String, required: true },
    city: String,
    state: String
  },
  destination: {
    pincode: { type: String, required: true },
    city: String,
    state: String
  },
  package: {
    weight: { type: Number, required: true },
    length: Number,
    breadth: Number,
    height: Number,
    volumetricWeight: Number,
    billableWeight: Number,
    description: String,
    value: Number
  },
  rateSelected: {
    totalCost: Number,
    zone: String,
    estimatedDays: Number,
    breakdown: mongoose.Schema.Types.Mixed
  },
  ratesSeen: [{ // all rates that were shown
    courier: String,
    totalCost: Number,
    estimatedDays: Number
  }],
  savings: { type: Number, default: 0 }, // vs most expensive option
  status: {
    type: String,
    enum: ['draft', 'booked', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'draft'
  },
  isCOD: { type: Boolean, default: false },
  codAmount: { type: Number, default: 0 },
  isFragile: { type: Boolean, default: false },
  requiresInsurance: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate tracking ID
shipmentSchema.pre('save', function(next) {
  if (!this.trackingId) {
    this.trackingId = 'SF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
