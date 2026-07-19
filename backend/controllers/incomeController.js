const Income = require('../models/Income');

// GET /api/income
exports.getIncome = async (req, res) => {
  try {
    const { category, from, to, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to)   query.date.$lte = new Date(to);
    }
    const [income, total, summary] = await Promise.all([
      Income.find(query).populate('client','name').sort({ date: -1 })
        .skip((page-1)*limit).limit(Number(limit)),
      Income.countDocuments(query),
      Income.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$category', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);
    res.json({ income, total, page: Number(page), pages: Math.ceil(total/limit), summary });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/income
exports.createIncome = async (req, res) => {
  try {
    const { amount, gstRate = 0 } = req.body;
    const gstAmount = Number(amount) * Number(gstRate) / 100;
    const totalAmount = Number(amount) + gstAmount;
    const income = await Income.create({ ...req.body, user: req.user._id, gstAmount, totalAmount });
    res.status(201).json({ income });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/income/:id
exports.getIncomeById = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, user: req.user._id }).populate('client','name');
    if (!income) return res.status(404).json({ message: 'Income record not found' });
    res.json({ income });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/income/:id
exports.updateIncome = async (req, res) => {
  try {
    const { amount, gstRate = 0 } = req.body;
    const gstAmount = Number(amount) * Number(gstRate) / 100;
    const totalAmount = Number(amount) + gstAmount;
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, gstAmount, totalAmount }, { new: true }
    );
    if (!income) return res.status(404).json({ message: 'Income record not found' });
    res.json({ income });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/income/:id
exports.deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!income) return res.status(404).json({ message: 'Income record not found' });
    res.json({ message: 'Income record deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
