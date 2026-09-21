require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');
const stopRoutes = require('./routes/stops');
const driverRoutes = require('./routes/drivers');
const busInChargeRoutes = require('./routes/busInCharges');
const assignmentRoutes = require('./routes/assignments');
const cameraRoutes = require('./routes/cameras');
const metricRoutes = require('./routes/metrics');
const eventRoutes = require('./routes/events');
const calibrationRoutes = require('./routes/calibration');
const streamRoutes = require('./routes/streams');
const diagnosticsRoutes = require('./routes/diagnostics');
const studentRoutes = require('./routes/students');
const requestRoutes = require('./routes/requests');
const attendanceRoutes = require('./routes/attendance');
const staffRoutes = require('./routes/staff');
const shiftRoutes = require('./routes/shifts');
const leaveRoutes = require('./routes/leaves');
const performanceRoutes = require('./routes/performance');
const salaryRoutes = require('./routes/salary');
const enrollmentRoutes = require('./routes/enrollments');
const recognitionRoutes = require('./routes/recognition');
const verificationRoutes = require('./routes/verification');
const modelRoutes = require('./routes/models');
const boardingRoutes = require('./routes/boarding');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// System Health & Diagnostics
app.get('/api/health', async (req, res) => {
  let dbStatus = 'CONNECTING';
  let latencyMs = null;
  const start = Date.now();

  try {
    const resPing = await pool.query('SELECT 1');
    latencyMs = Date.now() - start;
    dbStatus = pool.isInMemoryFallback ? 'IN_MEMORY_FALLBACK' : 'ONLINE';
  } catch (err) {
    dbStatus = 'OFFLINE';
  }

  res.json({
    service: 'BUS STUDENTS TRACKER — TRANSPORT MASTER API',
    institution: 'V.S.B ENGINEERING COLLEGE',
    department: 'Department of AI & DS',
    status: 'HEALTHY',
    database: {
      status: dbStatus,
      latency_ms: latencyMs,
      tables: [
        'buses', 'routes', 'stops', 'drivers', 'bus_in_charges', 'bus_route_assignments', 'cameras',
        'camera_network_metrics', 'camera_events', 'camera_calibration', 'camera_stream_segments',
        'students', 'student_bus_assignments', 'student_transport_requests', 'student_attendance_log',
        'staff_roles', 'staff_members', 'staff_shifts', 'staff_leave_requests', 'staff_performance_log', 'staff_salary_structure',
        'biometric_enrollments', 'recognition_results', 'recognition_model_performance', 'recognition_audit_log'
      ]
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Resource Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bus-in-charges', busInChargeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/camera-metrics', metricRoutes);
app.use('/api/camera-events', eventRoutes);
app.use('/api/camera-calibration', calibrationRoutes);
app.use('/api/camera-streams', streamRoutes);
app.use('/api/camera-diagnostics', diagnosticsRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/transport-requests', requestRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/leave-requests', leaveRoutes);
app.use('/api/performance-logs', performanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/recognize', recognitionRoutes);
app.use('/api/recognition-results', recognitionRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/boarding', boardingRoutes);
console.log('[SERVER] ✅ Boarding verification routes registered');
app.use('/api/alerts', alertRoutes);
console.log('[SERVER] ✅ Alert management routes registered');

// 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'ENDPOINT_NOT_FOUND',
    message: `The requested endpoint '${req.originalUrl}' does not exist on this server.`
  });
});

// Global Error Handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[BST API] Server initialized on port ${PORT}`);
    console.log(`[BST API] Institution: V.S.B ENGINEERING COLLEGE`);
    console.log(`[BST API] Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
