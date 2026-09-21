/**
 * ALERT SERVICE
 * Generates, manages, and tracks system alerts for boarding anomalies
 * Handles notifications, escalations, and override workflows
 * PHASE: Phase 9 — Wrong Bus Detection & Alerts
 */

const db = require('../config/database');

class AlertService {
  /**
   * Create alert from boarding verification result
   */
  async createAlert(verificationResult, photoPath = null) {
    try {
      if (!verificationResult) return null;

      const {
        status, // 'WRONG_BUS', 'WRONG_STOP', 'UNKNOWN_STUDENT'
        studentId,
        boardingBusId,
        busId: originalBusId,
        assignedBusId,
        confidenceScore
      } = verificationResult;

      const effectiveBusId = boardingBusId || originalBusId;

      // Only create alert for anomalies (not VERIFIED)
      if (status === 'VERIFIED') {
        return null;
      }

      // Determine severity
      const severity = this.determineSeverity(status, confidenceScore);

      // Insert alert
      const result = await db.query(
        `INSERT INTO alerts
         (alert_type, student_id, bus_id, assigned_bus_id, confidence_score, photo_path, severity, alert_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
         RETURNING *`,
        [
          status,
          studentId ? String(studentId) : null,
          effectiveBusId ? String(effectiveBusId) : null,
          assignedBusId ? String(assignedBusId) : null,
          confidenceScore !== undefined && confidenceScore !== null ? parseFloat(confidenceScore) : 0,
          photoPath || null,
          severity
        ]
      );

      const alert = result.rows[0];
      if (alert) {
        alert.alert_status = alert.alert_status || alert.status || 'ACTIVE';
        alert.status = alert.alert_status;
      }

      // Dispatch notifications
      await this.dispatchNotifications(alert);

      // Check for pattern escalation
      if (studentId) {
        await this.checkAndEscalate(studentId, status);
      }

      console.log(`[ALERT] Created alert #${alert.id} (${status}) - Severity: ${severity}`);
      return alert;
    } catch (err) {
      console.error('[ALERT ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Determine alert severity based on type and confidence
   */
  determineSeverity(alertType, confidenceScore = 1) {
    if (alertType === 'UNKNOWN_STUDENT') return 'CRITICAL'; // Security risk
    if (confidenceScore !== null && confidenceScore !== undefined && confidenceScore < 0.6) return 'HIGH';
    if (alertType === 'WRONG_BUS') return 'HIGH'; // High priority mismatch
    if (alertType === 'WRONG_STOP') return 'MEDIUM';
    return 'MEDIUM';
  }

  /**
   * Dispatch notifications to relevant staff
   */
  async dispatchNotifications(alert) {
    try {
      let inChargeStaffIds = [];

      if (alert.alert_type === 'WRONG_BUS' && alert.assigned_bus_id) {
        // Notify BOTH bus in-charges (assigned bus and attempted bus)
        const result = await db.query(
          `SELECT DISTINCT bus_in_charge_id
           FROM bus_route_assignments
           WHERE bus_id::text IN ($1, $2)
             AND bus_in_charge_id IS NOT NULL`,
          [String(alert.assigned_bus_id), String(alert.bus_id)]
        );
        inChargeStaffIds = result.rows.map(r => r.bus_in_charge_id).filter(Boolean);
      } else if (alert.bus_id) {
        // Notify current bus in-charge
        const result = await db.query(
          `SELECT DISTINCT bus_in_charge_id
           FROM bus_route_assignments
           WHERE bus_id::text = $1
             AND bus_in_charge_id IS NOT NULL`,
          [String(alert.bus_id)]
        );
        inChargeStaffIds = result.rows.map(r => r.bus_in_charge_id).filter(Boolean);
      }

      // If no assigned in-charge found, notify system bus in-charges or default staff
      if (inChargeStaffIds.length === 0) {
        const defaultStaff = await db.query(
          `SELECT id, staff_id FROM staff_members 
           WHERE role_id IN (SELECT id FROM staff_roles WHERE role_name IN ('BUS_IN_CHARGE', 'ADMIN', 'TRANSPORT_STAFF'))
           LIMIT 2`
        );
        inChargeStaffIds = defaultStaff.rows.map(r => r.staff_id || r.id).filter(Boolean);
      }

      // Create notification records
      for (const staffId of inChargeStaffIds) {
        await db.query(
          `INSERT INTO alert_notifications
           (alert_id, recipient_id, notification_type, status)
           VALUES ($1, $2, 'IN_APP', 'PENDING')`,
          [alert.id, String(staffId)]
        );
      }

      console.log(`[NOTIFICATION] Dispatched alert #${alert.id} to ${inChargeStaffIds.length} recipients`);
    } catch (err) {
      console.error('[NOTIFICATION ERROR]', err.message);
    }
  }

  /**
   * Check if student has multiple anomalies (escalation trigger)
   */
  async checkAndEscalate(studentId, alertType) {
    if (!studentId) return;

    try {
      // Count anomalies in last 24 hours
      const result = await db.query(
        `SELECT COUNT(*) as anomaly_count
         FROM alerts
         WHERE student_id::text = $1
           AND alert_type != 'UNKNOWN_STUDENT'
           AND created_at > NOW() - INTERVAL '24 hours'`,
        [String(studentId)]
      );

      const anomalyCount = parseInt(result.rows[0]?.anomaly_count || 0, 10);

      // Escalate if >= 3 anomalies
      if (anomalyCount >= 3) {
        await this.escalateAlert(studentId, anomalyCount, alertType);
      }
    } catch (err) {
      console.error('[ESCALATION CHECK ERROR]', err.message);
    }
  }

  /**
   * Escalate to transport admin
   */
  async escalateAlert(studentId, anomalyCount, alertType) {
    try {
      // Check if already escalated
      const existing = await db.query(
        `SELECT id FROM anomaly_escalations
         WHERE student_id::text = $1 AND status = 'ACTIVE'`,
        [String(studentId)]
      );

      if (existing.rows.length > 0) {
        // Update anomaly count
        await db.query(
          `UPDATE anomaly_escalations
           SET anomaly_count = $2, updated_at = NOW()
           WHERE student_id::text = $1`,
          [String(studentId), anomalyCount]
        );
      } else {
        // Create escalation record
        await db.query(
          `INSERT INTO anomaly_escalations
           (student_id, anomaly_count, escalation_reason)
           VALUES ($1, $2, $3)`,
          [
            String(studentId),
            anomalyCount,
            `${anomalyCount} boarding anomalies in 24 hours - Pattern detected (${alertType})`
          ]
        );
      }

      // Get admin staff recipient
      const adminResult = await db.query(
        `SELECT id, staff_id FROM staff_members
         WHERE role_id IN (
           SELECT id FROM staff_roles WHERE role_name IN ('ADMIN', 'TRANSPORT_STAFF')
         )
         LIMIT 1`
      );

      if (adminResult.rows.length > 0) {
        const adminId = adminResult.rows[0].staff_id || adminResult.rows[0].id;

        const alertResult = await db.query(
          `SELECT id FROM alerts
           WHERE student_id::text = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [String(studentId)]
        );

        if (alertResult.rows.length > 0) {
          await db.query(
            `INSERT INTO alert_notifications
             (alert_id, recipient_id, notification_type, status)
             VALUES ($1, $2, 'EMAIL', 'SENT')`,
            [alertResult.rows[0].id, String(adminId)]
          );
        }
      }

      console.log(`[ESCALATION] Student ${studentId} escalated (${anomalyCount} anomalies)`);
    } catch (err) {
      console.error('[ESCALATION ERROR]', err.message);
    }
  }

  /**
   * Get active alerts for a bus in-charge or admin
   */
  async getActiveAlerts(staffId = null, role = null) {
    try {
      let query;
      let params = [];

      // If user is Admin/Transport staff or no staffId given, return all active/acknowledged alerts
      if (!staffId || role === 'ADMIN' || role === 'TRANSPORT_STAFF') {
        query = `
          SELECT 
            a.id,
            a.alert_type,
            a.student_id,
            COALESCE(s.full_name, 'Unidentified Student') as full_name,
            COALESCE(s.register_number, 'N/A') as register_number,
            a.bus_id,
            COALESCE(b.bus_number, a.bus_id) as bus_number,
            a.assigned_bus_id,
            COALESCE(b2.bus_number, a.assigned_bus_id) as assigned_bus_number,
            a.confidence_score,
            a.severity,
            a.alert_status,
            a.photo_path,
            a.action_taken,
            a.action_reason,
            a.created_at
          FROM alerts a
          LEFT JOIN students s ON (s.student_id::text = a.student_id::text OR s.id::text = a.student_id::text)
          LEFT JOIN buses b ON (b.bus_id::text = a.bus_id::text OR b.id::text = a.bus_id::text)
          LEFT JOIN buses b2 ON (b2.bus_id::text = a.assigned_bus_id::text OR b2.id::text = a.assigned_bus_id::text)
          WHERE a.alert_status IN ('ACTIVE', 'ACKNOWLEDGED')
          ORDER BY 
            CASE WHEN a.severity = 'CRITICAL' THEN 1
                 WHEN a.severity = 'HIGH' THEN 2
                 WHEN a.severity = 'MEDIUM' THEN 3
                 ELSE 4 END,
            a.created_at DESC
        `;
      } else {
        // Filter by in-charge's assigned buses
        query = `
          SELECT 
            a.id,
            a.alert_type,
            a.student_id,
            COALESCE(s.full_name, 'Unidentified Student') as full_name,
            COALESCE(s.register_number, 'N/A') as register_number,
            a.bus_id,
            COALESCE(b.bus_number, a.bus_id) as bus_number,
            a.assigned_bus_id,
            COALESCE(b2.bus_number, a.assigned_bus_id) as assigned_bus_number,
            a.confidence_score,
            a.severity,
            a.alert_status,
            a.photo_path,
            a.action_taken,
            a.action_reason,
            a.created_at
          FROM alerts a
          LEFT JOIN students s ON (s.student_id::text = a.student_id::text OR s.id::text = a.student_id::text)
          LEFT JOIN buses b ON (b.bus_id::text = a.bus_id::text OR b.id::text = a.bus_id::text)
          LEFT JOIN buses b2 ON (b2.bus_id::text = a.assigned_bus_id::text OR b2.id::text = a.assigned_bus_id::text)
          LEFT JOIN bus_route_assignments bra ON (bra.bus_id::text = a.bus_id::text OR bra.bus_id::text = a.assigned_bus_id::text)
          WHERE (bra.bus_in_charge_id::text = $1 OR a.in_charge_id::text = $1 OR a.alert_status = 'ACTIVE')
            AND a.alert_status IN ('ACTIVE', 'ACKNOWLEDGED')
          ORDER BY 
            CASE WHEN a.severity = 'CRITICAL' THEN 1
                 WHEN a.severity = 'HIGH' THEN 2
                 WHEN a.severity = 'MEDIUM' THEN 3
                 ELSE 4 END,
            a.created_at DESC
        `;
        params.push(String(staffId));
      }

      const result = await db.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('[GET ALERTS ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Acknowledge alert (in-charge reads it)
   */
  async acknowledgeAlert(alertId, staffId) {
    try {
      const result = await db.query(
        `UPDATE alerts
         SET alert_status = 'ACKNOWLEDGED', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [alertId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Alert #${alertId} not found`);
      }

      // Mark notification as read
      if (staffId) {
        await db.query(
          `UPDATE alert_notifications
           SET status = 'READ', read_timestamp = NOW()
           WHERE alert_id = $1 AND recipient_id::text = $2`,
          [alertId, String(staffId)]
        );
      }

      const row = result.rows[0];
      if (row) {
        row.alert_status = row.alert_status || row.status || 'ACKNOWLEDGED';
        row.status = row.alert_status;
      }
      return row;
    } catch (err) {
      console.error('[ACKNOWLEDGE ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Override alert (approve or reject)
   */
  async overrideAlert(alertId, action, reason, staffId) {
    try {
      // Validate action
      if (!['APPROVED', 'REJECTED'].includes(action)) {
        throw new Error('Invalid action. Use APPROVED or REJECTED');
      }

      const result = await db.query(
        `UPDATE alerts
         SET 
          alert_status = 'RESOLVED',
          action_taken = $2,
          action_reason = $3,
          in_charge_id = $4,
          action_timestamp = NOW(),
          updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [alertId, action, reason, staffId ? String(staffId) : null]
      );

      if (result.rows.length === 0) {
        throw new Error(`Alert #${alertId} not found`);
      }

      const alert = result.rows[0];
      if (alert) {
        alert.alert_status = alert.alert_status || alert.status || 'RESOLVED';
        alert.status = alert.alert_status;
      }

      // Log to attendance if approved
      if (action === 'APPROVED' && alert.student_id) {
        await db.query(
          `INSERT INTO student_attendance_log
           (student_id, bus_id, date, session_type, boarding_status, verified_by_biometric, boarded_at)
           VALUES ($1, $2, CURRENT_DATE, 'Morning', 'Override', false, NOW())
           ON CONFLICT DO NOTHING`,
          [alert.student_id, alert.bus_id]
        );
      }

      console.log(`[OVERRIDE] Alert #${alertId} marked ${action} by staff ${staffId}`);
      return alert;
    } catch (err) {
      console.error('[OVERRIDE ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(busId = null, timeWindowHours = 24) {
    try {
      const hours = parseInt(timeWindowHours, 10) || 24;
      const whereClause = busId ? 'AND (a.bus_id::text = $1 OR a.assigned_bus_id::text = $1)' : '';
      const params = busId ? [String(busId)] : [];

      const query = `
        SELECT 
          COUNT(*)::int as total_alerts,
          COUNT(CASE WHEN a.alert_status = 'ACTIVE' THEN 1 END)::int as active_alerts,
          COUNT(CASE WHEN a.severity = 'CRITICAL' THEN 1 END)::int as critical_alerts,
          COUNT(CASE WHEN a.alert_type = 'WRONG_BUS' THEN 1 END)::int as wrong_bus_count,
          COUNT(CASE WHEN a.alert_type = 'WRONG_STOP' THEN 1 END)::int as wrong_stop_count,
          COUNT(DISTINCT a.student_id)::int as affected_students
        FROM alerts a
        WHERE a.created_at > NOW() - INTERVAL '${hours} hours'
        ${whereClause}
      `;

      const result = await db.query(query, params);
      return result.rows[0] || {
        total_alerts: 0,
        active_alerts: 0,
        critical_alerts: 0,
        wrong_bus_count: 0,
        wrong_stop_count: 0,
        affected_students: 0
      };
    } catch (err) {
      console.error('[STATS ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Get historical alerts
   */
  async getAlertHistory(options = {}, maybeStatus = null, maybeLimit = 50) {
    let studentId, status, limit;
    if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
      studentId = options.studentId;
      status = options.status || null;
      limit = options.limit || 50;
    } else {
      studentId = options;
      status = maybeStatus;
      limit = maybeLimit || 50;
    }

    let query = `
      SELECT 
        a.*,
        COALESCE(s.full_name, 'Unidentified Student') as full_name,
        COALESCE(s.register_number, 'N/A') as register_number,
        COALESCE(b.bus_number, a.bus_id) as bus_number,
        COALESCE(b2.bus_number, a.assigned_bus_id) as assigned_bus_number
      FROM alerts a
      LEFT JOIN students s ON (s.student_id::text = a.student_id::text OR s.id::text = a.student_id::text)
      LEFT JOIN buses b ON (b.bus_id::text = a.bus_id::text OR b.id::text = a.bus_id::text)
      LEFT JOIN buses b2 ON (b2.bus_id::text = a.assigned_bus_id::text OR b2.id::text = a.assigned_bus_id::text)
      WHERE 1=1
    `;
    const params = [];

    if (studentId) {
      params.push(String(studentId));
      query += ` AND a.student_id::text = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND a.alert_status = $${params.length}`;
    }

    params.push(parseInt(limit, 10) || 50);
    query += ` ORDER BY a.created_at DESC LIMIT $${params.length}`;

    const result = await db.query(query, params);
    return result.rows.map(r => {
      r.alert_status = r.alert_status || r.status || 'ACTIVE';
      r.status = r.alert_status;
      return r;
    });
  }

  /**
   * Get escalations
   */
  async getEscalations() {
    const result = await db.query(`
      SELECT 
        ae.id,
        ae.student_id,
        COALESCE(s.full_name, 'Student #' || ae.student_id) as full_name,
        COALESCE(s.register_number, 'N/A') as register_number,
        ae.anomaly_count,
        ae.escalation_reason,
        ae.created_at,
        ae.status
      FROM anomaly_escalations ae
      LEFT JOIN students s ON (s.student_id::text = ae.student_id::text OR s.id::text = ae.student_id::text)
      WHERE ae.status = 'ACTIVE'
      ORDER BY ae.anomaly_count DESC, ae.created_at DESC
    `);
    return result.rows;
  }
}

module.exports = new AlertService();
