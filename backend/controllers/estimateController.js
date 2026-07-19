const Estimate = require('../models/Estimate');
const Invoice  = require('../models/Invoice');

function calcTotals(items, contingency=0, overhead=0, discount=0) {
  let subtotal=0, totalGST=0;
  const processed = items.map(item => {
    const amount    = Number(item.quantity) * Number(item.rate);
    const gstAmount = amount * Number(item.gstRate) / 100;
    subtotal  += amount;
    totalGST  += gstAmount;
    return { ...item, amount, gstAmount, totalAmount: amount + gstAmount };
  });
  const subtotalWithGST = subtotal + totalGST;
  const contingencyAmt  = subtotalWithGST * Number(contingency)  / 100;
  const overheadAmt     = subtotalWithGST * Number(overhead)     / 100;
  const beforeDiscount  = subtotalWithGST + contingencyAmt + overheadAmt;
  const grandTotal      = Math.max(0, beforeDiscount - Number(discount));
  return {
    items: processed,
    subtotal:       Math.round(subtotal*100)/100,
    totalGST:       Math.round(totalGST*100)/100,
    contingencyAmt: Math.round(contingencyAmt*100)/100,
    overheadAmt:    Math.round(overheadAmt*100)/100,
    grandTotal:     Math.round(grandTotal*100)/100,
  };
}

async function genEstimateNumber(userId) {
  const count = await Estimate.countDocuments({ user: userId });
  return `EST-${new Date().getFullYear()}-${String(count+1).padStart(4,'0')}`;
}

// GET /api/estimates
exports.getEstimates = async (req, res) => {
  try {
    const { status, page=1, limit=20 } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;
    const [estimates, total] = await Promise.all([
      Estimate.find(query).populate('client','name').sort({ estimateDate:-1 }).skip((page-1)*limit).limit(Number(limit)),
      Estimate.countDocuments(query)
    ]);
    res.json({ estimates, total, page: Number(page), pages: Math.ceil(total/limit) });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// POST /api/estimates
exports.createEstimate = async (req, res) => {
  try {
    const { items, contingency=0, overhead=0, discount=0, ...rest } = req.body;
    const calculated = calcTotals(items, contingency, overhead, discount);
    const estimateNumber = rest.estimateNumber || await genEstimateNumber(req.user._id);
    const estimate = await Estimate.create({ ...rest, ...calculated, user: req.user._id, estimateNumber, contingency, overhead, discount });
    await estimate.populate('client','name');
    res.status(201).json({ estimate });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// GET /api/estimates/:id
exports.getEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client').populate('user','name email businessName gstin phone address');
    if (!estimate) return res.status(404).json({ message: 'Estimate not found' });
    res.json({ estimate });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/estimates/:id
exports.updateEstimate = async (req, res) => {
  try {
    const { items, contingency=0, overhead=0, discount=0, ...rest } = req.body;
    const calculated = items ? calcTotals(items, contingency, overhead, discount) : {};
    const estimate = await Estimate.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...rest, ...calculated, contingency, overhead, discount }, { new: true }
    ).populate('client','name');
    if (!estimate) return res.status(404).json({ message: 'Estimate not found' });
    res.json({ estimate });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/estimates/:id
exports.deleteEstimate = async (req, res) => {
  try {
    const est = await Estimate.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!est) return res.status(404).json({ message: 'Estimate not found' });
    res.json({ message: 'Estimate deleted' });
  } catch(err) { res.status(500).json({ message: err.message }); }
};

// POST /api/estimates/:id/convert — convert to invoice
exports.convertToInvoice = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({ _id: req.params.id, user: req.user._id });
    if (!estimate) return res.status(404).json({ message: 'Estimate not found' });
    const count = await Invoice.countDocuments({ user: req.user._id });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count+1).padStart(4,'0')}`;
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate()+30);
    const invoice = await Invoice.create({
      user: req.user._id, client: estimate.client,
      invoiceNumber, invoiceDate: new Date(), dueDate, status: 'draft',
      gstType: 'intra', items: estimate.items.map(it => ({
        description: it.description, hsn: '', quantity: it.quantity,
        unit: it.unit, rate: it.rate, gstRate: it.gstRate,
        taxableAmount: it.amount, cgst: it.gstAmount/2, sgst: it.gstAmount/2, igst: 0,
        totalAmount: it.totalAmount
      })),
      subtotal: estimate.subtotal, totalCGST: estimate.totalGST/2,
      totalSGST: estimate.totalGST/2, totalIGST: 0, totalGST: estimate.totalGST,
      grandTotal: estimate.grandTotal, balanceDue: estimate.grandTotal,
      notes: `Converted from Estimate ${estimate.estimateNumber}`,
    });
    await Estimate.findByIdAndUpdate(estimate._id, { status:'converted', convertedToInvoice: invoice._id });
    res.json({ invoice, message: 'Estimate converted to invoice successfully' });
  } catch(err) { res.status(500).json({ message: err.message }); }
};
