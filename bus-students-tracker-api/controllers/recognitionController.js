const { query } = require('../config/database');
const faceRecognitionService = require('../services/faceRecognitionService');

/**
 * POST /api/recognize
 * Real-time face detection & recognition pipeline using OpenCV FaceNet logic
 * Body: {
 *   camera_id,
 *   bus_id,
 *   query_embedding, // optional 128-D vector
 *   seed_key,        // optional string seed for deterministic testing / simulation
 *   person_type_filter, // 'STUDENT', 'STAFF', 'DRIVER', or null
 *   liveness_checks, // { blink_detected, micro_pose_variance, texture_sharpness, frequency_fourier_ratio }
 *   bounding_box,    // [ymin, xmin, ymax, xmax]
 *   landmarks        // 5-point facial landmarks
 * }
 */
async function processFaceRecognition(req, res, next) {
  try {
    const {
      camera_id,
      bus_id,
      query_embedding,
      seed_key,
      person_type_filter,
      liveness_checks,
      bounding_box = [64, 82, 236, 218],
      landmarks = {
        left_eye: [122, 108],
        right_eye: [178, 108],
        nose_tip: [150, 142],
        mouth_left: [130, 182],
        mouth_right: [170, 182]
      }
    } = req.body;

    if (!camera_id) {
      return res.status(400).json({
        success: false,
        error: 'camera_id is required for recognition pipeline capture',
        code: 'MISSING_CAMERA_ID'
      });
    }

    // Resolve query embedding
    let queryVector;
    if (Array.isArray(query_embedding) && query_embedding.length === 128) {
      queryVector = query_embedding;
    } else if (seed_key) {
      queryVector = faceRecognitionService.generateEmbedding(seed_key);
    } else {
      // Default to randomized normalized embedding
      queryVector = faceRecognitionService.generateEmbedding(Date.now().toString());
    }

    // Fetch active enrollments
    const enrollmentsRes = await query(
      "SELECT * FROM biometric_enrollments WHERE status = 'ACTIVE' OR enrollment_status = 'ACTIVE'"
    );
    const enrolledProfiles = enrollmentsRes.rows;

    // Run OpenCV Euclidean & Cosine matching engine
    const bestMatch = faceRecognitionService.findBestMatch(
      queryVector,
      enrolledProfiles,
      person_type_filter
    );

    // Assess liveness (Anti-spoofing)
    const livenessResult = faceRecognitionService.assessLiveness(liveness_checks);

    // Resolve person metadata
    let matchedPersonName = null;
    let matchedPersonType = null;
    let matchedPersonId = null;

    if (bestMatch && bestMatch.matched_person_id) {
      matchedPersonId = bestMatch.matched_person_id;
      matchedPersonType = bestMatch.person_type;
      matchedPersonName = bestMatch.person_name || 'Enrolled Subject';
    }

    // Generate SVG HUD frame overlay
    const hudFrameSvg = faceRecognitionService.generateHUDFrameSVG({
      cameraId: camera_id,
      busId: bus_id || 'BUS-14',
      personName: matchedPersonName,
      confidenceScore: bestMatch.confidence_score,
      decision: bestMatch.decision,
      livenessStatus: livenessResult.liveness_status,
      boundingBox: bounding_box,
      landmarks
    });

    // Determine target bus_id if not explicitly provided
    let effectiveBusId = bus_id;
    if (!effectiveBusId) {
      const camRes = await query('SELECT bus_id FROM cameras WHERE camera_id = $1', [camera_id]);
      if (camRes.rows.length > 0) {
        effectiveBusId = camRes.rows[0].bus_id;
      }
    }

    // Save recognition result
    const insertSql = `
      INSERT INTO recognition_results (
        camera_id, bus_id, matched_person_id, matched_person_name,
        person_type, euclidean_distance, cosine_similarity, confidence_score,
        match_status, liveness_status, bounding_box, landmarks,
        captured_frame_url, recognition_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const insertRes = await query(insertSql, [
      camera_id,
      effectiveBusId,
      matchedPersonId,
      matchedPersonName,
      matchedPersonType,
      bestMatch.distance,
      bestMatch.cosine_similarity,
      bestMatch.confidence_score,
      bestMatch.decision,
      livenessResult.liveness_status,
      JSON.stringify(bounding_box),
      JSON.stringify(landmarks),
      `https://stream.vsb.ac.in/frames/${camera_id}_${Date.now()}.jpg`
    ]);

    const savedResult = insertRes.rows[0];

    const livenessData = {
      ...livenessResult,
      is_live: livenessResult.is_live ?? (livenessResult.liveness_status === 'LIVE')
    };

    res.json({
      success: true,
      message: `Face processing complete. Classification: ${bestMatch.decision}`,
      hud_frame_svg: hudFrameSvg,
      data: {
        ...savedResult,
        decision: bestMatch.decision,
        confidence_score: bestMatch.confidence_score,
        best_match: bestMatch,
        liveness: livenessData,
        hud_frame_svg: hudFrameSvg
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/recognition-results
 * Filters: bus_id, camera_id, match_status, person_type, limit
 */
async function getAllRecognitionResults(req, res, next) {
  try {
    const { bus_id, camera_id, match_status, person_type, limit = 50 } = req.query;
    let sql = 'SELECT * FROM recognition_results';
    const conditions = [];
    const params = [];

    if (bus_id) {
      params.push(bus_id);
      conditions.push(`bus_id = $${params.length}`);
    }

    if (camera_id) {
      params.push(camera_id);
      conditions.push(`camera_id = $${params.length}`);
    }

    if (match_status) {
      params.push(match_status.toUpperCase());
      conditions.push(`match_status = $${params.length}`);
    }

    if (person_type) {
      params.push(person_type.toUpperCase());
      conditions.push(`person_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY recognition_timestamp DESC';

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

/**
 * GET /api/recognition-results/:id
 */
async function getRecognitionResultById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM recognition_results WHERE result_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Recognition result record not found',
        code: 'RESULT_NOT_FOUND'
      });
    }

    const record = result.rows[0];

    // Generate HUD SVG for playback
    const hudFrameSvg = faceRecognitionService.generateHUDFrameSVG({
      cameraId: record.camera_id,
      busId: record.bus_id || record.bus_number,
      personName: record.matched_person_name,
      confidenceScore: record.confidence_score,
      decision: record.match_status,
      livenessStatus: record.liveness_status,
      boundingBox: typeof record.bounding_box === 'string' ? JSON.parse(record.bounding_box) : record.bounding_box,
      landmarks: typeof record.landmarks === 'string' ? JSON.parse(record.landmarks) : record.landmarks
    });

    res.json({
      success: true,
      data: {
        ...record,
        hud_frame_svg: hudFrameSvg
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processFaceRecognition,
  getAllRecognitionResults,
  getRecognitionResultById
};
