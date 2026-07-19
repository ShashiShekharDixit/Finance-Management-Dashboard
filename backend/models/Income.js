const mongoose = require('mongoose');
const incomeSchema = new mongoose.Schema({
  user:          { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  client:        { type:mongoose.Schema.Types.ObjectId, ref:'Client' },
  invoice:       { type:mongoose.Schema.Types.ObjectId, ref:'Invoice' },
  title:         { type:String, required:true, trim:true },
  category:      { type:String, required:true, enum:['Sales','Service','Consulting','Rental','Investment','Interest','Commission','Freelance','Refund','Other'] },
  amount:        { type:Number, required:true, min:0 },
  gstRate:       { type:Number, enum:[0,5,12,18,28], default:18 },
  gstAmount:     { type:Number, default:0 },
  totalAmount:   { type:Number, required:true },
  date:          { type:Date, required:true, default:Date.now },
  paymentMethod: { type:String, enum:['cash','bank','upi','card','cheque'], default:'bank' },
  reference:     { type:String, default:'' },
  notes:         { type:String, default:'' },
}, { timestamps:true });
module.exports = mongoose.model('Income', incomeSchema);
