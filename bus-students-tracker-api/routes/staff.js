const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaffStats,
  getStaffRoles,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffMetrics
} = require('../controllers/staffController');
const { getStaffShifts } = require('../controllers/shiftController');
const { getStaffLeaves } = require('../controllers/leaveController');
const { getStaffPerformanceHistory } = require('../controllers/performanceController');
const { getStaffSalary, updateStaffSalary } = require('../controllers/salaryController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All staff endpoints require authentication
router.use(authenticate);

// Aggregates & System Roles
router.get('/stats', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'), getStaffStats);
router.get('/roles', requireRole('ADMIN', 'TRANSPORT_STAFF'), getStaffRoles);

// Specific staff nested resources
router.get('/:id/shifts', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getStaffShifts);
router.get('/:id/leaves', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getStaffLeaves);
router.get('/:id/performance', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'), getStaffPerformanceHistory);
router.get('/:id/metrics', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getStaffMetrics);
router.get('/:id/salary', requireRole('ADMIN', 'TRANSPORT_STAFF', 'DRIVER'), getStaffSalary);
router.post('/:id/salary', requireRole('ADMIN'), updateStaffSalary);

// Staff Directory CRUD
router.get('/', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getAllStaff);
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createStaff);
router.get('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'), getStaffById);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateStaff);
router.delete('/:id', requireRole('ADMIN'), deleteStaff);

module.exports = router;
