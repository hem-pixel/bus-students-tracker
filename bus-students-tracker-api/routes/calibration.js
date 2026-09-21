const express = require('express');
const router = express.Router();
const {
  getCalibrationHistory,
  createCalibration,
  verifyCalibration
} = require('../controllers/calibrationController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

const ALLOWED_VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'];

router.get('/', requireRole(...ALLOWED_VIEW_ROLES), getCalibrationHistory);
router.get('/camera/:cameraId', requireRole(...ALLOWED_VIEW_ROLES), getCalibrationHistory);
router.get('/:id', requireRole(...ALLOWED_VIEW_ROLES), getCalibrationHistory);
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createCalibration);
router.put('/:id/verify', requireRole('ADMIN', 'TRANSPORT_STAFF'), verifyCalibration);

module.exports = router;
