const express = require('express');
const router = express.Router();
const {
  getAllRequests,
  getRequestById,
  createRequest,
  reviewRequest
} = require('../controllers/requestController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

// All endpoints require authentication
router.use(authenticate);

// Read: All authenticated users (Admin, Staff, Student)
router.get('/', getAllRequests);
router.get('/:id', getRequestById);

// Submit Request: Any authenticated user (STUDENT, ADMIN, TRANSPORT_STAFF)
router.post('/', createRequest);

// Review & Approval: ADMIN and TRANSPORT_STAFF only
router.put('/:id/review', requireRole('ADMIN', 'TRANSPORT_STAFF'), reviewRequest);

module.exports = router;
