const express = require('express');
const router = express.Router();
const {
  getAllBusInCharges,
  getBusInChargeById,
  createBusInCharge,
  updateBusInCharge,
  deleteBusInCharge
} = require('../controllers/busInChargeController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Read: All authenticated users
router.get('/', getAllBusInCharges);
router.get('/:id', getBusInChargeById);

// Create / Update / Delete: ADMIN only
router.post('/', requireRole('ADMIN'), createBusInCharge);
router.put('/:id', requireRole('ADMIN'), updateBusInCharge);
router.delete('/:id', requireRole('ADMIN'), deleteBusInCharge);

module.exports = router;
