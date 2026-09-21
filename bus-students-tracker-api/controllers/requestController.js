const { query } = require('../config/database');

/**
 * GET /api/transport-requests
 * Optional filters: student_id, request_status, request_type
 */
async function getAllRequests(req, res, next) {
  try {
    const { student_id, request_status, request_type } = req.query;
    let sql = 'SELECT * FROM student_transport_requests';
    const conditions = [];
    const params = [];

    if (student_id) {
      params.push(student_id);
      conditions.push(`student_id = $${params.length}`);
    }

    if (request_status) {
      params.push(request_status.toUpperCase());
      conditions.push(`request_status = $${params.length}`);
    }

    if (request_type) {
      params.push(request_type.toUpperCase());
      conditions.push(`request_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transport-requests/:id
 */
async function getRequestById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM student_transport_requests WHERE request_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Transport request '${id}' not found.`
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
 * POST /api/transport-requests
 */
async function createRequest(req, res, next) {
  try {
    const {
      student_id,
      request_type = 'NEW_ALLOCATION',
      requested_bus_id = null,
      requested_route_id = null,
      requested_boarding_stop_id = null,
      requested_drop_stop_id = null,
      reason = '',
      notes = ''
    } = req.body;

    if (!student_id || !requested_route_id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'student_id and requested_route_id are required to file a transport request.'
      });
    }

    const insertSql = `
      INSERT INTO student_transport_requests (
        student_id, request_type, requested_bus_id, requested_route_id,
        requested_boarding_stop_id, requested_drop_stop_id, reason,
        request_status, notes
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        'PENDING', $8
      ) RETURNING *
    `;

    const params = [
      student_id,
      request_type,
      requested_bus_id,
      requested_route_id,
      requested_boarding_stop_id,
      requested_drop_stop_id,
      reason,
      notes
    ];

    const result = await query(insertSql, params);

    // Update student's status to REQUESTED
    await query("UPDATE students SET transport_status = 'REQUESTED' WHERE student_id = $1", [student_id]);

    res.status(201).json({
      success: true,
      message: 'Transport request submitted and queued for administrative approval.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/transport-requests/:id/review
 * Action: Approve or Reject
 */
async function reviewRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { request_status, admin_remarks, reviewed_by } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(request_status)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "request_status must be either 'APPROVED' or 'REJECTED'."
      });
    }

    const reqRes = await query('SELECT * FROM student_transport_requests WHERE request_id = $1', [id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Transport request '${id}' not found.`
      });
    }

    const currentReq = reqRes.rows[0];

    const updateSql = `
      UPDATE student_transport_requests
      SET request_status = $1,
          admin_remarks = $2,
          reviewed_by = $3,
          reviewed_at = $4
      WHERE request_id = $5
      RETURNING *
    `;

    const params = [
      request_status,
      admin_remarks || `Request ${request_status.toLowerCase()} by transport administrator.`,
      reviewed_by || req.user?.id || 'USR-ADM-001',
      new Date().toISOString(),
      id
    ];

    const updatedResult = await query(updateSql, params);

    // If APPROVED, instantiate or update the student's bus assignment
    if (request_status === 'APPROVED' && currentReq.requested_bus_id && currentReq.requested_route_id) {
      // Deactivate old active assignments
      await query(
        "UPDATE student_bus_assignments SET status = 'INACTIVE' WHERE student_id = $1 AND status = 'ACTIVE'",
        [currentReq.student_id]
      );

      // Create new active assignment
      const assignSql = `
        INSERT INTO student_bus_assignments (
          student_id, bus_id, route_id, boarding_stop_id, drop_stop_id,
          seat_number, is_primary, valid_from, valid_to, status, notes
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, true, $7, '2027-05-31', 'ACTIVE', $8
        )
      `;
      await query(assignSql, [
        currentReq.student_id,
        currentReq.requested_bus_id,
        currentReq.requested_route_id,
        currentReq.requested_boarding_stop_id,
        currentReq.requested_drop_stop_id,
        null,
        new Date().toISOString().split('T')[0],
        `Generated from approved request ${id}`
      ]);

      // Set student status to ACTIVE
      await query("UPDATE students SET transport_status = 'ACTIVE' WHERE student_id = $1", [currentReq.student_id]);
    } else if (request_status === 'REJECTED') {
      // Check if student has other active assignment
      const remainingActive = await query(
        "SELECT assignment_id FROM student_bus_assignments WHERE student_id = $1 AND status = 'ACTIVE'",
        [currentReq.student_id]
      );
      if (remainingActive.rows.length === 0) {
        await query("UPDATE students SET transport_status = 'INACTIVE' WHERE student_id = $1", [currentReq.student_id]);
      } else {
        await query("UPDATE students SET transport_status = 'ACTIVE' WHERE student_id = $1", [currentReq.student_id]);
      }
    }

    res.json({
      success: true,
      message: `Transport request marked as '${request_status}'.`,
      data: updatedResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  reviewRequest
};
