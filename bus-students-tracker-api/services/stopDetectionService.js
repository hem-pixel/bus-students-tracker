/**
 * STOP DETECTION SERVICE
 * Phase 10: Wrong Stop Detection & Alerts
 * 
 * Verifies student boarding/alighting events against designated stop assignments.
 * Calculates sequence deltas, physical distance discrepancies, generates alerts,
 * and tracks resolution lifecycles.
 */

const crypto = require('crypto');
const db = require('../config/database');

/**
 * Calculate geographical distance in meters between two lat/lng coordinates (Haversine formula).
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const pLat1 = parseFloat(lat1);
  const pLon1 = parseFloat(lon1);
  const pLat2 = parseFloat(lat2);
  const pLon2 = parseFloat(lon2);
  if (isNaN(pLat1) || isNaN(pLon1) || isNaN(pLat2) || isNaN(pLon2)) return 0;

  const R = 6371000; // Earth radius in meters
  const dLat = (pLat2 - pLat1) * Math.PI / 180;
  const dLon = (pLon2 - pLon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pLat1 * Math.PI / 180) * Math.cos(pLat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

class StopDetectionService {
  /**
   * Assign designated stops to student per route. Supports single or bulk assignments.
   */
  async assignStops(assignmentData) {
    const items = Array.isArray(assignmentData) ? assignmentData : [assignmentData];
    const createdAssignments = [];

    for (const item of items) {
      const {
        student_id,
        route_id,
        pickup_stop_id,
        dropoff_stop_id,
        assigned_bus_id,
        effective_date = new Date().toISOString().split('T')[0],
        status = 'ACTIVE',
        notes = null
      } = item;

      if (!student_id || !route_id || !pickup_stop_id) {
        throw new Error('student_id, route_id, and pickup_stop_id are required for stop assignment');
      }

      const id = `sa-${crypto.randomUUID()}`;
      const query = `
        INSERT INTO stop_assignments (
          id, student_id, route_id, pickup_stop_id, dropoff_stop_id,
          assigned_bus_id, effective_date, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const params = [
        id,
        student_id,
        route_id,
        pickup_stop_id,
        dropoff_stop_id || pickup_stop_id,
        assigned_bus_id || null,
        effective_date,
        status,
        notes
      ];

      const result = await db.query(query, params);
      if (result.rows && result.rows.length > 0) {
        createdAssignments.push(result.rows[0]);
      }
    }

    return Array.isArray(assignmentData) ? createdAssignments : createdAssignments[0];
  }

  /**
   * Retrieve all stop assignments for a specific student.
   */
  async getStudentAssignments(student_id) {
    const query = `
      SELECT * FROM stop_assignments
      WHERE student_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [student_id]);
    return result.rows || [];
  }

  /**
   * Retrieve filterable list of stop assignments.
   */
  async getAssignments(filters = {}) {
    let query = 'SELECT * FROM stop_assignments';
    const params = [];
    const conditions = [];

    if (filters.student_id) {
      params.push(filters.student_id);
      conditions.push(`student_id = $${params.length}`);
    }

    if (filters.route_id) {
      params.push(filters.route_id);
      conditions.push(`route_id = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows || [];
  }

  /**
   * Core boarding verification engine.
   * Compares detected boarding stop with student's designated stop.
   */
  async checkBoarding(eventData) {
    const {
      student_id,
      bus_id,
      detected_stop_id,
      event_type = 'BOARDING', // 'BOARDING' or 'ALIGHTING'
      confidence_score = 0.95,
      verification_method = 'FACE_RECOGNITION',
      detected_at = new Date().toISOString()
    } = eventData;

    if (!student_id || !detected_stop_id) {
      throw new Error('student_id and detected_stop_id are required for boarding check');
    }

    // 1. Fetch student info
    const studentRes = await db.query('SELECT * FROM students WHERE student_id = $1 OR id = $1', [student_id]);
    const student = studentRes.rows && studentRes.rows[0];
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
    const rollNumber = student ? student.roll_number : '';

    // 2. Fetch detected stop info
    const detectedStopRes = await db.query('SELECT * FROM stops WHERE stop_id = $1 OR id = $1', [detected_stop_id]);
    const detectedStop = detectedStopRes.rows && detectedStopRes.rows[0];
    const detectedStopName = detectedStop ? detectedStop.stop_name : 'Unknown Stop';
    const detectedStopSeq = detectedStop ? parseInt(detectedStop.stop_sequence || 0, 10) : 0;
    const detectedRouteId = detectedStop ? detectedStop.route_id : null;

    // 3. Fetch active stop assignment for student
    const assignmentRes = await db.query(
      `SELECT * FROM stop_assignments 
       WHERE student_id = $1 AND status = 'ACTIVE' 
       ORDER BY created_at DESC LIMIT 1`,
      [student_id]
    );
    let assignment = assignmentRes.rows && assignmentRes.rows[0];

    // Fallback: check student_bus_assignments if stop_assignments is empty
    if (!assignment) {
      const sbaRes = await db.query(
        `SELECT * FROM student_bus_assignments 
         WHERE student_id = $1 AND is_active = TRUE 
         ORDER BY created_at DESC LIMIT 1`,
        [student_id]
      );
      if (sbaRes.rows && sbaRes.rows[0]) {
        const sba = sbaRes.rows[0];
        assignment = {
          student_id,
          route_id: sba.route_id,
          pickup_stop_id: sba.stop_id,
          dropoff_stop_id: sba.stop_id,
          assigned_bus_id: sba.bus_id
        };
      }
    }

    // Handle NO ASSIGNMENT
    if (!assignment) {
      const detectionId = `wsd-${crypto.randomUUID()}`;
      const mismatchType = 'UNAUTHORIZED_STOP';
      const severity = 'HIGH';

      const insertDetQuery = `
        INSERT INTO wrong_stop_detections (
          id, student_id, bus_id, route_id, detected_stop_id, assigned_stop_id,
          event_type, mismatch_type, sequence_delta, distance_from_assigned_meters,
          confidence_score, verification_method, status, detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      const detParams = [
        detectionId,
        student_id,
        bus_id || null,
        detectedRouteId || null,
        detected_stop_id,
        null,
        event_type,
        mismatchType,
        0,
        0,
        confidence_score,
        verification_method,
        'ACTIVE',
        detected_at
      ];

      const detResult = await db.query(insertDetQuery, detParams);
      const detection = detResult.rows[0];

      // Create alert
      const alertId = `sda-${crypto.randomUUID()}`;
      const alertQuery = `
        INSERT INTO stop_detection_alerts (
          id, detection_id, alert_type, severity, title, description, status, alert_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const alertTitle = `Unassigned Student Boarding: ${studentName}`;
      const alertDesc = `${studentName} (${rollNumber}) boarded at ${detectedStopName} without an active stop assignment.`;
      const alertResult = await db.query(alertQuery, [
        alertId,
        detectionId,
        'WRONG_STOP_BOARDING',
        severity,
        alertTitle,
        alertDesc,
        'ACTIVE',
        detected_at
      ]);

      return {
        is_correct_stop: false,
        is_mismatch: true,
        mismatch_type: mismatchType,
        status: 'UNAUTHORIZED_STOP',
        severity,
        reason: 'Student has no designated stop assignment',
        student: { id: student_id, name: studentName, roll_number: rollNumber },
        detected_stop: { id: detected_stop_id, name: detectedStopName, sequence: detectedStopSeq },
        assigned_stop: null,
        sequence_delta: 0,
        distance_meters: 0,
        distance_discrepancy_meters: 0,
        alert_generated: true,
        detection,
        alert: alertResult.rows[0]
      };
    }

    // Designated stop based on event type
    const assignedStopId = (event_type === 'ALIGHTING') ? assignment.dropoff_stop_id : assignment.pickup_stop_id;

    // Fetch assigned stop details
    const assignedStopRes = await db.query('SELECT * FROM stops WHERE stop_id = $1 OR id = $1', [assignedStopId]);
    const assignedStop = assignedStopRes.rows && assignedStopRes.rows[0];
    const assignedStopName = assignedStop ? assignedStop.stop_name : 'Assigned Stop';
    const assignedStopSeq = assignedStop ? parseInt(assignedStop.stop_sequence || 0, 10) : 0;

    // 4. Exact Match Check
    if (detected_stop_id === assignedStopId) {
      // Log successful verification event
      await db.query(`
        INSERT INTO stop_events (
          id, bus_id, route_id, stop_id, arrival_time, event_type
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [`se-${crypto.randomUUID()}`, bus_id || assignment.assigned_bus_id, assignment.route_id, detected_stop_id, detected_at, event_type]);

      return {
        is_correct_stop: true,
        is_mismatch: false,
        status: 'VERIFIED',
        mismatch_type: null,
        severity: 'NONE',
        reason: 'Designated stop matched successfully',
        student: { id: student_id, name: studentName, roll_number: rollNumber },
        detected_stop: { id: detected_stop_id, name: detectedStopName, sequence: detectedStopSeq },
        assigned_stop: { id: assignedStopId, name: assignedStopName, sequence: assignedStopSeq },
        sequence_delta: 0,
        distance_meters: 0,
        distance_discrepancy_meters: 0,
        alert_generated: false
      };
    }

    // 5. MISMATCH DETECTED: Calculate sequence delta & Haversine distance
    const sequenceDelta = Math.abs(detectedStopSeq - assignedStopSeq);
    let distanceMeters = 0;
    if (detectedStop && assignedStop) {
      distanceMeters = calculateHaversineDistance(
        detectedStop.latitude, detectedStop.longitude,
        assignedStop.latitude, assignedStop.longitude
      );
    }

    // Determine mismatch type
    let mismatchType = 'WRONG_STOP';
    if (detectedStopSeq > 0 && assignedStopSeq > 0) {
      if (detectedStopSeq < assignedStopSeq) {
        mismatchType = 'PREVIOUS_STOP';
      } else if (detectedStopSeq > assignedStopSeq) {
        mismatchType = 'SUBSEQUENT_STOP';
      }
    } else if (detectedRouteId && assignment.route_id && detectedRouteId !== assignment.route_id) {
      mismatchType = 'UNAUTHORIZED_STOP';
    }

    // Determine severity
    let severity = 'MEDIUM';
    if (mismatchType === 'UNAUTHORIZED_STOP' || sequenceDelta >= 3 || distanceMeters > 3000) {
      severity = 'CRITICAL';
    } else if (sequenceDelta >= 2 || distanceMeters > 1000) {
      severity = 'HIGH';
    }

    // 6. Record in wrong_stop_detections
    const detectionId = `wsd-${crypto.randomUUID()}`;
    const insertDetQuery = `
      INSERT INTO wrong_stop_detections (
        id, student_id, bus_id, route_id, detected_stop_id, assigned_stop_id,
        event_type, mismatch_type, sequence_delta, distance_from_assigned_meters,
        confidence_score, verification_method, status, detected_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const detParams = [
      detectionId,
      student_id,
      bus_id || assignment.assigned_bus_id,
      assignment.route_id,
      detected_stop_id,
      assignedStopId,
      event_type,
      mismatchType,
      sequenceDelta,
      distanceMeters,
      confidence_score,
      verification_method,
      'ACTIVE',
      detected_at
    ];

    const detResult = await db.query(insertDetQuery, detParams);
    const detection = detResult.rows[0];

    // 7. Generate Alert in stop_detection_alerts
    const alertId = `sda-${crypto.randomUUID()}`;
    const actionLabel = event_type === 'ALIGHTING' ? 'alighted at' : 'boarded at';
    const alertTitle = `Wrong Stop Alert: ${studentName} (${mismatchType.replace('_', ' ')})`;
    const alertDesc = `${studentName} (${rollNumber}) ${actionLabel} ${detectedStopName} instead of assigned stop ${assignedStopName} (Delta: ${sequenceDelta} stops, ~${distanceMeters}m).`;

    const alertQuery = `
      INSERT INTO stop_detection_alerts (
        id, detection_id, alert_type, severity, title, description, status, alert_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const alertResult = await db.query(alertQuery, [
      alertId,
      detectionId,
      'WRONG_STOP_BOARDING',
      severity,
      alertTitle,
      alertDesc,
      'ACTIVE',
      detected_at
    ]);

    // 8. Log in stop_performance_log
    const perfId = `spl-${crypto.randomUUID()}`;
    await db.query(`
      INSERT INTO stop_performance_log (
        id, route_id, bus_id, scheduled_stop_id, actual_stop_id,
        deviation_meters, sequence_mismatch, is_unauthorized_stop, logged_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      perfId,
      assignment.route_id,
      bus_id || assignment.assigned_bus_id,
      assignedStopId,
      detected_stop_id,
      distanceMeters,
      sequenceDelta > 0,
      mismatchType === 'UNAUTHORIZED_STOP',
      detected_at
    ]);

    return {
      is_correct_stop: false,
      is_mismatch: true,
      status: 'FLAGGED_MISMATCH',
      mismatch_type: mismatchType,
      severity,
      student: { id: student_id, name: studentName, roll_number: rollNumber },
      detected_stop: { id: detected_stop_id, name: detectedStopName, sequence: detectedStopSeq },
      assigned_stop: { id: assignedStopId, name: assignedStopName, sequence: assignedStopSeq },
      sequence_delta: sequenceDelta,
      distance_meters: distanceMeters,
      distance_discrepancy_meters: distanceMeters,
      alert_generated: true,
      detection,
      alert: alertResult.rows[0]
    };
  }

  /**
   * Retrieve filterable list of wrong stop detection records.
   */
  async getDetections(filters = {}) {
    let query = 'SELECT * FROM wrong_stop_detections';
    const params = [];
    const conditions = [];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    if (filters.route_id) {
      params.push(filters.route_id);
      conditions.push(`route_id = $${params.length}`);
    }

    if (filters.bus_id) {
      params.push(filters.bus_id);
      conditions.push(`bus_id = $${params.length}`);
    }

    if (filters.student_id) {
      params.push(filters.student_id);
      conditions.push(`student_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY detected_at DESC';

    const result = await db.query(query, params);
    return result.rows || [];
  }

  /**
   * Retrieve filterable list of active/unhandled wrong stop alerts.
   */
  async getAlerts(filters = {}) {
    let query = 'SELECT * FROM stop_detection_alerts';
    const params = [];
    const conditions = [];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    } else {
      // By default return ACTIVE alerts unless 'ALL' specified
      if (filters.status !== 'ALL') {
        conditions.push(`status = 'ACTIVE'`);
      }
    }

    if (filters.severity) {
      params.push(filters.severity);
      conditions.push(`severity = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY alert_time DESC';

    const result = await db.query(query, params);
    return result.rows || [];
  }

  /**
   * Resolve a wrong stop detection with administrative override or acknowledgment.
   */
  async resolveDetection(id, resolutionData = {}) {
    const resolution_notes = resolutionData.resolution_notes || 'Verified and approved by transport authority';
    const resolution_status = resolutionData.resolution_status || resolutionData.verification_status || 'RESOLVED';
    const in_charge_id = resolutionData.resolved_by || resolutionData.in_charge_id || 'USR-ADM-001';

    const query = `
      UPDATE wrong_stop_detections
      SET status = $1, resolution_notes = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(query, [resolution_status, resolution_notes, in_charge_id, id]);
    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Wrong stop detection record with ID '${id}' not found`);
    }

    // Dismiss or resolve linked alert
    await db.query(`
      UPDATE stop_detection_alerts
      SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1
      WHERE detection_id = $2
    `, [in_charge_id, id]);

    const updated = result.rows[0];
    return {
      ...updated,
      verification_status: updated.status
    };
  }

  /**
   * Dismiss an alert with optional reason.
   */
  async dismissAlert(id, dismissalData = {}) {
    const {
      dismissal_reason = 'Dismissed by administrator',
      in_charge_id = 'USR-ADM-001'
    } = dismissalData;

    const query = `
      UPDATE stop_detection_alerts
      SET status = 'DISMISSED', dismissal_reason = $1, dismissed_by = $2, dismissed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await db.query(query, [dismissal_reason, in_charge_id, id]);
    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Stop detection alert with ID '${id}' not found`);
    }

    return result.rows[0];
  }

  /**
   * Compute aggregated dashboard metrics.
   */
  async getStats() {
    const allDetectionsRes = await db.query('SELECT * FROM wrong_stop_detections');
    const allDetections = allDetectionsRes.rows || [];

    const allAlertsRes = await db.query('SELECT * FROM stop_detection_alerts');
    const allAlerts = allAlertsRes.rows || [];

    // Filter today's detections (last 24 hours)
    const oneDayAgo = Date.now() - 86400000;
    const todayDetections = allDetections.filter(d => new Date(d.detected_at || d.created_at).getTime() >= oneDayAgo);

    const activeAlerts = allAlerts.filter(a => a.status === 'ACTIVE');
    const resolvedCount = allDetections.filter(d => d.status === 'RESOLVED' || d.status === 'OVERRIDDEN').length;
    const resolutionRate = allDetections.length > 0 
      ? Math.round((resolvedCount / allDetections.length) * 100) 
      : 100;

    // Breakdown by mismatch type
    const mismatchTypeBreakdown = {
      PREVIOUS_STOP: 0,
      SUBSEQUENT_STOP: 0,
      WRONG_STOP: 0,
      UNAUTHORIZED_STOP: 0
    };

    // Frequency by detected stop
    const stopFrequency = {};
    for (const d of allDetections) {
      const type = d.mismatch_type || 'WRONG_STOP';
      mismatchTypeBreakdown[type] = (mismatchTypeBreakdown[type] || 0) + 1;

      const stopName = d.detected_stop_name || 'Stop ' + d.detected_stop_id;
      stopFrequency[stopName] = (stopFrequency[stopName] || 0) + 1;
    }

    const topMismatchedStops = Object.entries(stopFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_detections_all_time: allDetections.length,
      today_detections_count: todayDetections.length,
      active_alerts_count: activeAlerts.length,
      resolved_count: resolvedCount,
      resolution_rate_percent: resolutionRate,
      mismatch_breakdown: mismatchTypeBreakdown,
      top_mismatched_stops: topMismatchedStops
    };
  }
}

module.exports = new StopDetectionService();
