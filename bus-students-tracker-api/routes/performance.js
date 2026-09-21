const express = require('express');
const router = express.Router();
const {
  getPerformanceLogs,
  getPerformanceLogById,
  logPerformance,
  updatePerformanceLog,
  deletePerformanceLog
} = require('../controllers/performanceController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'), getPerformanceLogs);
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'), logPerformance);
router.get('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'), getPerformanceLogById);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updatePerformanceLog);
router.delete('/:id', requireRole('ADMIN'), deletePerformanceLog);

module.exports = router;
