const express = require('express');
const router = express.Router();
const {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/driverController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Read: All authenticated users
router.get('/', getAllDrivers);
router.get('/:id', getDriverById);

// Create / Update / Delete: ADMIN only for drivers
router.post('/', requireRole('ADMIN'), createDriver);
router.put('/:id', requireRole('ADMIN'), updateDriver);
router.delete('/:id', requireRole('ADMIN'), deleteDriver);

module.exports = router;
