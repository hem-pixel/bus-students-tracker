/**
 * ALERT CONTROLLER
 * API endpoints for alert management and override workflow
 * PHASE: Phase 9 — Wrong Bus Detection & Alerts
 */

const alertService = require('../services/alertService');
const db = require('../config/database');

// POST /api/alerts/create
// Create alert from boarding verification result
exports.createAlert = async (req, res, next) => {
  try {
    const { verificationResult, photoPath } = req.body;

    if (!verificationResult) {
      return res.status(400).json({ error: 'verificationResult required' });
    }

    const alert = await alertService.createAlert(verificationResult, photoPath);

    if (!alert) {
      return res.json({ 
        success: true,
        message: 'No alert needed (boarding verified or status is VERIFIED)' 
      });
    }

    res.status(201).json({
      success: true,
      alert,
      message: `Alert created: ${alert.alert_type}`
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/active
// Get all active alerts for current in-charge or admin
exports.getActiveAlerts = async (req, res, next) => {
  try {
    const staffId = req.user?.staffId || req.user?.staff_id || req.user?.id || req.user?.sub || null;
    const role = req.user?.role || null;

    const alerts = await alertService.getActiveAlerts(staffId, role);

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/alerts/:id/acknowledge
// Mark alert as acknowledged
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staffId = req.user?.staffId || req.user?.staff_id || req.user?.id || req.user?.sub || null;

    const alert = await alertService.acknowledgeAlert(id, staffId);

    res.json({
      success: true,
      message: 'Alert acknowledged',
      alert
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/alerts/:id/override
// Override alert decision (approve or reject)
exports.overrideAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const staffId = req.user?.staffId || req.user?.staff_id || req.user?.id || req.user?.sub || null;

    if (!action || !reason) {
      return res.status(400).json({
        error: 'action and reason required'
      });
    }

    const alert = await alertService.overrideAlert(id, action, reason, staffId);

    res.json({
      success: true,
      message: `Alert ${action}`,
      alert
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/stats
// Get alert statistics
exports.getAlertStats = async (req, res, next) => {
  try {
    const { busId, hoursBack = 24 } = req.query;

    const stats = await alertService.getAlertStats(
      busId ? String(busId) : null,
      parseInt(hoursBack, 10) || 24
    );

    res.json({
      success: true,
      stats,
      timeWindow: `${hoursBack} hours`
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/history
// Get historical alerts
exports.getAlertHistory = async (req, res, next) => {
  try {
    const { studentId, status = 'RESOLVED', limit = 50 } = req.query;

    const history = await alertService.getAlertHistory({
      studentId,
      status: status === 'ALL' ? null : status,
      limit
    });

    res.json({
      success: true,
      count: history.length,
      alerts: history
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/alerts/escalations
// Get escalated students
exports.getEscalations = async (req, res, next) => {
  try {
    const escalations = await alertService.getEscalations();

    res.json({
      success: true,
      count: escalations.length,
      escalations
    });
  } catch (err) {
    next(err);
  }
};
