const express = require('express');
const router = express.Router();
const {
  getStreamSegments,
  getStorageUsage,
  cleanupOldSegments
} = require('../controllers/streamController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

const ALLOWED_VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'];

router.get('/', requireRole(...ALLOWED_VIEW_ROLES), getStreamSegments);
router.get('/segments', requireRole(...ALLOWED_VIEW_ROLES), getStreamSegments);
router.get('/storage', requireRole(...ALLOWED_VIEW_ROLES), getStorageUsage);
router.get('/storage-usage', requireRole(...ALLOWED_VIEW_ROLES), getStorageUsage);
router.post('/cleanup', requireRole('ADMIN', 'TRANSPORT_STAFF'), cleanupOldSegments);

module.exports = router;
