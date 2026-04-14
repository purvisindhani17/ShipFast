const mongoose = require('mongoose');

const zoneRateSchema = new mongoose.Schema({
  zone: { type: String, required: true }, // 'local', 'regional', 'national', 'metro'
  baseWeight: { type: Number, required: true }, // in kg
  basePrice: { type: Number, required: true }, // in INR
  additionalPerKg: { type: Number, required: true },
  fuelSurcharge: { type: Number, default: 0 }, // percentage
  codCharge: { type: Number, default: 0 }, // flat or percentage
  codType: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
  minBillableWeight: { type: Number, default: 0.5 }
});

const courierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  logo: { type: String },
  color: { type: String, default: '#3B82F6' },
  rating: { type: Number, min: 1, max: 5, default: 3.5 },
  avgDeliveryDays: {
    local: { type: Number, default: 1 },
    regional: { type: Number, default: 2 },
    national: { type: Number, default: 4 },
    metro: { type: Number, default: 1 }
  },
  maxWeight: { type: Number, default: 50 }, // kg
  volumetricDivisor: { type: Number, default: 5000 }, // L*B*H / divisor = vol weight
  zones: [zoneRateSchema],
  services: [{
    name: String,
    extraCharge: Number,
    type: { type: String, enum: ['flat', 'percentage'] }
  }],
  features: [String], // ['COD', 'Express', 'Fragile', 'Insurance']
  isActive: { type: Boolean, default: true },
  apiEndpoint: { type: String }, // for real integration
  pincodesServed: { type: Number, default: 19000 }
}, { timestamps: true });

module.exports = mongoose.model('Courier', courierSchema);
