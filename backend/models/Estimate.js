const mongoose = require('mongoose');

const estimateItemSchema = new mongoose.Schema({
  category:    { type: String, default: 'Civil Work' },
  description: { type: String, required: true },
  unit:        { type: String, default: 'sqft' },
  quantity:    { type: Number, required: true, min: 0 },
  rate:        { type: Number, required: true, min: 0 },
  amount:      { type: Number, default: 0 },
  gstRate:     { type: Number, enum: [0,5,12,18,28], default: 18 },
  gstAmount:   { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  remarks:     { type: String, default: '' },
}, { _id: false });

const estimateSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client:         { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  estimateNumber: { type: String, required: true },
  title:          { type: String, required: true, trim: true },
  projectType:    { type: String, enum: [
    'Residential Construction','Commercial Construction','Interior Work',
    'Renovation','Road Work','Plumbing','Electrical','Painting',
    'Flooring','Roofing','Landscaping','Other'
  ], default: 'Residential Construction' },
  projectAddress: { type: String, default: '' },
  estimateDate:   { type: Date, default: Date.now },
  validUntil:     { type: Date },
  status:         { type: String, enum: ['draft','sent','approved','rejected','converted'], default: 'draft' },
  items:          [estimateItemSchema],

  // Totals
  subtotal:       { type: Number, default: 0 },
  totalGST:       { type: Number, default: 0 },
  contingency:    { type: Number, default: 0 },     // % contingency allowance
  contingencyAmt: { type: Number, default: 0 },
  overhead:       { type: Number, default: 0 },     // % overhead
  overheadAmt:    { type: Number, default: 0 },
  discount:       { type: Number, default: 0 },
  grandTotal:     { type: Number, default: 0 },

  notes:          { type: String, default: '' },
  terms:          { type: String, default: 'This estimate is valid for 30 days from the date of issue.' },
  convertedToInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
}, { timestamps: true });

estimateSchema.index({ user: 1, status: 1 });
estimateSchema.index({ user: 1, estimateDate: -1 });

module.exports = mongoose.model('Estimate', estimateSchema);
