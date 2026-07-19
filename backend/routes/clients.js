const express = require('express');
const router = express.Router();
const { getClients, createClient, getClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(getClients).post(createClient);
router.route('/:id').get(getClient).put(updateClient).delete(deleteClient);
module.exports = router;
