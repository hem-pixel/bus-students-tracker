const { query } = require('../config/database');

/**
 * GET /api/assignments
 * Optional queries: bus_id, route_id, status
 */
async function getAllAssignments(req, res, next) {
  try {
    const { bus_id, route_id, status } = req.query;
    let sql = `
      SELECT bra.*, 
             b.bus_number, b.registration_plate, b.capacity as bus_capacity, b.status as bus_status,
             r.route_name, r.route_code, r.route_type, r.start_time, r.end_time, r.status as route_status
      FROM bus_route_assignments bra
      JOIN buses b ON bra.bus_id = b.bus_id
      JOIN routes r ON bra.route_id = r.route_id
    `;
    const conditions = [];
    const params = [];

    if (bus_id) {
      params.push(bus_id);
      conditions.push(`bra.bus_id = $${params.length}`);
    }

    if (route_id) {
      params.push(route_id);
      conditions.push(`bra.route_id = $${params.length}`);
    }

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`bra.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY bra.assigned_date DESC, b.bus_number ASC';

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
 * GET /api/assignments/:id
 */
async function getAssignmentById(req, res, next) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT bra.*, 
             b.bus_number, b.registration_plate, b.capacity as bus_capacity,
             r.route_name, r.route_code, r.route_type
      FROM bus_route_assignments bra
      JOIN buses b ON bra.bus_id = b.bus_id
      JOIN routes r ON bra.route_id = r.route_id
      WHERE bra.assignment_id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Bus Route Assignment with identifier '${id}' not found.`
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
 * POST /api/assignments
 * Required: bus_id, route_id
 */
async function createAssignment(req, res, next) {
  try {
    const {
      bus_id,
      route_id,
      assigned_date = new Date().toISOString().split('T')[0],
      unassigned_date
    } = req.body;

    const status = req.body.status || (req.body.is_active !== undefined ? (req.body.is_active ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE');

    if (!bus_id || !route_id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Both bus_id and route_id are required to establish an assignment.'
      });
    }

    // Check bus and route exist
    const [busRes, routeRes] = await Promise.all([
      query('SELECT bus_id, status FROM buses WHERE bus_id = $1', [bus_id]),
      query('SELECT route_id, status FROM routes WHERE route_id = $1', [route_id])
    ]);

    if (busRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Bus '${bus_id}' not found.`
      });
    }
    if (routeRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route '${route_id}' not found.`
      });
    }

    const sql = `
      INSERT INTO bus_route_assignments (
        bus_id, route_id, assigned_date, unassigned_date, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const params = [
      bus_id,
      route_id,
      assigned_date,
      unassigned_date || null,
      status.toUpperCase()
    ];

    const result = await query(sql, params);
    res.status(201).json({
      success: true,
      message: 'Bus successfully assigned to route schedule.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DUPLICATE_ASSIGNMENT',
        message: 'An assignment between this bus and route on this date already exists.'
      });
    }
    next(err);
  }
}

/**
 * PUT /api/assignments/:id
 */
async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const {
      bus_id,
      route_id,
      assigned_date,
      unassigned_date
    } = req.body;

    let status = req.body.status ? req.body.status.toUpperCase() : undefined;
    if (req.body.is_active !== undefined) {
      status = req.body.is_active ? 'ACTIVE' : 'INACTIVE';
    }

    const existing = await query('SELECT * FROM bus_route_assignments WHERE assignment_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Assignment with identifier '${id}' not found.`
      });
    }

    const sql = `
      UPDATE bus_route_assignments
      SET 
        bus_id = COALESCE($1, bus_id),
        route_id = COALESCE($2, route_id),
        assigned_date = COALESCE($3, assigned_date),
        unassigned_date = COALESCE($4, unassigned_date),
        status = COALESCE($5, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE assignment_id = $6
      RETURNING *
    `;

    const params = [
      bus_id || null,
      route_id || null,
      assigned_date || null,
      unassigned_date !== undefined ? unassigned_date : null,
      status || null,
      id
    ];

    const result = await query(sql, params);
    res.json({
      success: true,
      message: 'Bus route assignment updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/assignments/:id
 */
async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM bus_route_assignments WHERE assignment_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Assignment with identifier '${id}' not found.`
      });
    }

    res.json({
      success: true,
      message: 'Bus route assignment unlinked.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
