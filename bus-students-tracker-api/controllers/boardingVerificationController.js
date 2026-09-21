/**
 * BOARDING VERIFICATION CONTROLLER
 * API endpoints for student boarding verification and status monitoring
 */

const boardingService = require('../services/boardingVerificationService');
const db = require('../config/database');

// POST /api/boarding/verify
// Main endpoint: Verify student boarding authorization
exports.verifyBoarding = async (req, res, next) => {
  try {
    const { studentId, busId, stopId, confidenceScore, photoPath } = req.body;

    if (!studentId || !busId || !stopId) {
      return res.status(400).json({
        error: 'Missing required fields: studentId, busId, stopId'
      });
    }

    const sId = parseInt(studentId);
    const bId = parseInt(busId);
    const stId = parseInt(stopId);
    const conf = confidenceScore !== undefined ? parseFloat(confidenceScore) : 0.95;

    // Run verification
    const verification = await boardingService.verifyBoardingAuthorization(
      sId,
      bId,
      stId,
      conf
    );

    // Log the event with audit trail
    const loggedEvent = await boardingService.createBoardingEvent(verification, { photoPath });

    // If verified, log attendance
    let attendanceRecord = null;
    if (verification.status === 'VERIFIED') {
      attendanceRecord = await boardingService.logBoardingEvent(sId, bId, stId, true, conf);
    }

    res.json({
      ...verification,
      eventId: loggedEvent?.id,
      attendanceLogged: Boolean(attendanceRecord)
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/boarding/check/:studentId/:busId/:stopId
// Quick check without full logging
exports.quickCheckBoarding = async (req, res, next) => {
  try {
    const { studentId, busId, stopId } = req.params;

    const verification = await boardingService.verifyBoardingAuthorization(
      parseInt(studentId),
      parseInt(busId),
      parseInt(stopId),
      1.0
    );

    res.json(verification);
  } catch (err) {
    next(err);
  }
};

// GET /api/boarding/summary/:busId
// Get boarding summary for a bus
exports.getBoardingSummary = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { date } = req.query;

    const summary = await boardingService.getBusBoardingSummary(
      parseInt(busId),
      date
    );

    const anomalies = await boardingService.getAnomalyEvents(parseInt(busId));

    res.json({
      summary: summary,
      anomalies: anomalies,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/boarding/anomalies/:busId
// Get all anomalies for a bus
exports.getAnomalies = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { hoursBack = 24 } = req.query;

    const anomalies = await boardingService.getAnomalyEvents(
      parseInt(busId),
      parseInt(hoursBack)
    );

    res.json({
      count: anomalies.length,
      anomalies: anomalies,
      timeWindow: `${hoursBack} hours`
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/boarding/:eventId/override
// In-charge manual override of boarding decision
exports.overrideBoarding = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { inChargeId, reason } = req.body;
    
    // Safely extract inCharge identifier as integer or null
    let staffId = null;
    if (Number.isInteger(Number(inChargeId))) {
      staffId = parseInt(inChargeId);
    } else if (req.user && Number.isInteger(Number(req.user.id))) {
      staffId = parseInt(req.user.id);
    }

    const overrideReason = reason || 'In-charge authorized manual override';

    // Get the event
    const eventResult = await db.query(
      'SELECT * FROM boarding_verification_events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Update event with override
    const result = await db.query(
      `UPDATE boarding_verification_events
       SET override_status = 'APPROVED', 
           override_reason = $2,
           in_charge_id = $3,
           overridden_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [eventId, overrideReason, staffId]
    );

    // If student recognized, log attendance now as Override
    if (event.student_id) {
      await db.query(
        `INSERT INTO student_attendance_log
         (student_id, bus_id, date, session_type, boarding_status, verified_by_biometric, boarded_at)
         VALUES ($1, $2, CURRENT_DATE, 'Morning', 'Override', FALSE, NOW())`,
        [event.student_id, event.bus_id]
      );
    }

    res.json({
      message: 'Override approved successfully',
      event: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/boarding/events/:busId
// Get all boarding events for a bus (real-time stream ready)
exports.getBoardingEvents = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { limit = 50 } = req.query;

    const result = await db.query(
      `SELECT 
        bve.id,
        bve.student_id,
        COALESCE(s.full_name, 'Unknown Student') as full_name,
        COALESCE(s.register_number, 'N/A') as register_number,
        bve.verification_status,
        bve.confidence_score,
        bve.override_status,
        bve.override_reason,
        bve.created_at
       FROM boarding_verification_events bve
       LEFT JOIN students s ON bve.student_id = s.id
       WHERE bve.bus_id = $1
       ORDER BY bve.created_at DESC
       LIMIT $2`,
      [parseInt(busId), parseInt(limit) || 50]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/boarding/attendance/:studentId
// Get student's boarding attendance history
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { daysBack = 30 } = req.query;

    const result = await db.query(
      `SELECT 
        sal.id,
        sal.date,
        sal.boarding_status,
        sal.verified_by_biometric,
        sal.boarded_at,
        b.bus_number,
        b.registration_number
       FROM student_attendance_log sal
       JOIN buses b ON sal.bus_id = b.id
       WHERE sal.student_id = $1
         AND sal.date >= CURRENT_DATE - INTERVAL '${parseInt(daysBack) || 30} days'
       ORDER BY sal.date DESC, sal.boarded_at DESC`,
      [parseInt(studentId)]
    );

    res.json({
      studentId: parseInt(studentId),
      attendanceRecords: result.rows,
      timeWindow: `Last ${daysBack} days`
    });
  } catch (err) {
    next(err);
  }
};
