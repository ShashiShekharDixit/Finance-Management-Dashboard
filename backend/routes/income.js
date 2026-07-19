const express = require('express');
const router = express.Router();
const ic = require('../controllers/incomeController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(ic.getIncome).post(ic.createIncome);
router.route('/:id').get(ic.getIncomeById).put(ic.updateIncome).delete(ic.deleteIncome);
module.exports = router;
