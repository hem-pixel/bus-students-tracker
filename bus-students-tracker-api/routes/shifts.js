const express = require('express');
const router = express.Router();
const {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getBusShifts
} = require('../controllers/shiftController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/bus/:bus_id/date/:date', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getBusShifts);
router.get('/', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getAllShifts);
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createShift);
router.get('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getShiftById);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF', 'DRIVER'), updateShift);
router.delete('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), deleteShift);

module.exports = router;
