/**
 * ALERT ROUTES
 * API endpoints: /api/alerts/*
 * PHASE: Phase 9 — Wrong Bus Detection & Alerts
 */

const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Alert creation and management
router.post('/create', alertController.createAlert);
router.get('/active', alertController.getActiveAlerts);
router.get('/stats', alertController.getAlertStats);
router.get('/history', alertController.getAlertHistory);
router.get('/escalations', alertController.getEscalations);

// Alert actions
router.post('/:id/acknowledge', alertController.acknowledgeAlert);
router.post('/:id/override', alertController.overrideAlert);

module.exports = router;
