// FILE: bus-students-tracker-api/scripts/supabase_migrate.js
// PURPOSE: Automated hands-free deployment of 25 tables and VSB College seed data to Supabase PostgreSQL

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPABASE_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:yC9sXi5TXfIlS5j9@db.ovhtvxveijutcpvnggqn.supabase.co:5432/postgres';

const MIGRATION_SQL = `
-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PHASE 3: TRANSPORT MASTER DATA (7 TABLES)
-- ============================================================

CREATE TABLE IF NOT EXISTS buses (
  bus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number VARCHAR(50) UNIQUE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  registration_plate VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(100),
  manufacturer VARCHAR(100),
  purchase_date DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS routes (
  route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name VARCHAR(255) NOT NULL,
  route_code VARCHAR(50) UNIQUE NOT NULL,
  route_type VARCHAR(50) NOT NULL,
  distance_km DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  start_time TIME,
  end_time TIME,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS stops (
  stop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_name VARCHAR(255) NOT NULL,
  stop_sequence INTEGER NOT NULL,
  stop_type VARCHAR(50) DEFAULT 'BOTH',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  landmark VARCHAR(255),
  scheduled_arrival_time TIME,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS drivers (
  driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  date_of_birth DATE,
  date_of_joining DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  assigned_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS bus_in_charges (
  in_charge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  assigned_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS bus_route_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  assignment_date DATE DEFAULT CURRENT_DATE,
  assignment_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(bus_id, route_id, assignment_date)
);

CREATE TABLE IF NOT EXISTS cameras (
  camera_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES buses(bus_id) ON DELETE CASCADE,
  camera_name VARCHAR(100) NOT NULL,
  camera_type VARCHAR(50) DEFAULT 'ENTRY',
  location_type VARCHAR(50) DEFAULT 'ENTRANCE',
  ip_address VARCHAR(50),
  mac_address VARCHAR(50),
  stream_url TEXT,
  stream_type VARCHAR(50) DEFAULT 'HLS',
  resolution VARCHAR(50) DEFAULT '1920x1080',
  fps INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'ONLINE',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- ============================================================
-- PHASE 4: STUDENT TRANSPORT MANAGEMENT (4 TABLES)
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
  student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100) NOT NULL,
  year_of_study INTEGER NOT NULL,
  section VARCHAR(10),
  parent_name VARCHAR(100),
  parent_phone VARCHAR(20),
  parent_email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  transport_status VARCHAR(50) DEFAULT 'ACTIVE',
  profile_photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS student_bus_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops(stop_id) ON DELETE CASCADE,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  seat_number VARCHAR(20),
  assignment_status VARCHAR(50) DEFAULT 'ACTIVE',
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(student_id, academic_year, semester)
);

CREATE TABLE IF NOT EXISTS student_transport_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,
  current_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  requested_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  current_stop_id UUID REFERENCES stops(stop_id) ON DELETE SET NULL,
  requested_stop_id UUID REFERENCES stops(stop_id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  request_status VARCHAR(50) DEFAULT 'PENDING',
  requested_by_role VARCHAR(50) DEFAULT 'STUDENT',
  approved_by_user_id VARCHAR(255),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  effective_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_attendance_log (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops(stop_id) ON DELETE CASCADE,
  camera_id UUID REFERENCES cameras(camera_id) ON DELETE SET NULL,
  trip_type VARCHAR(50) NOT NULL,
  attendance_date DATE DEFAULT CURRENT_DATE,
  boarding_time TIMESTAMP NOT NULL,
  deboarding_time TIMESTAMP,
  recognition_status VARCHAR(50) DEFAULT 'RECOGNIZED',
  confidence_score DECIMAL(5, 2),
  verification_result VARCHAR(50) DEFAULT 'VERIFIED',
  snapshot_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- ============================================================
-- PHASE 5: STAFF TRANSPORT & ATTENDANCE (6 TABLES)
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(100) UNIQUE NOT NULL,
  role_description TEXT,
  permissions JSONB,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_members (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_type VARCHAR(50) DEFAULT 'DRIVER',
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  aadhar_number VARCHAR(12),
  pan_number VARCHAR(10),
  role_id UUID REFERENCES staff_roles(role_id) ON DELETE SET NULL,
  department VARCHAR(100),
  designation VARCHAR(100),
  employment_status VARCHAR(50) DEFAULT 'ACTIVE',
  hire_date DATE,
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  last_login TIMESTAMP,
  license_number VARCHAR(50) UNIQUE,
  license_expiry DATE,
  license_category VARCHAR(20),
  license_holder_name VARCHAR(100),
  safety_rating DECIMAL(3, 2) DEFAULT 5.00,
  punctuality_rating DECIMAL(3, 2) DEFAULT 5.00,
  student_satisfaction DECIMAL(3, 2) DEFAULT 5.00,
  total_incidents INTEGER DEFAULT 0,
  total_complaints INTEGER DEFAULT 0,
  assigned_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  assignment_date DATE,
  profile_photo_url TEXT,
  bio_enrolled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS staff_shifts (
  shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type VARCHAR(50) DEFAULT 'MORNING',
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  shift_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, shift_date, shift_type)
);

CREATE TABLE IF NOT EXISTS staff_leave_requests (
  leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  leave_type VARCHAR(50) DEFAULT 'CASUAL',
  leave_start_date DATE NOT NULL,
  leave_end_date DATE NOT NULL,
  total_days INTEGER,
  reason TEXT NOT NULL,
  request_status VARCHAR(50) DEFAULT 'PENDING',
  approved_by_user_id VARCHAR(255),
  approved_at TIMESTAMP,
  approval_notes TEXT,
  replacement_staff_id UUID REFERENCES staff_members(staff_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_performance_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  log_type VARCHAR(50) DEFAULT 'FEEDBACK',
  incident_type VARCHAR(100),
  incident_description TEXT,
  severity VARCHAR(50) DEFAULT 'LOW',
  complaint_from_student_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
  complaint_description TEXT,
  commendation_details TEXT,
  action_taken TEXT,
  logged_by_user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_salary_structure (
  salary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  effective_date DATE DEFAULT CURRENT_DATE,
  base_salary DECIMAL(10, 2),
  dearness_allowance DECIMAL(10, 2) DEFAULT 0,
  house_rent_allowance DECIMAL(10, 2) DEFAULT 0,
  conveyance_allowance DECIMAL(10, 2) DEFAULT 0,
  medical_allowance DECIMAL(10, 2) DEFAULT 0,
  performance_bonus DECIMAL(10, 2) DEFAULT 0,
  total_monthly_salary DECIMAL(10, 2),
  provident_fund DECIMAL(10, 2) DEFAULT 0,
  income_tax DECIMAL(10, 2) DEFAULT 0,
  salary_status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PHASE 6: CAMERA INFRASTRUCTURE & TELEMETRY (4 TABLES)
-- ============================================================

CREATE TABLE IF NOT EXISTS camera_network_metrics (
  metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ping_latency_ms NUMERIC(6, 2) DEFAULT 0.00,
  packet_loss_percentage NUMERIC(5, 2) DEFAULT 0.00,
  jitter_ms NUMERIC(6, 2) DEFAULT 0.00,
  bandwidth_kbps INTEGER DEFAULT 0,
  connection_quality VARCHAR(50) DEFAULT 'GOOD',
  battery_percentage INTEGER,
  cpu_usage_percentage NUMERIC(5, 2) DEFAULT 0.00,
  memory_usage_percentage NUMERIC(5, 2) DEFAULT 0.00,
  temperature_celsius NUMERIC(4, 1) DEFAULT 0.0,
  fps_current NUMERIC(4, 1) DEFAULT 30.0,
  bitrate_current_kbps INTEGER DEFAULT 2048,
  network_type VARCHAR(50) DEFAULT '4G'
);

CREATE TABLE IF NOT EXISTS camera_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) DEFAULT 'WARNING',
  event_description TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS camera_calibration (
  calibration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  calibrated_by VARCHAR(255),
  calibration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pan_angle_deg NUMERIC(5, 2) DEFAULT 0.00,
  tilt_angle_deg NUMERIC(5, 2) DEFAULT -15.00,
  zoom_factor NUMERIC(3, 1) DEFAULT 1.0,
  focus_distance_m NUMERIC(4, 2) DEFAULT 2.50,
  face_detection_threshold NUMERIC(3, 2) DEFAULT 0.85,
  min_face_size_pixels INTEGER DEFAULT 80,
  calibration_status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  reference_image_url TEXT,
  notes TEXT,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS camera_stream_segments (
  segment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  shift_id UUID REFERENCES staff_shifts(shift_id) ON DELETE SET NULL,
  segment_start_time TIMESTAMP NOT NULL,
  segment_end_time TIMESTAMP NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  stream_quality VARCHAR(50) DEFAULT '720p',
  retention_policy VARCHAR(50) DEFAULT '7_DAYS',
  is_archived BOOLEAN DEFAULT FALSE,
  archive_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PHASE 7: BIOMETRIC & AI MODEL TELEMETRY (4 TABLES)
-- ============================================================

CREATE TABLE IF NOT EXISTS biometric_enrollments (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_type VARCHAR(50) NOT NULL,
  person_id VARCHAR(255) NOT NULL,
  identifier_code VARCHAR(50) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  face_embedding TEXT,
  embedding_vector JSONB,
  face_image_url TEXT,
  thumbnail_url TEXT,
  enrollment_status VARCHAR(50) DEFAULT 'ACTIVE',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  enrollment_quality_score DECIMAL(4, 3) DEFAULT 0.95,
  landmarks_detected INTEGER DEFAULT 68,
  lighting_condition VARCHAR(50) DEFAULT 'OPTIMAL',
  pose_variation VARCHAR(50) DEFAULT 'FRONTAL',
  enrolled_by VARCHAR(255),
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recognition_results (
  result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES cameras(camera_id) ON DELETE SET NULL,
  bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  recognized_person_id VARCHAR(255),
  person_type VARCHAR(50),
  person_name VARCHAR(100),
  confidence_score DECIMAL(5, 2),
  match_status VARCHAR(50),
  decision VARCHAR(50),
  liveness_score DECIMAL(4, 3),
  liveness_status VARCHAR(50),
  distance_metric DECIMAL(5, 3),
  snapshot_url TEXT,
  detection_bbox JSONB,
  recognition_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_by VARCHAR(255),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recognition_model_performance (
  perf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  accuracy DECIMAL(5, 2),
  accuracy_percentage DECIMAL(5, 2),
  precision DECIMAL(5, 2),
  recall DECIMAL(5, 2),
  f1_score DECIMAL(5, 2),
  false_acceptance_rate DECIMAL(6, 4),
  false_rejection_rate DECIMAL(6, 4),
  avg_inference_latency_ms DECIMAL(6, 2),
  optimal_lighting_accuracy DECIMAL(5, 2),
  low_lighting_accuracy DECIMAL(5, 2),
  glare_accuracy DECIMAL(5, 2),
  total_inferences INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  is_active BOOLEAN DEFAULT true,
  metric_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recognition_audit_log (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(100) NOT NULL,
  target_id VARCHAR(255),
  target_type VARCHAR(100),
  performed_by VARCHAR(255),
  role VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_buses_bus_number ON buses(bus_number);
CREATE INDEX IF NOT EXISTS idx_routes_route_code ON routes(route_code);
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_bus ON drivers(assigned_bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_in_charges_assigned_bus ON bus_in_charges(assigned_bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_route_assignments_bus ON bus_route_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_route_assignments_route ON bus_route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_cameras_bus ON cameras(bus_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_student_bus_assignments_student ON student_bus_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_bus_assignments_bus ON student_bus_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_student ON student_transport_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance_log(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_boarding_time ON student_attendance_log(boarding_time);
CREATE INDEX IF NOT EXISTS idx_staff_members_employee_id ON staff_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_assigned_bus ON staff_members(assigned_bus_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_bus ON staff_shifts(bus_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_staff ON staff_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_camera_metrics_camera ON camera_network_metrics(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_bus ON camera_events(bus_id);
CREATE INDEX IF NOT EXISTS idx_biometric_person ON biometric_enrollments(person_id);
CREATE INDEX IF NOT EXISTS idx_recognition_results_bus ON recognition_results(bus_id);
`;

async function runMigration() {
  console.log('🚀 Connecting to Supabase PostgreSQL at:', SUPABASE_DB_URL.replace(/:[^:@]+@/, ':****@'));
  const client = new Client({
    connectionString: SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase DB.');

    console.log('📦 Executing schema creation for all 25 tables...');
    await client.query(MIGRATION_SQL);
    console.log('✅ Schema migration executed successfully.');

    // Query information_schema to verify tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC;
    `);

    console.log(`\n📊 Verified Tables in public schema (${tableRes.rows.length} total):`);
    tableRes.rows.forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.table_name}`);
    });

    return tableRes.rows.map(r => r.table_name);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runMigration().then(() => {
    console.log('\n🎉 Supabase Migration Completed Successfully!');
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { runMigration, MIGRATION_SQL };
