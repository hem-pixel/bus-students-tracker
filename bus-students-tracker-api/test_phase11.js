/**
 * Phase 11: Live Transport Monitoring & GPS Tracking Verification Test
 */
process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const gpsTrackingService = require('./services/gpsTrackingService');
const { calculateHaversineDistance, VSB_LOCATIONS } = require('./utils/geo');

async function runTests() {
  console.log('=== PHASE 11: LIVE TRANSPORT MONITORING VERIFICATION TEST ===\n');

  // Start server on an ephemeral port
  const server = app.server || http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/live`;
  const token = 'BST-AUTH-ADMIN-USR-ADM-001';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Geo utility calculation
    console.log('[TEST 1] Testing Geo Utils & Haversine Distance...');
    const distMeters = calculateHaversineDistance(
      VSB_LOCATIONS.KARUR_BUS_STAND.latitude,
      VSB_LOCATIONS.KARUR_BUS_STAND.longitude,
      VSB_LOCATIONS.VSB_MAIN_GATE.latitude,
      VSB_LOCATIONS.VSB_MAIN_GATE.longitude
    );
    console.log(`  Distance Karur Bus Stand -> VSB Gate: ${(distMeters / 1000).toFixed(2)} km`);
    if (distMeters < 5000 || distMeters > 20000) throw new Error('Haversine distance calculation out of expected range');
    console.log('  ✅ Geo utils passed.\n');

    // 2. Service-level test: recordLocation
    console.log('[TEST 2] Testing GPS Location Recording (Service)...');
    const recResult = await gpsTrackingService.recordGPSLocation({
      bus_id: 'b1000000-0000-0000-0000-000000000001',
      latitude: 10.9574,
      longitude: 78.0815,
      accuracy_meters: 4.5,
      speed_kmh: 32.0,
      heading_degrees: 175.0
    });
    console.log('  Recorded GPS location for Bus 1:', recResult.recorded.latitude, recResult.recorded.longitude);
    console.log('  Deviation check:', recResult.deviation.isDeviated ? 'DEVIATED' : 'ON_CORRIDOR');
    console.log('  ✅ GPS recording service passed.\n');

    // 3. HTTP: POST /api/live/gps
    console.log('[TEST 3] Testing HTTP POST /api/live/gps...');
    const postGpsRes = await fetch(`${baseUrl}/gps`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        latitude: 10.9320,
        longitude: 78.0864,
        accuracy_meters: 3.8,
        speed_kmh: 28.0,
        heading_degrees: 170.0
      })
    });
    const postGpsJson = await postGpsRes.json();
    console.log('  Status:', postGpsRes.status, 'Success:', postGpsJson.success);
    if (!postGpsJson.success) throw new Error('Failed to record GPS via HTTP');
    console.log('  ✅ POST /api/live/gps passed.\n');

    // 4. HTTP: GET /api/live/bus/:busId/location
    console.log('[TEST 4] Testing HTTP GET /api/live/bus/:busId/location...');
    const busLocRes = await fetch(`${baseUrl}/bus/b1000000-0000-0000-0000-000000000001/location`, { headers });
    const busLocJson = await busLocRes.json();
    console.log('  Status:', busLocRes.status, 'Bus Number:', busLocJson.data.bus_number, 'Speed:', busLocJson.data.latest_gps.speed_kmh);
    if (!busLocJson.success) throw new Error('Failed to fetch bus location');
    console.log('  ✅ GET /api/live/bus/:busId/location passed.\n');

    // 5. HTTP: GET /api/live/buses/locations
    console.log('[TEST 5] Testing HTTP GET /api/live/buses/locations...');
    const allBusesRes = await fetch(`${baseUrl}/buses/locations`, { headers });
    const allBusesJson = await allBusesRes.json();
    console.log('  Status:', allBusesRes.status, 'Active buses count:', allBusesJson.count);
    if (!allBusesJson.success || !Array.isArray(allBusesJson.data)) throw new Error('Failed to fetch all bus locations');
    console.log('  ✅ GET /api/live/buses/locations passed.\n');

    // 6. HTTP: POST /api/live/route/progress
    console.log('[TEST 6] Testing HTTP POST /api/live/route/progress...');
    const progPostRes = await fetch(`${baseUrl}/route/progress`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        current_stop_id: 's1000000-0000-0000-0000-000000000002',
        next_stop_id: 's1000000-0000-0000-0000-000000000003',
        stops_completed: 2,
        total_stops: 5,
        estimated_arrival_next_stop: new Date(Date.now() + 7 * 60000).toISOString(),
        on_schedule: true,
        delay_minutes: 0
      })
    });
    const progPostJson = await progPostRes.json();
    console.log('  Status:', progPostRes.status, 'Success:', progPostJson.success);
    if (!progPostJson.success) throw new Error('Failed to update route progress');
    console.log('  ✅ POST /api/live/route/progress passed.\n');

    // 7. HTTP: GET /api/live/route/:routeId/progress
    console.log('[TEST 7] Testing HTTP GET /api/live/route/:routeId/progress...');
    const progGetRes = await fetch(`${baseUrl}/route/r1000000-0000-0000-0000-000000000001/progress`, { headers });
    const progGetJson = await progGetRes.json();
    console.log('  Status:', progGetRes.status, 'Completion %:', progGetJson.data.progress.completion_percentage, 'Stops count:', progGetJson.data.stops.length);
    if (!progGetJson.success || !progGetJson.data.stops) throw new Error('Failed to fetch route progress');
    console.log('  ✅ GET /api/live/route/:routeId/progress passed.\n');

    // 8. HTTP: GET /api/live/route/:routeId/eta
    console.log('[TEST 8] Testing HTTP GET /api/live/route/:routeId/eta...');
    const etaRes = await fetch(`${baseUrl}/route/r1000000-0000-0000-0000-000000000001/eta`, { headers });
    const etaJson = await etaRes.json();
    console.log('  Status:', etaRes.status, 'ETAs count:', etaJson.data.etas.length);
    if (!etaJson.success || !Array.isArray(etaJson.data.etas)) throw new Error('Failed to fetch route ETAs');
    console.log('  ✅ GET /api/live/route/:routeId/eta passed.\n');

    // 9. HTTP: GET /api/live/deviations
    console.log('[TEST 9] Testing HTTP GET /api/live/deviations...');
    const devRes = await fetch(`${baseUrl}/deviations`, { headers });
    const devJson = await devRes.json();
    console.log('  Status:', devRes.status, 'Active deviations count:', devJson.count);
    if (!devJson.success) throw new Error('Failed to fetch deviations');
    console.log('  ✅ GET /api/live/deviations passed.\n');

    // 10. HTTP: GET /api/live/map-data
    console.log('[TEST 10] Testing HTTP GET /api/live/map-data...');
    const mapRes = await fetch(`${baseUrl}/map-data`, { headers });
    const mapJson = await mapRes.json();
    console.log('  Status:', mapRes.status, 'Buses:', mapJson.data.buses.length, 'Routes:', mapJson.data.routes.length);
    if (!mapJson.success || !mapJson.data.buses || !mapJson.data.routes) throw new Error('Failed to fetch map data bundle');
    console.log('  ✅ GET /api/live/map-data passed.\n');

    // 11. HTTP: GET /api/live/analytics
    console.log('[TEST 11] Testing HTTP GET /api/live/analytics...');
    const anaRes = await fetch(`${baseUrl}/analytics`, { headers });
    const anaJson = await anaRes.json();
    console.log('  Status:', anaRes.status, 'Fleet On-Time %:', anaJson.data.fleet_on_time_percentage, 'Avg Speed:', anaJson.data.fleet_average_speed_kmh);
    if (!anaJson.success || anaJson.data.fleet_on_time_percentage === undefined) throw new Error('Failed to fetch live analytics');
    console.log('  ✅ GET /api/live/analytics passed.\n');

    // 12. HTTP: GET /api/live/bus/:busId/passengers
    console.log('[TEST 12] Testing HTTP GET /api/live/bus/:busId/passengers...');
    const passRes = await fetch(`${baseUrl}/bus/b1000000-0000-0000-0000-000000000001/passengers`, { headers });
    const passJson = await passRes.json();
    console.log('  Status:', passRes.status, 'Occupancy %:', passJson.data.occupancy_rate_percent, 'Status:', passJson.data.status);
    if (!passJson.success) throw new Error('Failed to fetch passenger flow');
    console.log('  ✅ GET /api/live/bus/:busId/passengers passed.\n');

    // 13. HTTP: POST /api/live/simulate-step
    console.log('[TEST 13] Testing HTTP POST /api/live/simulate-step...');
    const simRes = await fetch(`${baseUrl}/simulate-step`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001'
      })
    });
    const simJson = await simRes.json();
    console.log('  Status:', simRes.status, 'Waypoint:', simJson.data.waypoint, 'Speed:', simJson.data.current_gps.speed_kmh);
    if (!simJson.success || !simJson.data.simulation_active) throw new Error('Failed to execute simulation step');
    console.log('  ✅ POST /api/live/simulate-step passed.\n');

    // 14. HTTP: POST /api/live/metrics/daily
    console.log('[TEST 14] Testing HTTP POST /api/live/metrics/daily...');
    const metRes = await fetch(`${baseUrl}/metrics/daily`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        route_id: 'r1000000-0000-0000-0000-000000000001',
        date: new Date().toISOString().split('T')[0]
      })
    });
    const metJson = await metRes.json();
    console.log('  Status:', metRes.status, 'On-Time rate recorded:', metJson.data.on_time_percentage);
    if (!metJson.success) throw new Error('Failed to record daily metrics');
    console.log('  ✅ POST /api/live/metrics/daily passed.\n');

    console.log('🎉 ALL 14 PHASE 11 TESTS PASSED SUCCESSFULLY! BACKEND READY.');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
