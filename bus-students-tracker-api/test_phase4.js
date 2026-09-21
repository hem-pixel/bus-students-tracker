// Phase 4 Backend Integration Test Script
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING PHASE 4 BACKEND INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Health check
    console.log('[1/12] Testing GET /api/health...');
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    if (health.status !== 200) throw new Error(`Health check failed: ${health.status}`);
    console.log('  ✓ Health check passed. Tables in DB:', health.data.database.tables.length);

    // 2. Admin Auth to get JWT
    console.log('[2/12] Authenticating as ADMIN (admin@vsb.ac.in)...');
    const auth = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@vsb.ac.in', password: 'Admin@123' });
    
    if (auth.status !== 200 || !auth.data.token) {
      throw new Error(`Auth failed: ${auth.status} ${JSON.stringify(auth.data)}`);
    }
    const token = auth.data.token;
    console.log('  ✓ Authenticated successfully as ADMIN.');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Student Stats
    console.log('[3/12] Testing GET /api/students/stats...');
    const stats = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/stats',
      method: 'GET',
      headers: authHeaders
    });
    if (stats.status !== 200) throw new Error(`Student stats failed: ${stats.status}`);
    console.log('  ✓ Stats:', JSON.stringify(stats.data.data));

    // 4. List Students
    console.log('[4/12] Testing GET /api/students...');
    const list = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'GET',
      headers: authHeaders
    });
    if (list.status !== 200) throw new Error(`List students failed: ${list.status}`);
    console.log(`  ✓ Retrieved ${list.data.data.length} students.`);

    // 5. Create Student
    console.log('[5/12] Testing POST /api/students...');
    const newStudentData = {
      roll_number: '922522AD099',
      first_name: 'Kavitha',
      last_name: 'M',
      department: 'ARTIFICIAL_INTELLIGENCE_DATA_SCIENCE',
      year_of_study: 3,
      semester: 5,
      section: 'A',
      gender: 'FEMALE',
      email: 'kavitha.m@vsb.ac.in',
      phone: '+91 98765 43299',
      parent_name: 'Muthukumar',
      parent_phone: '+91 98765 11199',
      emergency_contact_phone: '+91 98765 11199',
      address: '12 Gandhiji Road, Karur',
      transport_status: 'INACTIVE'
    };
    const created = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'POST',
      headers: authHeaders
    }, newStudentData);
    if (created.status !== 201) throw new Error(`Create student failed: ${created.status} ${JSON.stringify(created.data)}`);
    const studentId = created.data.data.student_id;
    console.log(`  ✓ Created student ID: ${studentId} (${created.data.data.first_name} ${created.data.data.last_name})`);

    // 6. Update Student
    console.log('[6/12] Testing PUT /api/students/:id...');
    const updated = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/${studentId}`,
      method: 'PUT',
      headers: authHeaders
    }, { transport_status: 'REQUESTED' });
    if (updated.status !== 200 || updated.data.data.transport_status !== 'REQUESTED') {
      throw new Error(`Update student failed: ${updated.status}`);
    }
    console.log('  ✓ Updated student transport_status to REQUESTED.');

    // 7. List Student Bus Assignments
    console.log('[7/12] Testing GET /api/students/assignments...');
    const assignments = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/assignments',
      method: 'GET',
      headers: authHeaders
    });
    if (assignments.status !== 200) throw new Error(`List assignments failed: ${assignments.status}`);
    console.log(`  ✓ Retrieved ${assignments.data.data.length} student bus assignments.`);

    // 8. Transport Requests List
    console.log('[8/12] Testing GET /api/transport-requests...');
    const requests = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/transport-requests',
      method: 'GET',
      headers: authHeaders
    });
    if (requests.status !== 200) throw new Error(`List transport requests failed: ${requests.status}`);
    console.log(`  ✓ Retrieved ${requests.data.data.length} transport requests.`);

    // 9. Submit Transport Request
    console.log('[9/12] Testing POST /api/transport-requests...');
    const newReq = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/transport-requests',
      method: 'POST',
      headers: authHeaders
    }, {
      student_id: studentId,
      requested_route_id: 'r1000000-0000-0000-0000-000000000002',
      request_type: 'NEW_ALLOCATION',
      reason: 'Relocated near Karur Bus Stand route'
    });
    if (newReq.status !== 201) throw new Error(`Submit transport request failed: ${newReq.status} ${JSON.stringify(newReq.data)}`);
    const reqId = newReq.data.data.request_id;
    console.log(`  ✓ Submitted transport request ID: ${reqId}`);

    // 10. Review Transport Request (Approve)
    console.log('[10/12] Testing PUT /api/transport-requests/:id/review (APPROVE)...');
    const reviewed = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transport-requests/${reqId}/review`,
      method: 'PUT',
      headers: authHeaders
    }, {
      request_status: 'APPROVED',
      admin_remarks: 'Approved by Transport Cell - Assigned to Route 1'
    });
    if (reviewed.status !== 200 || reviewed.data.data.request_status !== 'APPROVED') {
      throw new Error(`Review transport request failed: ${reviewed.status}`);
    }
    console.log('  ✓ Request successfully marked APPROVED.');

    // 11. Attendance Logs & Summary
    console.log('[11/12] Testing GET /api/attendance and /api/attendance/summary...');
    const attLogs = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance',
      method: 'GET',
      headers: authHeaders
    });
    const attSummary = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/summary',
      method: 'GET',
      headers: authHeaders
    });
    if (attLogs.status !== 200 || attSummary.status !== 200) {
      throw new Error('Attendance logs or summary failed');
    }
    console.log(`  ✓ Retrieved ${attLogs.data.data.length} attendance logs. Summary today:`, JSON.stringify(attSummary.data.summary));

    // 12. Cleanup Test Student
    console.log('[12/12] Testing DELETE /api/students/:id (cleanup)...');
    const deleted = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/${studentId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    if (deleted.status !== 200) throw new Error(`Delete student failed: ${deleted.status}`);
    console.log('  ✓ Cleaned up test student.');

    console.log('\n====================================================');
    console.log('  ALL 12 BACKEND TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
