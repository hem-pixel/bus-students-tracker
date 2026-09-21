-- BUS STUDENTS TRACKER — PHASE 3: TRANSPORT MASTER DATA
-- PostgreSQL Database Schema (7 Tables)
-- Target Database: bus_students_tracker_db

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM Types
DO $$ BEGIN
    CREATE TYPE bus_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE route_type_enum AS ENUM ('MORNING', 'EVENING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE generic_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stop_type_enum AS ENUM ('BOARDING', 'DROP', 'BOTH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE staff_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE camera_type_enum AS ENUM ('ENTRY', 'EXIT', 'INTERIOR', 'GPS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE camera_status_enum AS ENUM ('ONLINE', 'CONNECTING', 'OFFLINE', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PHASE 6 CAMERA ENUMS
DO $$ BEGIN
    CREATE TYPE camera_location_type_enum AS ENUM ('ENTRANCE', 'EXIT', 'INTERIOR', 'GPS', 'CABIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stream_type_enum AS ENUM ('RTMP', 'HLS', 'HTTP_MJPEG', 'ONVIF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE power_source_enum AS ENUM ('AC', 'DC', 'BATTERY', 'SOLAR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_status_enum AS ENUM ('CONNECTED', 'DISCONNECTED', 'DEGRADED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stream_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE camera_event_type_enum AS ENUM (
      'ONLINE', 'OFFLINE', 'STREAM_ERROR', 'BATTERY_LOW', 
      'TEMPERATURE_HIGH', 'NETWORK_DEGRADED', 'STORAGE_FULL', 
      'CALIBRATION_NEEDED', 'MAINTENANCE_DUE', 'CONFIG_CHANGE',
      'RECOGNIZED_PERSON', 'UNRECOGNIZED_PERSON', 'ANOMALY'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE camera_event_severity_enum AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calibration_status_enum AS ENUM ('PASSED', 'FAILED', 'NEEDS_ADJUSTMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stream_quality_enum AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'CORRUPTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE retention_policy_enum AS ENUM ('PERMANENT', '30_DAYS', '7_DAYS', 'AUDIT_ONLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_transport_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'REQUESTED', 'APPROVED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_assignment_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'REQUESTED', 'APPROVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transport_request_type_enum AS ENUM ('NEW_ASSIGNMENT', 'CHANGE_ROUTE', 'CHANGE_STOP', 'DISABLE_TRANSPORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transport_request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transport_request_role_enum AS ENUM ('STUDENT', 'PARENT', 'ADMIN', 'TRANSPORT_STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recognition_status_enum AS ENUM ('RECOGNIZED', 'UNKNOWN', 'MISMATCHED', 'MANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_result_enum AS ENUM ('VERIFIED', 'WRONG_BUS', 'WRONG_STOP', 'NOT_BOARDED', 'ANOMALY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- Table 1: buses
CREATE TABLE IF NOT EXISTS buses (
  bus_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number VARCHAR(50) UNIQUE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  registration_plate VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(100),
  manufacturer VARCHAR(100),
  purchase_date DATE,
  status bus_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 2: routes
CREATE TABLE IF NOT EXISTS routes (
  route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name VARCHAR(255) NOT NULL,
  route_code VARCHAR(50) UNIQUE NOT NULL,
  route_type route_type_enum NOT NULL,
  distance_km DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  start_time TIME,
  end_time TIME,
  status generic_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 3: stops
CREATE TABLE IF NOT EXISTS stops (
  stop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  stop_name VARCHAR(255) NOT NULL,
  stop_sequence INTEGER NOT NULL,
  stop_type stop_type_enum DEFAULT 'BOTH',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  estimated_arrival_time TIME,
  estimated_departure_time TIME,
  geofence_radius_meters INTEGER DEFAULT 500,
  status generic_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 4: drivers
CREATE TABLE IF NOT EXISTS drivers (
  driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE,
  aadhar_number VARCHAR(12),
  date_of_birth DATE,
  status staff_status_enum DEFAULT 'ACTIVE',
  assigned_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  assignment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 5: bus_in_charges
CREATE TABLE IF NOT EXISTS bus_in_charges (
  in_charge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  department VARCHAR(100),
  designation VARCHAR(100),
  date_of_birth DATE,
  status staff_status_enum DEFAULT 'ACTIVE',
  assigned_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  assignment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 6: bus_route_assignments
CREATE TABLE IF NOT EXISTS bus_route_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  assigned_date DATE DEFAULT CURRENT_DATE,
  unassigned_date DATE,
  status generic_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bus_id, route_id, assigned_date)
);

-- Table 7: cameras (Phase 6 Enhanced)
CREATE TABLE IF NOT EXISTS cameras (
  camera_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_name VARCHAR(255) NOT NULL,
  camera_model VARCHAR(100),
  manufacturer VARCHAR(100),
  
  -- Bus Assignment
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  
  -- Physical Location
  location VARCHAR(100),
  location_type camera_location_type_enum DEFAULT 'ENTRANCE',
  mounting_height_cm INTEGER,
  viewing_angle_degrees INTEGER,
  
  -- Network Configuration
  ip_address VARCHAR(50) UNIQUE,
  mac_address VARCHAR(17) UNIQUE,
  port INTEGER DEFAULT 8080,
  username VARCHAR(100),
  password_hash VARCHAR(255),
  
  -- Streaming
  stream_url VARCHAR(500),
  stream_type stream_type_enum DEFAULT 'RTMP',
  stream_bitrate_kbps INTEGER DEFAULT 2048,
  stream_resolution VARCHAR(50) DEFAULT '1920x1080',
  frame_rate_fps INTEGER DEFAULT 30,
  
  -- Hardware Specs
  resolution VARCHAR(50),
  sensor_type VARCHAR(100),
  lens_type VARCHAR(100),
  ir_enabled BOOLEAN DEFAULT false,
  night_vision_enabled BOOLEAN DEFAULT false,
  
  -- Power & Battery
  power_source power_source_enum DEFAULT 'AC',
  battery_capacity_mah INTEGER,
  battery_percentage DECIMAL(5, 2),
  battery_last_checked TIMESTAMP,
  
  -- Network Metrics
  status camera_status_enum DEFAULT 'OFFLINE',
  signal_strength_db INTEGER,
  bandwidth_usage_mbps DECIMAL(5, 2),
  packet_loss_percentage DECIMAL(5, 2),
  latency_ms INTEGER,
  
  -- Health Monitoring
  cpu_usage_percentage DECIMAL(5, 2),
  memory_usage_percentage DECIMAL(5, 2),
  storage_usage_percentage DECIMAL(5, 2),
  temperature_celsius DECIMAL(5, 2),
  
  -- Firmware & Software
  firmware_version VARCHAR(50),
  firmware_last_updated TIMESTAMP,
  software_version VARCHAR(50),
  last_reboot TIMESTAMP,
  
  -- Operational Tracking
  installation_date DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_notes TEXT,
  
  -- Status Tracking
  is_active BOOLEAN DEFAULT true,
  is_calibrated BOOLEAN DEFAULT false,
  calibration_date DATE,
  
  last_seen TIMESTAMP,
  last_heartbeat TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 8: students
CREATE TABLE IF NOT EXISTS students (
  student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  date_of_birth DATE,
  department VARCHAR(100),
  semester INTEGER CHECK (semester > 0 AND semester <= 8),
  section VARCHAR(50),
  transport_status student_transport_status_enum DEFAULT 'INACTIVE',
  profile_photo_url TEXT,
  bio_enrolled BOOLEAN DEFAULT false,
  face_recognition_id VARCHAR(255),
  parent_name VARCHAR(100),
  parent_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 9: student_bus_assignments
CREATE TABLE IF NOT EXISTS student_bus_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  boarding_stop_id UUID NOT NULL REFERENCES stops(stop_id) ON DELETE CASCADE,
  drop_stop_id UUID NOT NULL REFERENCES stops(stop_id) ON DELETE CASCADE,
  assignment_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status student_assignment_status_enum DEFAULT 'ACTIVE',
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 10: student_transport_requests
CREATE TABLE IF NOT EXISTS student_transport_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  requested_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  requested_route_id UUID REFERENCES routes(route_id) ON DELETE SET NULL,
  requested_boarding_stop_id UUID REFERENCES stops(stop_id) ON DELETE SET NULL,
  requested_drop_stop_id UUID REFERENCES stops(stop_id) ON DELETE SET NULL,
  request_type transport_request_type_enum DEFAULT 'NEW_ASSIGNMENT',
  request_status transport_request_status_enum DEFAULT 'PENDING',
  requested_by_role transport_request_role_enum DEFAULT 'STUDENT',
  reviewed_by_user_id VARCHAR(255),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 11: student_attendance_log
CREATE TABLE IF NOT EXISTS student_attendance_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  boarding_time TIMESTAMP,
  drop_time TIMESTAMP,
  boarding_stop_id UUID REFERENCES stops(stop_id) ON DELETE SET NULL,
  drop_stop_id UUID REFERENCES stops(stop_id) ON DELETE SET NULL,
  recognition_status recognition_status_enum DEFAULT 'MANUAL',
  verification_result verification_result_enum DEFAULT 'VERIFIED',
  camera_id UUID REFERENCES cameras(camera_id) ON DELETE SET NULL,
  confidence_score DECIMAL(3, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PHASE 5 ENUMS
DO $$ BEGIN
    CREATE TYPE staff_type_enum AS ENUM ('DRIVER', 'BUS_IN_CHARGE', 'TRANSPORT_STAFF', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_enum AS ENUM ('M', 'F', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employment_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_type_enum AS ENUM ('MORNING', 'EVENING', 'FULL_DAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_status_enum AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type_enum AS ENUM ('CASUAL', 'SICK', 'EMERGENCY', 'PERSONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_type_enum AS ENUM ('INCIDENT', 'COMPLAINT', 'COMMENDATION', 'FEEDBACK', 'METRIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE salary_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'REVISED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table 12: staff_roles (Phase 5)
CREATE TABLE IF NOT EXISTS staff_roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(100) UNIQUE NOT NULL,
  role_description TEXT,
  permissions JSONB,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 13: staff_members (Phase 5 Enhanced)
CREATE TABLE IF NOT EXISTS staff_members (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_type staff_type_enum DEFAULT 'DRIVER',
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  date_of_birth DATE,
  gender gender_enum,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  aadhar_number VARCHAR(12),
  pan_number VARCHAR(10),
  
  -- Role & Permissions
  role_id UUID REFERENCES staff_roles(role_id) ON DELETE SET NULL,
  department VARCHAR(100),
  designation VARCHAR(100),
  employment_status employment_status_enum DEFAULT 'ACTIVE',
  hire_date DATE,
  
  -- Credentials
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  last_login TIMESTAMP,
  
  -- Driver-specific
  license_number VARCHAR(50) UNIQUE,
  license_expiry DATE,
  license_category VARCHAR(20),
  license_holder_name VARCHAR(100),
  
  -- Ratings & Performance
  safety_rating DECIMAL(3, 2) DEFAULT 5.00,
  punctuality_rating DECIMAL(3, 2) DEFAULT 5.00,
  student_satisfaction DECIMAL(3, 2) DEFAULT 5.00,
  total_incidents INTEGER DEFAULT 0,
  total_complaints INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
  assignment_date DATE,
  
  profile_photo_url TEXT,
  bio_enrolled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Table 14: staff_shifts (Phase 5)
CREATE TABLE IF NOT EXISTS staff_shifts (
  shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type shift_type_enum DEFAULT 'MORNING',
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  status shift_status_enum DEFAULT 'SCHEDULED',
  shift_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, shift_date, shift_type)
);

-- Table 15: staff_leave_requests (Phase 5)
CREATE TABLE IF NOT EXISTS staff_leave_requests (
  leave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  leave_type leave_type_enum DEFAULT 'CASUAL',
  leave_start_date DATE NOT NULL,
  leave_end_date DATE NOT NULL,
  total_days INTEGER,
  reason TEXT NOT NULL,
  request_status leave_status_enum DEFAULT 'PENDING',
  approved_by_user_id VARCHAR(255),
  approved_at TIMESTAMP,
  approval_notes TEXT,
  replacement_staff_id UUID REFERENCES staff_members(staff_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 16: staff_performance_log (Phase 5)
CREATE TABLE IF NOT EXISTS staff_performance_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  log_type log_type_enum DEFAULT 'FEEDBACK',
  
  -- Incident details
  incident_type VARCHAR(100),
  incident_description TEXT,
  severity severity_enum DEFAULT 'LOW',
  
  -- Complaint details
  complaint_from_student_id UUID REFERENCES students(student_id) ON DELETE SET NULL,
  complaint_description TEXT,
  
  -- Commendation
  commendation_reason TEXT,
  
  -- Feedback/Ratings
  safety_score DECIMAL(3, 2),
  punctuality_score DECIMAL(3, 2),
  student_interaction_score DECIMAL(3, 2),
  professionalism_score DECIMAL(3, 2),
  
  -- Follow-up
  action_taken TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  resolved BOOLEAN DEFAULT false,
  
  created_by_user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 17: staff_salary_structure (Phase 5)
CREATE TABLE IF NOT EXISTS staff_salary_structure (
  salary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff_members(staff_id) ON DELETE CASCADE,
  effective_date DATE DEFAULT CURRENT_DATE,
  
  -- Salary components
  base_salary DECIMAL(10, 2),
  dearness_allowance DECIMAL(10, 2) DEFAULT 0,
  house_rent_allowance DECIMAL(10, 2) DEFAULT 0,
  conveyance_allowance DECIMAL(10, 2) DEFAULT 0,
  medical_allowance DECIMAL(10, 2) DEFAULT 0,
  performance_bonus DECIMAL(10, 2) DEFAULT 0,
  
  total_monthly_salary DECIMAL(10, 2),
  
  -- Deductions
  provident_fund DECIMAL(10, 2) DEFAULT 0,
  income_tax DECIMAL(10, 2) DEFAULT 0,
  
  salary_status salary_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_buses_bus_number ON buses(bus_number);
CREATE INDEX IF NOT EXISTS idx_routes_route_code ON routes(route_code);
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_stops_location ON stops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_bus ON drivers(assigned_bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_in_charges_assigned_bus ON bus_in_charges(assigned_bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_route_assignments_bus ON bus_route_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_route_assignments_route ON bus_route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_cameras_bus ON cameras(bus_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_student_bus_assignments_student ON student_bus_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_bus_assignments_bus ON student_bus_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_student_bus_assignments_route ON student_bus_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_student ON student_transport_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_status ON student_transport_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance_log(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_bus ON student_attendance_log(bus_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_boarding_time ON student_attendance_log(boarding_time);

-- Phase 5 Indexes
CREATE INDEX IF NOT EXISTS idx_staff_members_employee_id ON staff_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_type ON staff_members(staff_type);
CREATE INDEX IF NOT EXISTS idx_staff_members_status ON staff_members(employment_status);
CREATE INDEX IF NOT EXISTS idx_staff_members_assigned_bus ON staff_members(assigned_bus_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff ON staff_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_bus ON staff_shifts(bus_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON staff_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_staff_leave_staff ON staff_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_leave_status ON staff_leave_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_staff_performance_staff ON staff_performance_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_salary_staff ON staff_salary_structure(staff_id);

-- ============================================================
-- PHASE 6 TABLES — CAMERA MANAGEMENT & INTEGRATION
-- ============================================================

-- Table 18: Camera Network Metrics (Time-series health & performance telemetry)
CREATE TABLE IF NOT EXISTS camera_network_metrics (
  metric_id SERIAL PRIMARY KEY,
  camera_id INTEGER NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  bus_id INTEGER NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ping_latency_ms NUMERIC(6, 2) DEFAULT 0.00,
  packet_loss_percentage NUMERIC(5, 2) DEFAULT 0.00,
  jitter_ms NUMERIC(6, 2) DEFAULT 0.00,
  bandwidth_kbps INTEGER DEFAULT 0,
  connection_quality connection_quality_enum DEFAULT 'GOOD',
  battery_percentage INTEGER,
  cpu_usage_percentage NUMERIC(5, 2) DEFAULT 0.00,
  memory_usage_percentage NUMERIC(5, 2) DEFAULT 0.00,
  temperature_celsius NUMERIC(4, 1) DEFAULT 0.0,
  fps_current NUMERIC(4, 1) DEFAULT 30.0,
  bitrate_current_kbps INTEGER DEFAULT 2048,
  network_type network_type_enum DEFAULT '4G'
);

-- Table 19: Camera Events & Alerts (Incidents, alarms, anomalies)
CREATE TABLE IF NOT EXISTS camera_events (
  event_id SERIAL PRIMARY KEY,
  camera_id INTEGER NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  bus_id INTEGER NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  event_type camera_event_type_enum NOT NULL,
  severity camera_event_severity_enum DEFAULT 'WARNING',
  event_description TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 20: Camera Calibration & Alignment
CREATE TABLE IF NOT EXISTS camera_calibration (
  calibration_id SERIAL PRIMARY KEY,
  camera_id INTEGER NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  calibrated_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  calibration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pan_angle_deg NUMERIC(5, 2) DEFAULT 0.00,
  tilt_angle_deg NUMERIC(5, 2) DEFAULT -15.00,
  zoom_factor NUMERIC(3, 1) DEFAULT 1.0,
  focus_distance_m NUMERIC(4, 2) DEFAULT 2.50,
  face_detection_threshold NUMERIC(3, 2) DEFAULT 0.85,
  min_face_size_pixels INTEGER DEFAULT 80,
  calibration_status calibration_status_enum DEFAULT 'PENDING_VERIFICATION',
  reference_image_url TEXT,
  notes TEXT,
  verified_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 21: Camera Stream Segments (Archived recordings & retention)
CREATE TABLE IF NOT EXISTS camera_stream_segments (
  segment_id SERIAL PRIMARY KEY,
  camera_id INTEGER NOT NULL REFERENCES cameras(camera_id) ON DELETE CASCADE,
  bus_id INTEGER NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
  shift_id INTEGER REFERENCES staff_shifts(shift_id) ON DELETE SET NULL,
  segment_start_time TIMESTAMP NOT NULL,
  segment_end_time TIMESTAMP NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  stream_quality stream_quality_enum DEFAULT '720p',
  retention_policy retention_policy_enum DEFAULT '7_DAYS',
  is_archived BOOLEAN DEFAULT FALSE,
  archive_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase 6 Indexes
CREATE INDEX IF NOT EXISTS idx_camera_metrics_camera_time ON camera_network_metrics(camera_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_camera_metrics_bus ON camera_network_metrics(bus_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_camera ON camera_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_bus ON camera_events(bus_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_unresolved ON camera_events(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_camera_events_severity ON camera_events(severity);
CREATE INDEX IF NOT EXISTS idx_camera_calibration_camera ON camera_calibration(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_stream_segments_camera_time ON camera_stream_segments(camera_id, segment_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_camera_stream_segments_bus ON camera_stream_segments(bus_id);
CREATE INDEX IF NOT EXISTS idx_camera_stream_segments_retention ON camera_stream_segments(retention_policy, is_archived);

