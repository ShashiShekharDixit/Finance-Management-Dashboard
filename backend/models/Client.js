const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  type:        { type: String, enum:['client','vendor'], default:'client' },
  name:        { type: String, required:true, trim:true },
  email:       { type: String, trim:true, default:'' },
  phone:       { type: String, trim:true, default:'' },
  gstin:       { type: String, trim:true, default:'' },
  pan:         { type: String, trim:true, default:'' },
  address:     { type: String, trim:true, default:'' },
  city:        { type: String, trim:true, default:'' },
  state:       { type: String, trim:true, default:'' },
  company:     { type: String, trim:true, default:'' },
  notes:       { type: String, trim:true, default:'' },
  isActive:    { type: Boolean, default:true },
  totalBilled: { type: Number, default:0 },
  totalPaid:   { type: Number, default:0 },
}, { timestamps:true });
module.exports = mongoose.model('Client', clientSchema);
