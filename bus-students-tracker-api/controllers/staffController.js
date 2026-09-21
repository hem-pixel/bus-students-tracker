const { query } = require('../config/database');

/**
 * GET /api/staff
 * Optional query filters: type / staff_type, status / employment_status, department, search
 */
async function getAllStaff(req, res, next) {
  try {
    const { type, staff_type, status, employment_status, department, search } = req.query;
    const targetType = type || staff_type;
    const targetStatus = status || employment_status;

    let result = await query('SELECT * FROM staff_members ORDER BY first_name ASC');
    let staffList = result.rows;

    if (targetType) {
      staffList = staffList.filter(s => String(s.staff_type).toUpperCase() === targetType.toUpperCase());
    }

    if (targetStatus) {
      staffList = staffList.filter(s => String(s.employment_status).toUpperCase() === targetStatus.toUpperCase());
    }

    if (department) {
      staffList = staffList.filter(s => s.department && s.department.toLowerCase().includes(department.toLowerCase()));
    }

    if (search) {
      const q = search.trim().toLowerCase();
      staffList = staffList.filter(s =>
        (s.employee_id && s.employee_id.toLowerCase().includes(q)) ||
        (s.first_name && s.first_name.toLowerCase().includes(q)) ||
        (s.last_name && s.last_name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.license_number && s.license_number.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: staffList.length,
      data: staffList
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/staff/stats
 * Aggregate KPIs for dashboard cards
 */
async function getStaffStats(req, res, next) {
  try {
    const [staffRes, shiftRes, leaveRes] = await Promise.all([
      query('SELECT * FROM staff_members'),
      query('SELECT * FROM staff_shifts'),
      query('SELECT * FROM staff_leave_requests')
    ]);

    const allStaff = staffRes.rows || [];
    const totalStaff = allStaff.length;
    const activeStaff = allStaff.filter(s => s.employment_status === 'ACTIVE').length;
    const activeDrivers = allStaff.filter(s => s.staff_type === 'DRIVER' && s.employment_status === 'ACTIVE').length;
    const onLeaveToday = allStaff.filter(s => s.employment_status === 'ON_LEAVE').length;

    const pendingLeaves = (leaveRes.rows || []).filter(l => l.request_status === 'PENDING').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysShifts = (shiftRes.rows || []).filter(sh => (sh.shift_date || '').startsWith(todayStr) || (sh.shift_date || '').startsWith('2025-01-20')).length;

    // Calculate ratings
    const drivers = allStaff.filter(s => s.staff_type === 'DRIVER');
    const avgSafety = drivers.length > 0
      ? (drivers.reduce((acc, d) => acc + parseFloat(d.safety_rating || 5.0), 0) / drivers.length).toFixed(2)
      : '5.00';
    const avgPunctuality = drivers.length > 0
      ? (drivers.reduce((acc, d) => acc + parseFloat(d.punctuality_rating || 5.0), 0) / drivers.length).toFixed(2)
      : '5.00';

    res.json({
      success: true,
      data: {
        total_staff: totalStaff,
        active_staff: activeStaff,
        active_drivers: activeDrivers,
        on_leave_today: onLeaveToday,
        pending_leaves: pendingLeaves,
        todays_shifts: todaysShifts,
        avg_safety_rating: avgSafety,
        avg_punctuality_rating: avgPunctuality
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/staff/roles
 * List system & custom roles
 */
async function getStaffRoles(req, res, next) {
  try {
    const result = await query('SELECT * FROM staff_roles ORDER BY role_name ASC');
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
 * GET /api/staff/:id
 */
async function getStaffById(req, res, next) {
  try {
    const { id } = req.params;
    const staffRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [id]);
    if (staffRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Staff member with identifier '${id}' not found in college transport registry.`
      });
    }

    const staff = staffRes.rows[0];

    // Sub-resources
    const [shiftsRes, leavesRes, perfRes, salaryRes] = await Promise.all([
      query('SELECT * FROM staff_shifts WHERE staff_id = $1 ORDER BY shift_date DESC', [id]),
      query('SELECT * FROM staff_leave_requests WHERE staff_id = $1 ORDER BY leave_start_date DESC', [id]),
      query('SELECT * FROM staff_performance_log WHERE staff_id = $1 ORDER BY log_date DESC', [id]),
      query('SELECT * FROM staff_salary_structure WHERE staff_id = $1', [id])
    ]);

    res.json({
      success: true,
      data: {
        ...staff,
        shifts: shiftsRes.rows || [],
        leaves: leavesRes.rows || [],
        performance: perfRes.rows || [],
        salary: salaryRes.rows[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/staff
 * Create staff member (ADMIN or TRANSPORT_STAFF)
 */
async function createStaff(req, res, next) {
  try {
    const {
      staff_type = 'DRIVER',
      employee_id,
      first_name,
      last_name,
      email,
      phone,
      emergency_contact_name,
      emergency_contact_phone,
      date_of_birth,
      gender = 'M',
      address,
      city = 'Karur',
      postal_code = '639111',
      aadhar_number,
      pan_number,
      role_id,
      department = 'Transport',
      designation,
      employment_status = 'ACTIVE',
      hire_date = new Date().toISOString().split('T')[0],
      username,
      license_number,
      license_expiry,
      license_category = 'Heavy Vehicle (HMV)',
      license_holder_name,
      assigned_bus_id,
      notes
    } = req.body;

    if (!employee_id || !first_name || !last_name || !email) {
      return res.status(400).json({
        error: 'VALIDATION_FAILED',
        message: 'Employee ID, first name, last name, and institutional email are required.'
      });
    }

    if (!email.toLowerCase().endsWith('@vsb.ac.in')) {
      return res.status(400).json({
        error: 'INVALID_EMAIL_DOMAIN',
        message: 'Staff institutional email must belong to the @vsb.ac.in domain.'
      });
    }

    if (staff_type === 'DRIVER') {
      if (!license_number) {
        return res.status(400).json({
          error: 'MISSING_LICENSE',
          message: 'Heavy motor vehicle driver license number is mandatory for driver personnel.'
        });
      }
      if (license_expiry && new Date(license_expiry) < new Date()) {
        return res.status(400).json({
          error: 'EXPIRED_LICENSE',
          message: 'Driver license expiry date must be in the future.'
        });
      }
    }

    // Check duplicate employee_id or email
    const existing = await query('SELECT * FROM staff_members');
    const duplicate = (existing.rows || []).find(s =>
      s.employee_id.toLowerCase() === employee_id.trim().toLowerCase() ||
      s.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (duplicate) {
      return res.status(409).json({
        error: 'DUPLICATE_STAFF',
        message: `A staff member with employee ID '${employee_id}' or email '${email}' is already registered.`
      });
    }

    const insertSql = `
      INSERT INTO staff_members (
        staff_type, employee_id, first_name, last_name, email, phone,
        emergency_contact_name, emergency_contact_phone, date_of_birth, gender,
        address, city, postal_code, aadhar_number, pan_number, role_id,
        department, designation, employment_status, hire_date, username,
        license_number, license_expiry, license_category, license_holder_name,
        assigned_bus_id, notes, safety_rating, punctuality_rating, student_satisfaction
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *
    `;

    const params = [
      staff_type.toUpperCase(),
      employee_id.trim().toUpperCase(),
      first_name.trim(),
      last_name.trim(),
      email.trim().toLowerCase(),
      phone || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      date_of_birth || null,
      gender,
      address || null,
      city,
      postal_code,
      aadhar_number || null,
      pan_number || null,
      role_id || null,
      department,
      designation || (staff_type === 'DRIVER' ? 'Senior Bus Driver' : staff_type === 'BUS_IN_CHARGE' ? 'Faculty Bus In-Charge' : 'Operations Officer'),
      employment_status.toUpperCase(),
      hire_date,
      username || employee_id.toLowerCase().replace(/[^a-z0-9]/g, ''),
      license_number || null,
      license_expiry || null,
      license_category || null,
      license_holder_name || `${first_name} ${last_name}`,
      assigned_bus_id || null,
      notes || null,
      5.00,
      5.00,
      5.00
    ];

    const result = await query(insertSql, params);
    res.status(201).json({
      success: true,
      message: 'Staff member profile registered successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/staff/:id
 * Update staff member
 */
async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const existingRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Staff member with ID '${id}' not found.`
      });
    }

    const current = existingRes.rows[0];
    const {
      first_name = current.first_name,
      last_name = current.last_name,
      email = current.email,
      phone = current.phone,
      emergency_contact_name = current.emergency_contact_name,
      emergency_contact_phone = current.emergency_contact_phone,
      staff_type = current.staff_type,
      department = current.department,
      designation = current.designation,
      employment_status = current.employment_status,
      assigned_bus_id = current.assigned_bus_id,
      license_number = current.license_number,
      license_expiry = current.license_expiry,
      license_category = current.license_category,
      address = current.address,
      notes = current.notes,
      safety_rating = current.safety_rating,
      punctuality_rating = current.punctuality_rating,
      student_satisfaction = current.student_satisfaction
    } = req.body;

    const updateSql = `
      UPDATE staff_members SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        emergency_contact_name = $5,
        emergency_contact_phone = $6,
        staff_type = $7,
        department = $8,
        designation = $9,
        employment_status = $10,
        assigned_bus_id = $11,
        license_number = $12,
        license_expiry = $13,
        license_category = $14,
        address = $15,
        notes = $16,
        safety_rating = $17,
        punctuality_rating = $18,
        student_satisfaction = $19
      WHERE staff_id = $20
      RETURNING *
    `;

    const params = [
      first_name,
      last_name,
      email,
      phone,
      emergency_contact_name,
      emergency_contact_phone,
      staff_type,
      department,
      designation,
      employment_status,
      assigned_bus_id,
      license_number,
      license_expiry,
      license_category,
      address,
      notes,
      safety_rating,
      punctuality_rating,
      student_satisfaction,
      id
    ];

    const result = await query(updateSql, params);
    res.json({
      success: true,
      message: 'Staff member record updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/staff/:id
 * Remove or soft-delete staff member
 */
async function deleteStaff(req, res, next) {
  try {
    const { id } = req.params;
    const existingRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Staff member with ID '${id}' not found.`
      });
    }

    await query('DELETE FROM staff_members WHERE staff_id = $1', [id]);

    res.json({
      success: true,
      message: 'Staff member record removed from active directory.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/staff/:id/metrics
 * Calculate safety, punctuality, and satisfaction ratings
 */
async function getStaffMetrics(req, res, next) {
  try {
    const { id } = req.params;
    const staffRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [id]);
    if (staffRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Staff member with ID '${id}' not found.`
      });
    }

    const staff = staffRes.rows[0];
    const perfLogs = await query('SELECT * FROM staff_performance_log WHERE staff_id = $1', [id]);
    const logs = perfLogs.rows || [];

    const incidents = logs.filter(l => l.log_type === 'INCIDENT');
    const complaints = logs.filter(l => l.log_type === 'COMPLAINT');
    const commendations = logs.filter(l => l.log_type === 'COMMENDATION');
    const feedbacks = logs.filter(l => l.log_type === 'FEEDBACK');

    const avgSafety = feedbacks.length > 0 && feedbacks.some(f => f.safety_score)
      ? (feedbacks.filter(f => f.safety_score).reduce((acc, f) => acc + parseFloat(f.safety_score), 0) / feedbacks.filter(f => f.safety_score).length).toFixed(2)
      : staff.safety_rating || 5.00;

    const avgPunctuality = feedbacks.length > 0 && feedbacks.some(f => f.punctuality_score)
      ? (feedbacks.filter(f => f.punctuality_score).reduce((acc, f) => acc + parseFloat(f.punctuality_score), 0) / feedbacks.filter(f => f.punctuality_score).length).toFixed(2)
      : staff.punctuality_rating || 5.00;

    res.json({
      success: true,
      data: {
        staff_id: id,
        staff_name: staff.full_name || `${staff.first_name} ${staff.last_name}`,
        employee_id: staff.employee_id,
        safety_rating: parseFloat(avgSafety),
        punctuality_rating: parseFloat(avgPunctuality),
        student_satisfaction: parseFloat(staff.student_satisfaction || 5.00),
        total_incidents: incidents.length,
        total_complaints: complaints.length,
        total_commendations: commendations.length,
        total_feedbacks: feedbacks.length,
        recent_logs: logs.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllStaff,
  getStaffStats,
  getStaffRoles,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffMetrics
};
