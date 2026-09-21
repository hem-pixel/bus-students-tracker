const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus
} = require('../controllers/busController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All endpoints require authentication
router.use(authenticate);

// Read: All authenticated roles
router.get('/', getAllBuses);
router.get('/:id', getBusById);

// Create / Update: ADMIN and TRANSPORT_STAFF
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createBus);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateBus);

// Delete: ADMIN only
router.delete('/:id', requireRole('ADMIN'), deleteBus);

module.exports = router;
