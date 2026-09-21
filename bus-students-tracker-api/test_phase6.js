const http = require('http');
const app = require('./server');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'BST-AUTH-ADMIN-USR-ADM-001';
const TRANSPORT_STAFF_TOKEN = 'BST-AUTH-TRANSPORT_STAFF-USR-STF-001';
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
  console.log('\n================================================================');
  console.log('🧪 PHASE 6 — CAMERA MANAGEMENT & INTEGRATION TEST SUITE');
  console.log('================================================================\n');

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
    // 1. Health check includes all Phase 6 tables
    console.log('[1/10] Checking Health Endpoint & 21 Database Tables...');
    const healthRes = await request('GET', '/api/health', null, null);
    assert(healthRes.status === 200, 'Health endpoint responds with 200 OK');
    assert(healthRes.body.database && healthRes.body.database.tables.length >= 21, 'Health endpoint lists all 21 system tables');
    assert(healthRes.body.database.tables.includes('cameras'), 'Lists cameras table');
    assert(healthRes.body.database.tables.includes('camera_network_metrics'), 'Lists camera_network_metrics table');
    assert(healthRes.body.database.tables.includes('camera_events'), 'Lists camera_events table');
    assert(healthRes.body.database.tables.includes('camera_calibration'), 'Lists camera_calibration table');
    assert(healthRes.body.database.tables.includes('camera_stream_segments'), 'Lists camera_stream_segments table');

    // 2. Fleet Health Dashboard KPI
    console.log('\n[2/10] Testing Fleet Health Dashboard KPI Summary...');
    const fleetHealthRes = await request('GET', '/api/cameras/health/dashboard');
    assert(fleetHealthRes.status === 200, 'Fleet Health Dashboard returned 200 OK');
    assert(fleetHealthRes.body.success === true, 'Fleet health payload success is true');
    const fh = fleetHealthRes.body.data;
    assert(typeof fh.total_cameras === 'number' && fh.total_cameras >= 6, `Total cameras count is ${fh.total_cameras} (>= 6)`);
    assert(typeof fh.online === 'number' && fh.online >= 3, `Online cameras count is ${fh.online}`);
    assert(typeof fh.connecting === 'number', 'Connecting count exists');
    assert(typeof fh.offline === 'number', 'Offline count exists');
    assert(typeof fh.error === 'number', 'Error count exists');
    assert(typeof fh.calibrated_count === 'number', 'Calibrated count exists');
    assert(typeof fh.average_latency === 'number', `Average latency calculated: ${fh.average_latency}ms`);
    assert(typeof fh.average_fps === 'number', `Average FPS calculated: ${fh.average_fps} fps`);
    assert(typeof fh.active_alerts === 'number', `Active alerts count: ${fh.active_alerts}`);

    // 3. Camera Inventory & Status
    console.log('\n[3/10] Testing Camera Inventory Listing & Individual Status...');
    const camListRes = await request('GET', '/api/cameras');
    assert(camListRes.status === 200, 'Camera list returned 200 OK');
    assert(camListRes.body.data && camListRes.body.data.length >= 6, `Found ${camListRes.body.data.length} cameras`);
    const testCam = camListRes.body.data[0];
    assert(testCam.id && testCam.bus_number, `Camera ${testCam.id} is mapped to bus ${testCam.bus_number}`);
    assert(testCam.rtsp_url && testCam.hls_url, 'Camera has RTSP and HLS streaming URLs configured');

    const statusRes = await request('GET', `/api/cameras/${testCam.id}/status`);
    assert(statusRes.status === 200, `Camera ${testCam.id} status endpoint returned 200 OK`);
    assert(statusRes.body.data.camera_id === testCam.id, 'Status camera_id matches');
    assert(statusRes.body.data.status !== undefined, `Camera status: ${statusRes.body.data.status}`);

    // Filter cameras
    const onlineCamsRes = await request('GET', '/api/cameras?status=ONLINE');
    assert(onlineCamsRes.status === 200, 'Filtered cameras (status=ONLINE) returned 200');
    assert(onlineCamsRes.body.data.every(c => c.status === 'ONLINE'), 'All returned cameras have status=ONLINE');

    // 4. Camera Registration & Modification
    console.log('\n[4/10] Testing Camera Registration & Configuration Updates...');
    const newCamPayload = {
      bus_id: testCam.bus_id,
      camera_name: 'TEST-CAM-999',
      model: 'Hikvision DS-2CD2143G2-I',
      ip_address: '192.168.1.199',
      mac_address: '00:1A:2B:3C:4D:99',
      camera_type: 'CABIN_WIDE',
      resolution: '1920x1080',
      fps: 30,
      field_of_view: 110.0,
      night_vision_enabled: true,
      audio_enabled: false,
      rtsp_url: 'rtsp://admin:password@192.168.1.199:554/live',
      hls_url: 'http://stream.vsb.ac.in/hls/test999/index.m3u8',
      hardware_version: 'HW-V3.2',
      firmware_version: 'FW-V2.1.0'
    };
    const createCamRes = await request('POST', '/api/cameras', newCamPayload);
    assert(createCamRes.status === 201, 'Created new camera successfully (201 Created)');
    const createdCamId = createCamRes.body.data.id;
    assert(createdCamId, `Created camera ID: ${createdCamId}`);

    const updateCamRes = await request('PUT', `/api/cameras/${createdCamId}`, {
      status: 'CONNECTING',
      firmware_version: 'FW-V2.1.1'
    });
    assert(updateCamRes.status === 200, 'Updated camera successfully (200 OK)');
    assert(updateCamRes.body.data.status === 'CONNECTING', 'Camera status updated to CONNECTING');
    assert(updateCamRes.body.data.firmware_version === 'FW-V2.1.1', 'Camera firmware updated');

    // 5. Camera Network Metrics & Threshold Alert Trigger
    console.log('\n[5/10] Testing Metrics Ingestion, History & Alert Automation...');
    const metricsPayload = {
      camera_id: testCam.id,
      connection_type: 'WIFI',
      signal_strength_dbm: -62,
      latency_ms: 28.5,
      bandwidth_kbps: 4120.0,
      packet_loss_percent: 8.5, // High packet loss triggers alert!
      jitter_ms: 4.2,
      fps_actual: 29.8,
      bitrate_actual_kbps: 4050.0,
      cpu_usage_percent: 54.2,
      memory_usage_percent: 61.8,
      temperature_celsius: 43.5,
      battery_level_percent: 94.0
    };
    const recordMetricsRes = await request('POST', '/api/camera-metrics', metricsPayload);
    assert(recordMetricsRes.status === 201, 'Recorded camera metrics successfully (201)');

    const latestMetricsRes = await request('GET', `/api/camera-metrics/${testCam.id}/latest`);
    assert(latestMetricsRes.status === 200, 'Latest metrics retrieved');
    assert(latestMetricsRes.body.data.camera_id === testCam.id, 'Latest metrics camera_id matches');

    const historyMetricsRes = await request('GET', `/api/camera-metrics/${testCam.id}/history?limit=5`);
    assert(historyMetricsRes.status === 200, 'Metrics history retrieved');
    assert(Array.isArray(historyMetricsRes.body.data), 'History data is an array');

    // 6. Camera Events & Resolution
    console.log('\n[6/10] Testing Camera Events & Incident Resolution...');
    const eventListRes = await request('GET', '/api/camera-events');
    assert(eventListRes.status === 200, 'Camera events list returned 200 OK');
    assert(eventListRes.body.data.length >= 1, `Found ${eventListRes.body.data.length} camera events`);

    const unresolvedRes = await request('GET', '/api/camera-events/unresolved');
    assert(unresolvedRes.status === 200, 'Unresolved events list returned 200 OK');

    const newEventRes = await request('POST', '/api/camera-events', {
      camera_id: testCam.id,
      bus_id: testCam.bus_id,
      event_type: 'TAMPER_DETECTED',
      severity: 'HIGH',
      description: 'Physical tilt angle anomaly detected on driver cabin mount'
    });
    assert(newEventRes.status === 201, 'Created new camera event (201 Created)');
    const eventId = newEventRes.body.data.id;

    const resolveEventRes = await request('PUT', `/api/camera-events/${eventId}/resolve`, {
      resolution_notes: 'Mount tightened and recalibrated by technician.'
    });
    assert(resolveEventRes.status === 200, 'Resolved camera event successfully (200 OK)');
    assert(resolveEventRes.body.data.is_resolved === true, 'Event marked as resolved');

    // 7. Camera Calibration
    console.log('\n[7/10] Testing Camera Calibration & Verification...');
    const calibPayload = {
      camera_id: testCam.id,
      bus_id: testCam.bus_id,
      calibrated_by: 'Staff Tech A',
      mount_position: 'FRONT_WINDSHIELD_CENTER',
      angle_pitch: 12.5,
      angle_yaw: 0.2,
      angle_roll: -0.1,
      pan: 0,
      tilt: 12.5,
      zoom: 1.0,
      face_box_x_min: 15.0,
      face_box_y_min: 20.0,
      face_box_x_max: 85.0,
      face_box_y_max: 80.0,
      driver_seat_coordinates: { x: 320, y: 240, width: 400, height: 480 },
      calibration_image_url: 'http://storage.vsb.ac.in/calibration/cam-001.jpg',
      verification_status: 'PENDING',
      notes: 'Initial driver position alignment'
    };
    const createCalibRes = await request('POST', '/api/camera-calibration', calibPayload);
    assert(createCalibRes.status === 201, 'Recorded new camera calibration (201 Created)');
    const calibId = createCalibRes.body.data.id;

    const verifyCalibRes = await request('PUT', `/api/camera-calibration/${calibId}/verify`, {
      verified_by: 'Admin Lead',
      status: 'VERIFIED',
      notes: 'Passed facial bounding box compliance test.'
    });
    assert(verifyCalibRes.status === 200, 'Verified camera calibration (200 OK)');
    assert(verifyCalibRes.body.data.verification_status === 'VERIFIED', 'Calibration status is VERIFIED');

    const calibHistoryRes = await request('GET', `/api/camera-calibration/${testCam.id}`);
    assert(calibHistoryRes.status === 200, 'Calibration history retrieved successfully');
    assert(calibHistoryRes.body.data.length >= 1, 'Calibration history records exist');

    // 8. Stream Segments & Storage Usage
    console.log('\n[8/10] Testing Stream Segments & Storage Management...');
    const segmentsRes = await request('GET', '/api/camera-streams');
    assert(segmentsRes.status === 200, 'Stream segments list returned 200 OK');

    const storageRes = await request('GET', '/api/camera-streams/storage');
    assert(storageRes.status === 200, 'Stream storage usage returned 200 OK');
    assert(typeof storageRes.body.data.total_storage_mb === 'number', `Total storage used: ${storageRes.body.data.total_storage_mb} MB`);
    assert(Array.isArray(storageRes.body.data.by_bus), 'Storage usage broken down by bus');

    const cleanupRes = await request('POST', '/api/camera-streams/cleanup', { retention_days: 30 });
    assert(cleanupRes.status === 200, 'Stream segment cleanup executed (200 OK)');

    // 9. Camera Diagnostics: Ping, Reboot & Network Test
    console.log('\n[9/10] Testing Hardware Diagnostics: Ping, Reboot & Network Trace...');
    const pingRes = await request('POST', '/api/camera-diagnostics/ping', { camera_id: testCam.id });
    assert(pingRes.status === 200, 'Ping camera diagnostic returned 200 OK');
    assert(pingRes.body.data.packet_loss !== undefined, `Ping diagnostic packet loss: ${pingRes.body.data.packet_loss}%`);

    const rebootRes = await request('POST', '/api/camera-diagnostics/reboot', { camera_id: testCam.id });
    assert(rebootRes.status === 200, 'Reboot camera command issued successfully (200 OK)');
    assert(rebootRes.body.data.status === 'REBOOTING', 'Camera transitioning to REBOOTING');

    const netDiagRes = await request('GET', `/api/camera-diagnostics/${testCam.id}/network`);
    assert(netDiagRes.status === 200, 'Network diagnostic report returned 200 OK');
    assert(netDiagRes.body.data.network_health_score !== undefined, `Network health score: ${netDiagRes.body.data.network_health_score}/100`);

    // 10. RBAC Enforcement
    console.log('\n[10/10] Testing RBAC Security & Student Authorization Blocks...');
    // Transport Staff should have full operational access
    const staffHealthRes = await request('GET', '/api/cameras/health/dashboard', null, TRANSPORT_STAFF_TOKEN);
    assert(staffHealthRes.status === 200, 'TRANSPORT_STAFF has access to camera health dashboard (200 OK)');

    // Student role MUST be blocked with 403 Forbidden
    const studentFleetRes = await request('GET', '/api/cameras', null, STUDENT_TOKEN);
    assert(studentFleetRes.status === 403, 'STUDENT role blocked from camera list (403 Forbidden)');

    const studentHealthRes = await request('GET', '/api/cameras/health/dashboard', null, STUDENT_TOKEN);
    assert(studentHealthRes.status === 403, 'STUDENT role blocked from health dashboard (403 Forbidden)');

    const studentMetricsRes = await request('GET', `/api/camera-metrics/${testCam.id}/latest`, null, STUDENT_TOKEN);
    assert(studentMetricsRes.status === 403, 'STUDENT role blocked from camera metrics (403 Forbidden)');

    const studentEventsRes = await request('GET', '/api/camera-events', null, STUDENT_TOKEN);
    assert(studentEventsRes.status === 403, 'STUDENT role blocked from camera events (403 Forbidden)');

    const studentCalibRes = await request('GET', `/api/camera-calibration/${testCam.id}`, null, STUDENT_TOKEN);
    assert(studentCalibRes.status === 403, 'STUDENT role blocked from camera calibration (403 Forbidden)');

    const studentStreamsRes = await request('GET', '/api/camera-streams', null, STUDENT_TOKEN);
    assert(studentStreamsRes.status === 403, 'STUDENT role blocked from camera streams (403 Forbidden)');

    const studentPingRes = await request('POST', '/api/camera-diagnostics/ping', { camera_id: testCam.id }, STUDENT_TOKEN);
    assert(studentPingRes.status === 403, 'STUDENT role blocked from camera diagnostics (403 Forbidden)');

  } catch (error) {
    console.error('\n❌ Unhandled exception during testing:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
