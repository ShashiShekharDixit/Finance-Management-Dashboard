const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, getInvoice, updateInvoice, deleteInvoice, recordPayment } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.patch('/:id/payment', recordPayment);
module.exports = router;
