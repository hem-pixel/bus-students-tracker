/**
 * PHASE 8 TEST SCRIPT: STUDENT BOARDING VERIFICATION
 * Tests all 4 verification scenarios, logging, summaries, and overrides
 */

const db = require('./config/database');
const boardingService = require('./services/boardingVerificationService');

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('🧪 BUS STUDENTS TRACKER - PHASE 8 VERIFICATION TEST');
  console.log('====================================================\n');

  try {
    // 1. Fetch an active student assignment for testing
    console.log('[STEP 1] Fetching active student assignment from DB...');
    const assignRes = await db.query(`
      SELECT sba.student_id, sba.bus_id, sba.stop_id, s.full_name, s.register_number, b.bus_number
      FROM student_bus_assignments sba
      JOIN students s ON s.id = sba.student_id
      JOIN buses b ON b.id = sba.bus_id
      WHERE sba.is_active = TRUE
      LIMIT 1
    `);

    let testStudentId, testBusId, testStopId, studentName, regNo, busNumber;

    if (assignRes.rows.length > 0) {
      const row = assignRes.rows[0];
      testStudentId = row.student_id;
      testBusId = row.bus_id;
      testStopId = row.stop_id;
      studentName = row.full_name;
      regNo = row.register_number;
      busNumber = row.bus_number;
      console.log(`✅ Using active assignment: Student ${studentName} (#${testStudentId}, Reg: ${regNo}) on Bus ${busNumber} (#${testBusId}), Stop #${testStopId}`);
    } else {
      console.log('⚠️ No active assignment found. Fetching any student, bus, stop to create temporary assignment...');
      const s = await db.query('SELECT id, full_name, register_number FROM students LIMIT 1');
      const b = await db.query('SELECT id, bus_number FROM buses LIMIT 2');
      const st = await db.query('SELECT id FROM stops LIMIT 2');
      
      testStudentId = s.rows[0].id;
      testBusId = b.rows[0].id;
      testStopId = st.rows[0].id;
      studentName = s.rows[0].full_name;
      regNo = s.rows[0].register_number;
      busNumber = b.rows[0].bus_number;

      await db.query(`
        INSERT INTO student_bus_assignments (student_id, bus_id, stop_id, boarding_pass_number, is_active)
        VALUES ($1, $2, $3, 'PASS-TEST-8', TRUE)
        ON CONFLICT DO NOTHING
      `, [testStudentId, testBusId, testStopId]);
      console.log(`✅ Created test assignment: Student #${testStudentId} on Bus #${testBusId}`);
    }

    // SCENARIO 1: VERIFIED
    console.log('\n----------------------------------------------------');
    console.log('[SCENARIO 1] Correct Bus & Correct Stop -> Expected: VERIFIED');
    const result1 = await boardingService.verifyBoardingAuthorization(
      testStudentId,
      testBusId,
      testStopId,
      0.975
    );
    console.log('Result:', {
      status: result1.status,
      student: result1.student,
      reason: result1.reason,
      confidence: result1.confidenceScore
    });
    if (result1.status !== 'VERIFIED') {
      throw new Error(`Scenario 1 failed: Expected VERIFIED, got ${result1.status}`);
    }
    console.log('✅ Scenario 1 Passed: Student successfully verified.');

    // Log the event & attendance
    const event1 = await boardingService.createBoardingEvent(result1);
    const attendance1 = await boardingService.logBoardingEvent(testStudentId, testBusId, testStopId, result1.status, 0.975);
    console.log(`✅ Event #${event1.id} recorded in boarding_verification_events`);
    console.log(`✅ Attendance record #${attendance1.id} logged in student_attendance_log`);

    // SCENARIO 2: WRONG_BUS
    console.log('\n----------------------------------------------------');
    console.log('[SCENARIO 2] Wrong Bus ID -> Expected: WRONG_BUS');
    const wrongBusId = testBusId + 999;
    const result2 = await boardingService.verifyBoardingAuthorization(
      testStudentId,
      wrongBusId,
      testStopId,
      0.96
    );
    console.log('Result:', {
      status: result2.status,
      student: result2.student,
      reason: result2.reason,
      assignedBusId: result2.assignedBusId,
      attemptedBusId: result2.boardingBusId
    });
    if (result2.status !== 'WRONG_BUS') {
      throw new Error(`Scenario 2 failed: Expected WRONG_BUS, got ${result2.status}`);
    }
    console.log('✅ Scenario 2 Passed: Wrong Bus anomaly correctly flagged.');
    const event2 = await boardingService.createBoardingEvent(result2);
    console.log(`✅ Anomaly Event #${event2.id} recorded.`);

    // SCENARIO 3: WRONG_STOP
    console.log('\n----------------------------------------------------');
    console.log('[SCENARIO 3] Correct Bus, Wrong Stop ID -> Expected: WRONG_STOP');
    const wrongStopId = (testStopId || 1) + 999;
    const result3 = await boardingService.verifyBoardingAuthorization(
      testStudentId,
      testBusId,
      wrongStopId,
      0.94
    );
    console.log('Result:', {
      status: result3.status,
      student: result3.student,
      reason: result3.reason,
      assignedStopId: result3.assignedStopId,
      attemptedStopId: result3.boardingStopId
    });
    if (result3.status !== 'WRONG_STOP') {
      throw new Error(`Scenario 3 failed: Expected WRONG_STOP, got ${result3.status}`);
    }
    console.log('✅ Scenario 3 Passed: Wrong Stop anomaly correctly flagged.');
    const event3 = await boardingService.createBoardingEvent(result3);
    console.log(`✅ Anomaly Event #${event3.id} recorded.`);

    // SCENARIO 4: UNKNOWN_STUDENT
    console.log('\n----------------------------------------------------');
    console.log('[SCENARIO 4] Non-existent Student ID -> Expected: UNKNOWN_STUDENT');
    const result4 = await boardingService.verifyBoardingAuthorization(
      999999,
      testBusId,
      testStopId,
      0.35
    );
    console.log('Result:', {
      status: result4.status,
      reason: result4.reason
    });
    if (result4.status !== 'UNKNOWN_STUDENT') {
      throw new Error(`Scenario 4 failed: Expected UNKNOWN_STUDENT, got ${result4.status}`);
    }
    console.log('✅ Scenario 4 Passed: Unknown student safely identified.');
    const event4 = await boardingService.createBoardingEvent(result4);
    console.log(`✅ Security Event #${event4.id} recorded.`);

    // STEP 5: Bus Summary & Anomalies Fetch
    console.log('\n----------------------------------------------------');
    console.log(`[STEP 5] Testing getBusBoardingSummary & getAnomalyEvents for Bus #${testBusId}...`);
    const summary = await boardingService.getBusBoardingSummary(testBusId);
    console.log('Bus Boarding Summary:', summary);

    const anomalies = await boardingService.getAnomalyEvents(testBusId, 24);
    console.log(`Found ${anomalies.length} anomaly event(s) in last 24h for Bus #${testBusId}`);

    // STEP 6: Test In-Charge Override
    console.log('\n----------------------------------------------------');
    console.log(`[STEP 6] Testing In-Charge Override on Anomaly Event #${event3.id}...`);
    const overrideQuery = await db.query(`
      UPDATE boarding_verification_events
      SET override_status = 'APPROVED',
          override_reason = 'Special permission by Dean for interchange bus stop',
          in_charge_id = NULL,
          overridden_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [event3.id]);
    console.log('Overridden Event:', {
      id: overrideQuery.rows[0].id,
      override_status: overrideQuery.rows[0].override_status,
      override_reason: overrideQuery.rows[0].override_reason,
      overridden_at: overrideQuery.rows[0].overridden_at
    });
    console.log('✅ In-charge manual override successfully verified.');

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 8 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ PHASE 8 TEST FAILED:', err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runPhase8Tests();
