const { query } = require('../config/database');

/**
 * GET /api/stops
 * Optional queries: route_id, stop_type, status, search
 */
async function getAllStops(req, res, next) {
  try {
    const { route_id, stop_type, status, search } = req.query;
    let sql = `
      SELECT s.*, r.route_name, r.route_code, r.route_type
      FROM stops s
      JOIN routes r ON s.route_id = r.route_id
    `;
    const conditions = [];
    const params = [];

    if (route_id) {
      params.push(route_id);
      conditions.push(`s.route_id = $${params.length}`);
    }

    if (stop_type) {
      params.push(stop_type.toUpperCase());
      conditions.push(`s.stop_type = $${params.length}`);
    }

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`s.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(s.stop_name ILIKE $${params.length} OR s.address ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY r.route_code ASC, s.stop_sequence ASC';

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
 * GET /api/stops/:id
 */
async function getStopById(req, res, next) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT s.*, r.route_name, r.route_code, r.route_type
      FROM stops s
      JOIN routes r ON s.route_id = r.route_id
      WHERE s.stop_id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Stop with identifier '${id}' not found.`
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
 * POST /api/stops
 * Required: route_id, stop_name, stop_sequence
 */
async function createStop(req, res, next) {
  try {
    const route_id = req.body.route_id;
    const stop_name = req.body.stop_name;
    const stop_sequence = req.body.stop_sequence !== undefined ? req.body.stop_sequence : req.body.stop_order;
    const address = req.body.address || req.body.landmark;
    const estimated_arrival_time = req.body.estimated_arrival_time || req.body.arrival_time;
    const {
      stop_type = 'BOTH',
      latitude,
      longitude,
      estimated_departure_time,
      geofence_radius_meters = 500,
      status = 'ACTIVE',
      notes
    } = req.body;

    if (!route_id || !stop_name || stop_sequence === undefined) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Fields route_id, stop_name, and stop_sequence (or stop_order) are required.'
      });
    }

    // Verify route exists
    const routeCheck = await query('SELECT route_id FROM routes WHERE route_id = $1', [route_id]);
    if (routeCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Associated route with id '${route_id}' does not exist.`
      });
    }

    const sql = `
      INSERT INTO stops (
        route_id, stop_name, stop_sequence, stop_type, latitude, longitude,
        address, estimated_arrival_time, estimated_departure_time, geofence_radius_meters,
        status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const params = [
      route_id,
      stop_name.trim(),
      parseInt(stop_sequence, 10),
      stop_type.toUpperCase(),
      latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
      longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
      address ? address.trim() : null,
      estimated_arrival_time || null,
      estimated_departure_time || null,
      parseInt(geofence_radius_meters, 10) || 500,
      status.toUpperCase(),
      notes || null
    ];

    const result = await query(sql, params);
    res.status(201).json({
      success: true,
      message: 'Bus stop registered in route sequence.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/stops/:id
 */
async function updateStop(req, res, next) {
  try {
    const { id } = req.params;
    const stop_sequence = req.body.stop_sequence !== undefined ? req.body.stop_sequence : req.body.stop_order;
    const address = req.body.address !== undefined ? req.body.address : req.body.landmark;
    const estimated_arrival_time = req.body.estimated_arrival_time !== undefined ? req.body.estimated_arrival_time : req.body.arrival_time;
    const {
      route_id,
      stop_name,
      stop_type,
      latitude,
      longitude,
      estimated_departure_time,
      geofence_radius_meters,
      status,
      notes
    } = req.body;

    const existing = await query('SELECT * FROM stops WHERE stop_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Stop with identifier '${id}' not found.`
      });
    }

    const sql = `
      UPDATE stops
      SET 
        route_id = COALESCE($1, route_id),
        stop_name = COALESCE($2, stop_name),
        stop_sequence = COALESCE($3, stop_sequence),
        stop_type = COALESCE($4, stop_type),
        latitude = COALESCE($5, latitude),
        longitude = COALESCE($6, longitude),
        address = COALESCE($7, address),
        estimated_arrival_time = COALESCE($8, estimated_arrival_time),
        estimated_departure_time = COALESCE($9, estimated_departure_time),
        geofence_radius_meters = COALESCE($10, geofence_radius_meters),
        status = COALESCE($11, status),
        notes = COALESCE($12, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE stop_id = $13
      RETURNING *
    `;

    const params = [
      route_id || null,
      stop_name !== undefined ? stop_name.trim() : null,
      stop_sequence !== undefined ? parseInt(stop_sequence, 10) : null,
      stop_type !== undefined ? stop_type.toUpperCase() : null,
      latitude !== undefined ? parseFloat(latitude) : null,
      longitude !== undefined ? parseFloat(longitude) : null,
      address !== undefined ? address : null,
      estimated_arrival_time !== undefined ? estimated_arrival_time : null,
      estimated_departure_time !== undefined ? estimated_departure_time : null,
      geofence_radius_meters !== undefined ? parseInt(geofence_radius_meters, 10) : null,
      status !== undefined ? status.toUpperCase() : null,
      notes !== undefined ? notes : null,
      id
    ];

    const result = await query(sql, params);
    res.json({
      success: true,
      message: 'Bus stop details updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/stops/:id
 */
async function deleteStop(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM stops WHERE stop_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Stop with identifier '${id}' not found.`
      });
    }

    res.json({
      success: true,
      message: 'Stop removed from route sequence.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllStops,
  getStopById,
  createStop,
  updateStop,
  deleteStop
};
