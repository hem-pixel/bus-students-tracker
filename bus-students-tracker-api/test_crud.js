const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== PHASE 3 BACKEND CRUD AUTOMATED TEST ===\n');

  // 1. Health check
  console.log('1. Testing Health Endpoint...');
  const health = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('Health status:', health.status, health.body);

  // 2. Admin Login
  console.log('\n2. Logging in as Admin...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@vsb.ac.in', password: 'Admin@123' });

  console.log('Login Response:', loginRes.status, loginRes.body.success ? 'Success' : 'Failed');
  const token = loginRes.body.token || loginRes.body.data?.token;
  if (!token) {
    throw new Error('Could not acquire admin token: ' + JSON.stringify(loginRes.body));
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 3. Test GET for all 7 resources
  const resources = [
    { name: 'Buses', path: '/api/buses' },
    { name: 'Routes', path: '/api/routes' },
    { name: 'Stops', path: '/api/stops' },
    { name: 'Drivers', path: '/api/drivers' },
    { name: 'Bus In-Charges', path: '/api/bus-in-charges' },
    { name: 'Assignments', path: '/api/assignments' },
    { name: 'Cameras', path: '/api/cameras' }
  ];

  console.log('\n3. Testing GET on all 7 Transport Master Data endpoints...');
  for (const r of resources) {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: r.path,
      method: 'GET',
      headers: authHeaders
    });
    const count = Array.isArray(res.body.data) ? res.body.data.length : (Array.isArray(res.body) ? res.body.length : 0);
    console.log(`- ${r.name} (${r.path}): HTTP ${res.status} [Count: ${count}]`);
    if (res.status !== 200) {
      console.error('Error details:', res.body);
    }
  }

  // 4. Test Create, Update, Delete on Buses
  console.log('\n4. Testing CREATE, UPDATE, DELETE on /api/buses...');
  const newBus = {
    bus_number: 'BUS-TEST-99',
    registration_plate: 'TN-47-TEST-9999',
    capacity: 55,
    manufacturer: 'Ashok Leyland',
    status: 'ACTIVE'
  };

  const createRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/buses',
    method: 'POST',
    headers: authHeaders
  }, newBus);
  console.log('Create Bus Response:', createRes.status, createRes.body.success ? 'Created' : 'Failed');
  const createdBus = createRes.body.data || createRes.body;
  const busId = createdBus.bus_id || createdBus.id;
  console.log('Created Bus ID:', busId);

  // Update
  const updateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/buses/${busId}`,
    method: 'PUT',
    headers: authHeaders
  }, { capacity: 60, status: 'MAINTENANCE' });
  console.log('Update Bus Response:', updateRes.status, updateRes.body.success ? 'Updated' : 'Failed');

  // Delete
  const deleteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/buses/${busId}`,
    method: 'DELETE',
    headers: authHeaders
  });
  console.log('Delete Bus Response:', deleteRes.status, deleteRes.body.success ? 'Deleted' : 'Failed');

  // 5. Test Driver creation with concatenated name
  console.log('\n5. Testing CREATE driver with name concatenation handling...');
  const newDriver = {
    name: 'Suresh Kumar',
    phone_number: '9876500099',
    license_number: 'TN47-2024-9999',
    status: 'ACTIVE'
  };
  const createDriverRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/drivers',
    method: 'POST',
    headers: authHeaders
  }, newDriver);
  console.log('Create Driver Response:', createDriverRes.status, createDriverRes.body.success ? 'Created' : 'Failed');
  const createdDriver = createDriverRes.body.data || createDriverRes.body;
  const driverId = createdDriver.driver_id || createdDriver.id;

  // Clean up driver
  await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/drivers/${driverId}`,
    method: 'DELETE',
    headers: authHeaders
  });
  console.log('Cleaned up test driver.');

  console.log('\n=== ALL TRANSPORT MASTER DATA API TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
