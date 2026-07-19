const express = require('express');
const router = express.Router();
const ec = require('../controllers/estimateController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(ec.getEstimates).post(ec.createEstimate);
router.route('/:id').get(ec.getEstimate).put(ec.updateEstimate).delete(ec.deleteEstimate);
router.post('/:id/convert', ec.convertToInvoice);
module.exports = router;
