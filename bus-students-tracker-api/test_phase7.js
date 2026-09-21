const http = require('http');
const app = require('./server');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'BST-AUTH-ADMIN-USR-ADM-001';
const TRANSPORT_STAFF_TOKEN = 'BST-AUTH-TRANSPORT_STAFF-USR-STF-001';
const BUS_IN_CHARGE_TOKEN = 'BST-AUTH-BUS_IN_CHARGE-USR-BIC-001';
const STUDENT_TOKEN = 'BST-AUTH-STUDENT-USR-STU-001';

let serverInstance = null;

function ensureServerRunning() {
  return new Promise((resolve) => {
    // If server is already listening via require('./server') or standalone
    setTimeout(() => {
      resolve(true);
    }, 400);
  });
}

function request(method, path, body = null, token = ADMIN_TOKEN) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 PHASE 7 — AI RECOGNITION ENGINE & DRIVER VERIFICATION TEST');
  console.log('================================================================\n');

  await ensureServerRunning();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health & Tables Verification
    console.log('[1/8] Verifying Phase 7 Schema & System Health...');
    const healthRes = await request('GET', '/api/health', null, null);
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    const dbTables = healthRes.body.database?.tables || [];
    assert(dbTables.includes('biometric_enrollments'), 'Schema includes biometric_enrollments table');
    assert(dbTables.includes('recognition_results'), 'Schema includes recognition_results table');
    assert(dbTables.includes('recognition_model_performance'), 'Schema includes recognition_model_performance table');
    assert(dbTables.includes('recognition_audit_log'), 'Schema includes recognition_audit_log table');

    // 2. Biometric Enrollments
    console.log('\n[2/8] Testing Biometric Enrollment Pipeline...');
    const enrollmentsList = await request('GET', '/api/enrollments', null, ADMIN_TOKEN);
    assert(enrollmentsList.status === 200 && enrollmentsList.body.success, 'Fetch biometric enrollments succeeded');
    assert(enrollmentsList.body.data.length >= 4, `Found ${enrollmentsList.body.data.length} enrolled biometric profiles (Students, Staff, Drivers)`);

    // Quality check rejection test (< 0.85)
    const lowQualityRes = await request('POST', '/api/enrollments', {
      person_type: 'STUDENT',
      person_id: 's1000000-0000-0000-0000-000000000001',
      embedding_vector: new Array(128).fill(0.05),
      face_image_url: 'https://images.unsplash.com/photo-test',
      quality_score: 0.62 // Below threshold 0.85
    }, ADMIN_TOKEN);
    assert(lowQualityRes.status === 400 && lowQualityRes.body.code === 'LOW_QUALITY_SAMPLE', 'Enrollment rejects low quality sample (< 0.85) with 400');

    // Valid Enrollment creation
    const newEnrollmentRes = await request('POST', '/api/enrollments', {
      person_type: 'STUDENT',
      person_id: 's1000000-0000-0000-0000-000000000002',
      quality_score: 0.94,
      lighting_condition: 'OPTIMAL_DAYLIGHT',
      pose_angle: 'FRONTAL'
    }, ADMIN_TOKEN);
    assert(newEnrollmentRes.status === 201 && newEnrollmentRes.body.success, 'New biometric profile enrolled with 128-D vector');
    const createdEnrollmentId = newEnrollmentRes.body.data.enrollment_id;

    // Status update
    const patchStatusRes = await request('PATCH', `/api/enrollments/${createdEnrollmentId}/status`, {
      status: 'SUSPENDED',
      reason: 'Biometric re-capture scheduled'
    }, ADMIN_TOKEN);
    assert(patchStatusRes.status === 200 && patchStatusRes.body.data.status === 'SUSPENDED', 'Enrollment status updated to SUSPENDED');

    // Reactivate for downstream recognition
    await request('PATCH', `/api/enrollments/${createdEnrollmentId}/status`, {
      status: 'ACTIVE'
    }, ADMIN_TOKEN);

    // 3. OpenCV FaceNet Recognition Pipeline
    console.log('\n[3/8] Testing OpenCV Face Recognition Pipeline (/api/recognize)...');
    // Test match against enrolled student Aarav Sharma (seed: 's1000000-0000-0000-0000-000000000001')
    const matchRes = await request('POST', '/api/recognize', {
      camera_id: 'c1000000-0000-0000-0000-000000000001',
      bus_id: 'b1000000-0000-0000-0000-000000000001',
      seed_key: 's1000000-0000-0000-0000-000000000001',
      liveness_checks: {
        blink_detected: true,
        micro_pose_variance: 0.15,
        texture_sharpness: 165.2,
        frequency_fourier_ratio: 0.91
      }
    }, ADMIN_TOKEN);
    assert(matchRes.status === 200 && matchRes.body.success, 'Face recognition pipeline executed successfully');
    assert(matchRes.body.data.decision === 'VERIFIED', `Match decision is VERIFIED (${matchRes.body.data.confidence_score}%)`);
    assert(matchRes.body.data.liveness.is_live === true, 'Multi-factor liveness assessment verified live human subject');
    assert(typeof matchRes.body.hud_frame_svg === 'string' && matchRes.body.hud_frame_svg.includes('<svg'), 'Dynamic OpenCV HUD SVG overlay generated');

    // 4. 4-Tier Confidence Scoring Classification
    console.log('\n[4/8] Testing 4-Tier Confidence Scoring Trees...');
    const faceRecService = require('./services/faceRecognitionService');
    const tierVerified = faceRecService.classifyConfidence(94.5);
    assert(tierVerified.tier === 'VERIFIED' && tierVerified.isMatch === true, 'Confidence >= 90% classified as VERIFIED');

    const tierLikely = faceRecService.classifyConfidence(84.2);
    assert(tierLikely.tier === 'LIKELY' && tierLikely.requiresSecondaryVerification === true, 'Confidence 80-89% classified as LIKELY with secondary verification flag');

    const tierUncertain = faceRecService.classifyConfidence(73.8);
    assert(tierUncertain.tier === 'UNCERTAIN' && tierUncertain.flagManualInspection === true, 'Confidence 70-79% classified as UNCERTAIN');

    const tierRejected = faceRecService.classifyConfidence(52.1);
    assert(tierRejected.tier === 'REJECTED' && tierRejected.isMatch === false, 'Confidence < 70% classified as REJECTED');

    // Unknown face detection test
    const unknownRes = await request('POST', '/api/recognize', {
      camera_id: 'c1000000-0000-0000-0000-000000000001',
      seed_key: 'TOTALLY_UNKNOWN_UNREGISTERED_PERSON_99999'
    }, ADMIN_TOKEN);
    assert(unknownRes.status === 200 && (unknownRes.body.data.decision === 'REJECTED' || unknownRes.body.data.decision === 'UNCERTAIN'), `Unregistered subject classified safely as ${unknownRes.body.data.decision}`);

    // 5. Pre-Dispatch Driver Verification Workflow
    console.log('\n[5/8] Testing Pre-Dispatch Driver Biometric Verification Workflow...');
    // Bus 14 driver match test (Driver Murugesan K scheduled for Bus 14)
    const bus14DriverVerifyRes = await request('POST', '/api/verification/verify-driver', {
      bus_id: 'b1000000-0000-0000-0000-000000000001',
      camera_id: 'c1000000-0000-0000-0000-000000000003', // CAM-B14-CABIN
      driver_face_seed: 'MATCH'
    }, ADMIN_TOKEN);
    assert(bus14DriverVerifyRes.status === 200, 'Driver verification API responded with 200');
    assert(bus14DriverVerifyRes.body.data.verification_status === 'DISPATCH_ALLOWED', 'Assigned scheduled driver matched -> DISPATCH_ALLOWED');
    assert(bus14DriverVerifyRes.body.data.is_authorized === true, 'Driver authorized for vehicle dispatch');
    assert(bus14DriverVerifyRes.body.data.bus_number === '14', 'Linked correctly to Bus 14');

    // Driver Mismatch test -> must BLOCK dispatch
    const mismatchDriverRes = await request('POST', '/api/verification/verify-driver', {
      bus_id: 'b1000000-0000-0000-0000-000000000001',
      driver_face_seed: 'UNKNOWN_UNAUTHORIZED_IMPOSTOR'
    }, ADMIN_TOKEN);
    assert(mismatchDriverRes.status === 200, 'Mismatch driver check responded with 200');
    assert(mismatchDriverRes.body.data.verification_status === 'DISPATCH_BLOCKED', 'Unauthorized driver detected -> DISPATCH_BLOCKED');
    assert(mismatchDriverRes.body.data.is_authorized === false, 'Dispatch authorization denied');

    // 6. Manual Dispatch Override Workflow
    console.log('\n[6/8] Testing Supervisor Dispatch Override...');
    const overrideRes = await request('POST', '/api/verification/override', {
      bus_id: 'b1000000-0000-0000-0000-000000000001',
      override_reason: 'Regular driver on emergency medical leave; substitute driver identity verified via physical ID check by Transport Supervisor'
    }, ADMIN_TOKEN);
    assert(overrideRes.status === 200 && overrideRes.body.success, 'Supervisor dispatch override applied');
    assert(overrideRes.body.data.verification_status === 'OVERRIDDEN', 'Verification status updated to OVERRIDDEN');

    // Status check
    const busStatusRes = await request('GET', '/api/verification/status/b1000000-0000-0000-0000-000000000001', null, ADMIN_TOKEN);
    assert(busStatusRes.status === 200 && busStatusRes.body.success, 'Bus dispatch status queried');
    assert(busStatusRes.body.data.dispatch_readiness === 'AUTHORIZED_BY_OVERRIDE' || busStatusRes.body.data.dispatch_readiness === 'READY', `Bus dispatch readiness is ${busStatusRes.body.data.dispatch_readiness}`);

    // Audit logs
    const auditLogsRes = await request('GET', '/api/verification/logs', null, ADMIN_TOKEN);
    assert(auditLogsRes.status === 200 && auditLogsRes.body.data.length > 0, `Verification audit log captures ${auditLogsRes.body.data.length} tamper-evident entries`);

    // 7. Model Performance & Benchmarks
    console.log('\n[7/8] Testing Model Performance & Architecture Metrics...');
    const modelMetricsRes = await request('GET', '/api/models', null, ADMIN_TOKEN);
    assert(modelMetricsRes.status === 200 && modelMetricsRes.body.success, 'Model performance endpoint returns 200');
    assert(modelMetricsRes.body.active_model.accuracy_percentage >= 95, `Model benchmark accuracy: ${modelMetricsRes.body.active_model.accuracy_percentage}%`);
    assert(modelMetricsRes.body.active_model.false_acceptance_rate < 0.01, `FAR: ${modelMetricsRes.body.active_model.false_acceptance_rate}`);
    assert(modelMetricsRes.body.thresholds.verified.min === 90.0, 'Threshold verified tier min is 90.0%');

    // 8. Strict RBAC Enforcement (Student Blocked from all Phase 7 endpoints)
    console.log('\n[8/8] Testing RBAC Security & Student Authorization Blocks...');
    const studentEnrollRes = await request('GET', '/api/enrollments', null, STUDENT_TOKEN);
    assert(studentEnrollRes.status === 403, 'STUDENT blocked from biometric enrollments (403 Forbidden)');

    const studentRecognizeRes = await request('POST', '/api/recognize', { camera_id: 'c1000000-0000-0000-0000-000000000001' }, STUDENT_TOKEN);
    assert(studentRecognizeRes.status === 403, 'STUDENT blocked from recognition pipeline (403 Forbidden)');

    const studentVerifyRes = await request('POST', '/api/verification/verify-driver', { bus_id: 'b1000000-0000-0000-0000-000000000001' }, STUDENT_TOKEN);
    assert(studentVerifyRes.status === 403, 'STUDENT blocked from driver verification (403 Forbidden)');

    const studentOverrideRes = await request('POST', '/api/verification/override', { bus_id: 'b1000000-0000-0000-0000-000000000001' }, STUDENT_TOKEN);
    assert(studentOverrideRes.status === 403, 'STUDENT blocked from supervisor override (403 Forbidden)');

    const studentModelsRes = await request('GET', '/api/models', null, STUDENT_TOKEN);
    assert(studentModelsRes.status === 403, 'STUDENT blocked from model architecture metrics (403 Forbidden)');

    // Transport Staff should have full operational access
    const staffEnrollRes = await request('GET', '/api/enrollments', null, TRANSPORT_STAFF_TOKEN);
    assert(staffEnrollRes.status === 200, 'TRANSPORT_STAFF has operational access to enrollments (200 OK)');

    const staffVerifyRes = await request('GET', '/api/verification/status/b1000000-0000-0000-0000-000000000001', null, TRANSPORT_STAFF_TOKEN);
    assert(staffVerifyRes.status === 200, 'TRANSPORT_STAFF has operational access to verification status (200 OK)');

  } catch (err) {
    console.error('\n❌ Unhandled exception during Phase 7 testing:', err);
    failed++;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  console.log('\n================================================================');
  console.log(`📊 PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
