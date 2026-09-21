const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentStats,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const {
  getAllAssignments,
  getAssignmentById,
  assignStudent,
  updateAssignment,
  removeAssignment
} = require('../controllers/studentAssignmentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All endpoints require valid authentication
router.use(authenticate);

// Student Assignment Endpoints (Must be declared before /:id)
router.get('/assignments', getAllAssignments);
router.get('/assignments/:id', getAssignmentById);
router.post('/assignments', requireRole('ADMIN', 'TRANSPORT_STAFF'), assignStudent);
router.put('/assignments/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateAssignment);
router.delete('/assignments/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), removeAssignment);

// Student KPI Stats
router.get('/stats', getStudentStats);

// Student Roster CRUD
router.get('/', getAllStudents);
router.get('/:id', getStudentById);

// Creation / Modification: ADMIN and TRANSPORT_STAFF
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createStudent);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateStudent);

// Removal: ADMIN only
router.delete('/:id', requireRole('ADMIN'), deleteStudent);

module.exports = router;
