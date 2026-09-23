/**
 * STOP DETECTION ROUTES
 * Phase 10: Wrong Stop Detection & Alerts
 * 
 * Mount path: /api/stop-detection/*
 */

const express = require('express');
const router = express.Router();
const stopDetectionController = require('../controllers/stopDetectionController');
const { authenticateJWT, authorize } = require('../middleware/auth');

// All stop detection routes require authentication and valid staff/admin role
router.use(authenticateJWT);
router.use(authorize('ADMIN', 'TRANSPORT_STAFF'));

// 1. Assign designated stops to student (single or bulk)
router.post('/assign-stops', stopDetectionController.assignStops);

// 2. Fetch assigned stops for a specific student
router.get('/student-assignments/:student_id', stopDetectionController.getStudentAssignments);

// 3. Filterable assignments list
router.get('/assignments', stopDetectionController.getAssignments);

// 4. Verification engine: check boarding against designated stop
router.post('/check-boarding', stopDetectionController.checkBoarding);

// 5. Wrong stop detections log
router.get('/detections', stopDetectionController.getDetections);

// 6. Active / unhandled wrong stop alerts
router.get('/alerts', stopDetectionController.getAlerts);

// 7. Resolve detection with notes and verification status
router.put('/detections/:id/resolve', stopDetectionController.resolveDetection);

// 8. Dismiss alert with reason
router.put('/alerts/:id/dismiss', stopDetectionController.dismissAlert);

// 9. Aggregated metrics summary
router.get('/stats', stopDetectionController.getStats);

module.exports = router;
