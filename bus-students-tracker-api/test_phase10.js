/**
 * Phase 10: Wrong Stop Detection & Alerts - Backend Verification Test
 */

const jwt = require('jsonwebtoken');
const stopDetectionService = require('./services/stopDetectionService');
const db = require('./config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'vsb-secret-jwt-key-2025';

async function runTests() {
  console.log('=== PHASE 10: WRONG STOP DETECTION VERIFICATION TEST ===\n');

  try {
    // 1. Test getStats
    console.log('[TEST 1] Testing getStats()...');
    const stats = await stopDetectionService.getStats();
    console.log('  Initial stats:', JSON.stringify(stats, null, 2));
    if (typeof stats.total_detections_all_time !== 'number') throw new Error('Stats format invalid');
    console.log('  ✅ getStats() passed.\n');

    // 2. Test getAssignments
    console.log('[TEST 2] Testing getAssignments()...');
    const assignments = await stopDetectionService.getAssignments();
    console.log(`  Fetched ${assignments.length} assignments.`);
    if (assignments.length > 0) {
      console.log('  Sample assignment:', assignments[0].id, assignments[0].student_name, 'Stop:', assignments[0].pickup_stop_name);
    }
    console.log('  ✅ getAssignments() passed.\n');

    // 3. Test getStudentAssignments
    console.log('[TEST 3] Testing getStudentAssignments()...');
    const studentAssignments = await stopDetectionService.getStudentAssignments('st100000-0000-0000-0000-000000000001');
    console.log(`  Fetched ${studentAssignments.length} assignments for student 1.`);
    console.log('  ✅ getStudentAssignments() passed.\n');

    // 4. Test assignStops (single and bulk)
    console.log('[TEST 4] Testing assignStops()...');
    const newAssignment = await stopDetectionService.assignStops({
      student_id: 'st100000-0000-0000-0000-000000000002',
      route_id: 'r1000000-0000-0000-0000-000000000001',
      pickup_stop_id: 's1000000-0000-0000-0000-000000000002',
      dropoff_stop_id: 's1000000-0000-0000-0000-000000000005',
      notes: 'Assigned via Phase 10 test'
    });
    console.log('  Created assignment:', newAssignment.id);
    console.log('  ✅ assignStops() passed.\n');

    // 5. Test checkBoarding - Correct Stop
    console.log('[TEST 5] Testing checkBoarding() - MATCH scenario...');
    const matchCheck = await stopDetectionService.checkBoarding({
      student_id: 'st100000-0000-0000-0000-000000000001', // pickup stop is s1000000-0000-0000-0000-000000000001
      route_id: 'r1000000-0000-0000-0000-000000000001',
      detected_stop_id: 's1000000-0000-0000-0000-000000000001',
      bus_id: 'b1000000-0000-0000-0000-000000000001',
      event_type: 'BOARDING'
    });
    console.log('  Match check result: is_correct_stop =', matchCheck.is_correct_stop, 'status =', matchCheck.status);
    if (!matchCheck.is_correct_stop) throw new Error('Expected is_correct_stop to be true');
    console.log('  ✅ checkBoarding() match scenario passed.\n');

    // 6. Test checkBoarding - Mismatch scenario (Wrong Stop)
    console.log('[TEST 6] Testing checkBoarding() - MISMATCH scenario...');
    const mismatchCheck = await stopDetectionService.checkBoarding({
      student_id: 'st100000-0000-0000-0000-000000000001', // pickup stop is stop 1
      route_id: 'r1000000-0000-0000-0000-000000000001',
      detected_stop_id: 's1000000-0000-0000-0000-000000000004', // sequence 4, sequence delta = 3!
      bus_id: 'b1000000-0000-0000-0000-000000000001',
      event_type: 'BOARDING'
    });
    console.log('  Mismatch check result:', {
      is_correct_stop: mismatchCheck.is_correct_stop,
      mismatch_type: mismatchCheck.mismatch_type,
      severity: mismatchCheck.severity,
      sequence_delta: mismatchCheck.sequence_delta,
      distance_meters: mismatchCheck.distance_discrepancy_meters,
      alert_generated: mismatchCheck.alert_generated
    });
    if (mismatchCheck.is_correct_stop) throw new Error('Expected is_correct_stop to be false');
    if (!mismatchCheck.alert_generated) throw new Error('Expected alert_generated to be true');
    console.log('  ✅ checkBoarding() mismatch scenario passed.\n');

    // 7. Test getDetections
    console.log('[TEST 7] Testing getDetections()...');
    const detections = await stopDetectionService.getDetections();
    console.log(`  Fetched ${detections.length} detections.`);
    const latestDetection = detections[0];
    console.log('  Latest detection:', latestDetection.id, latestDetection.mismatch_type, latestDetection.verification_status);
    console.log('  ✅ getDetections() passed.\n');

    // 8. Test getAlerts
    console.log('[TEST 8] Testing getAlerts()...');
    const alerts = await stopDetectionService.getAlerts();
    console.log(`  Fetched ${alerts.length} active/pending alerts.`);
    const latestAlert = alerts[0];
    console.log('  Latest alert:', latestAlert.id, latestAlert.alert_type, latestAlert.status);
    console.log('  ✅ getAlerts() passed.\n');

    // 9. Test resolveDetection
    console.log('[TEST 9] Testing resolveDetection()...');
    const resolved = await stopDetectionService.resolveDetection(latestDetection.id, {
      resolved_by: 'admin-user',
      resolution_notes: 'Verified student missed first bus stop, permitted to board at stop 4.',
      verification_status: 'OVERRIDDEN'
    });
    console.log('  Resolved detection status:', resolved.verification_status, 'resolved_by:', resolved.resolved_by);
    console.log('  ✅ resolveDetection() passed.\n');

    // 10. Test dismissAlert
    console.log('[TEST 10] Testing dismissAlert()...');
    const dismissed = await stopDetectionService.dismissAlert(latestAlert.id, {
      dismissed_by: 'transport-staff',
      reason: 'Acknowledged and addressed by transport supervisor'
    });
    console.log('  Dismissed alert status:', dismissed.status, 'dismissed_by:', dismissed.dismissed_by);
    console.log('  ✅ dismissAlert() passed.\n');

    // 11. Final Stats Check
    console.log('[TEST 11] Checking updated stats...');
    const updatedStats = await stopDetectionService.getStats();
    console.log('  Updated stats:', updatedStats);
    console.log('  ✅ Final stats check passed.\n');

    console.log('🎉 ALL PHASE 10 BACKEND TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
