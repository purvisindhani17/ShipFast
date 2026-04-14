const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
  company:         { type: mongoose.Schema.Types.ObjectId, ref: 'CourierCompany', required: true },
  name:            { type: String, required: true, trim: true },
  phone:           { type: String, required: true, trim: true },
  email:           { type: String, default: '', trim: true },
  vehicleType:     { type: String, enum: ['bike','scooter','car','van','truck'], default: 'bike' },
  vehicleNumber:   { type: String, default: '', trim: true },
  isAvailable:     { type: Boolean, default: true },
  totalDeliveries: { type: Number, default: 0 },
  currentBooking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, { timestamps: true });

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
