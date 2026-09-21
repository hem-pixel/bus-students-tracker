const express = require('express');
const router = express.Router();
const {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Read: All authenticated users
router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);

// Create / Update / Delete: ADMIN and TRANSPORT_STAFF
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createAssignment);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateAssignment);
router.delete('/:id', requireRole('ADMIN'), deleteAssignment);

module.exports = router;
