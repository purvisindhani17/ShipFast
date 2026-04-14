const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const courierCompanySchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true, minlength: 6, select: false },
  phone:          { type: String, default: '' },
  address:        { type: String, default: '' },
  courierCode:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  logoColor:      { type: String, default: '#4361ee' },
  isActive:       { type: Boolean, default: true },
  totalDelivered: { type: Number, default: 0 },
}, { timestamps: true });

courierCompanySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

courierCompanySchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('CourierCompany', courierCompanySchema);
