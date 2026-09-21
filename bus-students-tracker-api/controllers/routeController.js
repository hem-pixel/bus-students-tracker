const { query } = require('../config/database');

/**
 * GET /api/routes
 * Optional queries: route_type, status, search
 */
async function getAllRoutes(req, res, next) {
  try {
    const { route_type, status, search } = req.query;
    let sql = 'SELECT * FROM routes';
    const conditions = [];
    const params = [];

    if (route_type) {
      params.push(route_type.toUpperCase());
      conditions.push(`route_type = $${params.length}`);
    }

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(route_name ILIKE $${params.length} OR route_code ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY route_code ASC';

    const result = await query(sql, params);

    // Attach stop counts and bus assignments summary
    const routesWithMeta = await Promise.all(
      result.rows.map(async (route) => {
        const [stopsCountRes, busesCountRes] = await Promise.all([
          query('SELECT COUNT(*) as count FROM stops WHERE route_id = $1', [route.route_id]),
          query('SELECT COUNT(*) as count FROM bus_route_assignments WHERE route_id = $1 AND status = \'ACTIVE\'', [route.route_id])
        ]);
        return {
          ...route,
          stops_count: parseInt(stopsCountRes.rows[0]?.count || 0, 10),
          assigned_buses_count: parseInt(busesCountRes.rows[0]?.count || 0, 10)
        };
      })
    );

    res.json({
      success: true,
      count: routesWithMeta.length,
      data: routesWithMeta
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/routes/:id
 */
async function getRouteById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM routes WHERE route_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route with identifier '${id}' not found.`
      });
    }

    const route = result.rows[0];

    // Fetch sequenced stops and assigned buses
    const [stopsRes, assignedBusesRes] = await Promise.all([
      query('SELECT * FROM stops WHERE route_id = $1 ORDER BY stop_sequence ASC', [id]),
      query(
        `SELECT bra.*, b.bus_number, b.registration_plate, b.capacity, b.status as bus_status
         FROM bus_route_assignments bra
         JOIN buses b ON bra.bus_id = b.bus_id
         WHERE bra.route_id = $1 AND bra.status = 'ACTIVE'`,
        [id]
      )
    ]);

    route.stops = stopsRes.rows;
    route.assigned_buses = assignedBusesRes.rows;

    res.json({
      success: true,
      data: route
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/routes
 * Required: route_name, route_code, route_type
 */
async function createRoute(req, res, next) {
  try {
    const route_name = req.body.route_name;
    const route_code = req.body.route_code || req.body.route_number;
    const route_type = (req.body.route_type || 'MORNING').toUpperCase();
    const distance_km = req.body.distance_km !== undefined ? req.body.distance_km : req.body.total_distance_km;
    const estimated_duration_minutes = req.body.estimated_duration_minutes !== undefined ? req.body.estimated_duration_minutes : req.body.estimated_duration_mins;
    const {
      start_time,
      end_time,
      status = 'ACTIVE',
      notes
    } = req.body;

    if (!route_name || !route_code) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Fields route_name and route_code (or route_number) are required.'
      });
    }

    const validTypes = ['MORNING', 'EVENING'];
    if (!validTypes.includes(route_type)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: `route_type must be one of: ${validTypes.join(', ')}.`
      });
    }

    const sql = `
      INSERT INTO routes (
        route_name, route_code, route_type, distance_km, estimated_duration_minutes,
        start_time, end_time, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const params = [
      route_name.trim(),
      route_code.trim().toUpperCase(),
      route_type,
      distance_km !== undefined && distance_km !== null ? parseFloat(distance_km) : null,
      estimated_duration_minutes !== undefined && estimated_duration_minutes !== null ? parseInt(estimated_duration_minutes, 10) : null,
      start_time || null,
      end_time || null,
      status.toUpperCase(),
      notes || null
    ];

    const result = await query(sql, params);
    res.status(201).json({
      success: true,
      message: 'Transport route registered successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DUPLICATE_ROUTE',
        message: 'A route with this route code already exists.'
      });
    }
    next(err);
  }
}

/**
 * PUT /api/routes/:id
 */
async function updateRoute(req, res, next) {
  try {
    const { id } = req.params;
    const {
      route_name,
      route_code,
      route_type,
      distance_km,
      estimated_duration_minutes,
      start_time,
      end_time,
      status,
      notes
    } = req.body;

    const existing = await query('SELECT * FROM routes WHERE route_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route with identifier '${id}' not found.`
      });
    }

    const sql = `
      UPDATE routes
      SET 
        route_name = COALESCE($1, route_name),
        route_code = COALESCE($2, route_code),
        route_type = COALESCE($3, route_type),
        distance_km = COALESCE($4, distance_km),
        estimated_duration_minutes = COALESCE($5, estimated_duration_minutes),
        start_time = COALESCE($6, start_time),
        end_time = COALESCE($7, end_time),
        status = COALESCE($8, status),
        notes = COALESCE($9, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE route_id = $10
      RETURNING *
    `;

    const routeCodeVal = req.body.route_code || req.body.route_number;
    const distanceKmVal = req.body.distance_km !== undefined ? req.body.distance_km : req.body.total_distance_km;
    const durationVal = req.body.estimated_duration_minutes !== undefined ? req.body.estimated_duration_minutes : req.body.estimated_duration_mins;

    const params = [
      route_name !== undefined ? route_name.trim() : null,
      routeCodeVal !== undefined ? routeCodeVal.trim().toUpperCase() : null,
      route_type !== undefined ? route_type.toUpperCase() : null,
      distanceKmVal !== undefined && distanceKmVal !== null ? parseFloat(distanceKmVal) : null,
      durationVal !== undefined && durationVal !== null ? parseInt(durationVal, 10) : null,
      start_time !== undefined ? start_time : null,
      end_time !== undefined ? end_time : null,
      status !== undefined ? status.toUpperCase() : null,
      notes !== undefined ? notes : null,
      id
    ];

    const result = await query(sql, params);
    res.json({
      success: true,
      message: 'Transport route updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DUPLICATE_ROUTE',
        message: 'Conflict: Route code is already utilized by another route.'
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/routes/:id
 */
async function deleteRoute(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM routes WHERE route_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route with identifier '${id}' not found.`
      });
    }

    res.json({
      success: true,
      message: 'Route removed from system registry.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
};
