const { query } = require('../config/database');

/**
 * GET /api/attendance
 * Optional filters: bus_id, student_id, date, verification_result, recognition_status
 */
async function getAttendanceLogs(req, res, next) {
  try {
    const { bus_id, student_id, date, verification_result, recognition_status } = req.query;
    let sql = 'SELECT * FROM student_attendance_log';
    const conditions = [];
    const params = [];

    if (bus_id) {
      params.push(bus_id);
      conditions.push(`bus_id = $${params.length}`);
    }

    if (student_id) {
      params.push(student_id);
      conditions.push(`student_id = $${params.length}`);
    }

    if (verification_result) {
      params.push(verification_result.toUpperCase());
      conditions.push(`verification_result = $${params.length}`);
    }

    if (recognition_status) {
      params.push(recognition_status.toUpperCase());
      conditions.push(`recognition_status = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY boarding_time DESC';

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
 * GET /api/attendance/summary
 */
async function getAttendanceSummary(req, res, next) {
  try {
    const [totalLogRes, verifiedRes, manualRes, unverifiedRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM student_attendance_log'),
      query("SELECT COUNT(*) as count FROM student_attendance_log WHERE verification_result = 'VERIFIED'"),
      query("SELECT COUNT(*) as count FROM student_attendance_log WHERE recognition_status = 'MANUAL'"),
      query("SELECT COUNT(*) as count FROM student_attendance_log WHERE verification_result = 'UNVERIFIED'")
    ]);

    res.json({
      success: true,
      data: {
        total_logs: parseInt(totalLogRes.rows[0]?.count || 0, 10),
        verified_boardings: parseInt(verifiedRes.rows[0]?.count || 0, 10),
        manual_verifications: parseInt(manualRes.rows[0]?.count || 0, 10),
        unverified_boardings: parseInt(unverifiedRes.rows[0]?.count || 0, 10)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/attendance
 * Logs a vision edge verification event or manual check-in
 */
async function logAttendance(req, res, next) {
  try {
    const {
      student_id,
      bus_id,
      boarding_time = new Date().toISOString(),
      drop_time = null,
      boarding_stop_id = null,
      drop_stop_id = null,
      recognition_status = 'FACE_MATCH',
      verification_result = 'VERIFIED',
      camera_id = null,
      confidence_score = 0.95,
      notes = ''
    } = req.body;

    if (!student_id || !bus_id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'student_id and bus_id are mandatory to register an attendance event.'
      });
    }

    const insertSql = `
      INSERT INTO student_attendance_log (
        student_id, bus_id, boarding_time, drop_time,
        boarding_stop_id, drop_stop_id, recognition_status,
        verification_result, camera_id, confidence_score, notes
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10, $11
      ) RETURNING *
    `;

    const params = [
      student_id,
      bus_id,
      boarding_time,
      drop_time,
      boarding_stop_id,
      drop_stop_id,
      recognition_status,
      verification_result,
      camera_id,
      parseFloat(confidence_score) || 0.95,
      notes
    ];

    const result = await query(insertSql, params);

    res.status(201).json({
      success: true,
      message: 'Student attendance logged and verified.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAttendanceLogs,
  getAttendanceSummary,
  logAttendance
};
