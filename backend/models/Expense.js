const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user:          { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  vendor:        { type:mongoose.Schema.Types.ObjectId, ref:'Client' },
  title:         { type:String, required:true, trim:true },
  category:      { type:String, required:true, enum:['Office Supplies','Travel','Utilities','Rent','Salaries','Marketing','Software','Equipment','Maintenance','Food','Professional Fees','Taxes','Insurance','Miscellaneous'] },
  amount:        { type:Number, required:true, min:0 },
  gstRate:       { type:Number, enum:[0,5,12,18,28], default:0 },
  gstAmount:     { type:Number, default:0 },
  totalAmount:   { type:Number, required:true },
  date:          { type:Date, required:true, default:Date.now },
  paymentMethod: { type:String, enum:['cash','bank','upi','card','cheque'], default:'bank' },
  reference:     { type:String, default:'' },
  notes:         { type:String, default:'' },
  isRecurring:   { type:Boolean, default:false },
}, { timestamps:true });

module.exports = mongoose.model('Expense', expenseSchema);
