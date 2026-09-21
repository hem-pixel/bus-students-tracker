const express = require('express');
const router = express.Router();
const {
  getLeaveRequests,
  getLeaveById,
  createLeaveRequest,
  approveLeave,
  rejectLeave,
  deleteLeaveRequest
} = require('../controllers/leaveController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'), getLeaveRequests);
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), createLeaveRequest);
router.get('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getLeaveById);
router.put('/:id/approve', requireRole('ADMIN', 'TRANSPORT_STAFF'), approveLeave);
router.put('/:id/reject', requireRole('ADMIN', 'TRANSPORT_STAFF'), rejectLeave);
router.delete('/:id', requireRole('ADMIN'), deleteLeaveRequest);

module.exports = router;
