const { query } = require('../config/database');

/**
 * GET /api/drivers
 * Optional queries: status, assigned_bus_id, search
 */
async function getAllDrivers(req, res, next) {
  try {
    const { status, assigned_bus_id, search } = req.query;
    let sql = `
      SELECT d.*, CONCAT(d.first_name, ' ', d.last_name) AS name, b.bus_number, b.registration_plate, b.capacity as bus_capacity
      FROM drivers d
      LEFT JOIN buses b ON d.assigned_bus_id = b.bus_id
    `;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`d.status = $${params.length}`);
    }

    if (assigned_bus_id) {
      params.push(assigned_bus_id);
      conditions.push(`d.assigned_bus_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(
        d.first_name ILIKE $${params.length} OR 
        d.last_name ILIKE $${params.length} OR 
        d.employee_id ILIKE $${params.length} OR 
        d.license_number ILIKE $${params.length} OR 
        d.phone ILIKE $${params.length}
      )`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY d.employee_id ASC';

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
 * GET /api/drivers/:id
 */
async function getDriverById(req, res, next) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT d.*, CONCAT(d.first_name, ' ', d.last_name) AS name, b.bus_number, b.registration_plate, b.capacity as bus_capacity
      FROM drivers d
      LEFT JOIN buses b ON d.assigned_bus_id = b.bus_id
      WHERE d.driver_id = $1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Driver with identifier '${id}' not found.`
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
 * POST /api/drivers
 * Required: employee_id, first_name, last_name, license_number
 */
async function createDriver(req, res, next) {
  try {
    let fName = req.body.first_name;
    let lName = req.body.last_name;
    if ((!fName || !lName) && req.body.name) {
      const parts = req.body.name.trim().split(/\s+/);
      fName = parts[0] || 'Driver';
      lName = parts.slice(1).join(' ') || parts[0];
    }
    const employee_id = req.body.employee_id || ('DRV-' + Date.now().toString().slice(-4));
    const license_number = req.body.license_number || ('DL-VSB-' + Date.now().toString().slice(-4));

    const {
      email,
      phone,
      emergency_contact,
      emergency_phone,
      license_expiry,
      aadhar_number,
      date_of_birth,
      status = 'ACTIVE',
      assigned_bus_id,
      assignment_date,
      notes
    } = req.body;

    if (!fName || !lName) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'first_name and last_name (or name) are required.'
      });
    }

    // If assigned_bus_id is provided, check bus exists
    if (assigned_bus_id) {
      const busCheck = await query('SELECT bus_id FROM buses WHERE bus_id = $1', [assigned_bus_id]);
      if (busCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Specified bus '${assigned_bus_id}' does not exist in registry.`
        });
      }
    }

    const sql = `
      INSERT INTO drivers (
        employee_id, first_name, last_name, email, phone, emergency_contact,
        emergency_phone, license_number, license_expiry, aadhar_number, date_of_birth,
        status, assigned_bus_id, assignment_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const params = [
      employee_id.trim().toUpperCase(),
      fName.trim(),
      lName.trim(),
      email ? email.trim().toLowerCase() : null,
      phone ? phone.trim() : null,
      emergency_contact || null,
      emergency_phone || null,
      license_number.trim().toUpperCase(),
      license_expiry || null,
      aadhar_number || null,
      date_of_birth || null,
      status.toUpperCase(),
      assigned_bus_id || null,
      assignment_date || (assigned_bus_id ? new Date().toISOString().split('T')[0] : null),
      notes || null
    ];

    const result = await query(sql, params);
    res.status(201).json({
      success: true,
      message: 'Transport driver onboarded successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DUPLICATE_ENTRY',
        message: 'Conflict: Driver with this employee ID, license number, or email already exists.'
      });
    }
    next(err);
  }
}

/**
 * PUT /api/drivers/:id
 */
async function updateDriver(req, res, next) {
  try {
    const { id } = req.params;
    let {
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      emergency_contact,
      emergency_phone,
      license_number,
      license_expiry,
      aadhar_number,
      date_of_birth,
      status,
      assigned_bus_id,
      assignment_date,
      notes
    } = req.body;

    if (req.body.name && !first_name && !last_name) {
      const parts = req.body.name.trim().split(/\s+/);
      first_name = parts[0];
      last_name = parts.slice(1).join(' ') || parts[0];
    }

    const existing = await query('SELECT * FROM drivers WHERE driver_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Driver with identifier '${id}' not found.`
      });
    }

    const sql = `
      UPDATE drivers
      SET 
        employee_id = COALESCE($1, employee_id),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        emergency_contact = COALESCE($6, emergency_contact),
        emergency_phone = COALESCE($7, emergency_phone),
        license_number = COALESCE($8, license_number),
        license_expiry = COALESCE($9, license_expiry),
        aadhar_number = COALESCE($10, aadhar_number),
        date_of_birth = COALESCE($11, date_of_birth),
        status = COALESCE($12, status),
        assigned_bus_id = COALESCE($13, assigned_bus_id),
        assignment_date = COALESCE($14, assignment_date),
        notes = COALESCE($15, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE driver_id = $16
      RETURNING *
    `;

    const params = [
      employee_id ? employee_id.trim().toUpperCase() : null,
      first_name ? first_name.trim() : null,
      last_name ? last_name.trim() : null,
      email !== undefined ? (email ? email.trim().toLowerCase() : null) : null,
      phone !== undefined ? phone : null,
      emergency_contact !== undefined ? emergency_contact : null,
      emergency_phone !== undefined ? emergency_phone : null,
      license_number ? license_number.trim().toUpperCase() : null,
      license_expiry !== undefined ? license_expiry : null,
      aadhar_number !== undefined ? aadhar_number : null,
      date_of_birth !== undefined ? date_of_birth : null,
      status ? status.toUpperCase() : null,
      assigned_bus_id !== undefined ? assigned_bus_id : null,
      assignment_date !== undefined ? assignment_date : null,
      notes !== undefined ? notes : null,
      id
    ];

    const result = await query(sql, params);
    res.json({
      success: true,
      message: 'Driver profile updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'DUPLICATE_ENTRY',
        message: 'Conflict: The updated employee ID or license number belongs to another driver.'
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/drivers/:id
 */
async function deleteDriver(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM drivers WHERE driver_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Driver with identifier '${id}' not found.`
      });
    }

    res.json({
      success: true,
      message: 'Driver record removed from active roster.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver
};
