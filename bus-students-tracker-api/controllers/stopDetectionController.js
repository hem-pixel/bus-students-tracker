/**
 * STOP DETECTION CONTROLLER
 * Phase 10: Wrong Stop Detection & Alerts
 * 
 * Handles API requests for student-to-stop assignments, real-time boarding verification,
 * mismatch detection retrieval, alert management, and operational analytics.
 */

const stopDetectionService = require('../services/stopDetectionService');

/**
 * POST /api/stop-detection/assign-stops
 * Assign designated stops to a student per route (single or bulk).
 */
exports.assignStops = async (req, res, next) => {
  try {
    const result = await stopDetectionService.assignStops(req.body);
    return res.status(201).json({
      success: true,
      message: 'Stop assignments updated successfully',
      data: result
    });
  } catch (err) {
    if (err.message && err.message.includes('required')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/stop-detection/student-assignments/:student_id
 * Fetch assigned stops for a specific student.
 */
exports.getStudentAssignments = async (req, res, next) => {
  try {
    const { student_id } = req.params;
    if (!student_id) {
      return res.status(400).json({ success: false, error: 'student_id parameter is required' });
    }
    const assignments = await stopDetectionService.getStudentAssignments(student_id);
    return res.json({
      success: true,
      data: assignments
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/stop-detection/assignments
 * Filterable list of stop assignments (by student_id, route_id, status).
 */
exports.getAssignments = async (req, res, next) => {
  try {
    const assignments = await stopDetectionService.getAssignments(req.query);
    return res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stop-detection/check-boarding
 * Main verification engine checking whether a student boarded/alighted at their designated stop.
 */
exports.checkBoarding = async (req, res, next) => {
  try {
    const result = await stopDetectionService.checkBoarding(req.body);
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    if (err.message && err.message.includes('required')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/stop-detection/detections
 * Filterable list of wrong stop events (status, route_id, bus_id, student_id, mismatch_type).
 */
exports.getDetections = async (req, res, next) => {
  try {
    const detections = await stopDetectionService.getDetections(req.query);
    return res.json({
      success: true,
      count: detections.length,
      data: detections
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/stop-detection/alerts
 * Active and unhandled wrong stop alerts.
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = await stopDetectionService.getAlerts(req.query);
    return res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/stop-detection/detections/:id/resolve
 * Resolve a wrong stop detection with review notes and status.
 */
exports.resolveDetection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await stopDetectionService.resolveDetection(id, req.body);
    return res.json({
      success: true,
      message: 'Detection resolved successfully',
      data: result
    });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
};

/**
 * PUT /api/stop-detection/alerts/:id/dismiss
 * Dismiss an alert with a reason.
 */
exports.dismissAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await stopDetectionService.dismissAlert(id, req.body);
    return res.json({
      success: true,
      message: 'Alert dismissed successfully',
      data: result
    });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
};

/**
 * GET /api/stop-detection/stats
 * Aggregated metrics summary for wrong stop monitoring.
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await stopDetectionService.getStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};
