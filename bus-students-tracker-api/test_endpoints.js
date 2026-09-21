const http = require('http');

function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
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

async function run() {
  console.log('=== VERIFYING PHASE 3 TRANSPORT MASTER API ===');

  // 1. Health
  const health = await request('/api/health');
  console.log(`[HEALTH] Status: ${health.status}, State: ${health.body.status}`);

  // 2. Auth Login
  const loginRes = await request('/api/auth/login', 'POST', {
    email: 'admin@vsb.ac.in',
    password: 'Admin@123'
  });
  console.log(`[LOGIN] Status: ${loginRes.status}, User: ${loginRes.body.user?.email}, Role: ${loginRes.body.user?.role}`);
  const token = loginRes.body.token;

  if (!token) {
    console.error('Failed to obtain token');
    process.exit(1);
  }

  // 3. Test all 7 endpoints
  const endpoints = [
    { name: 'Buses', path: '/api/buses' },
    { name: 'Routes', path: '/api/routes' },
    { name: 'Stops', path: '/api/stops' },
    { name: 'Drivers', path: '/api/drivers' },
    { name: 'Bus In-Charges', path: '/api/bus-in-charges' },
    { name: 'Assignments', path: '/api/assignments' },
    { name: 'Cameras', path: '/api/cameras' }
  ];

  for (const ep of endpoints) {
    const res = await request(ep.path, 'GET', null, token);
    const count = Array.isArray(res.body) ? res.body.length : (res.body.data ? res.body.data.length : 'N/A');
    console.log(`[${ep.name.padEnd(16)}] Status: ${res.status} | Records: ${count}`);
    if (Array.isArray(res.body) && res.body.length > 0) {
      const sample = res.body[0];
      const keys = Object.keys(sample).slice(0, 4).join(', ');
      console.log(`  Sample keys: ${keys}`);
    }
  }

  console.log('=== VERIFICATION COMPLETED ===');
}

run().catch(console.error);
