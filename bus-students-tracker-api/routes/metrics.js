const express = require('express');
const router = express.Router();
const {
  getLatestMetrics,
  getMetricsHistory,
  recordMetrics
} = require('../controllers/metricsController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

const ALLOWED_VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'];

router.get('/camera/:cameraId/latest', requireRole(...ALLOWED_VIEW_ROLES), getLatestMetrics);
router.get('/camera/:cameraId/history', requireRole(...ALLOWED_VIEW_ROLES), getMetricsHistory);
router.get('/:cameraId/latest', requireRole(...ALLOWED_VIEW_ROLES), getLatestMetrics);
router.get('/:cameraId/history', requireRole(...ALLOWED_VIEW_ROLES), getMetricsHistory);
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), recordMetrics);

module.exports = router;
