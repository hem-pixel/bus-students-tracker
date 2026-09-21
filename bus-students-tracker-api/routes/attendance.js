const express = require('express');
const router = express.Router();
const {
  getAttendanceLogs,
  getAttendanceSummary,
  logAttendance
} = require('../controllers/attendanceController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All endpoints require authentication
router.use(authenticate);

// Aggregated Summary
router.get('/summary', getAttendanceSummary);

// Attendance Log History
router.get('/', getAttendanceLogs);

// Log Boarding Event: ADMIN, TRANSPORT_STAFF, BUS_IN_CHARGE, DRIVER
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), logAttendance);

module.exports = router;
