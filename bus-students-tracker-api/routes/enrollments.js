const express = require('express');
const router = express.Router();
const {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollmentStatus,
  deleteEnrollment
} = require('../controllers/enrollmentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Student is 403 Forbidden across all biometric enrollment endpoints
const ALLOWED_VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'];

// Read
router.get('/', requireRole(...ALLOWED_VIEW_ROLES), getAllEnrollments);
router.get('/:id', requireRole(...ALLOWED_VIEW_ROLES), getEnrollmentById);

// Create & Update
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createEnrollment);
router.patch('/:id/status', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateEnrollmentStatus);
router.put('/:id/status', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateEnrollmentStatus);

// Delete (Admin only)
router.delete('/:id', requireRole('ADMIN'), deleteEnrollment);

module.exports = router;
