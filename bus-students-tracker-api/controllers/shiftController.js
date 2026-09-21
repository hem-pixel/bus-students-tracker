const { query } = require('../config/database');

/**
 * GET /api/shifts
 * Query params: staff_id, bus_id, route_id, shift_date, date_from, date_to, status, shift_type
 */
async function getAllShifts(req, res, next) {
  try {
    const { staff_id, bus_id, route_id, shift_date, date_from, date_to, status, shift_type } = req.query;

    let result = await query('SELECT * FROM staff_shifts ORDER BY shift_date DESC, scheduled_start_time ASC');
    let shifts = result.rows;

    if (staff_id) {
      shifts = shifts.filter(s => s.staff_id === staff_id);
    }
    if (bus_id) {
      shifts = shifts.filter(s => s.bus_id === bus_id);
    }
    if (route_id) {
      shifts = shifts.filter(s => s.route_id === route_id);
    }
    if (shift_date) {
      shifts = shifts.filter(s => s.shift_date === shift_date);
    }
    if (date_from) {
      shifts = shifts.filter(s => s.shift_date >= date_from);
    }
    if (date_to) {
      shifts = shifts.filter(s => s.shift_date <= date_to);
    }
    if (status) {
      shifts = shifts.filter(s => String(s.status).toUpperCase() === status.toUpperCase());
    }
    if (shift_type) {
      shifts = shifts.filter(s => String(s.shift_type).toUpperCase() === shift_type.toUpperCase());
    }

    res.json({
      success: true,
      count: shifts.length,
      data: shifts
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shifts/:id
 */
async function getShiftById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM staff_shifts WHERE shift_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Shift duty with ID '${id}' not found.`
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
 * POST /api/shifts
 * Create shift assignment (ADMIN / TRANSPORT_STAFF)
 */
async function createShift(req, res, next) {
  try {
    const {
      staff_id,
      bus_id,
      route_id,
      shift_date,
      shift_type = 'MORNING',
      scheduled_start_time,
      scheduled_end_time,
      shift_notes
    } = req.body;

    if (!staff_id || !bus_id || !route_id || !shift_date) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'staff_id, bus_id, route_id, and shift_date are required fields.'
      });
    }

    // Verify staff exists and is active
    const staffRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [staff_id]);
    if (staffRes.rows.length === 0) {
      return res.status(404).json({
        error: 'STAFF_NOT_FOUND',
        message: `Staff member with ID '${staff_id}' does not exist.`
      });
    }
    const staff = staffRes.rows[0];
    if (staff.employment_status === 'ON_LEAVE' || staff.employment_status === 'SUSPENDED') {
      return res.status(400).json({
        error: 'STAFF_UNAVAILABLE',
        message: `Staff member '${staff.first_name} ${staff.last_name}' is currently ${staff.employment_status} and cannot be assigned shifts.`
      });
    }

    // Verify bus exists
    const busRes = await query('SELECT * FROM buses WHERE bus_id = $1', [bus_id]);
    if (busRes.rows.length === 0) {
      return res.status(404).json({
        error: 'BUS_NOT_FOUND',
        message: `Bus with ID '${bus_id}' does not exist.`
      });
    }

    // Verify route exists
    const routeRes = await query('SELECT * FROM routes WHERE route_id = $1', [route_id]);
    if (routeRes.rows.length === 0) {
      return res.status(404).json({
        error: 'ROUTE_NOT_FOUND',
        message: `Route with ID '${route_id}' does not exist.`
      });
    }

    // Time validation if both provided
    if (scheduled_start_time && scheduled_end_time && scheduled_start_time >= scheduled_end_time) {
      return res.status(400).json({
        error: 'INVALID_SHIFT_TIMES',
        message: 'scheduled_start_time must be earlier than scheduled_end_time.'
      });
    }

    // Check duplicate assignment for same staff on same date and shift type
    const existRes = await query(
      'SELECT * FROM staff_shifts WHERE staff_id = $1 AND shift_date = $2 AND shift_type = $3',
      [staff_id, shift_date, shift_type]
    );
    if (existRes.rows.length > 0) {
      return res.status(409).json({
        error: 'SHIFT_CONFLICT',
        message: `Staff member is already scheduled for a ${shift_type} shift on ${shift_date}.`
      });
    }

    const insertRes = await query(
      `INSERT INTO staff_shifts (
        staff_id, bus_id, route_id, shift_date, shift_type,
        scheduled_start_time, scheduled_end_time, status, shift_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        staff_id,
        bus_id,
        route_id,
        shift_date,
        shift_type,
        scheduled_start_time || (shift_type === 'EVENING' ? '16:00' : '06:00'),
        scheduled_end_time || (shift_type === 'EVENING' ? '19:30' : '09:00'),
        'SCHEDULED',
        shift_notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Staff shift duty scheduled successfully.',
      data: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/shifts/:id
 * Update shift times, status (IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED), or notes
 */
async function updateShift(req, res, next) {
  try {
    const { id } = req.params;
    const shiftRes = await query('SELECT * FROM staff_shifts WHERE shift_id = $1', [id]);
    if (shiftRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Shift with ID '${id}' not found.`
      });
    }

    const current = shiftRes.rows[0];
    const {
      actual_start_time,
      actual_end_time,
      status,
      shift_notes,
      scheduled_start_time,
      scheduled_end_time,
      bus_id,
      route_id
    } = req.body;

    const updated = await query(
      `UPDATE staff_shifts SET
        bus_id = COALESCE($1, bus_id),
        route_id = COALESCE($2, route_id),
        scheduled_start_time = COALESCE($3, scheduled_start_time),
        scheduled_end_time = COALESCE($4, scheduled_end_time),
        actual_start_time = COALESCE($5, actual_start_time),
        actual_end_time = COALESCE($6, actual_end_time),
        status = COALESCE($7, status),
        shift_notes = COALESCE($8, shift_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE shift_id = $9
      RETURNING *`,
      [
        bus_id || null,
        route_id || null,
        scheduled_start_time || null,
        scheduled_end_time || null,
        actual_start_time || null,
        actual_end_time || null,
        status || null,
        shift_notes || null,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Shift duty updated successfully.',
      data: updated.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/shifts/:id
 */
async function deleteShift(req, res, next) {
  try {
    const { id } = req.params;
    const shiftRes = await query('SELECT * FROM staff_shifts WHERE shift_id = $1', [id]);
    if (shiftRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Shift with ID '${id}' not found.`
      });
    }

    await query('DELETE FROM staff_shifts WHERE shift_id = $1', [id]);

    res.json({
      success: true,
      message: 'Shift duty cancelled and removed from roster.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shifts/bus/:bus_id/date/:date
 * Get all shifts scheduled for a specific bus on a given date
 */
async function getBusShifts(req, res, next) {
  try {
    const { bus_id, date } = req.params;
    const result = await query(
      'SELECT * FROM staff_shifts WHERE bus_id = $1 AND shift_date = $2 ORDER BY scheduled_start_time ASC',
      [bus_id, date]
    );

    res.json({
      success: true,
      bus_id,
      date,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/staff/:id/shifts
 * Get shifts for a specific staff member
 */
async function getStaffShifts(req, res, next) {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    let result = await query(
      'SELECT * FROM staff_shifts WHERE staff_id = $1 ORDER BY shift_date DESC, scheduled_start_time ASC',
      [id]
    );

    let shifts = result.rows;
    if (date_from) {
      shifts = shifts.filter(s => s.shift_date >= date_from);
    }
    if (date_to) {
      shifts = shifts.filter(s => s.shift_date <= date_to);
    }

    res.json({
      success: true,
      staff_id: id,
      count: shifts.length,
      data: shifts
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  getBusShifts,
  getStaffShifts
};
