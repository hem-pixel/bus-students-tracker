const http = require('http');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'BST-AUTH-ADMIN-USR-ADM-001';
const DRIVER_TOKEN = 'BST-AUTH-DRIVER-USR-DRV-001';
const STUDENT_TOKEN = 'BST-AUTH-STUDENT-USR-STU-001';

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
  console.log('\n======================================================');
  console.log('🧪 PHASE 5 — STAFF & DRIVER MANAGEMENT TEST SUITE');
  console.log('======================================================\n');

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
    await new Promise(r => setTimeout(r, 400));
    // 1. Health check includes Phase 5 tables
    console.log('[1/8] Checking Health Endpoint & Table Registration...');
    const healthRes = await request('GET', '/api/health', null, null);
    assert(healthRes.status === 200, 'Health endpoint responds with 200 OK');
    assert(
      healthRes.body.database && healthRes.body.database.tables.includes('staff_members'),
      'Health endpoint lists staff_members table'
    );
    assert(
      healthRes.body.database.tables.includes('staff_shifts'),
      'Health endpoint lists staff_shifts table'
    );
    assert(
      healthRes.body.database.tables.includes('staff_leave_requests'),
      'Health endpoint lists staff_leave_requests table'
    );

    // 2. Staff Directory & Stats
    console.log('\n[2/8] Testing Staff Directory & KPIs...');
    const statsRes = await request('GET', '/api/staff/stats');
    assert(statsRes.status === 200, 'Staff stats retrieved successfully');
    assert(statsRes.body.data && statsRes.body.data.total_staff >= 5, 'Stats show seeded staff members');
    assert(statsRes.body.data.active_drivers >= 2, 'Stats show active drivers count');

    const staffListRes = await request('GET', '/api/staff?type=DRIVER');
    assert(staffListRes.status === 200, 'Filtered staff list (type=DRIVER) returned 200');
    assert(staffListRes.body.data.length >= 2, 'Found seeded driver staff members');
    assert(
      staffListRes.body.data.every(s => s.staff_type === 'DRIVER'),
      'All returned staff have staff_type == DRIVER'
    );

    // 3. Staff Creation
    console.log('\n[3/8] Testing Staff Creation & Validation...');
    const newStaffPayload = {
      staff_type: 'DRIVER',
      employee_id: `STF-TEST-${Date.now().toString().slice(-4)}`,
      first_name: 'Murugan',
      last_name: 'Subramanian',
      email: `murugan.${Date.now().toString().slice(-4)}@vsb.ac.in`,
      phone: '+91-9876500001',
      license_number: `DL-TN-VSB-${Date.now().toString().slice(-4)}`,
      license_expiry: '2027-06-30',
      license_category: 'HEAVY_MOTOR_VEHICLE',
      department: 'Transport Department',
      hire_date: '2024-01-10'
    };

    const createStaffRes = await request('POST', '/api/staff', newStaffPayload);
    assert(createStaffRes.status === 201, 'Staff member created successfully (201 Created)');
    const createdStaffId = createStaffRes.body.data ? createStaffRes.body.data.staff_id : null;
    assert(createdStaffId !== null, 'Created staff has valid UUID');

    // Duplicate email or employee_id check
    const dupRes = await request('POST', '/api/staff', newStaffPayload);
    assert(dupRes.status === 409, 'Duplicate employee ID blocked with 409 Conflict');

    // 4. Shift Management
    console.log('\n[4/8] Testing Shift Scheduling & Roster...');
    // Seeded bus Bus 04 (b1000000-0000-0000-0000-000000000001), route Route 04 (r1000000-0000-0000-0000-000000000001)
    const busId = 'b1000000-0000-0000-0000-000000000001';
    const routeId = 'r1000000-0000-0000-0000-000000000001';
    const shiftDate = '2026-09-21';

    const newShiftPayload = {
      staff_id: createdStaffId,
      bus_id: busId,
      route_id: routeId,
      shift_date: shiftDate,
      shift_type: 'MORNING',
      scheduled_start_time: '06:00',
      scheduled_end_time: '09:00',
      shift_notes: 'Morning express student pickup'
    };

    const createShiftRes = await request('POST', '/api/shifts', newShiftPayload);
    assert(createShiftRes.status === 201, 'Shift created with 201 status');
    const shiftId = createShiftRes.body.data ? createShiftRes.body.data.shift_id : null;

    // Duplicate shift for same staff & type on same date should be 409
    const dupShiftRes = await request('POST', '/api/shifts', newShiftPayload);
    assert(dupShiftRes.status === 409, 'Conflicting shift on same day/type blocked with 409 Conflict');

    // Update actual shift times & status
    const updateShiftRes = await request('PUT', `/api/shifts/${shiftId}`, {
      actual_start_time: '2026-09-21T06:04:00Z',
      actual_end_time: '2026-09-21T08:58:00Z',
      status: 'COMPLETED'
    });
    assert(updateShiftRes.status === 200, 'Shift duty marked as COMPLETED with actual timestamps');
    assert(updateShiftRes.body.data.status === 'COMPLETED', 'Status field updated correctly');

    // 5. Leave Request & Approval Workflow
    console.log('\n[5/8] Testing Leave Management Workflow...');
    const leavePayload = {
      staff_id: createdStaffId,
      leave_type: 'CASUAL',
      leave_start_date: '2026-09-25',
      leave_end_date: '2026-09-26',
      reason: 'Personal family event',
      replacement_staff_id: 'sm100000-0000-0000-0000-000000000002' // Sivakumar Kaliappan
    };

    const createLeaveRes = await request('POST', '/api/leave-requests', leavePayload);
    assert(createLeaveRes.status === 201, 'Leave request created with 201 Created');
    const leaveId = createLeaveRes.body.data ? createLeaveRes.body.data.leave_id : null;
    assert(createLeaveRes.body.data.request_status === 'PENDING', 'Leave is initially in PENDING status');
    assert(createLeaveRes.body.data.total_days === 2, 'Total leave days calculated as 2');

    // Approve leave with replacement staff
    const approveRes = await request('PUT', `/api/leave-requests/${leaveId}/approve`, {
      approval_notes: 'Coverage assigned to Sivakumar Kaliappan. Approved by Transport Head.',
      replacement_staff_id: 'sm100000-0000-0000-0000-000000000002'
    });
    assert(approveRes.status === 200, 'Leave approved successfully');
    assert(approveRes.body.data.request_status === 'APPROVED', 'Request status changed to APPROVED');

    // 6. Performance Logging & Driver Scorecard
    console.log('\n[6/8] Testing Performance Logs & Metrics Calculation...');
    const perfPayload = {
      staff_id: createdStaffId,
      log_type: 'FEEDBACK',
      safety_score: 4.8,
      punctuality_score: 4.9,
      student_interaction_score: 5.0,
      professionalism_score: 4.8,
      action_taken: 'Commended during weekly driver briefing.'
    };

    const perfRes = await request('POST', '/api/performance-logs', perfPayload);
    assert(perfRes.status === 201, 'Performance feedback logged with 201 Created');

    const metricsRes = await request('GET', `/api/staff/${createdStaffId}/metrics`);
    assert(metricsRes.status === 200, 'Driver scorecard & metrics calculated');
    assert(metricsRes.body.data && metricsRes.body.data.safety_rating > 0, 'Safety rating calculated');
    assert(metricsRes.body.data.punctuality_rating > 0, 'Punctuality rating calculated');

    // 7. Salary Structure & Compensation
    console.log('\n[7/8] Testing Salary Structure Breakdown...');
    const salaryPayload = {
      base_salary: 22000,
      dearness_allowance: 3000,
      house_rent_allowance: 2500,
      conveyance_allowance: 1500,
      medical_allowance: 1000,
      performance_bonus: 2000,
      provident_fund: 2640,
      income_tax: 500
    };

    const salaryRes = await request('POST', `/api/staff/${createdStaffId}/salary`, salaryPayload);
    assert(salaryRes.status === 200, 'Salary structure configured successfully');
    assert(
      parseFloat(salaryRes.body.data.total_monthly_salary) === 32000,
      'Total monthly gross salary matches sum (32000.00)'
    );
    assert(
      parseFloat(salaryRes.body.data.net_monthly_salary) === 28860,
      'Net monthly take-home salary calculated accurately (32000 - 3140 = 28860.00)'
    );

    // 8. RBAC Enforcements
    console.log('\n[8/8] Testing Role-Based Access Control (RBAC)...');
    // Driver can read staff, but cannot create staff
    const driverStaffCreateRes = await request('POST', '/api/staff', newStaffPayload, DRIVER_TOKEN);
    assert(driverStaffCreateRes.status === 403, 'DRIVER cannot create new staff members (403 Forbidden)');

    // Student cannot access staff management at all
    const studentStaffListRes = await request('GET', '/api/staff', null, STUDENT_TOKEN);
    assert(studentStaffListRes.status === 403, 'STUDENT cannot view staff directory (403 Forbidden)');

    const studentShiftsRes = await request('GET', '/api/shifts', null, STUDENT_TOKEN);
    assert(studentShiftsRes.status === 403, 'STUDENT cannot view shift rosters (403 Forbidden)');

    const studentLeaveApproveRes = await request('PUT', `/api/leave-requests/${leaveId}/approve`, {}, STUDENT_TOKEN);
    assert(studentLeaveApproveRes.status === 403, 'STUDENT cannot approve leaves (403 Forbidden)');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`📊 PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Start server if needed or run tests directly
const app = require('./server');
const server = app.listen(5000, () => {
  runTests().then(() => {
    server.close();
  }).catch(() => {
    server.close();
  });
});
