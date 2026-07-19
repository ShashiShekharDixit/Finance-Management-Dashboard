const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Income  = require('../models/Income');
const Client  = require('../models/Client');

// GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const uid = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);
    const last6Months  = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalRevenue, monthRevenue,
      totalExpenses, monthExpenses,
      totalIncome, monthIncome,
      invoiceStats, clientCount,
      overdueInvoices, recentInvoices,
      monthlyTrend, expenseByCategory,
      pendingAmount
    ] = await Promise.all([
      // Total revenue from paid invoices
      Invoice.aggregate([{ $match:{ user:uid, status:'paid' }}, { $group:{ _id:null, total:{ $sum:'$grandTotal' }}}]),
      Invoice.aggregate([{ $match:{ user:uid, status:'paid', invoiceDate:{ $gte:startOfMonth }}}, { $group:{ _id:null, total:{ $sum:'$grandTotal' }}}]),
      // Total expenses
      Expense.aggregate([{ $match:{ user:uid }}, { $group:{ _id:null, total:{ $sum:'$totalAmount' }}}]),
      Expense.aggregate([{ $match:{ user:uid, date:{ $gte:startOfMonth }}}, { $group:{ _id:null, total:{ $sum:'$totalAmount' }}}]),
      // Total income
      Income.aggregate([{ $match:{ user:uid }}, { $group:{ _id:null, total:{ $sum:'$totalAmount' }}}]),
      Income.aggregate([{ $match:{ user:uid, date:{ $gte:startOfMonth }}}, { $group:{ _id:null, total:{ $sum:'$totalAmount' }}}]),
      // Invoice status breakdown
      Invoice.aggregate([{ $match:{ user:uid }}, { $group:{ _id:'$status', count:{ $sum:1 }, amount:{ $sum:'$grandTotal' }}}]),
      Client.countDocuments({ user:uid, isActive:true }),
      // Overdue invoices
      Invoice.find({ user:uid, status:'overdue' }).populate('client','name').sort({ dueDate:1 }).limit(5).select('invoiceNumber grandTotal balanceDue dueDate client'),
      // Recent invoices
      Invoice.find({ user:uid }).populate('client','name').sort({ createdAt:-1 }).limit(8).select('invoiceNumber grandTotal status invoiceDate client'),
      // Monthly revenue trend (last 6 months)
      Invoice.aggregate([
        { $match:{ user:uid, status:{ $in:['paid','partial'] }, invoiceDate:{ $gte:last6Months }}},
        { $group:{ _id:{ year:{ $year:'$invoiceDate' }, month:{ $month:'$invoiceDate' }}, revenue:{ $sum:'$grandTotal' }, count:{ $sum:1 }}},
        { $sort:{ '_id.year':1, '_id.month':1 }}
      ]),
      // Expenses by category
      Expense.aggregate([
        { $match:{ user:uid, date:{ $gte:startOfYear }}},
        { $group:{ _id:'$category', total:{ $sum:'$totalAmount' }}},
        { $sort:{ total:-1 }}, { $limit:6 }
      ]),
      // Pending/outstanding amount
      Invoice.aggregate([{ $match:{ user:uid, status:{ $in:['sent','partial','overdue'] }}}, { $group:{ _id:null, total:{ $sum:'$balanceDue' }}}]),
    ]);

    res.json({
      summary: {
        totalRevenue:   totalRevenue[0]?.total || 0,
        monthRevenue:   monthRevenue[0]?.total || 0,
        totalExpenses:  totalExpenses[0]?.total || 0,
        monthExpenses:  monthExpenses[0]?.total || 0,
        totalIncome:    totalIncome[0]?.total || 0,
        monthIncome:    monthIncome[0]?.total || 0,
        netProfit:      ((totalRevenue[0]?.total || 0) + (totalIncome[0]?.total || 0)) - (totalExpenses[0]?.total || 0),
        pendingAmount:  pendingAmount[0]?.total || 0,
        clientCount,
      },
      invoiceStats,
      overdueInvoices,
      recentInvoices,
      monthlyTrend,
      expenseByCategory,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
