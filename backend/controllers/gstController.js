const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');

// GET /api/gst/summary?from=&to=
exports.getGSTSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);

    const invoiceMatch = { user: req.user._id, status: { $in: ['sent','paid','partial'] } };
    if (from || to) invoiceMatch.invoiceDate = dateFilter;

    const expenseMatch = { user: req.user._id };
    if (from || to) expenseMatch.date = dateFilter;

    const [outputGST, inputGST, rateBreakdown] = await Promise.all([
      // Output GST (collected from clients on invoices)
      Invoice.aggregate([
        { $match: invoiceMatch },
        { $group: {
          _id: null,
          totalCGST:  { $sum: '$totalCGST' },
          totalSGST:  { $sum: '$totalSGST' },
          totalIGST:  { $sum: '$totalIGST' },
          totalGST:   { $sum: '$totalGST' },
          subtotal:   { $sum: '$subtotal' },
          grandTotal: { $sum: '$grandTotal' },
          count:      { $sum: 1 },
        }}
      ]),
      // Input GST (paid to vendors on expenses)
      Expense.aggregate([
        { $match: expenseMatch },
        { $group: {
          _id: null,
          totalInputGST: { $sum: '$gstAmount' },
          totalExpense:  { $sum: '$totalAmount' },
          count:         { $sum: 1 },
        }}
      ]),
      // GST by rate slab from invoices
      Invoice.aggregate([
        { $match: invoiceMatch },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.gstRate',
          taxableAmount: { $sum: '$items.taxableAmount' },
          gstAmount:     { $sum: { $add: ['$items.cgst','$items.sgst','$items.igst'] } },
          count:         { $sum: 1 },
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    const output = outputGST[0] || { totalCGST:0, totalSGST:0, totalIGST:0, totalGST:0, subtotal:0, grandTotal:0, count:0 };
    const input  = inputGST[0]  || { totalInputGST:0, totalExpense:0, count:0 };
    const netGSTPayable = output.totalGST - input.totalInputGST;

    res.json({
      outputGST:    output,
      inputGST:     input,
      netGSTPayable: Math.max(0, Math.round(netGSTPayable * 100) / 100),
      inputCredit:   Math.round(input.totalInputGST * 100) / 100,
      rateBreakdown,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/gst/gstr1 — GSTR-1 style report
exports.getGSTR1 = async (req, res) => {
  try {
    const { from, to } = req.query;
    const match = { user: req.user._id, status: { $in: ['sent','paid','partial'] } };
    if (from || to) {
      match.invoiceDate = {};
      if (from) match.invoiceDate.$gte = new Date(from);
      if (to)   match.invoiceDate.$lte = new Date(to);
    }
    const invoices = await Invoice.find(match)
      .populate('client','name gstin state')
      .sort({ invoiceDate: 1 })
      .select('invoiceNumber invoiceDate client subtotal totalCGST totalSGST totalIGST totalGST grandTotal gstType');
    res.json({ invoices, count: invoices.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
