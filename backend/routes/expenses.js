// routes/expenses.js
const express = require('express');
const r1 = express.Router();
const ec = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
r1.use(protect);
r1.route('/').get(ec.getExpenses).post(ec.createExpense);
r1.route('/:id').get(ec.getExpense).put(ec.updateExpense).delete(ec.deleteExpense);
module.exports = r1;
