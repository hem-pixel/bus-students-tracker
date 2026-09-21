const express = require('express');
const router = express.Router();
const {
  processFaceRecognition,
  getAllRecognitionResults,
  getRecognitionResultById
} = require('../controllers/recognitionController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Student is 403 Forbidden across recognition endpoints
const ALLOWED_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'];

// POST /api/recognize
router.post('/', requireRole(...ALLOWED_ROLES), processFaceRecognition);

// GET /api/recognition-results or /api/recognize/results
router.get('/', requireRole(...ALLOWED_ROLES), getAllRecognitionResults);
router.get('/results', requireRole(...ALLOWED_ROLES), getAllRecognitionResults);
router.get('/results/:id', requireRole(...ALLOWED_ROLES), getRecognitionResultById);
router.get('/:id', requireRole(...ALLOWED_ROLES), getRecognitionResultById);

module.exports = router;
