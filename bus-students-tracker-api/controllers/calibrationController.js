const { query } = require('../config/database');

/**
 * GET /api/camera-calibration/camera/:cameraId
 * GET /api/camera-calibration/:id
 * GET /api/camera-calibration
 * Calibration history for a camera or all calibrations
 */
async function getCalibrationHistory(req, res, next) {
  try {
    const targetId = req.params.cameraId || req.params.id;
    let sql = `
      SELECT cal.*, c.camera_name, c.camera_type, b.bus_number
      FROM camera_calibration cal
      LEFT JOIN cameras c ON cal.camera_id = c.camera_id
      LEFT JOIN buses b ON c.bus_id = b.bus_id
    `;
    let params = [];
    if (targetId) {
      sql += ` WHERE cal.camera_id = $1`;
      params = [targetId];
    }
    sql += ` ORDER BY cal.calibration_date DESC`;
    let result = await query(sql, params);

    // If targetId was passed and not found by camera_id, check if it's a calibration_id
    if (targetId && result.rows.length === 0) {
      const altSql = `
        SELECT cal.*, c.camera_name, c.camera_type, b.bus_number
        FROM camera_calibration cal
        LEFT JOIN cameras c ON cal.camera_id = c.camera_id
        LEFT JOIN buses b ON c.bus_id = b.bus_id
        WHERE cal.calibration_id = $1
        ORDER BY cal.calibration_date DESC
      `;
      result = await query(altSql, [targetId]);
    }

    const rows = result.rows.map(r => ({
      ...r,
      id: r.id || r.calibration_id,
      verification_status: r.verification_status || (r.is_verified ? 'VERIFIED' : 'PENDING')
    }));

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
 * POST /api/camera-calibration
 * Calibrates camera sensor and positioning
 */
async function createCalibration(req, res, next) {
  try {
    const {
      camera_id,
      pitch_degrees,
      angle_pitch,
      yaw_degrees,
      angle_yaw,
      roll_degrees,
      angle_roll,
      pan_angle,
      pan,
      tilt_angle,
      tilt,
      zoom_level,
      zoom,
      installation_height_meters,
      distance_to_door_meters,
      target_face_bbox_x,
      face_box_x_min,
      target_face_bbox_y,
      face_box_y_min,
      target_face_bbox_width,
      face_box_x_max,
      target_face_bbox_height,
      face_box_y_max,
      lighting_lux,
      reference_image_url,
      calibration_image_url,
      calibration_notes,
      notes
    } = req.body;

    const calibrated_by = req.body.calibrated_by || req.user?.username || req.user?.id || 'transport_tech';

    if (!camera_id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'camera_id is required for calibration.'
      });
    }

    const camCheck = await query('SELECT * FROM cameras WHERE camera_id = $1', [camera_id]);
    if (camCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Camera unit '${camera_id}' not found.`
      });
    }

    const pPitch = angle_pitch !== undefined ? angle_pitch : (pitch_degrees !== undefined ? pitch_degrees : 0.0);
    const pYaw = angle_yaw !== undefined ? angle_yaw : (yaw_degrees !== undefined ? yaw_degrees : 0.0);
    const pRoll = angle_roll !== undefined ? angle_roll : (roll_degrees !== undefined ? roll_degrees : 0.0);
    const pPan = pan !== undefined ? pan : (pan_angle !== undefined ? pan_angle : 0.0);
    const pTilt = tilt !== undefined ? tilt : (tilt_angle !== undefined ? tilt_angle : -15.0);
    const pZoom = zoom !== undefined ? zoom : (zoom_level !== undefined ? zoom_level : 1.0);
    const pNotes = notes || calibration_notes || 'Standard entry gate facial alignment complete.';
    const pImageUrl = calibration_image_url || reference_image_url || null;

    const pBboxX = face_box_x_min !== undefined ? face_box_x_min : (target_face_bbox_x !== undefined ? target_face_bbox_x : 320);
    const pBboxY = face_box_y_min !== undefined ? face_box_y_min : (target_face_bbox_y !== undefined ? target_face_bbox_y : 180);
    const pBboxW = face_box_x_max !== undefined ? face_box_x_max : (target_face_bbox_width !== undefined ? target_face_bbox_width : 640);
    const pBboxH = face_box_y_max !== undefined ? face_box_y_max : (target_face_bbox_height !== undefined ? target_face_bbox_height : 720);

    const sql = `
      INSERT INTO camera_calibration (
        camera_id, pitch_degrees, yaw_degrees, roll_degrees,
        pan_angle, tilt_angle, zoom_level,
        installation_height_meters, distance_to_door_meters,
        target_face_bbox_x, target_face_bbox_y,
        target_face_bbox_width, target_face_bbox_height,
        lighting_lux, reference_image_url, calibration_notes,
        calibrated_by, is_verified, calibration_date
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9,
        $10, $11,
        $12, $13,
        $14, $15, $16,
        $17, false, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const params = [
      camera_id,
      parseFloat(pPitch),
      parseFloat(pYaw),
      parseFloat(pRoll),
      parseFloat(pPan),
      parseFloat(pTilt),
      parseFloat(pZoom),
      installation_height_meters !== undefined ? parseFloat(installation_height_meters) : 2.1,
      distance_to_door_meters !== undefined ? parseFloat(distance_to_door_meters) : 1.8,
      parseInt(pBboxX, 10),
      parseInt(pBboxY, 10),
      parseInt(pBboxW, 10),
      parseInt(pBboxH, 10),
      lighting_lux !== undefined ? parseFloat(lighting_lux) : 450.0,
      pImageUrl,
      pNotes,
      calibrated_by
    ];

    const result = await query(sql, params);

    // Update camera calibration_status
    await query(`
      UPDATE cameras 
      SET calibration_status = 'CALIBRATED',
          updated_at = CURRENT_TIMESTAMP 
      WHERE camera_id = $1
    `, [camera_id]);

    const created = result.rows[0];
    const data = {
      ...created,
      id: created.id || created.calibration_id,
      verification_status: 'PENDING'
    };

    res.status(201).json({
      success: true,
      message: 'Camera sensor optical and geometric calibration profile saved.',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/camera-calibration/:id/verify
 * Confirms and locks calibration
 */
async function verifyCalibration(req, res, next) {
  try {
    const { id } = req.params;
    const verified_by = req.body?.verified_by || req.user?.username || req.user?.id || 'admin';

    const existing = await query('SELECT * FROM camera_calibration WHERE calibration_id = $1 OR id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Calibration profile '${id}' not found.`
      });
    }

    const realId = existing.rows[0].calibration_id || existing.rows[0].id;

    const sql = `
      UPDATE camera_calibration
      SET 
        is_verified = true,
        verified_by = $1,
        verified_at = CURRENT_TIMESTAMP
      WHERE calibration_id = $2
      RETURNING *
    `;

    const result = await query(sql, [verified_by, realId]);
    const updated = result.rows[0];
    const data = {
      ...updated,
      id: updated.id || updated.calibration_id,
      verification_status: 'VERIFIED'
    };

    res.json({
      success: true,
      message: 'Calibration profile verified and locked for deployment.',
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCalibrationHistory,
  createCalibration,
  verifyCalibration
};
