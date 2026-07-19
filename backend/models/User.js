const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6 },
  businessName: { type: String, trim: true, default: '' },
  gstin:        { type: String, trim: true, default: '' },
  phone:        { type: String, trim: true, default: '' },
  address:      { type: String, trim: true, default: '' },
  role:         { type: String, enum: ['owner','admin','staff'], default: 'owner' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = async function(p) { return bcrypt.compare(p, this.password); };
module.exports = mongoose.model('User', userSchema);
