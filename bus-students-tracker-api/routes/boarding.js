/**
 * BOARDING VERIFICATION ROUTES
 * API endpoints: /api/boarding/*
 */

const express = require('express');
const boardingController = require('../controllers/boardingVerificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Main verification endpoint
router.post('/verify', boardingController.verifyBoarding);

// Quick check (no logging)
router.get('/check/:studentId/:busId/:stopId', boardingController.quickCheckBoarding);

// Boarding summary, anomalies and events
router.get('/summary/:busId', boardingController.getBoardingSummary);
router.get('/anomalies/:busId', boardingController.getAnomalies);
router.get('/events/:busId', boardingController.getBoardingEvents);

// Override boarding decision (in-charge action)
router.post('/:eventId/override', boardingController.overrideBoarding);

// Student attendance history
router.get('/attendance/:studentId', boardingController.getStudentAttendance);

module.exports = router;
