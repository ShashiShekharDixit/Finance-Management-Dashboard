const express = require('express');
const router = express.Router();
const { getGSTSummary, getGSTR1 } = require('../controllers/gstController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/summary', getGSTSummary);
router.get('/gstr1', getGSTR1);
module.exports = router;
