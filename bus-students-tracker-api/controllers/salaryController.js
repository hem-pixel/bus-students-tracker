const { query } = require('../config/database');

/**
 * GET /api/salary
 * Get all salary records (ADMIN / TRANSPORT_STAFF)
 */
async function getAllSalaries(req, res, next) {
  try {
    const result = await query('SELECT * FROM staff_salary_structure ORDER BY effective_date DESC');
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
 * GET /api/staff/:id/salary
 * Get salary details for a specific staff member
 */
async function getStaffSalary(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM staff_salary_structure WHERE staff_id = $1 ORDER BY effective_date DESC LIMIT 1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Salary structure record for staff ID '${id}' not found.`
      });
    }

    const salary = result.rows[0];
    const totalGross = parseFloat(salary.total_monthly_salary) || 0;
    const pf = parseFloat(salary.provident_fund) || 0;
    const tax = parseFloat(salary.income_tax) || 0;
    const netSalary = (totalGross - (pf + tax)).toFixed(2);

    res.json({
      success: true,
      data: {
        ...salary,
        net_monthly_salary: parseFloat(netSalary)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/staff/:id/salary
 * Create or update salary structure (ADMIN only)
 */
async function updateStaffSalary(req, res, next) {
  try {
    const { id } = req.params;
    const {
      base_salary = 0,
      dearness_allowance = 0,
      house_rent_allowance = 0,
      conveyance_allowance = 0,
      medical_allowance = 0,
      performance_bonus = 0,
      provident_fund = 0,
      income_tax = 0,
      salary_status = 'ACTIVE',
      effective_date = new Date().toISOString().split('T')[0]
    } = req.body;

    // Verify staff exists
    const staffRes = await query('SELECT * FROM staff_members WHERE staff_id = $1', [id]);
    if (staffRes.rows.length === 0) {
      return res.status(404).json({
        error: 'STAFF_NOT_FOUND',
        message: `Staff member with ID '${id}' does not exist.`
      });
    }

    const base = parseFloat(base_salary) || 0;
    const da = parseFloat(dearness_allowance) || 0;
    const hra = parseFloat(house_rent_allowance) || 0;
    const ca = parseFloat(conveyance_allowance) || 0;
    const med = parseFloat(medical_allowance) || 0;
    const bonus = parseFloat(performance_bonus) || 0;

    const totalMonthly = (base + da + hra + ca + med + bonus).toFixed(2);

    // Check if salary record already exists
    const existRes = await query('SELECT * FROM staff_salary_structure WHERE staff_id = $1', [id]);

    let savedSalary;
    if (existRes.rows.length > 0) {
      const updateRes = await query(
        `UPDATE staff_salary_structure SET
          base_salary = $1,
          dearness_allowance = $2,
          house_rent_allowance = $3,
          conveyance_allowance = $4,
          medical_allowance = $5,
          performance_bonus = $6,
          total_monthly_salary = $7,
          provident_fund = $8,
          income_tax = $9,
          salary_status = $10,
          effective_date = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE staff_id = $12
        RETURNING *`,
        [
          base,
          da,
          hra,
          ca,
          med,
          bonus,
          totalMonthly,
          provident_fund,
          income_tax,
          salary_status,
          effective_date,
          id
        ]
      );
      savedSalary = updateRes.rows[0];
    } else {
      const insertRes = await query(
        `INSERT INTO staff_salary_structure (
          staff_id, base_salary, dearness_allowance, house_rent_allowance,
          conveyance_allowance, medical_allowance, performance_bonus,
          total_monthly_salary, provident_fund, income_tax, salary_status, effective_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          id,
          base,
          da,
          hra,
          ca,
          med,
          bonus,
          totalMonthly,
          provident_fund,
          income_tax,
          salary_status,
          effective_date
        ]
      );
      savedSalary = insertRes.rows[0];
    }

    const pf = parseFloat(savedSalary.provident_fund) || 0;
    const tax = parseFloat(savedSalary.income_tax) || 0;
    const netSalary = (parseFloat(savedSalary.total_monthly_salary) - (pf + tax)).toFixed(2);

    res.json({
      success: true,
      message: 'Staff salary structure configured successfully.',
      data: {
        ...savedSalary,
        net_monthly_salary: parseFloat(netSalary)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllSalaries,
  getStaffSalary,
  updateStaffSalary
};
