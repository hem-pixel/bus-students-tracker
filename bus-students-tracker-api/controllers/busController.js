const { query } = require('../config/database');

/**
 * GET /api/buses
 * Optional queries: status, search
 */
async function getAllBuses(req, res, next) {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM buses';
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(bus_number ILIKE $${params.length} OR registration_plate ILIKE $${params.length} OR model ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY bus_number ASC';

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
 * GET /api/buses/:id
 */
async function getBusById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM buses WHERE bus_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Bus with identifier '${id}' not found in registry.`
      });
    }

    // Also fetch associated driver, in_charge, routes, and cameras
    const bus = result.rows[0];
    const [driverRes, inChargeRes, routeRes, cameraRes] = await Promise.all([
      query('SELECT * FROM drivers WHERE assigned_bus_id = $1', [id]),
      query('SELECT * FROM bus_in_charges WHERE assigned_bus_id = $1', [id]),
      query(
        `SELECT bra.*, r.route_name, r.route_code, r.route_type 
         FROM bus_route_assignments bra 
         JOIN routes r ON bra.route_id = r.route_id 
         WHERE bra.bus_id = $1 AND bra.status = 'ACTIVE'`,
        [id]
      ),
      query('SELECT * FROM cameras WHERE bus_id = $1 ORDER BY camera_name ASC', [id])
    ]);

    bus.driver = driverRes.rows[0] || null;
    bus.in_charge = inChargeRes.rows[0] || null;
    bus.active_routes = routeRes.rows;
    bus.cameras = cameraRes.rows;

    res.json({
      success: true,
      data: bus
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/buses
 * Required: bus_number, capacity, registration_plate
 */
async function createBus(req, res, next) {
  try {
    const {
      bus_number,
      capacity,
      model,
      manufacturer,
      purchase_date,
      status = 'ACTIVE',
      notes
    } = req.body;

    const registration_plate = req.body.registration_plate || req.body.registration_number;

    if (!bus_number || !capacity || !registration_plate) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Fields bus_number, capacity, and registration_plate (or registration_number) are strictly required.'
      });
    }

    if (parseInt(capacity, 10) <= 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Bus capacity must be an integer greater than 0.'
      });
    }

    const sql = `
      INSERT INTO buses (
        bus_number, capacity, registration_plate, model, manufacturer, purchase_date, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      bus_number.trim().toUpperCase(),
      parseInt(capacity, 10),
      registration_plate.trim().toUpperCase(),
      model || null,
      manufacturer || null,
      purchase_date || null,
      status.toUpperCase(),
      notes || null
    ];

    const result = await query(sql, params);
    res.status(201).json({
      success: true,
      message: 'Bus asset registered successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DUPLICATE_ASSET',
        message: 'A bus with this bus number or registration plate already exists in the fleet registry.'
      });
    }
    next(err);
  }
}

/**
 * PUT /api/buses/:id
 */
async function updateBus(req, res, next) {
  try {
    const { id } = req.params;
    const {
      bus_number,
      capacity,
      model,
      manufacturer,
      purchase_date,
      status,
      notes
    } = req.body;

    const registration_plate = req.body.registration_plate || req.body.registration_number;

    const existing = await query('SELECT * FROM buses WHERE bus_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Bus with identifier '${id}' not found.`
      });
    }

    const sql = `
      UPDATE buses
      SET 
        bus_number = COALESCE($1, bus_number),
        capacity = COALESCE($2, capacity),
        registration_plate = COALESCE($3, registration_plate),
        model = COALESCE($4, model),
        manufacturer = COALESCE($5, manufacturer),
        purchase_date = COALESCE($6, purchase_date),
        status = COALESCE($7, status),
        notes = COALESCE($8, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE bus_id = $9
      RETURNING *
    `;

    const params = [
      bus_number ? bus_number.trim().toUpperCase() : null,
      capacity ? parseInt(capacity, 10) : null,
      registration_plate ? registration_plate.trim().toUpperCase() : null,
      model !== undefined ? model : null,
      manufacturer !== undefined ? manufacturer : null,
      purchase_date !== undefined ? purchase_date : null,
      status ? status.toUpperCase() : null,
      notes !== undefined ? notes : null,
      id
    ];

    const result = await query(sql, params);
    res.json({
      success: true,
      message: 'Bus asset updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DUPLICATE_ASSET',
        message: 'Conflict: The updated bus number or registration plate already belongs to another bus.'
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/buses/:id
 */
async function deleteBus(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM buses WHERE bus_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Bus with identifier '${id}' not found.`
      });
    }

    res.json({
      success: true,
      message: 'Bus asset removed from system registry.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus
};
