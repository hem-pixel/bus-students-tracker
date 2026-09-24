// FILE: bus-students-tracker-api/routes/notifications.js
// PURPOSE: Express routes for Phase 12 Notifications & Alerts System
// PHASE: Phase 12 — Multi-Channel Alert Delivery & Notification Management

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

// Flexible auth middleware: uses JWT/token if provided, or defaults to admin user for test/dev
const flexibleAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 'USR-ADM-001',
      role: 'ADMIN',
      name: 'Dr. K. Senthil Nathan',
      email: 'admin@vsb.ac.in'
    };
    return next();
  }
  return authenticate(req, res, next);
};

router.use(flexibleAuth);

// 1. Dashboard Metrics & Stats
router.get('/stats', notificationController.getStats);

// 2. Audit Log History
router.get('/audit', notificationController.getAuditHistory);

// 3. Alert Rules Management
router.get('/rules', notificationController.listAlertRules);
router.post('/rules', notificationController.createAlertRule);
router.post('/rules/test', notificationController.testAlertRule);
router.post('/rules/:id/test', notificationController.testAlertRule);
router.put('/rules/:id', notificationController.updateAlertRule);
router.delete('/rules/:id', notificationController.deleteAlertRule);

// 4. Notification Templates
router.get('/templates', notificationController.listTemplates);
router.post('/templates', notificationController.createTemplate);
router.put('/templates/:id', notificationController.updateTemplate);
router.delete('/templates/:id', notificationController.deleteTemplate);

// 5. User Notification Preferences
router.get('/preferences', notificationController.getUserPreferences);
router.get('/preferences/:userId', notificationController.getUserPreferences);
router.put('/preferences', notificationController.updateUserPreferences);
router.put('/preferences/:userId', notificationController.updateUserPreferences);

// 6. Direct & Bulk Notification Dispatch
router.post('/send', notificationController.sendNotification);
router.post('/bulk', notificationController.sendBulkNotification);

// 7. Notification Actions
router.post('/:id/acknowledge', notificationController.acknowledgeNotification);
router.post('/:id/retry', notificationController.retryNotification);
router.delete('/:id', notificationController.deleteNotification);

// 8. Notification Listing & Details (kept at bottom to prevent route collisions)
router.get('/', notificationController.listNotifications);
router.get('/:id', notificationController.getNotificationById);

module.exports = router;
