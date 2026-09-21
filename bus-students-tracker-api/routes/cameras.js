const express = require('express');
const router = express.Router();
const {
  getAllCameras,
  getFleetHealth,
  getCameraById,
  getCameraStatus,
  createCamera,
  updateCamera,
  deleteCamera
} = require('../controllers/cameraController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Student is 403 Forbidden across all camera endpoints
const ALLOWED_VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'];

// Health & Dashboard Overview (must come before /:id)
router.get('/health/dashboard', requireRole(...ALLOWED_VIEW_ROLES), getFleetHealth);

// Read
router.get('/', requireRole(...ALLOWED_VIEW_ROLES), getAllCameras);
router.get('/:id/status', requireRole(...ALLOWED_VIEW_ROLES), getCameraStatus);
router.get('/:id', requireRole(...ALLOWED_VIEW_ROLES), getCameraById);

// Create / Update: ADMIN and TRANSPORT_STAFF
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createCamera);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateCamera);

// Delete: ADMIN only
router.delete('/:id', requireRole('ADMIN'), deleteCamera);

module.exports = router;
