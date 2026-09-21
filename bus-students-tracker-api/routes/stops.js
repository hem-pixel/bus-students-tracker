const express = require('express');
const router = express.Router();
const {
  getAllStops,
  getStopById,
  createStop,
  updateStop,
  deleteStop
} = require('../controllers/stopController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Read: All authenticated users
router.get('/', getAllStops);
router.get('/:id', getStopById);

// Create / Update: ADMIN and TRANSPORT_STAFF
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createStop);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateStop);

// Delete: ADMIN only
router.delete('/:id', requireRole('ADMIN'), deleteStop);

module.exports = router;
