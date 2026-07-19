const Expense = require('../models/Expense');

// GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const { category, from, to, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };
    if (category) query.category = category;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to)   query.date.$lte = new Date(to);
    }
    const [expenses, total, summary] = await Promise.all([
      Expense.find(query).populate('vendor','name').sort({ date: -1 })
        .skip((page-1)*limit).limit(Number(limit)),
      Expense.countDocuments(query),
      Expense.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$category', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);
    res.json({ expenses, total, page: Number(page), pages: Math.ceil(total/limit), summary });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const { amount, gstRate = 0 } = req.body;
    const gstAmount = Number(amount) * Number(gstRate) / 100;
    const totalAmount = Number(amount) + gstAmount;
    const expense = await Expense.create({ ...req.body, user: req.user._id, gstAmount, totalAmount });
    res.status(201).json({ expense });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/expenses/:id
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id }).populate('vendor','name');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ expense });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const { amount, gstRate = 0 } = req.body;
    const gstAmount = Number(amount) * Number(gstRate) / 100;
    const totalAmount = Number(amount) + gstAmount;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, gstAmount, totalAmount }, { new: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ expense });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
