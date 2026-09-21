const express = require('express');
const router = express.Router();
const { getModelPerformanceMetrics } = require('../controllers/modelPerformanceController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Student is 403 Forbidden across model benchmark endpoints
const ALLOWED_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'];

router.get('/', requireRole(...ALLOWED_ROLES), getModelPerformanceMetrics);
router.get('/performance', requireRole(...ALLOWED_ROLES), getModelPerformanceMetrics);

module.exports = router;
