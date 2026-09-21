const { query } = require('../config/database');
const faceRecognitionService = require('../services/faceRecognitionService');

/**
 * POST /api/verification/verify-driver
 * Pre-dispatch driver biometric verification linked to scheduled shift
 * Body: {
 *   bus_id,
 *   shift_id,
 *   camera_id,
 *   driver_face_seed, // e.g. 'MATCH', 'MISMATCH', or custom seed
 *   query_embedding,  // optional custom 128-D vector
 *   liveness_checks   // optional { blink_detected, micro_pose_variance, texture_sharpness, frequency_fourier_ratio }
 * }
 */
async function verifyDriverPreDispatch(req, res, next) {
  try {
    const {
      bus_id,
      shift_id,
      camera_id,
      driver_face_seed = 'MATCH',
      query_embedding,
      liveness_checks = {
        blink_detected: true,
        micro_pose_variance: 0.12,
        texture_sharpness: 142.5,
        frequency_fourier_ratio: 0.88
      }
    } = req.body;

    if (!bus_id) {
      return res.status(400).json({
        success: false,
        error: 'bus_id is required for pre-dispatch driver verification',
        code: 'MISSING_BUS_ID'
      });
    }

    // 1. Fetch Bus and Scheduled Shift
    const busRes = await query('SELECT * FROM buses WHERE bus_id = $1', [bus_id]);
    if (busRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Target bus not found',
        code: 'BUS_NOT_FOUND'
      });
    }
    const bus = busRes.rows[0];

    // Find active or scheduled shift for this bus
    let shift = null;
    if (shift_id) {
      const shiftRes = await query('SELECT * FROM staff_shifts WHERE shift_id = $1', [shift_id]);
      if (shiftRes.rows.length > 0) shift = shiftRes.rows[0];
    }
    if (!shift) {
      const activeShiftRes = await query(
        "SELECT * FROM staff_shifts WHERE bus_id = $1 AND (status = 'SCHEDULED' OR status = 'ACTIVE' OR shift_status = 'SCHEDULED' OR shift_status = 'ACTIVE') ORDER BY scheduled_start_time ASC LIMIT 1",
        [bus_id]
      );
      if (activeShiftRes.rows.length > 0) shift = activeShiftRes.rows[0];
    }

    if (shift && !shift.staff_name && shift.staff_id) {
      const smRes = await query("SELECT first_name, last_name FROM staff_members WHERE staff_id = $1", [shift.staff_id]);
      if (smRes.rows.length > 0) {
        shift.staff_name = `${smRes.rows[0].first_name} ${smRes.rows[0].last_name}`;
      } else {
        const drvRes = await query("SELECT full_name FROM drivers WHERE driver_id = $1", [shift.staff_id]);
        if (drvRes.rows.length > 0) shift.staff_name = drvRes.rows[0].full_name;
      }
    }

    const scheduledStaffId = shift ? shift.staff_id : null;
    let scheduledDriverName = shift ? shift.staff_name : 'No Scheduled Driver';

    if (!scheduledStaffId) {
      return res.status(400).json({
        success: false,
        error: 'No active or scheduled driver shift found for this bus',
        code: 'NO_SCHEDULED_SHIFT'
      });
    }

    // 2. Resolve Cabin Camera
    let effectiveCameraId = camera_id;
    if (!effectiveCameraId) {
      const cabinCamRes = await query(
        "SELECT * FROM cameras WHERE bus_id = $1 AND (camera_type = 'CABIN_ENTRY' OR location_type = 'CABIN') LIMIT 1",
        [bus_id]
      );
      if (cabinCamRes.rows.length > 0) {
        effectiveCameraId = cabinCamRes.rows[0].camera_id;
      } else {
        const anyCamRes = await query('SELECT camera_id FROM cameras WHERE bus_id = $1 LIMIT 1', [bus_id]);
        effectiveCameraId = anyCamRes.rows.length > 0 ? anyCamRes.rows[0].camera_id : 'c1000000-0000-0000-0000-000000000003';
      }
    }

    // 3. Prepare Query Face Embedding
    let queryVector;
    if (Array.isArray(query_embedding) && query_embedding.length === 128) {
      queryVector = query_embedding;
    } else if (driver_face_seed === 'MATCH') {
      // Create high-similarity embedding matching scheduled driver
      queryVector = faceRecognitionService.generateEmbedding(scheduledStaffId);
    } else if (driver_face_seed === 'MISMATCH') {
      // Create embedding of an unauthorized person
      queryVector = faceRecognitionService.generateEmbedding('unauthorized_impostor_driver_99');
    } else {
      queryVector = faceRecognitionService.generateEmbedding(driver_face_seed);
    }

    // 4. Retrieve Active Biometric Enrollments
    const enrollmentsRes = await query(
      "SELECT * FROM biometric_enrollments WHERE (status = 'ACTIVE' OR enrollment_status = 'ACTIVE') AND (person_type = 'STAFF' OR person_type = 'DRIVER')"
    );
    const staffEnrollments = enrollmentsRes.rows;

    // 5. Match with OpenCV FaceNet Engine
    const bestMatch = faceRecognitionService.findBestMatch(queryVector, staffEnrollments, 'STAFF');
    const liveness = faceRecognitionService.assessLiveness(liveness_checks);

    // 6. Pre-Dispatch Clearance Decision Logic
    const isShiftDriverMatch = bestMatch.matched_person_id === scheduledStaffId;
    const meetsConfidenceThreshold = bestMatch.confidence_score >= 90.0;
    const isLivenessVerified = liveness.liveness_status === 'LIVE';

    let clearanceStatus;
    let dispatchAllowed;
    let clearanceReason;

    if (isShiftDriverMatch && meetsConfidenceThreshold && isLivenessVerified) {
      clearanceStatus = 'APPROVED';
      dispatchAllowed = true;
      clearanceReason = `Biometrics verified for scheduled driver ${scheduledDriverName} (Confidence: ${bestMatch.confidence_score}%, Liveness: LIVE)`;
    } else if (!isShiftDriverMatch) {
      clearanceStatus = 'BLOCKED';
      dispatchAllowed = false;
      clearanceReason = `Unscheduled or unrecognized driver detected in cabin. Expected: ${scheduledDriverName}, Detected: ${bestMatch.person_name || 'Unknown'}`;
    } else if (!meetsConfidenceThreshold) {
      clearanceStatus = 'REQUIRES_OVERRIDE';
      dispatchAllowed = false;
      clearanceReason = `Confidence score (${bestMatch.confidence_score}%) below standard 90.0% dispatch threshold. Manual override required.`;
    } else {
      clearanceStatus = 'BLOCKED';
      dispatchAllowed = false;
      clearanceReason = `Liveness verification failure (${liveness.liveness_status}). Anti-spoofing alert triggered.`;
    }

    // 7. Save Recognition Result
    const boundingBox = [68, 85, 238, 222];
    const landmarks = {
      left_eye: [122, 108],
      right_eye: [178, 108],
      nose_tip: [150, 142],
      mouth_left: [130, 182],
      mouth_right: [170, 182]
    };

    const insertResultRes = await query(`
      INSERT INTO recognition_results (
        camera_id, bus_id, matched_person_id, matched_person_name,
        person_type, euclidean_distance, cosine_similarity, confidence_score,
        match_status, liveness_status, bounding_box, landmarks,
        captured_frame_url, recognition_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      effectiveCameraId,
      bus_id,
      bestMatch.matched_person_id,
      bestMatch.person_name || 'Cabin Driver Candidate',
      'STAFF',
      bestMatch.distance,
      bestMatch.cosine_similarity,
      bestMatch.confidence_score,
      bestMatch.decision,
      liveness.liveness_status,
      JSON.stringify(boundingBox),
      JSON.stringify(landmarks),
      `https://stream.vsb.ac.in/frames/${effectiveCameraId}_${Date.now()}.jpg`
    ]);

    const savedResult = insertResultRes.rows[0];

    // 8. Generate Visual HUD Frame
    const hudFrameSvg = faceRecognitionService.generateHUDFrameSVG({
      cameraId: effectiveCameraId,
      busId: bus.bus_number,
      personName: bestMatch.person_name || scheduledDriverName,
      confidenceScore: bestMatch.confidence_score,
      decision: clearanceStatus === 'APPROVED' ? 'VERIFIED' : 'REJECTED',
      livenessStatus: liveness.liveness_status,
      boundingBox,
      landmarks
    });

    // 9. Log Audit Entry
    const actorId = req.user ? req.user.user_id : 'system';
    await query(`
      INSERT INTO recognition_audit_log (
        action_type, target_type, target_id, actor_id, details
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      dispatchAllowed ? 'DRIVER_VERIFICATION_APPROVED' : 'DRIVER_VERIFICATION_REJECTED',
      'BUS_DISPATCH',
      bus_id,
      actorId,
      JSON.stringify({
        shift_id: shift ? shift.shift_id : null,
        scheduled_staff_id: scheduledStaffId,
        detected_staff_id: bestMatch.matched_person_id,
        confidence_score: bestMatch.confidence_score,
        clearance_status: clearanceStatus,
        clearance_reason: clearanceReason
      })
    ]);

    res.json({
      success: true,
      message: `Driver pre-dispatch verification complete: ${clearanceStatus}`,
      data: {
        bus_id,
        bus_number: (bus.bus_number || '').replace(/^BUS-/, ''),
        registration_plate: bus.registration_plate,
        shift_id: shift ? shift.shift_id : null,
        scheduled_driver: {
          staff_id: scheduledStaffId,
          name: scheduledDriverName,
          phone: shift ? shift.phone : '',
          employee_id: shift ? shift.employee_id : ''
        },
        detected_driver: {
          staff_id: bestMatch.matched_person_id,
          name: bestMatch.person_name,
          confidence_score: bestMatch.confidence_score,
          match_status: bestMatch.decision,
          distance: bestMatch.distance,
          cosine_similarity: bestMatch.cosine_similarity
        },
        liveness: {
          ...liveness,
          is_live: liveness.liveness_status === 'LIVE'
        },
        clearance_status: clearanceStatus,
        verification_status: dispatchAllowed ? 'DISPATCH_ALLOWED' : (clearanceStatus === 'REQUIRES_OVERRIDE' ? 'REQUIRES_OVERRIDE' : 'DISPATCH_BLOCKED'),
        is_authorized: dispatchAllowed,
        dispatch_allowed: dispatchAllowed,
        clearance_reason: clearanceReason,
        verification_timestamp: new Date().toISOString(),
        result_id: savedResult ? savedResult.result_id : null,
        hud_frame_svg: hudFrameSvg
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/verification/override
 * Manual In-Charge or Admin pre-dispatch override
 * Body: { bus_id, shift_id, reason, override_reason, authorization_pin, notes }
 */
async function manualDispatchOverride(req, res, next) {
  try {
    const { bus_id, shift_id, reason, override_reason, authorization_pin, notes } = req.body;
    const reasonText = override_reason || reason;

    if (!bus_id || !reasonText || reasonText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'bus_id and a valid reason (minimum 5 characters) are required for manual override',
        code: 'INVALID_OVERRIDE_REQUEST'
      });
    }

    const busRes = await query('SELECT * FROM buses WHERE bus_id = $1', [bus_id]);
    if (busRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found',
        code: 'BUS_NOT_FOUND'
      });
    }
    const bus = busRes.rows[0];

    const actorId = req.user ? req.user.user_id : 'system';
    const actorRole = req.user ? req.user.role : 'ADMIN';

    // Insert into recognition audit log
    const auditRes = await query(`
      INSERT INTO recognition_audit_log (
        action_type, target_type, target_id, actor_id, details
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      'MANUAL_DISPATCH_OVERRIDE',
      'BUS_DISPATCH',
      bus_id,
      actorId,
      JSON.stringify({
        bus_id,
        bus_number: bus.bus_number,
        shift_id,
        authorized_by_role: actorRole,
        reason: reasonText.trim(),
        notes: notes || 'Supervisor authorized manual pre-dispatch clearance'
      })
    ]);

    res.json({
      success: true,
      message: `Manual dispatch override approved for Bus ${bus.bus_number}`,
      data: {
        bus_id,
        bus_number: (bus.bus_number || '').replace(/^BUS-/, ''),
        clearance_status: 'OVERRIDE_APPROVED',
        verification_status: 'OVERRIDDEN',
        dispatch_allowed: true,
        is_authorized: true,
        override_audit_id: auditRes.rows[0].audit_id,
        authorized_by: req.user ? req.user.email : 'transport.admin@vsb.ac.in',
        authorized_role: actorRole,
        reason: reasonText.trim(),
        authorization_timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/verification/status/:bus_id
 */
async function getBusVerificationStatus(req, res, next) {
  try {
    const { bus_id } = req.params;

    const busRes = await query('SELECT * FROM buses WHERE bus_id = $1', [bus_id]);
    if (busRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found',
        code: 'BUS_NOT_FOUND'
      });
    }
    const bus = busRes.rows[0];

    // Find latest cabin recognition result
    const latestRecRes = await query(
      'SELECT * FROM recognition_results WHERE bus_id = $1 ORDER BY recognition_timestamp DESC LIMIT 1',
      [bus_id]
    );
    const latestRec = latestRecRes.rows.length > 0 ? latestRecRes.rows[0] : null;

    // Find active shift
    const shiftRes = await query(
      "SELECT * FROM staff_shifts WHERE bus_id = $1 AND (status = 'SCHEDULED' OR status = 'ACTIVE' OR shift_status = 'SCHEDULED' OR shift_status = 'ACTIVE') LIMIT 1",
      [bus_id]
    );
    const shift = shiftRes.rows.length > 0 ? shiftRes.rows[0] : null;

    // Check latest audit override
    const overrideRes = await query(
      "SELECT * FROM recognition_audit_log WHERE target_id = $1 AND action_type = 'MANUAL_DISPATCH_OVERRIDE' ORDER BY audit_timestamp DESC LIMIT 1",
      [bus_id]
    );
    const latestOverride = overrideRes.rows.length > 0 ? overrideRes.rows[0] : null;

    let dispatch_allowed = false;
    let clearance_status = 'PENDING_VERIFICATION';
    const isOverridden = !!latestOverride;

    if (isOverridden) {
      clearance_status = 'OVERRIDE_APPROVED';
      dispatch_allowed = true;
    } else if (latestRec && latestRec.match_status === 'VERIFIED' && latestRec.confidence_score >= 90.0) {
      clearance_status = 'APPROVED';
      dispatch_allowed = true;
    } else if (latestRec && latestRec.match_status === 'REJECTED') {
      clearance_status = 'BLOCKED';
      dispatch_allowed = false;
    }

    res.json({
      success: true,
      data: {
        bus_id,
        bus_number: (bus.bus_number || '').replace(/^BUS-/, ''),
        registration_plate: bus.registration_plate,
        clearance_status,
        dispatch_allowed,
        is_authorized: dispatch_allowed,
        dispatch_readiness: isOverridden ? 'AUTHORIZED_BY_OVERRIDE' : (dispatch_allowed ? 'READY' : 'PENDING_VERIFICATION'),
        verification_status: isOverridden ? 'OVERRIDDEN' : (dispatch_allowed ? 'DISPATCH_ALLOWED' : 'PENDING_VERIFICATION'),
        shift: shift || null,
        latest_recognition: latestRec || null,
        latest_override: latestOverride || null
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/verification/logs
 */
async function getAllVerificationLogs(req, res, next) {
  try {
    const { bus_id, limit = 50 } = req.query;
    let sql = 'SELECT * FROM recognition_audit_log';
    const conditions = [];
    const params = [];

    if (bus_id) {
      params.push(bus_id);
      conditions.push(`target_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY audit_timestamp DESC';

    if (limit) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }

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

module.exports = {
  verifyDriverPreDispatch,
  manualDispatchOverride,
  getBusVerificationStatus,
  getAllVerificationLogs
};
