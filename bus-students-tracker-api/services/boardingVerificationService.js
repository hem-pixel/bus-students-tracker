/**
 * BOARDING VERIFICATION SERVICE
 * Verifies student boarding authorization against assignment records
 * Determines if student can board specific bus at specific stop
 */

const db = require('../config/database');

class BoardingVerificationService {
  /**
   * Main verification method
   * Called after Phase 7 recognition matches a student
   */
  async verifyBoardingAuthorization(studentId, busId, stopId, confidenceScore = 0.95) {
    try {
      // 1. Get student info
      const studentResult = await db.query(
        'SELECT id, full_name, register_number FROM students WHERE id = $1',
        [studentId]
      );

      let verification = null;

      if (studentResult.rows.length === 0) {
        verification = {
          status: 'UNKNOWN_STUDENT',
          reason: 'Student ID not found in database',
          studentId,
          busId,
          stopId,
          confidenceScore,
          severity: 'HIGH',
          timestamp: new Date().toISOString()
        };
      } else {
        const student = studentResult.rows[0];

        // 2. Get student's active bus assignment
        const assignmentResult = await db.query(
          `SELECT 
            id, bus_id, stop_id, route_id, boarding_pass_number
           FROM student_bus_assignments
           WHERE student_id = $1 AND is_active = TRUE
           ORDER BY created_at DESC
           LIMIT 1`,
          [studentId]
        );

        if (assignmentResult.rows.length === 0) {
          verification = {
            status: 'NO_ASSIGNMENT',
            reason: 'Student has no active bus assignment',
            studentId,
            student: student.full_name,
            registerNumber: student.register_number,
            busId,
            stopId,
            confidenceScore,
            severity: 'HIGH',
            timestamp: new Date().toISOString()
          };
        } else {
          const assignment = assignmentResult.rows[0];

          // 3. Verify bus authorization
          if (assignment.bus_id !== busId) {
            verification = {
              status: 'WRONG_BUS',
              reason: `Student assigned to Bus ${assignment.bus_id}, attempting Bus ${busId}`,
              studentId,
              student: student.full_name,
              registerNumber: student.register_number,
              boardingBusId: busId,
              busId,
              assignedBusId: assignment.bus_id,
              assignedStopId: assignment.stop_id,
              confidenceScore,
              severity: 'HIGH',
              timestamp: new Date().toISOString()
            };
          } else if (assignment.stop_id !== stopId) {
            // 4. Verify stop authorization
            verification = {
              status: 'WRONG_STOP',
              reason: `Student assigned to Stop ${assignment.stop_id}, attempting Stop ${stopId}`,
              studentId,
              student: student.full_name,
              registerNumber: student.register_number,
              busId,
              boardingStopId: stopId,
              assignedStopId: assignment.stop_id,
              confidenceScore,
              severity: 'MEDIUM',
              timestamp: new Date().toISOString()
            };
          } else {
            // 5. All checks passed - VERIFIED
            verification = {
              status: 'VERIFIED',
              reason: 'Student authorized to board this bus at this stop',
              studentId,
              student: student.full_name,
              registerNumber: student.register_number,
              busId,
              stopId,
              boardingPassNumber: assignment.boarding_pass_number,
              confidenceScore,
              severity: 'NONE',
              timestamp: new Date().toISOString()
            };
          }
        }
      }

      // Phase 9: After verification, trigger alert if anomaly
      if (verification.status !== 'VERIFIED') {
        try {
          const alertService = require('./alertService');
          await alertService.createAlert(verification);
        } catch (alertErr) {
          console.error('[ALERT CREATION FAILED]', alertErr.message);
        }
      }

      return verification;
    } catch (err) {
      console.error('[VERIFICATION ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Check if student already boarded today
   */
  async hasStudentAlreadyBoarded(studentId, busId, date = null) {
    try {
      const queryDate = date ? `'${date}'` : 'CURRENT_DATE';
      const result = await db.query(
        `SELECT id, boarding_status, boarded_at
         FROM student_attendance_log
         WHERE student_id = $1 
           AND bus_id = $2 
           AND date = ${queryDate}
         ORDER BY boarded_at DESC
         LIMIT 1`,
        [studentId, busId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (err) {
      console.error('[ATTENDANCE CHECK ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Log verified boarding event in student_attendance_log
   */
  async logBoardingEvent(studentId, busId, stopId, verificationStatus, confidenceScore = 0.95) {
    try {
      const result = await db.query(
        `INSERT INTO student_attendance_log
         (student_id, bus_id, date, session_type, boarding_status, verified_by_biometric, boarded_at)
         VALUES ($1, $2, CURRENT_DATE, 'Morning', 'Boarded', $3, NOW())
         RETURNING *`,
        [studentId, busId, verificationStatus === 'VERIFIED' || verificationStatus === true]
      );

      return result.rows[0];
    } catch (err) {
      console.error('[ATTENDANCE LOG ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Create boarding verification event with full audit trail
   */
  async createBoardingEvent(verificationResult, recognitionData = {}) {
    try {
      const result = await db.query(
        `INSERT INTO boarding_verification_events
         (
           student_id, bus_id, stop_id,
           confidence_score, verification_status,
           assigned_bus_id, assigned_stop_id,
           photo_path,
           biometric_verified
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          verificationResult.studentId || null,
          verificationResult.boardingBusId || verificationResult.busId,
          verificationResult.boardingStopId || verificationResult.stopId || null,
          verificationResult.confidenceScore || 0,
          verificationResult.status,
          verificationResult.assignedBusId || null,
          verificationResult.assignedStopId || null,
          recognitionData.photoPath || null,
          verificationResult.status === 'VERIFIED'
        ]
      );

      return result.rows[0];
    } catch (err) {
      console.error('[BOARDING EVENT LOG ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Get real-time boarding summary for a bus
   */
  async getBusBoardingSummary(busId, date = null) {
    try {
      const queryDate = date ? `'${date}'` : 'CURRENT_DATE';
      
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_boardings,
          COUNT(CASE WHEN verified_by_biometric THEN 1 END) as verified_boardings,
          COUNT(CASE WHEN boarding_status = 'Boarded' THEN 1 END) as completed_boardings,
          COUNT(CASE WHEN boarding_status = 'Absent' THEN 1 END) as absent_count
        FROM student_attendance_log
        WHERE bus_id = $1 AND date = ${queryDate}
      `, [busId]);

      return result.rows[0] || {
        total_boardings: 0,
        verified_boardings: 0,
        completed_boardings: 0,
        absent_count: 0
      };
    } catch (err) {
      console.error('[SUMMARY ERROR]', err.message);
      throw err;
    }
  }

  /**
   * Get anomalies for in-charge dashboard
   */
  async getAnomalyEvents(busId, hoursBack = 24) {
    try {
      const result = await db.query(
        `SELECT 
          bve.id,
          bve.student_id,
          COALESCE(s.full_name, 'Unknown Student') as full_name,
          COALESCE(s.register_number, 'N/A') as register_number,
          bve.verification_status,
          bve.confidence_score,
          bve.assigned_bus_id,
          bve.assigned_stop_id,
          bve.override_status,
          bve.override_reason,
          bve.overridden_at,
          bve.created_at
         FROM boarding_verification_events bve
         LEFT JOIN students s ON bve.student_id = s.id
         WHERE bve.bus_id = $1
           AND bve.verification_status != 'VERIFIED'
           AND bve.created_at > NOW() - INTERVAL '${parseInt(hoursBack) || 24} hours'
         ORDER BY bve.created_at DESC`,
        [busId]
      );

      return result.rows;
    } catch (err) {
      console.error('[ANOMALY FETCH ERROR]', err.message);
      throw err;
    }
  }
}

module.exports = new BoardingVerificationService();
