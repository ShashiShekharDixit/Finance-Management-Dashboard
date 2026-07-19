const Invoice = require('../models/Invoice');
const Client  = require('../models/Client');

function calcTotals(items, gstType, discount=0, discountType='flat') {
  let subtotal=0, totalCGST=0, totalSGST=0, totalIGST=0;
  const processed = items.map(item => {
    const taxable = Number(item.quantity) * Number(item.rate);
    const gst     = Number(item.gstRate) || 0;
    let cgst=0, sgst=0, igst=0;
    if (gstType==='intra') { cgst=taxable*gst/2/100; sgst=taxable*gst/2/100; }
    else igst = taxable*gst/100;
    subtotal+=taxable; totalCGST+=cgst; totalSGST+=sgst; totalIGST+=igst;
    return { ...item, taxableAmount:Math.round(taxable*100)/100, cgst:Math.round(cgst*100)/100, sgst:Math.round(sgst*100)/100, igst:Math.round(igst*100)/100, totalAmount:Math.round((taxable+cgst+sgst+igst)*100)/100 };
  });
  const totalGST = totalCGST+totalSGST+totalIGST;
  const pre = subtotal+totalGST;
  let disc = discountType==='percent' ? pre*discount/100 : Number(discount)||0;
  const grandTotal = Math.max(0, pre-disc);
  return { items:processed, subtotal:Math.round(subtotal*100)/100, totalCGST:Math.round(totalCGST*100)/100, totalSGST:Math.round(totalSGST*100)/100, totalIGST:Math.round(totalIGST*100)/100, totalGST:Math.round(totalGST*100)/100, grandTotal:Math.round(grandTotal*100)/100 };
}

async function genInvoiceNumber(userId) {
  const count = await Invoice.countDocuments({ user: userId });
  return `INV-${new Date().getFullYear()}-${String(count+1).padStart(4,'0')}`;
}

exports.getInvoices = async (req, res) => {
  try {
    const { status, client, from, to, page=1, limit=20 } = req.query;
    const q = { user: req.user._id };
    if (status) q.status=status;
    if (client) q.client=client;
    if (from||to) { q.invoiceDate={}; if(from) q.invoiceDate.$gte=new Date(from); if(to) q.invoiceDate.$lte=new Date(to); }
    const [invoices, total, statusTotals] = await Promise.all([
      Invoice.find(q).populate('client','name email gstin').sort({ invoiceDate:-1 }).skip((page-1)*limit).limit(Number(limit)),
      Invoice.countDocuments(q),
      Invoice.aggregate([{ $match:{ user:req.user._id }},{ $group:{ _id:'$status', count:{$sum:1}, amount:{$sum:'$grandTotal'}}}])
    ]);
    res.json({ invoices, total, page:Number(page), pages:Math.ceil(total/limit), statusTotals });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.createInvoice = async (req, res) => {
  try {
    const { items, gstType='intra', discount=0, discountType='flat', ...rest } = req.body;
    const calc = calcTotals(items, gstType, discount, discountType);
    const invoiceNumber = rest.invoiceNumber || await genInvoiceNumber(req.user._id);
    const invoice = await Invoice.create({ ...rest, ...calc, user:req.user._id, invoiceNumber, gstType, discount, discountType, balanceDue:calc.grandTotal-(rest.amountPaid||0) });
    await invoice.populate('client','name email gstin');
    if (rest.client) await Client.findByIdAndUpdate(rest.client, { $inc:{ totalBilled:calc.grandTotal }});
    res.status(201).json({ invoice });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id:req.params.id, user:req.user._id })
      .populate('client').populate('user','name email businessName gstin phone address');
    if (!invoice) return res.status(404).json({ message:'Not found' });
    res.json({ invoice });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { items, gstType='intra', discount=0, discountType='flat', ...rest } = req.body;
    const calc = items ? calcTotals(items, gstType, discount, discountType) : {};
    const invoice = await Invoice.findOneAndUpdate(
      { _id:req.params.id, user:req.user._id },
      { ...rest, ...calc, gstType, discount, discountType, ...(calc.grandTotal && { balanceDue:calc.grandTotal-(rest.amountPaid||0) }) },
      { new:true }
    ).populate('client','name email gstin');
    if (!invoice) return res.status(404).json({ message:'Not found' });
    res.json({ invoice });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amountPaid, paymentMethod, paymentDate, paymentRef } = req.body;
    const invoice = await Invoice.findOne({ _id:req.params.id, user:req.user._id });
    if (!invoice) return res.status(404).json({ message:'Not found' });
    invoice.amountPaid = (invoice.amountPaid||0) + Number(amountPaid);
    invoice.balanceDue = Math.max(0, invoice.grandTotal - invoice.amountPaid);
    invoice.status     = invoice.balanceDue<=0 ? 'paid' : 'partial';
    if (paymentMethod) invoice.paymentMethod=paymentMethod;
    if (paymentDate)   invoice.paymentDate=paymentDate;
    if (paymentRef)    invoice.paymentRef=paymentRef;
    await invoice.save();
    await Client.findByIdAndUpdate(invoice.client, { $inc:{ totalPaid:Number(amountPaid) }});
    res.json({ invoice });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id:req.params.id, user:req.user._id });
    if (!invoice) return res.status(404).json({ message:'Not found' });
    res.json({ message:'Deleted' });
  } catch(err) { res.status(500).json({ message:err.message }); }
};
