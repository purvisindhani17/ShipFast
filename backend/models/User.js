const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  company: { type: String },
  phone: { type: String },
  role: { type: String, enum: ['seller', 'admin'], default: 'seller' },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  preferredCouriers: [String],
  defaultOriginPincode: { type: String },
  totalShipments: { type: Number, default: 0 },
  totalSavings: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
