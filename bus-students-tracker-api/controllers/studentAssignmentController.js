const { query } = require('../config/database');

/**
 * GET /api/students/assignments (or /api/assignments/students)
 * Optional filters: student_id, bus_id, route_id, status
 */
async function getAllAssignments(req, res, next) {
  try {
    const { student_id, bus_id, route_id, status } = req.query;
    let sql = 'SELECT * FROM student_bus_assignments';
    const conditions = [];
    const params = [];

    if (student_id) {
      params.push(student_id);
      conditions.push(`student_id = $${params.length}`);
    }

    if (bus_id) {
      params.push(bus_id);
      conditions.push(`bus_id = $${params.length}`);
    }

    if (route_id) {
      params.push(route_id);
      conditions.push(`route_id = $${params.length}`);
    }

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`status = $${params.length}`);
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
 * GET /api/students/assignments/:id
 */
async function getAssignmentById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM student_bus_assignments WHERE assignment_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Student bus assignment '${id}' not found.`
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
 * POST /api/students/assignments
 */
async function assignStudent(req, res, next) {
  try {
    const {
      student_id,
      bus_id,
      route_id,
      boarding_stop_id,
      drop_stop_id,
      seat_number = null,
      is_primary = true,
      valid_from = new Date().toISOString().split('T')[0],
      valid_to = '2027-05-31',
      status = 'ACTIVE',
      notes = ''
    } = req.body;

    if (!student_id || !bus_id || !route_id || !boarding_stop_id || !drop_stop_id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required assignment fields: student_id, bus_id, route_id, boarding_stop_id, and drop_stop_id are mandatory.'
      });
    }

    // Deactivate previous active assignments for this student if is_primary is true
    if (is_primary) {
      await query(
        "UPDATE student_bus_assignments SET status = 'INACTIVE' WHERE student_id = $1 AND status = 'ACTIVE'",
        [student_id]
      );
    }

    const insertSql = `
      INSERT INTO student_bus_assignments (
        student_id, bus_id, route_id, boarding_stop_id, drop_stop_id,
        seat_number, is_primary, valid_from, valid_to, status, notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `;

    const params = [
      student_id,
      bus_id,
      route_id,
      boarding_stop_id,
      drop_stop_id,
      seat_number,
      Boolean(is_primary),
      valid_from,
      valid_to,
      status,
      notes
    ];

    const result = await query(insertSql, params);

    // Update student's overall transport_status to ACTIVE
    if (status === 'ACTIVE') {
      await query("UPDATE students SET transport_status = 'ACTIVE' WHERE student_id = $1", [student_id]);
    }

    res.status(201).json({
      success: true,
      message: 'Student successfully allocated to transport bus and route.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/students/assignments/:id
 */
async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const fields = req.body;

    const existing = await query('SELECT * FROM student_bus_assignments WHERE assignment_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Assignment '${id}' not found.`
      });
    }

    const updateable = [
      'bus_id', 'route_id', 'boarding_stop_id', 'drop_stop_id',
      'seat_number', 'is_primary', 'valid_from', 'valid_to', 'status', 'notes'
    ];

    const setClauses = [];
    const params = [];

    updateable.forEach(col => {
      if (fields[col] !== undefined) {
        params.push(fields[col]);
        setClauses.push(`${col} = $${params.length}`);
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'No valid assignment fields provided for modification.'
      });
    }

    params.push(id);
    const sql = `UPDATE student_bus_assignments SET ${setClauses.join(', ')} WHERE assignment_id = $${params.length} RETURNING *`;
    const result = await query(sql, params);

    // If status changed to INACTIVE, check if student has any other active assignments
    if (fields.status === 'INACTIVE') {
      const studentId = existing.rows[0].student_id;
      const remainingActive = await query(
        "SELECT assignment_id FROM student_bus_assignments WHERE student_id = $1 AND status = 'ACTIVE' AND assignment_id != $2",
        [studentId, id]
      );
      if (remainingActive.rows.length === 0) {
        await query("UPDATE students SET transport_status = 'INACTIVE' WHERE student_id = $1", [studentId]);
      }
    } else if (fields.status === 'ACTIVE') {
      const studentId = existing.rows[0].student_id;
      await query("UPDATE students SET transport_status = 'ACTIVE' WHERE student_id = $1", [studentId]);
    }

    res.json({
      success: true,
      message: 'Student bus assignment updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/students/assignments/:id
 */
async function removeAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM student_bus_assignments WHERE assignment_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Assignment '${id}' not found.`
      });
    }

    const studentId = existing.rows[0].student_id;

    // Delete record
    const delRes = await query('DELETE FROM student_bus_assignments WHERE assignment_id = $1 RETURNING *', [id]);

    // Check remaining active assignments
    const remainingActive = await query(
      "SELECT assignment_id FROM student_bus_assignments WHERE student_id = $1 AND status = 'ACTIVE'",
      [studentId]
    );
    if (remainingActive.rows.length === 0) {
      await query("UPDATE students SET transport_status = 'INACTIVE' WHERE student_id = $1", [studentId]);
    }

    res.json({
      success: true,
      message: 'Student bus allocation removed.',
      data: delRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllAssignments,
  getAssignmentById,
  assignStudent,
  updateAssignment,
  removeAssignment
};
