const { query } = require('../config/database');

/**
 * GET /api/performance-logs
 * Query params: staff_id, log_type, severity, resolved
 */
async function getPerformanceLogs(req, res, next) {
  try {
    const { staff_id, log_type, severity, resolved } = req.query;

    let result = await query('SELECT * FROM staff_performance_log ORDER BY log_date DESC, created_at DESC');
    let logs = result.rows;

    if (staff_id) {
      logs = logs.filter(l => l.staff_id === staff_id);
    }
    if (log_type) {
      logs = logs.filter(l => String(l.log_type).toUpperCase() === log_type.toUpperCase());
    }
    if (severity) {
      logs = logs.filter(l => String(l.severity).toUpperCase() === severity.toUpperCase());
    }
    if (resolved !== undefined) {
      const isResolved = String(resolved).toLowerCase() === 'true';
      logs = logs.filter(l => l.resolved === isResolved);
    }

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/performance-logs/:id
 */
async function getPerformanceLogById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM staff_performance_log WHERE log_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Performance log entry with ID '${id}' not found.`
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/performance-logs
 * Log incident, complaint, commendation, or feedback
 */
async function logPerformance(req, res, next) {
  try {
    const {
      staff_id,
      log_date = new Date().toISOString().split('T')[0],
      log_type = 'FEEDBACK',
      incident_type,
      incident_description,
      severity = 'LOW',
      complaint_from_student_id,
      complaint_description,
      commendation_reason,
      safety_score,
      punctuality_score,
      student_interaction_score,
      professionalism_score,
      action_taken,
      follow_up_required = false,
      follow_up_date,
      resolved = false
    } = req.body;

    if (!staff_id || !log_type) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'staff_id and log_type are required fields.'
      });
    }

    // Verify staff exists
    const staffRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [staff_id]);
    if (staffRes.rows.length === 0) {
      return res.status(404).json({
        error: 'STAFF_NOT_FOUND',
        message: `Staff member with ID '${staff_id}' does not exist.`
      });
    }
    const staff = staffRes.rows[0];

    // If student complaint, verify student exists
    if (complaint_from_student_id) {
      const stuRes = await query('SELECT * FROM students WHERE student_id = $1', [complaint_from_student_id]);
      if (stuRes.rows.length === 0) {
        return res.status(404).json({
          error: 'STUDENT_NOT_FOUND',
          message: `Student with ID '${complaint_from_student_id}' does not exist.`
        });
      }
    }

    const creatorId = req.user ? req.user.id : 'USR-ADM-001';

    const insertRes = await query(
      `INSERT INTO staff_performance_log (
        staff_id, log_date, log_type, incident_type, incident_description, severity,
        complaint_from_student_id, complaint_description, commendation_reason,
        safety_score, punctuality_score, student_interaction_score, professionalism_score,
        action_taken, follow_up_required, follow_up_date, resolved, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        staff_id,
        log_date,
        log_type,
        incident_type || null,
        incident_description || null,
        severity,
        complaint_from_student_id || null,
        complaint_description || null,
        commendation_reason || null,
        safety_score || null,
        punctuality_score || null,
        student_interaction_score || null,
        professionalism_score || null,
        action_taken || null,
        follow_up_required,
        follow_up_date || null,
        resolved,
        creatorId
      ]
    );

    // Update aggregate incident or complaint counter on staff_members
    if (log_type === 'INCIDENT') {
      const totalIncidents = (parseInt(staff.total_incidents, 10) || 0) + 1;
      await query('UPDATE staff_members SET total_incidents = $1 WHERE staff_id = $2', [totalIncidents, staff_id]);
    } else if (log_type === 'COMPLAINT') {
      const totalComplaints = (parseInt(staff.total_complaints, 10) || 0) + 1;
      await query('UPDATE staff_members SET total_complaints = $1 WHERE staff_id = $2', [totalComplaints, staff_id]);
    } else if (log_type === 'FEEDBACK' && safety_score && punctuality_score) {
      // Re-calculate weighted average
      const sScore = parseFloat(safety_score);
      const pScore = parseFloat(punctuality_score);
      const currentSafety = parseFloat(staff.safety_rating || 5.0);
      const currentPunct = parseFloat(staff.punctuality_rating || 5.0);
      const newSafety = ((currentSafety * 4 + sScore) / 5).toFixed(2);
      const newPunct = ((currentPunct * 4 + pScore) / 5).toFixed(2);

      await query(
        'UPDATE staff_members SET safety_rating = $1, punctuality_rating = $2 WHERE staff_id = $3',
        [newSafety, newPunct, staff_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Performance metric / event recorded successfully.',
      data: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/performance-logs/:id
 * Update action taken, follow-up status, or resolution
 */
async function updatePerformanceLog(req, res, next) {
  try {
    const { id } = req.params;
    const logRes = await query('SELECT * FROM staff_performance_log WHERE log_id = $1', [id]);
    if (logRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Performance log entry with ID '${id}' not found.`
      });
    }

    const { action_taken, follow_up_required, follow_up_date, resolved } = req.body;

    const updated = await query(
      `UPDATE staff_performance_log SET
        action_taken = COALESCE($1, action_taken),
        follow_up_required = COALESCE($2, follow_up_required),
        follow_up_date = COALESCE($3, follow_up_date),
        resolved = COALESCE($4, resolved),
        updated_at = CURRENT_TIMESTAMP
      WHERE log_id = $5
      RETURNING *`,
      [action_taken || null, follow_up_required, follow_up_date || null, resolved, id]
    );

    res.json({
      success: true,
      message: 'Performance log entry updated successfully.',
      data: updated.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/performance-logs/:id
 */
async function deletePerformanceLog(req, res, next) {
  try {
    const { id } = req.params;
    const logRes = await query('SELECT * FROM staff_performance_log WHERE log_id = $1', [id]);
    if (logRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Performance log entry with ID '${id}' not found.`
      });
    }

    await query('DELETE FROM staff_performance_log WHERE log_id = $1', [id]);

    res.json({
      success: true,
      message: 'Performance log entry deleted.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/staff/:id/performance
 */
async function getStaffPerformanceHistory(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM staff_performance_log WHERE staff_id = $1 ORDER BY log_date DESC, created_at DESC',
      [id]
    );

    res.json({
      success: true,
      staff_id: id,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPerformanceLogs,
  getPerformanceLogById,
  logPerformance,
  updatePerformanceLog,
  deletePerformanceLog,
  getStaffPerformanceHistory
};
