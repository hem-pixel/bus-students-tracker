const express = require('express');
const router = express.Router();
const { getAllSalaries } = require('../controllers/salaryController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), getAllSalaries);

module.exports = router;
