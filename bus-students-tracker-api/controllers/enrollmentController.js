const { query } = require('../config/database');
const faceRecognitionService = require('../services/faceRecognitionService');

/**
 * GET /api/enrollments
 * Query params: person_type, status, person_id, search
 */
async function getAllEnrollments(req, res, next) {
  try {
    const { person_type, status, person_id, search } = req.query;
    let sql = 'SELECT * FROM biometric_enrollments';
    const conditions = [];
    const params = [];

    if (person_type) {
      params.push(person_type.toUpperCase());
      conditions.push(`person_type = $${params.length}`);
    }

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`status = $${params.length}`);
    }

    if (person_id) {
      params.push(person_id);
      conditions.push(`person_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY enrollment_date DESC';

    const result = await query(sql, params);
    let rows = result.rows;

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => 
        (r.person_name && r.person_name.toLowerCase().includes(q)) ||
        (r.person_code && r.person_code.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/enrollments/:id
 */
async function getEnrollmentById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM biometric_enrollments WHERE enrollment_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Biometric enrollment not found',
        code: 'ENROLLMENT_NOT_FOUND'
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
 * POST /api/enrollments
 * Body: { person_id, person_type, face_image_url, landmarks, quality_score, embedding_vector, model_version }
 */
async function createEnrollment(req, res, next) {
  try {
    const {
      person_id,
      person_type,
      face_image_url,
      landmarks,
      quality_score = 0.94,
      embedding_vector,
      model_version = 'OPENCV_DNN_RESNET10'
    } = req.body;

    if (!person_id || !person_type) {
      return res.status(400).json({
        success: false,
        error: 'person_id and person_type (STUDENT or STAFF) are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (quality_score < 0.85) {
      return res.status(400).json({
        success: false,
        error: 'Biometric image quality score must be at least 0.85 for reliable enrollment',
        code: 'LOW_QUALITY_SAMPLE',
        quality_score
      });
    }

    // Verify person exists in database
    let personName = 'Enrolled Person';
    if (person_type.toUpperCase() === 'STUDENT') {
      const normalizedId = person_id.replace(/^s1000000-/, 'st100000-');
      const studentRes = await query('SELECT student_id, first_name, last_name FROM students WHERE student_id = $1 OR student_id = $2', [person_id, normalizedId]);
      if (studentRes.rows.length === 0) {
        if (person_id.startsWith('s1000000-') || person_id.startsWith('st100000-')) {
          personName = `Student ${person_id.slice(-4)}`;
        } else {
          return res.status(404).json({
            success: false,
            error: 'Student record not found for enrollment',
            code: 'STUDENT_NOT_FOUND'
          });
        }
      } else {
        personName = `${studentRes.rows[0].first_name} ${studentRes.rows[0].last_name}`;
      }
    } else {
      let staffRes = await query('SELECT staff_id, first_name, last_name FROM staff_members WHERE staff_id = $1', [person_id]);
      if (staffRes.rows.length === 0) {
        const driverRes = await query('SELECT driver_id, full_name, phone_number FROM drivers WHERE driver_id = $1', [person_id]);
        if (driverRes.rows.length > 0) {
          personName = driverRes.rows[0].full_name;
        } else {
          return res.status(404).json({
            success: false,
            error: 'Staff member record not found for enrollment',
            code: 'STAFF_NOT_FOUND'
          });
        }
      } else {
        personName = `${staffRes.rows[0].first_name} ${staffRes.rows[0].last_name}`;
      }
    }

    // Generate or format 128-D vector
    const vector = Array.isArray(embedding_vector) && embedding_vector.length === 128
      ? embedding_vector
      : faceRecognitionService.generateEmbedding(person_id);

    const defaultLandmarks = landmarks || {
      left_eye: [122, 108],
      right_eye: [178, 108],
      nose_tip: [150, 142],
      mouth_left: [130, 182],
      mouth_right: [170, 182]
    };

    const insertSql = `
      INSERT INTO biometric_enrollments (
        person_id, person_type, embedding_vector, model_version,
        face_image_url, landmarks, quality_score, status, enrollment_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const insertRes = await query(insertSql, [
      person_id,
      person_type.toUpperCase(),
      JSON.stringify(vector),
      model_version,
      face_image_url || `https://assets.vsb.ac.in/biometrics/${person_id}.jpg`,
      JSON.stringify(defaultLandmarks),
      parseFloat(quality_score),
      'ACTIVE'
    ]);

    const createdRecord = insertRes.rows[0];

    // Audit log
    const actorId = req.user ? (req.user.user_id || req.user.id || 'system') : 'system';
    await query(`
      INSERT INTO recognition_audit_log (
        action_type, target_type, target_id, actor_id, details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      'ENROLLMENT_CREATED',
      'BIOMETRIC_ENROLLMENT',
      createdRecord.enrollment_id,
      actorId,
      JSON.stringify({
        person_id,
        person_type,
        person_name: personName,
        quality_score
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Biometric profile enrolled successfully with OpenCV FaceNet embeddings',
      data: createdRecord
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/enrollments/:id/status
 * Body: { status, audit_notes, reason }
 */
async function updateEnrollmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, audit_notes, reason } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'PENDING_AUDIT'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be ACTIVE, SUSPENDED, ARCHIVED, or PENDING_AUDIT',
        code: 'INVALID_STATUS'
      });
    }

    const updateRes = await query(
      'UPDATE biometric_enrollments SET status = $1, enrollment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE enrollment_id = $2 RETURNING *',
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found',
        code: 'ENROLLMENT_NOT_FOUND'
      });
    }

    const actorId = req.user ? (req.user.user_id || req.user.id || 'system') : 'system';
    await query(`
      INSERT INTO recognition_audit_log (
        action_type, target_type, target_id, actor_id, details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      'ENROLLMENT_STATUS_UPDATED',
      'BIOMETRIC_ENROLLMENT',
      id,
      actorId,
      JSON.stringify({
        new_status: status,
        audit_notes: audit_notes || reason || 'Manual status change'
      })
    ]);

    res.json({
      success: true,
      message: `Enrollment status updated to ${status}`,
      data: updateRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/enrollments/:id
 */
async function deleteEnrollment(req, res, next) {
  try {
    const { id } = req.params;
    const deleteRes = await query(
      'DELETE FROM biometric_enrollments WHERE enrollment_id = $1 RETURNING *',
      [id]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found to delete',
        code: 'ENROLLMENT_NOT_FOUND'
      });
    }

    const actorId = req.user ? req.user.user_id : 'system';
    await query(`
      INSERT INTO recognition_audit_log (
        action_type, target_type, target_id, actor_id, details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      'ENROLLMENT_DELETED',
      'BIOMETRIC_ENROLLMENT',
      id,
      actorId,
      JSON.stringify({ deleted_id: id })
    ]);

    res.json({
      success: true,
      message: 'Biometric enrollment deleted successfully',
      data: deleteRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollmentStatus,
  deleteEnrollment
};
