const { query } = require('../config/database');

/**
 * GET /api/leave-requests
 * Query params: status / request_status, staff_id, leave_type
 */
async function getLeaveRequests(req, res, next) {
  try {
    const { status, request_status, staff_id, leave_type } = req.query;
    const targetStatus = status || request_status;

    let result = await query('SELECT * FROM staff_leave_requests ORDER BY leave_start_date DESC');
    let leaves = result.rows;

    if (targetStatus) {
      leaves = leaves.filter(l => String(l.request_status).toUpperCase() === targetStatus.toUpperCase());
    }
    if (staff_id) {
      leaves = leaves.filter(l => l.staff_id === staff_id);
    }
    if (leave_type) {
      leaves = leaves.filter(l => String(l.leave_type).toUpperCase() === leave_type.toUpperCase());
    }

    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leave-requests/:id
 */
async function getLeaveById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM staff_leave_requests WHERE leave_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Leave request with ID '${id}' not found.`
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
 * POST /api/leave-requests
 * Submit a new leave request (STAFF / ADMIN)
 */
async function createLeaveRequest(req, res, next) {
  try {
    const {
      staff_id,
      leave_type = 'CASUAL',
      leave_start_date,
      leave_end_date,
      total_days,
      reason,
      replacement_staff_id
    } = req.body;

    if (!staff_id || !leave_start_date || !leave_end_date || !reason) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'staff_id, leave_start_date, leave_end_date, and reason are required fields.'
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

    if (leave_end_date < leave_start_date) {
      return res.status(400).json({
        error: 'INVALID_DATE_RANGE',
        message: 'leave_end_date must be greater than or equal to leave_start_date.'
      });
    }

    // Calculate days if not provided
    let calculatedDays = total_days;
    if (!calculatedDays) {
      const d1 = new Date(leave_start_date);
      const d2 = new Date(leave_end_date);
      const diffTime = Math.abs(d2 - d1);
      calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Check replacement staff if provided
    if (replacement_staff_id) {
      const repRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [replacement_staff_id]);
      if (repRes.rows.length === 0) {
        return res.status(404).json({
          error: 'REPLACEMENT_STAFF_NOT_FOUND',
          message: `Replacement staff member with ID '${replacement_staff_id}' does not exist.`
        });
      }
    }

    const insertRes = await query(
      `INSERT INTO staff_leave_requests (
        staff_id, leave_type, leave_start_date, leave_end_date, total_days,
        reason, request_status, replacement_staff_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        staff_id,
        leave_type,
        leave_start_date,
        leave_end_date,
        calculatedDays,
        reason,
        'PENDING',
        replacement_staff_id || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for review.',
      data: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/leave-requests/:id/approve
 * Approve leave request (ADMIN only)
 */
async function approveLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { approval_notes, replacement_staff_id } = req.body;
    const approverId = req.user ? req.user.id : 'USR-ADM-001';

    const leaveRes = await query('SELECT * FROM staff_leave_requests WHERE leave_id = $1', [id]);
    if (leaveRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Leave request with ID '${id}' not found.`
      });
    }

    const leave = leaveRes.rows[0];

    // Optional replacement validation
    if (replacement_staff_id) {
      const repRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [replacement_staff_id]);
      if (repRes.rows.length === 0) {
        return res.status(404).json({
          error: 'REPLACEMENT_STAFF_NOT_FOUND',
          message: `Replacement staff member with ID '${replacement_staff_id}' does not exist.`
        });
      }
    }

    const updated = await query(
      `UPDATE staff_leave_requests SET
        request_status = 'APPROVED',
        approved_by_user_id = $1,
        approved_at = CURRENT_TIMESTAMP,
        approval_notes = COALESCE($2, approval_notes),
        replacement_staff_id = COALESCE($3, replacement_staff_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE leave_id = $4
      RETURNING *`,
      [
        approverId,
        approval_notes || 'Approved by Institutional Transport Authority.',
        replacement_staff_id || null,
        id
      ]
    );

    // If leave starts today or earlier and is active, update staff status to ON_LEAVE
    const today = new Date().toISOString().split('T')[0];
    if (leave.leave_start_date <= today && leave.leave_end_date >= today) {
      await query(
        "UPDATE staff_members SET employment_status = 'ON_LEAVE', updated_at = CURRENT_TIMESTAMP WHERE staff_id = $1",
        [leave.staff_id]
      );
    }

    res.json({
      success: true,
      message: 'Staff leave request approved successfully.',
      data: updated.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/leave-requests/:id/reject
 * Reject leave request (ADMIN only)
 */
async function rejectLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { approval_notes } = req.body;
    const approverId = req.user ? req.user.id : 'USR-ADM-001';

    const leaveRes = await query('SELECT * FROM staff_leave_requests WHERE leave_id = $1', [id]);
    if (leaveRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Leave request with ID '${id}' not found.`
      });
    }

    const updated = await query(
      `UPDATE staff_leave_requests SET
        request_status = 'REJECTED',
        approved_by_user_id = $1,
        approved_at = CURRENT_TIMESTAMP,
        approval_notes = COALESCE($2, 'Leave request rejected by management.'),
        updated_at = CURRENT_TIMESTAMP
      WHERE leave_id = $3
      RETURNING *`,
      [approverId, approval_notes || 'Leave request declined due to operational requirements.', id]
    );

    res.json({
      success: true,
      message: 'Staff leave request rejected.',
      data: updated.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/leave-requests/:id
 */
async function deleteLeaveRequest(req, res, next) {
  try {
    const { id } = req.params;
    const leaveRes = await query('SELECT * FROM staff_leave_requests WHERE leave_id = $1', [id]);
    if (leaveRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Leave request with ID '${id}' not found.`
      });
    }

    await query('DELETE FROM staff_leave_requests WHERE leave_id = $1', [id]);

    res.json({
      success: true,
      message: 'Leave application removed successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/staff/:id/leaves
 */
async function getStaffLeaves(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM staff_leave_requests WHERE staff_id = $1 ORDER BY leave_start_date DESC',
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
  getLeaveRequests,
  getLeaveById,
  createLeaveRequest,
  approveLeave,
  rejectLeave,
  deleteLeaveRequest,
  getStaffLeaves
};
