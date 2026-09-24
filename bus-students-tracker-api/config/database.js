// FILE: bus-students-tracker-api/config/database.js
// PURPOSE: PostgreSQL connection pool with intelligent resilient fallback store for development
// PHASE: Phase 3 — Transport Master Data

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const faceRecognitionService = require('../services/faceRecognitionService');
require('dotenv').config();

let isPgConnected = false;
let fallbackStore = null;

// Configure PostgreSQL connection pool (supports local PostgreSQL & Supabase Cloud PostgreSQL)
let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bus_students_tracker_db';
const isCloudDb = connectionString.includes('supabase.co') || connectionString.includes('sslmode=require');

if (isCloudDb) {
  // Strip ?sslmode=... so pg does not alias to verify-full and reject cloud self-signed certificates
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, '');
}

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: isCloudDb ? 10000 : 2500,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false
});

// Resilient Pre-seeded In-Memory Store (VSB Engineering College Transport Data)
function initFallbackStore() {
  if (fallbackStore) return fallbackStore;

  fallbackStore = {
    buses: [
      {
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        bus_number: 'BUS-14',
        capacity: 54,
        registration_plate: 'TN-47-AV-1414',
        model: 'Viking 222 CRDI',
        manufacturer: 'Ashok Leyland',
        purchase_date: '2023-06-15',
        status: 'ACTIVE',
        created_at: new Date('2023-06-15T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        notes: 'Primary AI & DS corridor shuttle from Karur central'
      },
      {
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        bus_number: 'BUS-08',
        capacity: 50,
        registration_plate: 'TN-47-AV-0808',
        model: 'Starbus Ultra',
        manufacturer: 'Tata Motors',
        purchase_date: '2022-08-10',
        status: 'ACTIVE',
        created_at: new Date('2022-08-10T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        notes: 'Dindigul express transit vehicle'
      },
      {
        bus_id: 'b1000000-0000-0000-0000-000000000003',
        bus_number: 'BUS-22',
        capacity: 54,
        registration_plate: 'TN-47-BW-2222',
        model: 'Lynx Smart Bus',
        manufacturer: 'Ashok Leyland',
        purchase_date: '2024-01-20',
        status: 'ACTIVE',
        created_at: new Date('2024-01-20T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-20T10:00:00Z').toISOString(),
        notes: 'Trichy route high-capacity bus'
      },
      {
        bus_id: 'b1000000-0000-0000-0000-000000000004',
        bus_number: 'BUS-05',
        capacity: 48,
        registration_plate: 'TN-47-AU-0505',
        model: 'Starbus Skool',
        manufacturer: 'Tata Motors',
        purchase_date: '2021-11-05',
        status: 'ACTIVE',
        created_at: new Date('2021-11-05T08:00:00Z').toISOString(),
        updated_at: new Date('2023-11-05T10:00:00Z').toISOString(),
        notes: 'Erode connector transit'
      },
      {
        bus_id: 'b1000000-0000-0000-0000-000000000005',
        bus_number: 'BUS-31',
        capacity: 54,
        registration_plate: 'TN-47-BX-3131',
        model: 'Viking 222 CRDI',
        manufacturer: 'Ashok Leyland',
        purchase_date: '2024-03-01',
        status: 'MAINTENANCE',
        created_at: new Date('2024-03-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-03-05T10:00:00Z').toISOString(),
        notes: 'Scheduled quarterly brake caliper service'
      }
    ],
    routes: [
      {
        route_id: 'r1000000-0000-0000-0000-000000000001',
        route_name: 'Karur Central to VSB Campus',
        route_code: 'RT-KRR-01',
        route_type: 'MORNING',
        distance_km: 18.50,
        estimated_duration_minutes: 40,
        start_time: '07:30:00',
        end_time: '08:15:00',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'High traffic suburban feeder route via Thanthonimalai'
      },
      {
        route_id: 'r1000000-0000-0000-0000-000000000002',
        route_name: 'VSB Campus to Karur Central',
        route_code: 'RT-KRR-02',
        route_type: 'EVENING',
        distance_km: 18.50,
        estimated_duration_minutes: 45,
        start_time: '16:45:00',
        end_time: '17:30:00',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Evening student and faculty return route to Karur'
      },
      {
        route_id: 'r1000000-0000-0000-0000-000000000003',
        route_name: 'Dindigul Junction to VSB Campus',
        route_code: 'RT-DGL-01',
        route_type: 'MORNING',
        distance_km: 45.00,
        estimated_duration_minutes: 65,
        start_time: '07:00:00',
        end_time: '08:10:00',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Inter-district highway commuter route'
      },
      {
        route_id: 'r1000000-0000-0000-0000-000000000004',
        route_name: 'Tiruchirappalli Chathiram to VSB Campus',
        route_code: 'RT-TRY-01',
        route_type: 'MORNING',
        distance_km: 62.00,
        estimated_duration_minutes: 75,
        start_time: '06:45:00',
        end_time: '08:05:00',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'National highway express transit via Kulithalai'
      }
    ],
    stops: [
      {
        stop_id: 's1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_name: 'Karur Central Bus Stand (Bay 4)',
        stop_sequence: 1,
        stop_type: 'BOARDING',
        latitude: 10.95740000,
        longitude: 78.08150000,
        address: 'Central Bus Stand, Karur, TN 639001',
        estimated_arrival_time: '07:30:00',
        estimated_departure_time: '07:35:00',
        geofence_radius_meters: 500,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Primary urban hub'
      },
      {
        stop_id: 's1000000-0000-0000-0000-000000000002',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_name: 'Thanthonimalai Kalyana Mandapam',
        stop_sequence: 2,
        stop_type: 'BOARDING',
        latitude: 10.93200000,
        longitude: 78.08640000,
        address: 'Thanthonimalai Main Road, Karur',
        estimated_arrival_time: '07:45:00',
        estimated_departure_time: '07:47:00',
        geofence_radius_meters: 400,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Residential cluster'
      },
      {
        stop_id: 's1000000-0000-0000-0000-000000000003',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_name: 'Rayanur Junction',
        stop_sequence: 3,
        stop_type: 'BOARDING',
        latitude: 10.91500000,
        longitude: 78.08900000,
        address: 'Rayanur Arch, NH-83, Karur',
        estimated_arrival_time: '07:53:00',
        estimated_departure_time: '07:55:00',
        geofence_radius_meters: 400,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Highway boarding point'
      },
      {
        stop_id: 's1000000-0000-0000-0000-000000000004',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_name: 'Gandhigramam Roundana',
        stop_sequence: 4,
        stop_type: 'BOARDING',
        latitude: 10.90200000,
        longitude: 78.09300000,
        address: 'Gandhigramam Bus Stop, Karur',
        estimated_arrival_time: '08:00:00',
        estimated_departure_time: '08:02:00',
        geofence_radius_meters: 350,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Suburban junction'
      },
      {
        stop_id: 's1000000-0000-0000-0000-000000000005',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_name: 'V.S.B. Engineering College Main Gate',
        stop_sequence: 5,
        stop_type: 'DROP',
        latitude: 10.87560000,
        longitude: 78.10240000,
        address: 'Covai Road, Karudayampalayam, Karur, TN 639111',
        estimated_arrival_time: '08:15:00',
        estimated_departure_time: '08:20:00',
        geofence_radius_meters: 800,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Campus Destination'
      }
    ],
    drivers: [
      {
        driver_id: 'd1000000-0000-0000-0000-000000000001',
        employee_id: 'DRV-VSB-04',
        first_name: 'Murugesan',
        last_name: 'Palanisamy',
        email: 'driver@vsb.ac.in',
        phone: '+91 94432 10104',
        emergency_contact: 'Saraswathi M (Spouse)',
        emergency_phone: '+91 94432 10105',
        license_number: 'TN47-20120004589',
        license_expiry: '2028-09-30',
        aadhar_number: '784512963012',
        date_of_birth: '1982-05-14',
        status: 'ACTIVE',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        assignment_date: '2023-06-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Certified Heavy Vehicle Operator - 14 years service'
      },
      {
        driver_id: 'd1000000-0000-0000-0000-000000000002',
        employee_id: 'DRV-VSB-08',
        first_name: 'Sivakumar',
        last_name: 'Kaliappan',
        email: 'sivakumar.drv@vsb.ac.in',
        phone: '+91 98421 20208',
        emergency_contact: 'Lakshmi S (Spouse)',
        emergency_phone: '+91 98421 20209',
        license_number: 'TN47-20150007812',
        license_expiry: '2029-03-15',
        aadhar_number: '654123987456',
        date_of_birth: '1985-11-22',
        status: 'ACTIVE',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000002',
        assignment_date: '2022-08-10',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Dindigul highway route specialist'
      },
      {
        driver_id: 'd1000000-0000-0000-0000-000000000003',
        employee_id: 'DRV-VSB-22',
        first_name: 'Ramanathan',
        last_name: 'Chettiar',
        email: 'ramanathan.drv@vsb.ac.in',
        phone: '+91 97500 30322',
        emergency_contact: 'Meenakshi R (Spouse)',
        emergency_phone: '+91 97500 30323',
        license_number: 'TN47-20100003456',
        license_expiry: '2027-12-31',
        aadhar_number: '321654987123',
        date_of_birth: '1979-08-04',
        status: 'ACTIVE',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000003',
        assignment_date: '2024-01-20',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Trichy express route lead driver'
      }
    ],
    bus_in_charges: [
      {
        in_charge_id: 'f1000000-0000-0000-0000-000000000001',
        employee_id: 'FAC-AIDS-12',
        first_name: 'Revathi',
        last_name: 'Ramasamy',
        email: 'incharge@vsb.ac.in',
        phone: '+91 94861 80012',
        emergency_contact: 'Dr. Sundaram (Spouse)',
        emergency_phone: '+91 94861 80013',
        department: 'Department of AI & DS',
        designation: 'Assistant Professor',
        date_of_birth: '1988-03-18',
        status: 'ACTIVE',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        assignment_date: '2023-06-15',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Faculty in-charge for BUS-14. Responsible for student conduct and headcounts.'
      },
      {
        in_charge_id: 'f1000000-0000-0000-0000-000000000002',
        employee_id: 'FAC-CSE-09',
        first_name: 'Karthi',
        last_name: 'Shanmugam',
        email: 'karthi.cse@vsb.ac.in',
        phone: '+91 94861 80009',
        emergency_contact: 'Deepa K (Spouse)',
        emergency_phone: '+91 94861 80010',
        department: 'Department of CSE',
        designation: 'Associate Professor',
        date_of_birth: '1984-07-25',
        status: 'ACTIVE',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000002',
        assignment_date: '2022-08-10',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Faculty in-charge for BUS-08 (Dindigul route)'
      },
      {
        in_charge_id: 'f1000000-0000-0000-0000-000000000003',
        employee_id: 'FAC-ECE-15',
        first_name: 'Jayakumar',
        last_name: 'Perumal',
        email: 'jayakumar.ece@vsb.ac.in',
        phone: '+91 94861 80015',
        emergency_contact: 'Priya J (Spouse)',
        emergency_phone: '+91 94861 80016',
        department: 'Department of ECE',
        designation: 'Assistant Professor',
        date_of_birth: '1990-12-10',
        status: 'ACTIVE',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000003',
        assignment_date: '2024-01-20',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Faculty in-charge for BUS-22 (Trichy route)'
      }
    ],
    bus_route_assignments: [
      {
        assignment_id: 'a1000000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        assigned_date: '2024-01-01',
        unassigned_date: null,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        assignment_id: 'a1000000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        route_id: 'r1000000-0000-0000-0000-000000000003',
        assigned_date: '2024-01-01',
        unassigned_date: null,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        assignment_id: 'a1000000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000003',
        route_id: 'r1000000-0000-0000-0000-000000000004',
        assigned_date: '2024-01-01',
        unassigned_date: null,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    cameras: [
      {
        camera_id: 'c1000000-0000-0000-0000-000000000001',
        camera_name: 'CAM-B14-ENTRY',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        location: 'Front Boarding Door Footstep',
        camera_type: 'ENTRY',
        location_type: 'DOOR_ENTRY',
        ip_address: '192.168.14.101',
        mac_address: '00:1A:2B:3C:4D:01',
        port: 554,
        username: 'admin',
        stream_url: 'https://stream.vsb.ac.in/hls/b14_cam1/index.m3u8',
        rtsp_url: 'rtsp://admin:vsb123@192.168.14.101:554/live/ch0',
        stream_type: 'HLS',
        field_of_view_deg: 110.0,
        sensor_resolution: '1920x1080',
        focal_length_mm: 2.8,
        night_vision_enabled: true,
        ir_range_m: 15.0,
        battery_percentage: 94,
        power_source: 'VEHICLE_BATTERY',
        cpu_usage_percentage: 28.5,
        memory_usage_percentage: 42.0,
        temperature_celsius: 38.5,
        storage_used_gb: 14.2,
        storage_total_gb: 64.0,
        firmware_version: 'v2.4.1-vsb',
        last_ping_at: new Date().toISOString(),
        calibration_status: 'CALIBRATED',
        is_active: true,
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
        resolution: '1080p @ 30fps',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Primary face and badge detection optical pipeline'
      },
      {
        camera_id: 'c1000000-0000-0000-0000-000000000002',
        camera_name: 'CAM-B14-EXIT',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        location: 'Rear Departure Door',
        camera_type: 'EXIT',
        location_type: 'DOOR_EXIT',
        ip_address: '192.168.14.102',
        mac_address: '00:1A:2B:3C:4D:02',
        port: 554,
        username: 'admin',
        stream_url: 'https://stream.vsb.ac.in/hls/b14_cam2/index.m3u8',
        rtsp_url: 'rtsp://admin:vsb123@192.168.14.102:554/live/ch0',
        stream_type: 'HLS',
        field_of_view_deg: 95.0,
        sensor_resolution: '1920x1080',
        focal_length_mm: 3.6,
        night_vision_enabled: true,
        ir_range_m: 12.0,
        battery_percentage: 95,
        power_source: 'VEHICLE_BATTERY',
        cpu_usage_percentage: 24.0,
        memory_usage_percentage: 38.0,
        temperature_celsius: 37.2,
        storage_used_gb: 12.0,
        storage_total_gb: 64.0,
        firmware_version: 'v2.4.1-vsb',
        last_ping_at: new Date().toISOString(),
        calibration_status: 'CALIBRATED',
        is_active: true,
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
        resolution: '1080p @ 30fps',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Egress validation sensor'
      },
      {
        camera_id: 'c1000000-0000-0000-0000-000000000003',
        camera_name: 'CAM-B14-CABIN',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        location: 'Ceiling Center Forward Facing',
        camera_type: 'INTERIOR',
        location_type: 'CABIN_INTERIOR',
        ip_address: '192.168.14.103',
        mac_address: '00:1A:2B:3C:4D:03',
        port: 554,
        username: 'admin',
        stream_url: 'https://stream.vsb.ac.in/hls/b14_cam3/index.m3u8',
        rtsp_url: 'rtsp://admin:vsb123@192.168.14.103:554/live/ch0',
        stream_type: 'HLS',
        field_of_view_deg: 130.0,
        sensor_resolution: '3840x2160',
        focal_length_mm: 2.1,
        night_vision_enabled: true,
        ir_range_m: 20.0,
        battery_percentage: 91,
        power_source: 'VEHICLE_BATTERY',
        cpu_usage_percentage: 46.5,
        memory_usage_percentage: 58.0,
        temperature_celsius: 42.1,
        storage_used_gb: 28.5,
        storage_total_gb: 128.0,
        firmware_version: 'v2.4.1-vsb',
        last_ping_at: new Date().toISOString(),
        calibration_status: 'CALIBRATED',
        is_active: true,
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
        resolution: '4K Wide Angle',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Passenger seat occupancy vision telemetry'
      },
      {
        camera_id: 'c1000000-0000-0000-0000-000000000004',
        camera_name: 'CAM-B08-ENTRY',
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        location: 'Front Boarding Door',
        camera_type: 'ENTRY',
        location_type: 'DOOR_ENTRY',
        ip_address: '192.168.8.101',
        mac_address: '00:1A:2B:3C:4D:04',
        port: 554,
        username: 'admin',
        stream_url: 'https://stream.vsb.ac.in/hls/b08_cam1/index.m3u8',
        rtsp_url: 'rtsp://admin:vsb123@192.168.8.101:554/live/ch0',
        stream_type: 'HLS',
        field_of_view_deg: 110.0,
        sensor_resolution: '1920x1080',
        focal_length_mm: 2.8,
        night_vision_enabled: true,
        ir_range_m: 15.0,
        battery_percentage: 88,
        power_source: 'VEHICLE_BATTERY',
        cpu_usage_percentage: 35.0,
        memory_usage_percentage: 48.0,
        temperature_celsius: 41.5,
        storage_used_gb: 18.0,
        storage_total_gb: 64.0,
        firmware_version: 'v2.4.0-vsb',
        last_ping_at: new Date().toISOString(),
        calibration_status: 'CALIBRATED',
        is_active: true,
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
        resolution: '1080p @ 30fps',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Bus 08 entry gate sensor'
      },
      {
        camera_id: 'c1000000-0000-0000-0000-000000000005',
        camera_name: 'CAM-B31-ENTRY',
        bus_id: 'b1000000-0000-0000-0000-000000000005',
        location: 'Front Boarding Door',
        camera_type: 'ENTRY',
        location_type: 'DOOR_ENTRY',
        ip_address: '192.168.31.101',
        mac_address: '00:1A:2B:3C:4D:05',
        port: 554,
        username: 'admin',
        stream_url: 'https://stream.vsb.ac.in/hls/b31_cam1/index.m3u8',
        rtsp_url: 'rtsp://admin:vsb123@192.168.31.101:554/live/ch0',
        stream_type: 'HLS',
        field_of_view_deg: 110.0,
        sensor_resolution: '1920x1080',
        focal_length_mm: 2.8,
        night_vision_enabled: true,
        ir_range_m: 15.0,
        battery_percentage: 14,
        power_source: 'INTERNAL_BATTERY',
        cpu_usage_percentage: 0.0,
        memory_usage_percentage: 0.0,
        temperature_celsius: 26.0,
        storage_used_gb: 34.0,
        storage_total_gb: 64.0,
        firmware_version: 'v2.3.9-vsb',
        last_ping_at: new Date(Date.now() - 7200000).toISOString(),
        calibration_status: 'NEEDS_CALIBRATION',
        is_active: false,
        status: 'OFFLINE',
        last_seen: new Date(Date.now() - 7200000).toISOString(),
        resolution: '1080p @ 30fps',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Power supply disconnected for bus maintenance'
      },
      {
        camera_id: 'c1000000-0000-0000-0000-000000000006',
        id: 'c1000000-0000-0000-0000-000000000006',
        camera_name: 'CAM-B22-ENTRY',
        bus_id: 'b1000000-0000-0000-0000-000000000003',
        location: 'Front Boarding Door',
        camera_type: 'ENTRY',
        location_type: 'DOOR_ENTRY',
        ip_address: '192.168.22.101',
        mac_address: '00:1A:2B:3C:4D:06',
        port: 554,
        username: 'admin',
        stream_url: 'https://stream.vsb.ac.in/hls/b22_cam1/index.m3u8',
        hls_url: 'https://stream.vsb.ac.in/hls/b22_cam1/index.m3u8',
        rtsp_url: 'rtsp://admin:vsb123@192.168.22.101:554/live/ch0',
        stream_type: 'HLS',
        field_of_view_deg: 110.0,
        sensor_resolution: '1920x1080',
        focal_length_mm: 2.8,
        night_vision_enabled: true,
        ir_range_m: 15.0,
        battery_percentage: 92,
        power_source: 'VEHICLE_BATTERY',
        cpu_usage_percentage: 28.0,
        memory_usage_percentage: 42.0,
        temperature_celsius: 39.0,
        storage_used_gb: 12.0,
        storage_total_gb: 64.0,
        firmware_version: 'v2.4.1-vsb',
        last_ping_at: new Date().toISOString(),
        calibration_status: 'CALIBRATED',
        is_active: true,
        status: 'ONLINE',
        last_seen: new Date().toISOString(),
        resolution: '1080p @ 30fps',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Bus 22 entry gate sensor'
      }
    ],
    students: [
      {
        student_id: 'st100000-0000-0000-0000-000000000001',
        roll_number: '922521104001',
        first_name: 'Hemanth',
        last_name: 'Kumar',
        email: 'hemanth.aids@vsb.ac.in',
        phone: '+91 98765 43210',
        emergency_contact_name: 'Arumugam K (Father)',
        emergency_contact_phone: '+91 98765 43211',
        date_of_birth: '2004-05-12',
        department: 'Artificial Intelligence & Data Science',
        semester: 6,
        section: 'A',
        transport_status: 'ACTIVE',
        profile_photo_url: '',
        bio_enrolled: true,
        face_recognition_id: 'FACE-VSB-AIDS-001',
        parent_name: 'Arumugam K',
        parent_phone: '+91 98765 43211',
        address: '12, Kamaraj Nagar, Thanthonimalai',
        city: 'Karur',
        postal_code: '639005',
        created_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        notes: 'AI/DS Dept Student Representative'
      },
      {
        student_id: 'st100000-0000-0000-0000-000000000002',
        roll_number: '922521104042',
        first_name: 'Priya',
        last_name: 'Sharma',
        email: 'priya.aids@vsb.ac.in',
        phone: '+91 98765 43212',
        emergency_contact_name: 'Radhakrishnan S (Father)',
        emergency_contact_phone: '+91 98765 43213',
        date_of_birth: '2004-08-22',
        department: 'Artificial Intelligence & Data Science',
        semester: 6,
        section: 'A',
        transport_status: 'ACTIVE',
        profile_photo_url: '',
        bio_enrolled: true,
        face_recognition_id: 'FACE-VSB-AIDS-042',
        parent_name: 'Radhakrishnan S',
        parent_phone: '+91 98765 43213',
        address: '45/2, Kovai Road, Rayanur',
        city: 'Karur',
        postal_code: '639003',
        created_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        notes: 'Enrolled in edge camera vision trials'
      },
      {
        student_id: 'st100000-0000-0000-0000-000000000003',
        roll_number: '922521104055',
        first_name: 'Rajesh',
        last_name: 'Patel',
        email: 'rajesh.cse@vsb.ac.in',
        phone: '+91 98765 43214',
        emergency_contact_name: 'Mahesh Patel (Father)',
        emergency_contact_phone: '+91 98765 43215',
        date_of_birth: '2003-11-15',
        department: 'Computer Science & Engineering',
        semester: 6,
        section: 'B',
        transport_status: 'ACTIVE',
        profile_photo_url: '',
        bio_enrolled: false,
        face_recognition_id: null,
        parent_name: 'Mahesh Patel',
        parent_phone: '+91 98765 43215',
        address: '88, Central Bus Stand West, Bay Area',
        city: 'Karur',
        postal_code: '639001',
        created_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        notes: 'Regular morning commuter'
      },
      {
        student_id: 'st100000-0000-0000-0000-000000000004',
        roll_number: '922522104018',
        first_name: 'Aisha',
        last_name: 'Khan',
        email: 'aisha.ece@vsb.ac.in',
        phone: '+91 98765 43216',
        emergency_contact_name: 'Farooq Khan (Father)',
        emergency_contact_phone: '+91 98765 43217',
        date_of_birth: '2005-02-18',
        department: 'Electronics & Communication Engineering',
        semester: 4,
        section: 'A',
        transport_status: 'REQUESTED',
        profile_photo_url: '',
        bio_enrolled: false,
        face_recognition_id: null,
        parent_name: 'Farooq Khan',
        parent_phone: '+91 98765 43217',
        address: '104, Gandhigramam South',
        city: 'Karur',
        postal_code: '639004',
        created_at: new Date('2024-02-10T08:00:00Z').toISOString(),
        updated_at: new Date('2024-02-10T08:00:00Z').toISOString(),
        notes: 'Requested route change to RT-KRR-01'
      },
      {
        student_id: 'st100000-0000-0000-0000-000000000005',
        roll_number: '922522104090',
        first_name: 'Vikram',
        last_name: 'Singh',
        email: 'vikram.mech@vsb.ac.in',
        phone: '+91 98765 43218',
        emergency_contact_name: 'Balwant Singh (Father)',
        emergency_contact_phone: '+91 98765 43219',
        date_of_birth: '2005-06-30',
        department: 'Mechanical Engineering',
        semester: 4,
        section: 'B',
        transport_status: 'INACTIVE',
        profile_photo_url: '',
        bio_enrolled: false,
        face_recognition_id: null,
        parent_name: 'Balwant Singh',
        parent_phone: '+91 98765 43219',
        address: '22, Dindigul Highway bypass',
        city: 'Dindigul',
        postal_code: '624001',
        created_at: new Date('2024-01-05T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-05T08:00:00Z').toISOString(),
        notes: 'Hostel resident - transport currently suspended'
      }
    ],
    student_bus_assignments: [
      {
        assignment_id: 'sa100000-0000-0000-0000-000000000001',
        student_id: 'st100000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        boarding_stop_id: 's1000000-0000-0000-0000-000000000002',
        drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        assignment_date: '2024-01-02',
        expiry_date: null,
        status: 'ACTIVE',
        is_primary: true,
        created_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        notes: 'Thanthonimalai boarding point assignment'
      },
      {
        assignment_id: 'sa100000-0000-0000-0000-000000000002',
        student_id: 'st100000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        boarding_stop_id: 's1000000-0000-0000-0000-000000000003',
        drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        assignment_date: '2024-01-02',
        expiry_date: null,
        status: 'ACTIVE',
        is_primary: true,
        created_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        notes: 'Rayanur Junction boarding point assignment'
      },
      {
        assignment_id: 'sa100000-0000-0000-0000-000000000003',
        student_id: 'st100000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        boarding_stop_id: 's1000000-0000-0000-0000-000000000001',
        drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        assignment_date: '2024-01-02',
        expiry_date: null,
        status: 'ACTIVE',
        is_primary: true,
        created_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T08:00:00Z').toISOString(),
        notes: 'Karur Central Bus Stand boarding point assignment'
      }
    ],
    student_transport_requests: [
      {
        request_id: 'tr100000-0000-0000-0000-000000000001',
        student_id: 'st100000-0000-0000-0000-000000000004',
        requested_bus_id: 'b1000000-0000-0000-0000-000000000001',
        requested_route_id: 'r1000000-0000-0000-0000-000000000001',
        requested_boarding_stop_id: 's1000000-0000-0000-0000-000000000004',
        requested_drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        request_type: 'NEW_ASSIGNMENT',
        request_status: 'PENDING',
        requested_by_role: 'STUDENT',
        reviewed_by_user_id: null,
        reviewed_at: null,
        review_notes: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        notes: 'Relocated to Gandhigramam, requesting seat in BUS-14'
      },
      {
        request_id: 'tr100000-0000-0000-0000-000000000002',
        student_id: 'st100000-0000-0000-0000-000000000002',
        requested_bus_id: 'b1000000-0000-0000-0000-000000000001',
        requested_route_id: 'r1000000-0000-0000-0000-000000000001',
        requested_boarding_stop_id: 's1000000-0000-0000-0000-000000000004',
        requested_drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        request_type: 'STOP_CHANGE',
        request_status: 'APPROVED',
        requested_by_role: 'STUDENT',
        reviewed_by_user_id: 'ADMIN-01',
        reviewed_at: new Date(Date.now() - 86400000).toISOString(),
        review_notes: 'Stop change approved for lab semester',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        notes: 'Temporary stop change approved for lab practical weeks'
      }
    ],
    student_attendance_log: [
      {
        log_id: 'al100000-0000-0000-0000-000000000001',
        student_id: 'st100000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        boarding_time: new Date(Date.now() - 4800000).toISOString(),
        drop_time: new Date(Date.now() - 1800000).toISOString(),
        boarding_stop_id: 's1000000-0000-0000-0000-000000000002',
        drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        recognition_status: 'FACE_MATCH',
        verification_result: 'VERIFIED',
        camera_id: 'c1000000-0000-0000-0000-000000000001',
        confidence_score: 0.98,
        created_at: new Date(Date.now() - 4800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        notes: 'Edge camera matched facial embeddings at Thanthonimalai stop'
      },
      {
        log_id: 'al100000-0000-0000-0000-000000000002',
        student_id: 'st100000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        boarding_time: new Date(Date.now() - 4200000).toISOString(),
        drop_time: new Date(Date.now() - 1800000).toISOString(),
        boarding_stop_id: 's1000000-0000-0000-0000-000000000003',
        drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        recognition_status: 'FACE_MATCH',
        verification_result: 'VERIFIED',
        camera_id: 'c1000000-0000-0000-0000-000000000001',
        confidence_score: 0.96,
        created_at: new Date(Date.now() - 4200000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        notes: 'Edge camera matched facial embeddings at Rayanur stop'
      },
      {
        log_id: 'al100000-0000-0000-0000-000000000003',
        student_id: 'st100000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        boarding_time: new Date(Date.now() - 5200000).toISOString(),
        drop_time: new Date(Date.now() - 1800000).toISOString(),
        boarding_stop_id: 's1000000-0000-0000-0000-000000000001',
        drop_stop_id: 's1000000-0000-0000-0000-000000000005',
        recognition_status: 'MANUAL',
        verification_result: 'VERIFIED',
        camera_id: null,
        confidence_score: 1.00,
        created_at: new Date(Date.now() - 5200000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        notes: 'Faculty in-charge verified physical ID card at Central Bus Stand'
      }
    ],
    staff_roles: [
      {
        role_id: 'sr100000-0000-0000-0000-000000000001',
        role_name: 'DRIVER',
        role_description: 'Bus Driver Role with route & vehicle view access',
        permissions: {
          permissions: ['view_assigned_bus', 'view_route', 'view_students', 'log_boarding', 'log_dropoff'],
          dashboard_access: ['driver_dashboard'],
          report_access: ['daily_attendance', 'route_summary']
        },
        is_system_role: true,
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      },
      {
        role_id: 'sr100000-0000-0000-0000-000000000002',
        role_name: 'BUS_IN_CHARGE',
        role_description: 'Faculty Bus In-Charge role with student conduct tracking',
        permissions: {
          permissions: ['manage_students', 'review_requests', 'track_attendance', 'generate_reports'],
          dashboard_access: ['staff_dashboard', 'student_management'],
          report_access: ['daily_report', 'weekly_report', 'student_analytics']
        },
        is_system_role: true,
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      },
      {
        role_id: 'sr100000-0000-0000-0000-000000000003',
        role_name: 'TRANSPORT_STAFF',
        role_description: 'Transport Department Operations Staff',
        permissions: {
          permissions: ['manage_buses', 'manage_routes', 'manage_drivers', 'manage_staff'],
          dashboard_access: ['admin_dashboard', 'fleet_management'],
          report_access: ['fleet_report', 'driver_report', 'compliance_report']
        },
        is_system_role: true,
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      },
      {
        role_id: 'sr100000-0000-0000-0000-000000000004',
        role_name: 'ADMIN',
        role_description: 'Transport System Administrator Full Access',
        permissions: {
          permissions: ['*'],
          dashboard_access: ['admin_dashboard', 'all'],
          report_access: ['all']
        },
        is_system_role: true,
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      }
    ],
    staff_members: [
      {
        staff_id: 'sm100000-0000-0000-0000-000000000001',
        staff_type: 'DRIVER',
        employee_id: 'STF-001',
        first_name: 'Murugesan',
        last_name: 'Palanisamy',
        email: 'murugesan.drv@vsb.ac.in',
        phone: '+91 94432 10104',
        emergency_contact_name: 'Saraswathi M (Spouse)',
        emergency_contact_phone: '+91 94432 10105',
        date_of_birth: '1982-05-14',
        gender: 'M',
        address: '45, Anna Nagar, Thanthonimalai',
        city: 'Karur',
        postal_code: '639005',
        aadhar_number: '987654321012',
        pan_number: 'ABCDE1234F',
        role_id: 'sr100000-0000-0000-0000-000000000001',
        department: 'Transport Operations',
        designation: 'Senior Heavy Vehicle Pilot',
        employment_status: 'ACTIVE',
        hire_date: '2023-01-15',
        username: 'murugesan_drv',
        password_hash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rGzH2K4Uiq',
        last_login: new Date(Date.now() - 3600000).toISOString(),
        license_number: 'TN47-20120004589',
        license_expiry: '2028-09-30',
        license_category: 'HMV',
        license_holder_name: 'Murugesan Palanisamy',
        safety_rating: 4.90,
        punctuality_rating: 4.95,
        student_satisfaction: 4.85,
        total_incidents: 0,
        total_complaints: 0,
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        assignment_date: '2023-06-15',
        profile_photo_url: '',
        bio_enrolled: true,
        created_at: new Date('2023-01-15T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        notes: 'Certified Heavy Vehicle Operator - 14 years accident-free service'
      },
      {
        staff_id: 'sm100000-0000-0000-0000-000000000002',
        staff_type: 'DRIVER',
        employee_id: 'STF-002',
        first_name: 'Sivakumar',
        last_name: 'Kaliappan',
        email: 'sivakumar.drv@vsb.ac.in',
        phone: '+91 98421 20208',
        emergency_contact_name: 'Lakshmi S (Spouse)',
        emergency_contact_phone: '+91 98421 20209',
        date_of_birth: '1985-11-22',
        gender: 'M',
        address: '12, Bypass Road',
        city: 'Dindigul',
        postal_code: '624001',
        aadhar_number: '987654321013',
        pan_number: 'BCDEF2345G',
        role_id: 'sr100000-0000-0000-0000-000000000001',
        department: 'Transport Operations',
        designation: 'Heavy Vehicle Pilot',
        employment_status: 'ACTIVE',
        hire_date: '2023-02-20',
        username: 'sivakumar_drv',
        password_hash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rGzH2K4Uiq',
        last_login: new Date(Date.now() - 7200000).toISOString(),
        license_number: 'TN47-20150007812',
        license_expiry: '2029-03-15',
        license_category: 'HMV',
        license_holder_name: 'Sivakumar Kaliappan',
        safety_rating: 4.80,
        punctuality_rating: 4.70,
        student_satisfaction: 4.90,
        total_incidents: 0,
        total_complaints: 1,
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000002',
        assignment_date: '2022-08-10',
        profile_photo_url: '',
        bio_enrolled: true,
        created_at: new Date('2023-02-20T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        notes: 'Dindigul highway route transit specialist'
      },
      {
        staff_id: 'sm100000-0000-0000-0000-000000000003',
        staff_type: 'DRIVER',
        employee_id: 'STF-003',
        first_name: 'Ramanathan',
        last_name: 'Chettiar',
        email: 'ramanathan.drv@vsb.ac.in',
        phone: '+91 97500 30322',
        emergency_contact_name: 'Meenakshi R (Spouse)',
        emergency_contact_phone: '+91 97500 30323',
        date_of_birth: '1979-08-04',
        gender: 'M',
        address: '78, Chathiram Main Road',
        city: 'Tiruchirappalli',
        postal_code: '620002',
        aadhar_number: '987654321014',
        pan_number: 'CDEFG3456H',
        role_id: 'sr100000-0000-0000-0000-000000000001',
        department: 'Transport Operations',
        designation: 'Senior Transit Pilot',
        employment_status: 'ON_LEAVE',
        hire_date: '2024-01-20',
        username: 'ramanathan_drv',
        password_hash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rGzH2K4Uiq',
        last_login: new Date(Date.now() - 86400000 * 3).toISOString(),
        license_number: 'TN47-20100003456',
        license_expiry: '2027-12-31',
        license_category: 'HMV',
        license_holder_name: 'Ramanathan Chettiar',
        safety_rating: 4.85,
        punctuality_rating: 4.90,
        student_satisfaction: 4.80,
        total_incidents: 1,
        total_complaints: 0,
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000003',
        assignment_date: '2024-01-20',
        profile_photo_url: '',
        bio_enrolled: false,
        created_at: new Date('2024-01-20T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-20T08:00:00Z').toISOString(),
        notes: 'Trichy express route lead pilot - on medical leave this week'
      },
      {
        staff_id: 'sm100000-0000-0000-0000-000000000004',
        staff_type: 'BUS_IN_CHARGE',
        employee_id: 'STF-004',
        first_name: 'Revathi',
        last_name: 'Ramasamy',
        email: 'revathi.faculty@vsb.ac.in',
        phone: '+91 94861 80012',
        emergency_contact_name: 'Dr. Sundaram (Spouse)',
        emergency_contact_phone: '+91 94861 80013',
        date_of_birth: '1988-03-18',
        gender: 'F',
        address: '14, Staff Quarters, VSB Campus',
        city: 'Karur',
        postal_code: '639111',
        aadhar_number: '987654321015',
        pan_number: 'DEFGH4567I',
        role_id: 'sr100000-0000-0000-0000-000000000002',
        department: 'Artificial Intelligence & Data Science',
        designation: 'Assistant Professor & Bus In-Charge',
        employment_status: 'ACTIVE',
        hire_date: '2023-03-10',
        username: 'revathi_faculty',
        password_hash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rGzH2K4Uiq',
        last_login: new Date(Date.now() - 14400000).toISOString(),
        license_number: null,
        license_expiry: null,
        license_category: null,
        license_holder_name: null,
        safety_rating: 5.00,
        punctuality_rating: 5.00,
        student_satisfaction: 4.95,
        total_incidents: 0,
        total_complaints: 0,
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        assignment_date: '2023-06-15',
        profile_photo_url: '',
        bio_enrolled: true,
        created_at: new Date('2023-03-10T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        notes: 'Faculty in-charge for BUS-14 AI/DS transit corridor'
      },
      {
        staff_id: 'sm100000-0000-0000-0000-000000000005',
        staff_type: 'TRANSPORT_STAFF',
        employee_id: 'STF-005',
        first_name: 'Karthi',
        last_name: 'Shanmugam',
        email: 'karthi.staff@vsb.ac.in',
        phone: '+91 94861 80009',
        emergency_contact_name: 'Deepa K (Spouse)',
        emergency_contact_phone: '+91 94861 80010',
        date_of_birth: '1984-07-25',
        gender: 'M',
        address: '22, Teachers Colony',
        city: 'Karur',
        postal_code: '639002',
        aadhar_number: '987654321016',
        pan_number: 'EFGHI5678J',
        role_id: 'sr100000-0000-0000-0000-000000000003',
        department: 'Transport & Fleet Office',
        designation: 'Transport Supervisor',
        employment_status: 'ACTIVE',
        hire_date: '2022-05-01',
        username: 'karthi_transport',
        password_hash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6x8ekEY5k7rGzH2K4Uiq',
        last_login: new Date(Date.now() - 1800000).toISOString(),
        license_number: null,
        license_expiry: null,
        license_category: null,
        license_holder_name: null,
        safety_rating: 4.95,
        punctuality_rating: 4.85,
        student_satisfaction: 4.90,
        total_incidents: 0,
        total_complaints: 0,
        assigned_bus_id: null,
        assignment_date: null,
        profile_photo_url: '',
        bio_enrolled: false,
        created_at: new Date('2022-05-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        notes: 'Fleet dispatch supervisor and driver coordinator'
      }
    ],
    staff_shifts: [
      {
        shift_id: 'ss100000-0000-0000-0000-000000000001',
        staff_id: 'sm100000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        shift_date: new Date().toISOString().split('T')[0],
        shift_type: 'MORNING',
        scheduled_start_time: '06:45:00',
        scheduled_end_time: '08:30:00',
        actual_start_time: new Date(Date.now() - 6300000).toISOString(),
        actual_end_time: new Date(Date.now() - 900000).toISOString(),
        status: 'COMPLETED',
        shift_notes: 'Morning run completed on schedule. 52 students boarded.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        shift_id: 'ss100000-0000-0000-0000-000000000002',
        staff_id: 'sm100000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000002',
        shift_date: new Date().toISOString().split('T')[0],
        shift_type: 'EVENING',
        scheduled_start_time: '16:30:00',
        scheduled_end_time: '18:15:00',
        actual_start_time: null,
        actual_end_time: null,
        status: 'SCHEDULED',
        shift_notes: 'Evening return trip scheduled for Bay 4 Karur route',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        shift_id: 'ss100000-0000-0000-0000-000000000003',
        staff_id: 'sm100000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        route_id: 'r1000000-0000-0000-0000-000000000003',
        shift_date: new Date().toISOString().split('T')[0],
        shift_type: 'MORNING',
        scheduled_start_time: '06:30:00',
        scheduled_end_time: '08:20:00',
        actual_start_time: new Date(Date.now() - 6600000).toISOString(),
        actual_end_time: new Date(Date.now() - 1200000).toISOString(),
        status: 'COMPLETED',
        shift_notes: 'Dindigul morning commute completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        shift_id: 'ss100000-0000-0000-0000-000000000004',
        staff_id: 'sm100000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000003',
        route_id: 'r1000000-0000-0000-0000-000000000004',
        shift_date: new Date().toISOString().split('T')[0],
        shift_type: 'EVENING',
        scheduled_start_time: '16:30:00',
        scheduled_end_time: '18:30:00',
        actual_start_time: null,
        actual_end_time: null,
        status: 'SCHEDULED',
        shift_notes: 'Assigned as substitute driver for BUS-22 Trichy route',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    staff_leave_requests: [
      {
        leave_id: 'lr100000-0000-0000-0000-000000000001',
        staff_id: 'sm100000-0000-0000-0000-000000000003',
        leave_type: 'SICK',
        leave_start_date: new Date().toISOString().split('T')[0],
        leave_end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        total_days: 3,
        reason: 'Viral fever and prescribed medical rest by physician',
        request_status: 'APPROVED',
        approved_by_user_id: 'admin@vsb.ac.in',
        approved_at: new Date(Date.now() - 86400000).toISOString(),
        approval_notes: 'Approved. Driver Sivakumar assigned for Trichy route coverage.',
        replacement_staff_id: 'sm100000-0000-0000-0000-000000000002',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        leave_id: 'lr100000-0000-0000-0000-000000000002',
        staff_id: 'sm100000-0000-0000-0000-000000000001',
        leave_type: 'CASUAL',
        leave_start_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        leave_end_date: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
        total_days: 2,
        reason: 'Family function in hometown Madurai',
        request_status: 'PENDING',
        approved_by_user_id: null,
        approved_at: null,
        approval_notes: null,
        replacement_staff_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    staff_performance_log: [
      {
        log_id: 'pl100000-0000-0000-0000-000000000001',
        staff_id: 'sm100000-0000-0000-0000-000000000001',
        log_date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
        log_type: 'COMMENDATION',
        incident_type: null,
        incident_description: null,
        severity: 'LOW',
        complaint_from_student_id: null,
        complaint_description: null,
        commendation_reason: 'Exceptional vehicle handling in dense monsoon rain near Thanthonimalai with full passenger safety',
        safety_score: 5.00,
        punctuality_score: 5.00,
        student_interaction_score: 5.00,
        professionalism_score: 5.00,
        action_taken: 'Appreciation certificate issued by Transport Office',
        follow_up_required: false,
        follow_up_date: null,
        resolved: true,
        created_by_user_id: 'admin@vsb.ac.in',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      {
        log_id: 'pl100000-0000-0000-0000-000000000002',
        staff_id: 'sm100000-0000-0000-0000-000000000002',
        log_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        log_type: 'FEEDBACK',
        incident_type: null,
        incident_description: null,
        severity: 'LOW',
        complaint_from_student_id: null,
        complaint_description: null,
        commendation_reason: null,
        safety_score: 4.80,
        punctuality_score: 4.70,
        student_interaction_score: 4.90,
        professionalism_score: 4.80,
        action_taken: 'Monthly student feedback aggregate',
        follow_up_required: false,
        follow_up_date: null,
        resolved: true,
        created_by_user_id: 'incharge@vsb.ac.in',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        log_id: 'pl100000-0000-0000-0000-000000000003',
        staff_id: 'sm100000-0000-0000-0000-000000000003',
        log_date: new Date(Date.now() - 86400000 * 20).toISOString().split('T')[0],
        log_type: 'INCIDENT',
        incident_type: 'MINOR_DELAY',
        incident_description: 'Vehicle tire puncture on Trichy highway, safe evacuation to shoulder and swift tire replacement within 18 minutes',
        severity: 'LOW',
        complaint_from_student_id: null,
        complaint_description: null,
        commendation_reason: null,
        safety_score: 4.50,
        punctuality_score: 4.00,
        student_interaction_score: 4.80,
        professionalism_score: 4.90,
        action_taken: 'Spares inspected and tire pressure sensors calibrated',
        follow_up_required: false,
        follow_up_date: null,
        resolved: true,
        created_by_user_id: 'admin@vsb.ac.in',
        created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 20).toISOString()
      }
    ],
    staff_salary_structure: [
      {
        salary_id: 'sl100000-0000-0000-0000-000000000001',
        staff_id: 'sm100000-0000-0000-0000-000000000001',
        effective_date: '2024-01-01',
        base_salary: 22000.00,
        dearness_allowance: 4400.00,
        house_rent_allowance: 3300.00,
        conveyance_allowance: 1800.00,
        medical_allowance: 1200.00,
        performance_bonus: 2000.00,
        total_monthly_salary: 34700.00,
        provident_fund: 2640.00,
        income_tax: 500.00,
        salary_status: 'ACTIVE',
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      },
      {
        salary_id: 'sl100000-0000-0000-0000-000000000002',
        staff_id: 'sm100000-0000-0000-0000-000000000002',
        effective_date: '2024-01-01',
        base_salary: 20000.00,
        dearness_allowance: 4000.00,
        house_rent_allowance: 3000.00,
        conveyance_allowance: 1800.00,
        medical_allowance: 1200.00,
        performance_bonus: 1500.00,
        total_monthly_salary: 31500.00,
        provident_fund: 2400.00,
        income_tax: 400.00,
        salary_status: 'ACTIVE',
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      },
      {
        salary_id: 'sl100000-0000-0000-0000-000000000003',
        staff_id: 'sm100000-0000-0000-0000-000000000003',
        effective_date: '2024-01-01',
        base_salary: 23000.00,
        dearness_allowance: 4600.00,
        house_rent_allowance: 3450.00,
        conveyance_allowance: 1800.00,
        medical_allowance: 1200.00,
        performance_bonus: 1800.00,
        total_monthly_salary: 35850.00,
        provident_fund: 2760.00,
        income_tax: 600.00,
        salary_status: 'ACTIVE',
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      },
      {
        salary_id: 'sl100000-0000-0000-0000-000000000004',
        staff_id: 'sm100000-0000-0000-0000-000000000004',
        effective_date: '2024-01-01',
        base_salary: 45000.00,
        dearness_allowance: 9000.00,
        house_rent_allowance: 6750.00,
        conveyance_allowance: 2500.00,
        medical_allowance: 2000.00,
        performance_bonus: 3000.00,
        total_monthly_salary: 68250.00,
        provident_fund: 5400.00,
        income_tax: 2500.00,
        salary_status: 'ACTIVE',
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      },
      {
        salary_id: 'sl100000-0000-0000-0000-000000000005',
        staff_id: 'sm100000-0000-0000-0000-000000000005',
        effective_date: '2024-01-01',
        base_salary: 28000.00,
        dearness_allowance: 5600.00,
        house_rent_allowance: 4200.00,
        conveyance_allowance: 2000.00,
        medical_allowance: 1500.00,
        performance_bonus: 2000.00,
        total_monthly_salary: 43300.00,
        provident_fund: 3360.00,
        income_tax: 1000.00,
        salary_status: 'ACTIVE',
        created_at: new Date('2024-01-01T08:00:00Z').toISOString(),
        updated_at: new Date('2024-01-01T08:00:00Z').toISOString()
      }
    ],
    camera_network_metrics: [
      {
        metric_id: 'cm100000-0000-0000-0000-000000000001',
        camera_id: 'c1000000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        metric_timestamp: new Date(Date.now() - 300000).toISOString(),
        connection_status: 'ONLINE',
        latency_ms: 18.5,
        packet_loss_percent: 0.1,
        jitter_ms: 1.8,
        upload_bandwidth_kbps: 4120.0,
        download_bandwidth_kbps: 180.0,
        battery_level: 94.0,
        battery_voltage: 12.6,
        is_charging: true,
        cpu_usage_percent: 32.5,
        memory_usage_percent: 48.2,
        cpu_temperature_c: 42.1,
        storage_free_mb: 24500.0,
        current_fps: 30,
        current_bitrate_kbps: 4096,
        frame_drop_count: 0,
        network_type: '4G',
        signal_strength_dbm: -68,
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        metric_id: 'cm100000-0000-0000-0000-000000000002',
        camera_id: 'c1000000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        metric_timestamp: new Date(Date.now() - 300000).toISOString(),
        connection_status: 'ONLINE',
        latency_ms: 22.1,
        packet_loss_percent: 0.2,
        jitter_ms: 2.1,
        upload_bandwidth_kbps: 3950.0,
        download_bandwidth_kbps: 150.0,
        battery_level: 91.5,
        battery_voltage: 12.5,
        is_charging: true,
        cpu_usage_percent: 38.0,
        memory_usage_percent: 51.0,
        cpu_temperature_c: 44.3,
        storage_free_mb: 21800.0,
        current_fps: 25,
        current_bitrate_kbps: 3800,
        frame_drop_count: 2,
        network_type: '4G',
        signal_strength_dbm: -72,
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        metric_id: 'cm100000-0000-0000-0000-000000000003',
        camera_id: 'c1000000-0000-0000-0000-000000000004',
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        metric_timestamp: new Date(Date.now() - 300000).toISOString(),
        connection_status: 'CONNECTING',
        latency_ms: 145.0,
        packet_loss_percent: 3.8,
        jitter_ms: 14.5,
        upload_bandwidth_kbps: 1850.0,
        download_bandwidth_kbps: 80.0,
        battery_level: 68.0,
        battery_voltage: 11.9,
        is_charging: true,
        cpu_usage_percent: 45.0,
        memory_usage_percent: 62.0,
        cpu_temperature_c: 48.6,
        storage_free_mb: 18200.0,
        current_fps: 20,
        current_bitrate_kbps: 2000,
        frame_drop_count: 18,
        network_type: '4G',
        signal_strength_dbm: -88,
        created_at: new Date(Date.now() - 300000).toISOString()
      }
    ],
    camera_events: [
      {
        event_id: 'ce100000-0000-0000-0000-000000000001',
        camera_id: 'c1000000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        event_type: 'CONNECTION_RESTORED',
        severity: 'INFO',
        description: 'Camera optical uplink negotiated successfully with primary 4G mobile gateway',
        metrics_snapshot: { latency_ms: 18.5, fps: 30, bitrate: 4096 },
        event_timestamp: new Date(Date.now() - 7200000).toISOString(),
        is_resolved: true,
        resolved_at: new Date(Date.now() - 7140000).toISOString(),
        resolved_by_user_id: 'admin@vsb.ac.in',
        resolution_notes: 'System auto-reconnected on secondary cell band',
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        event_id: 'ce100000-0000-0000-0000-000000000002',
        camera_id: 'c1000000-0000-0000-0000-000000000004',
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        event_type: 'FRAME_DROP_SPIKE',
        severity: 'MEDIUM',
        description: 'Elevated packet loss and 18 frame drops detected over cellular transit segment',
        metrics_snapshot: { packet_loss_percent: 3.8, frame_drops: 18 },
        event_timestamp: new Date(Date.now() - 1800000).toISOString(),
        is_resolved: false,
        resolved_at: null,
        resolved_by_user_id: null,
        resolution_notes: null,
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        event_id: 'ce100000-0000-0000-0000-000000000003',
        camera_id: 'c1000000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        event_type: 'STREAM_OFFLINE',
        severity: 'HIGH',
        description: 'Cabin observation camera disconnected during scheduled maintenance idle',
        metrics_snapshot: { last_seen: new Date(Date.now() - 86400000).toISOString() },
        event_timestamp: new Date(Date.now() - 86400000).toISOString(),
        is_resolved: true,
        resolved_at: new Date(Date.now() - 82800000).toISOString(),
        resolved_by_user_id: 'admin@vsb.ac.in',
        resolution_notes: 'Turned off for maintenance per protocol',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    camera_calibration: [
      {
        calibration_id: 'cc100000-0000-0000-0000-000000000001',
        camera_id: 'c1000000-0000-0000-0000-000000000001',
        calibration_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        calibrated_by_user_id: 'transport@vsb.ac.in',
        pan_degrees: 0.0,
        tilt_degrees: -12.5,
        roll_degrees: 0.0,
        zoom_factor: 1.0,
        focus_level: 85,
        optical_center_x: 960,
        optical_center_y: 540,
        detection_zone_polygon: { points: [[100, 100], [1820, 100], [1820, 980], [100, 980]] },
        min_face_size_pixels: 80,
        max_face_size_pixels: 400,
        confidence_threshold: 0.85,
        lighting_compensation: 1.1,
        calibration_status: 'ACTIVE',
        notes: 'Doorway facial capture angle calibrated for standard bus entry steps',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      {
        calibration_id: 'cc100000-0000-0000-0000-000000000002',
        camera_id: 'c1000000-0000-0000-0000-000000000002',
        calibration_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        calibrated_by_user_id: 'transport@vsb.ac.in',
        pan_degrees: 180.0,
        tilt_degrees: -15.0,
        roll_degrees: 0.0,
        zoom_factor: 1.0,
        focus_level: 80,
        optical_center_x: 960,
        optical_center_y: 540,
        detection_zone_polygon: { points: [[150, 150], [1770, 150], [1770, 950], [150, 950]] },
        min_face_size_pixels: 75,
        max_face_size_pixels: 380,
        confidence_threshold: 0.85,
        lighting_compensation: 1.0,
        calibration_status: 'ACTIVE',
        notes: 'Rear exit step face & tag zone calibrated for egress verification',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ],
    camera_stream_segments: [
      {
        segment_id: 'cs100000-0000-0000-0000-000000000001',
        camera_id: 'c1000000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        segment_file_path: '/streams/cam-b14-entry/2026-09-19_07-30-00.mp4',
        segment_url: 'https://cdn.vsb.ac.in/streams/cam-b14-entry/2026-09-19_07-30-00.mp4',
        file_size_bytes: 52428800,
        duration_seconds: 900,
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() - 86400000 + 900000).toISOString(),
        quality: '1080P',
        retention_policy: 'DAYS_30',
        expires_at: new Date(Date.now() + 86400000 * 29).toISOString(),
        faces_detected_count: 42,
        is_archived: false,
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        segment_id: 'cs100000-0000-0000-0000-000000000002',
        camera_id: 'c1000000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        segment_file_path: '/streams/cam-b14-exit/2026-09-19_07-30-00.mp4',
        segment_url: 'https://cdn.vsb.ac.in/streams/cam-b14-exit/2026-09-19_07-30-00.mp4',
        file_size_bytes: 48234496,
        duration_seconds: 900,
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() - 86400000 + 900000).toISOString(),
        quality: '1080P',
        retention_policy: 'DAYS_30',
        expires_at: new Date(Date.now() + 86400000 * 29).toISOString(),
        faces_detected_count: 38,
        is_archived: false,
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    biometric_enrollments: [
      {
        enrollment_id: 'be100000-0000-0000-0000-000000000001',
        person_type: 'DRIVER',
        person_id: 'sm100000-0000-0000-0000-000000000001',
        identifier_code: 'EMP-DRV-001',
        full_name: 'Murugesan K',
        face_embedding: faceRecognitionService.generateEmbedding('sm100000-0000-0000-0000-000000000001'),
        embedding_vector: faceRecognitionService.generateEmbedding('sm100000-0000-0000-0000-000000000001'),
        face_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        enrollment_status: 'ACTIVE',
        status: 'ACTIVE',
        enrollment_quality_score: 0.96,
        landmarks_detected: 68,
        lighting_condition: 'OPTIMAL',
        pose_variation: 'FRONTAL',
        enrolled_by: 'transport.admin@vsb.ac.in',
        enrollment_date: '2026-09-01T09:00:00.000Z',
        notes: 'Master driver profile enrolled under studio LED lighting for Bus 14',
        created_at: '2026-09-01T09:00:00.000Z',
        updated_at: '2026-09-01T09:00:00.000Z'
      },
      {
        enrollment_id: 'be100000-0000-0000-0000-000000000002',
        person_type: 'DRIVER',
        person_id: 'sm100000-0000-0000-0000-000000000002',
        identifier_code: 'EMP-DRV-002',
        full_name: 'Sivakumar R',
        face_embedding: faceRecognitionService.generateEmbedding('sm100000-0000-0000-0000-000000000002'),
        embedding_vector: faceRecognitionService.generateEmbedding('sm100000-0000-0000-0000-000000000002'),
        face_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        thumbnail_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        enrollment_status: 'ACTIVE',
        status: 'ACTIVE',
        enrollment_quality_score: 0.94,
        landmarks_detected: 68,
        lighting_condition: 'OPTIMAL',
        pose_variation: 'FRONTAL',
        enrolled_by: 'transport.admin@vsb.ac.in',
        enrollment_date: '2026-09-01T09:30:00.000Z',
        notes: 'Relief driver biometric profile enrolled',
        created_at: '2026-09-01T09:30:00.000Z',
        updated_at: '2026-09-01T09:30:00.000Z'
      },
      {
        enrollment_id: 'be100000-0000-0000-0000-000000000003',
        person_type: 'STUDENT',
        person_id: 's1000000-0000-0000-0000-000000000001',
        identifier_code: '21AD001',
        full_name: 'Aarav Sharma',
        face_embedding: faceRecognitionService.generateEmbedding('s1000000-0000-0000-0000-000000000001'),
        embedding_vector: faceRecognitionService.generateEmbedding('s1000000-0000-0000-0000-000000000001'),
        face_image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
        thumbnail_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
        enrollment_status: 'ACTIVE',
        status: 'ACTIVE',
        enrollment_quality_score: 0.95,
        landmarks_detected: 68,
        lighting_condition: 'OPTIMAL',
        pose_variation: 'FRONTAL',
        enrolled_by: 'transport.admin@vsb.ac.in',
        enrollment_date: '2026-09-02T10:00:00.000Z',
        notes: 'Student annual academic biometric enrollment',
        created_at: '2026-09-02T10:00:00.000Z',
        updated_at: '2026-09-02T10:00:00.000Z'
      },
      {
        enrollment_id: 'be100000-0000-0000-0000-000000000004',
        person_type: 'STUDENT',
        person_id: 's1000000-0000-0000-0000-000000000002',
        identifier_code: '21AD002',
        full_name: 'Priya Sundaram',
        face_embedding: faceRecognitionService.generateEmbedding('s1000000-0000-0000-0000-000000000002'),
        embedding_vector: faceRecognitionService.generateEmbedding('s1000000-0000-0000-0000-000000000002'),
        face_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        thumbnail_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        enrollment_status: 'ACTIVE',
        status: 'ACTIVE',
        enrollment_quality_score: 0.97,
        landmarks_detected: 68,
        lighting_condition: 'OPTIMAL',
        pose_variation: 'FRONTAL',
        enrolled_by: 'transport.admin@vsb.ac.in',
        enrollment_date: '2026-09-02T10:30:00.000Z',
        notes: 'Student annual academic biometric enrollment',
        created_at: '2026-09-02T10:30:00.000Z',
        updated_at: '2026-09-02T10:30:00.000Z'
      }
    ],
    recognition_results: [
      {
        result_id: 'rr100000-0000-0000-0000-000000000001',
        camera_id: 'c1000000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        recognized_person_id: 'd1000000-0000-0000-0000-000000000001',
        person_type: 'DRIVER',
        person_name: 'Murugesan K',
        confidence_score: 94.8,
        match_status: 'VERIFIED',
        decision: 'DISPATCH_ALLOWED',
        liveness_score: 0.98,
        liveness_status: 'LIVE',
        distance_metric: 0.21,
        snapshot_url: '/snapshots/recog_rr001.jpg',
        detection_bbox: JSON.stringify({ x: 235, y: 85, width: 170, height: 190 }),
        recognition_timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        is_reviewed: true,
        reviewed_by: 'transport.admin@vsb.ac.in',
        review_notes: 'Driver pre-dispatch biometric cleared automatically',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        result_id: 'rr100000-0000-0000-0000-000000000002',
        camera_id: 'c1000000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        recognized_person_id: 'd1000000-0000-0000-0000-000000000001',
        person_type: 'DRIVER',
        person_name: 'Murugesan K',
        confidence_score: 91.2,
        match_status: 'VERIFIED',
        decision: 'DISPATCH_ALLOWED',
        liveness_score: 0.95,
        liveness_status: 'LIVE',
        distance_metric: 0.28,
        snapshot_url: '/snapshots/recog_rr002.jpg',
        detection_bbox: JSON.stringify({ x: 230, y: 80, width: 175, height: 195 }),
        recognition_timestamp: new Date(Date.now() - 3600000).toISOString(),
        is_reviewed: true,
        reviewed_by: null,
        review_notes: 'Autonomous cabin driver monitoring during transit',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        result_id: 'rr100000-0000-0000-0000-000000000003',
        camera_id: 'c1000000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        recognized_person_id: null,
        person_type: 'UNKNOWN',
        person_name: 'Unknown Person',
        confidence_score: 52.4,
        match_status: 'REJECTED',
        decision: 'DISPATCH_BLOCKED',
        liveness_score: 0.62,
        liveness_status: 'UNCERTAIN',
        distance_metric: 0.76,
        snapshot_url: '/snapshots/recog_rr003.jpg',
        detection_bbox: JSON.stringify({ x: 220, y: 70, width: 180, height: 200 }),
        recognition_timestamp: new Date(Date.now() - 1800000).toISOString(),
        is_reviewed: false,
        reviewed_by: null,
        review_notes: 'Unrecognized subject in driver seat — ignition interlock active',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ],
    recognition_model_performance: [
      {
        perf_id: 'mp100000-0000-0000-0000-000000000001',
        model_name: 'OPENCV_DNN_RESNET10',
        model_version: 'v2.4.1',
        accuracy: 98.6,
        accuracy_percentage: 98.6,
        precision: 98.9,
        recall: 98.2,
        f1_score: 98.5,
        false_acceptance_rate: 0.0015,
        false_rejection_rate: 0.012,
        avg_inference_latency_ms: 38.5,
        optimal_lighting_accuracy: 99.4,
        low_lighting_accuracy: 96.2,
        glare_accuracy: 94.8,
        total_inferences: 14850,
        status: 'ACTIVE',
        is_active: true,
        metric_date: '2026-09-20',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        perf_id: 'mp100000-0000-0000-0000-000000000002',
        model_name: 'OPENCV_HAAR_FACENET',
        model_version: 'v1.8.0',
        accuracy: 92.4,
        precision: 91.8,
        recall: 93.0,
        f1_score: 92.4,
        false_acceptance_rate: 0.15,
        false_rejection_rate: 0.42,
        avg_inference_latency_ms: 28.2,
        optimal_lighting_accuracy: 95.0,
        low_lighting_accuracy: 88.6,
        glare_accuracy: 84.1,
        total_inferences: 8200,
        status: 'STANDBY',
        metric_date: '2026-09-20',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    recognition_audit_log: [
      {
        audit_id: 'al100000-0000-0000-0000-000000000001',
        action_type: 'ENROLLMENT_CREATED',
        target_id: 'be100000-0000-0000-0000-000000000001',
        target_type: 'BIOMETRIC_ENROLLMENT',
        performed_by: 'transport.admin@vsb.ac.in',
        role: 'ADMIN',
        details: JSON.stringify({ person_name: 'Murugesan K', quality_score: 0.96 }),
        timestamp: '2026-09-01T09:00:00.000Z',
        created_at: '2026-09-01T09:00:00.000Z'
      },
      {
        audit_id: 'al100000-0000-0000-0000-000000000002',
        action_type: 'DRIVER_VERIFIED',
        target_id: 'd1000000-0000-0000-0000-000000000001',
        target_type: 'STAFF_SHIFT',
        performed_by: 'SYSTEM_OPENCV_ENGINE',
        role: 'SYSTEM',
        details: JSON.stringify({ bus_number: 'BUS-14', confidence: 94.8, liveness: 'LIVE' }),
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        audit_id: 'al100000-0000-0000-0000-000000000003',
        action_type: 'DISPATCH_ALLOWED',
        target_id: 'b1000000-0000-0000-0000-000000000001',
        target_type: 'BUS',
        performed_by: 'SYSTEM_OPENCV_ENGINE',
        role: 'SYSTEM',
        details: JSON.stringify({ trip_id: 'TR-2026-09-20-M01', bus_number: 'BUS-14' }),
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ],
    boarding_verification_events: [
      {
        id: 'bve-10000000-0000-0000-0000-000000000001',
        event_id: 'bve-10000000-0000-0000-0000-000000000001',
        student_id: 'st100000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        stop_id: 's1000000-0000-0000-0000-000000000002',
        confidence_score: 0.94,
        verification_status: 'WRONG_STOP',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        assigned_stop_id: 's1000000-0000-0000-0000-000000000001',
        photo_path: '/snapshots/bve_001.jpg',
        biometric_verified: false,
        override_status: 'PENDING',
        override_reason: null,
        overridden_at: null,
        in_charge_id: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    alerts: [],
    alert_notifications: [],
    anomaly_escalations: [],
    stop_assignments: [
      {
        id: 'sa100000-0000-0000-0000-000000000001',
        student_id: 'st100000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        pickup_stop_id: 's1000000-0000-0000-0000-000000000001',
        dropoff_stop_id: 's1000000-0000-0000-0000-000000000005',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        effective_date: '2025-01-01',
        status: 'ACTIVE',
        notes: 'Primary morning pickup at Karur Central',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: 'sa100000-0000-0000-0000-000000000002',
        student_id: 'st100000-0000-0000-0000-000000000002',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        pickup_stop_id: 's1000000-0000-0000-0000-000000000002',
        dropoff_stop_id: 's1000000-0000-0000-0000-000000000005',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        effective_date: '2025-01-01',
        status: 'ACTIVE',
        notes: 'Thanthonimalai cluster boarding',
        created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 25).toISOString()
      },
      {
        id: 'sa100000-0000-0000-0000-000000000003',
        student_id: 'st100000-0000-0000-0000-000000000003',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        pickup_stop_id: 's1000000-0000-0000-0000-000000000003',
        dropoff_stop_id: 's1000000-0000-0000-0000-000000000005',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        effective_date: '2025-01-01',
        status: 'ACTIVE',
        notes: 'Rayanur Junction highway boarding',
        created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 20).toISOString()
      },
      {
        id: 'sa100000-0000-0000-0000-000000000004',
        student_id: 'st100000-0000-0000-0000-000000000004',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        pickup_stop_id: 's1000000-0000-0000-0000-000000000004',
        dropoff_stop_id: 's1000000-0000-0000-0000-000000000005',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        effective_date: '2025-01-01',
        status: 'ACTIVE',
        notes: 'Gandhigramam Roundana stop',
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 15).toISOString()
      },
      {
        id: 'sa100000-0000-0000-0000-000000000005',
        student_id: 'st100000-0000-0000-0000-000000000005',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        pickup_stop_id: 's1000000-0000-0000-0000-000000000001',
        dropoff_stop_id: 's1000000-0000-0000-0000-000000000005',
        assigned_bus_id: 'b1000000-0000-0000-0000-000000000001',
        effective_date: '2025-01-01',
        status: 'ACTIVE',
        notes: 'Karur Central Bay 4',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ],
    stop_events: [
      {
        id: 'se100000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_id: 's1000000-0000-0000-0000-000000000001',
        arrival_time: new Date(Date.now() - 7200000).toISOString(),
        departure_time: new Date(Date.now() - 7020000).toISOString(),
        stop_sequence: 1,
        dwell_time_seconds: 180,
        gps_lat: 10.95740000,
        gps_lng: 78.08150000,
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'se100000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_id: 's1000000-0000-0000-0000-000000000002',
        arrival_time: new Date(Date.now() - 5400000).toISOString(),
        departure_time: new Date(Date.now() - 5280000).toISOString(),
        stop_sequence: 2,
        dwell_time_seconds: 120,
        gps_lat: 10.93200000,
        gps_lng: 78.08640000,
        created_at: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: 'se100000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_id: 's1000000-0000-0000-0000-000000000003',
        arrival_time: new Date(Date.now() - 3600000).toISOString(),
        departure_time: new Date(Date.now() - 3480000).toISOString(),
        stop_sequence: 3,
        dwell_time_seconds: 120,
        gps_lat: 10.91500000,
        gps_lng: 78.08900000,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    wrong_stop_detections: [
      {
        id: 'wsd-10000000-0000-0000-0000-000000000001',
        student_id: 'st100000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        event_type: 'BOARDING',
        detected_stop_id: 's1000000-0000-0000-0000-000000000002',
        assigned_stop_id: 's1000000-0000-0000-0000-000000000001',
        detected_time: new Date(Date.now() - 5400000).toISOString(),
        distance_from_assigned_meters: 2840,
        stop_sequence_delta: 1,
        severity: 'MEDIUM',
        status: 'OPEN',
        resolution_notes: null,
        resolved_by: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 5400000).toISOString(),
        updated_at: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: 'wsd-10000000-0000-0000-0000-000000000002',
        student_id: 'st100000-0000-0000-0000-000000000005',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        event_type: 'BOARDING',
        detected_stop_id: 's1000000-0000-0000-0000-000000000003',
        assigned_stop_id: 's1000000-0000-0000-0000-000000000001',
        detected_time: new Date(Date.now() - 3600000).toISOString(),
        distance_from_assigned_meters: 4720,
        stop_sequence_delta: 2,
        severity: 'HIGH',
        status: 'INVESTIGATING',
        resolution_notes: 'Driver notified; student reported missing designated stop due to heavy rain.',
        resolved_by: null,
        resolved_at: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'wsd-10000000-0000-0000-0000-000000000003',
        student_id: 'st100000-0000-0000-0000-000000000003',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        event_type: 'ALIGHTING',
        detected_stop_id: 's1000000-0000-0000-0000-000000000002',
        assigned_stop_id: 's1000000-0000-0000-0000-000000000005',
        detected_time: new Date(Date.now() - 86400000).toISOString(),
        distance_from_assigned_meters: 6100,
        stop_sequence_delta: -3,
        severity: 'CRITICAL',
        status: 'RESOLVED',
        resolution_notes: 'Parent requested early dropoff for doctor consultation. Verified via parent phone call.',
        resolved_by: 'ADMIN-SECURITY-CHIEF',
        resolved_at: new Date(Date.now() - 82800000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 82800000).toISOString()
      }
    ],
    stop_detection_alerts: [
      {
        id: 'sda-10000000-0000-0000-0000-000000000001',
        detection_id: 'wsd-10000000-0000-0000-0000-000000000001',
        alert_type: 'WRONG_STOP_BOARDING',
        severity: 'WARNING',
        title: 'Wrong Pickup Stop: Aravind Kumar (922521104015)',
        message: 'Student boarded at Thanthonimalai instead of assigned stop Karur Central Bus Stand (Bay 4). Distance mismatch: 2.8 km.',
        channels: '["SMS", "IN_APP"]',
        dismissed: false,
        dismissed_by: null,
        dismissed_at: null,
        created_at: new Date(Date.now() - 5400000).toISOString()
      },
      {
        id: 'sda-10000000-0000-0000-0000-000000000002',
        detection_id: 'wsd-10000000-0000-0000-0000-000000000002',
        alert_type: 'WRONG_STOP_BOARDING',
        severity: 'CRITICAL',
        title: 'Severe Stop Mismatch: Praveen N (922521104050)',
        message: 'Student boarded at Rayanur Junction (+2 stops away, 4.7 km). Immediate verification required.',
        channels: '["SMS", "IN_APP", "PUSH"]',
        dismissed: false,
        dismissed_by: null,
        dismissed_at: null,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    stop_performance_log: [
      {
        id: 'spl-10000000-0000-0000-0000-000000000001',
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        log_date: new Date().toISOString().split('T')[0],
        total_stops_scheduled: 5,
        total_stops_serviced: 5,
        skipped_stops_count: 0,
        wrong_stop_events_count: 2,
        on_time_stops_count: 4,
        average_dwell_time_seconds: 140,
        compliance_rate: 96.0,
        created_at: new Date().toISOString()
      },
      {
        id: 'spl-10000000-0000-0000-0000-000000000002',
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        route_id: 'r1000000-0000-0000-0000-000000000003',
        log_date: new Date().toISOString().split('T')[0],
        total_stops_scheduled: 6,
        total_stops_serviced: 6,
        skipped_stops_count: 0,
        wrong_stop_events_count: 0,
        on_time_stops_count: 6,
        average_dwell_time_seconds: 110,
        compliance_rate: 100.0,
        created_at: new Date().toISOString()
      }
    ],
    bus_gps_locations: [
      {
        id: 1,
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        latitude: 10.9320,
        longitude: 78.0864,
        accuracy_meters: 4.2,
        speed_kmh: 38.5,
        heading_degrees: 175.0,
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        latitude: 10.9150,
        longitude: 78.0890,
        accuracy_meters: 5.0,
        speed_kmh: 42.0,
        heading_degrees: 182.0,
        timestamp: new Date().toISOString()
      }
    ],
    route_progress: [
      {
        id: 1,
        bus_id: 'b1000000-0000-0000-0000-000000000001',
        route_id: 'r1000000-0000-0000-0000-000000000001',
        current_stop_id: 's1000000-0000-0000-0000-000000000002',
        next_stop_id: 's1000000-0000-0000-0000-000000000003',
        stops_completed: 2,
        total_stops: 5,
        estimated_arrival_next_stop: new Date(Date.now() + 8 * 60000).toISOString(),
        on_schedule: true,
        delay_minutes: 0,
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        bus_id: 'b1000000-0000-0000-0000-000000000002',
        route_id: 'r1000000-0000-0000-0000-000000000002',
        current_stop_id: 's1000000-0000-0000-0000-000000000003',
        next_stop_id: 's1000000-0000-0000-0000-000000000004',
        stops_completed: 3,
        total_stops: 5,
        estimated_arrival_next_stop: new Date(Date.now() + 5 * 60000).toISOString(),
        on_schedule: true,
        delay_minutes: 1,
        updated_at: new Date().toISOString()
      }
    ],
    live_eta_cache: [
      {
        id: 1,
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_id: 's1000000-0000-0000-0000-000000000003',
        estimated_arrival: new Date(Date.now() + 8 * 60000).toISOString(),
        confidence_percent: 92.0,
        last_updated: new Date().toISOString()
      },
      {
        id: 2,
        route_id: 'r1000000-0000-0000-0000-000000000001',
        stop_id: 's1000000-0000-0000-0000-000000000005',
        estimated_arrival: new Date(Date.now() + 22 * 60000).toISOString(),
        confidence_percent: 88.5,
        last_updated: new Date().toISOString()
      }
    ],
    route_performance_metrics: [
      {
        id: 1,
        route_id: 'r1000000-0000-0000-0000-000000000001',
        date: new Date().toISOString().split('T')[0],
        average_delay_minutes: 1.2,
        on_time_percentage: 95.5,
        passenger_count: 52,
        fuel_consumed_liters: 14.5,
        total_distance_km: 26.8,
        created_at: new Date().toISOString()
      }
    ],
    // ==========================================
    // PHASE 12: Notifications & Alerts System
    // ==========================================
    notifications: [
      {
        id: 1,
        notification_type: 'EMERGENCY_SOS',
        event_id: 'evt-sos-001',
        event_type: 'EMERGENCY_SOS',
        title: '🚨 SOS Alert: Bus 12',
        message: 'Emergency SOS button triggered on Bus 12 (Route 3 - Karur to VSB Campus) near NH-47.',
        priority: 'CRITICAL',
        status: 'SENT',
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
        updated_at: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: 2,
        notification_type: 'GEOFENCE_EXIT',
        event_id: 'evt-geo-002',
        event_type: 'GEOFENCE_EXIT',
        title: 'Route Deviation Alert',
        message: 'Bus 08 has deviated from prescribed Route 5 geofence zone by 620 meters.',
        priority: 'HIGH',
        status: 'DELIVERED',
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
        updated_at: new Date(Date.now() - 45 * 60000).toISOString()
      },
      {
        id: 3,
        notification_type: 'BOARDING',
        event_id: 'evt-brd-003',
        event_type: 'BOARDING',
        title: 'Student Boarding Verified',
        message: 'Student Rajesh Kumar (CS023) has safely boarded Bus 12 at Stop 4 (Gandhigramam).',
        priority: 'LOW',
        status: 'READ',
        created_at: new Date(Date.now() - 120 * 60000).toISOString(),
        updated_at: new Date(Date.now() - 110 * 60000).toISOString()
      },
      {
        id: 4,
        notification_type: 'ETA_DELAY',
        event_id: 'evt-dly-004',
        event_type: 'ETA_DELAY',
        title: 'Traffic Delay Notification',
        message: 'Bus 04 on Route 2 is delayed by ~15 mins due to road construction on Karur Main Road.',
        priority: 'MEDIUM',
        status: 'DELIVERED',
        created_at: new Date(Date.now() - 180 * 60000).toISOString(),
        updated_at: new Date(Date.now() - 180 * 60000).toISOString()
      }
    ],
    notification_recipients: [
      {
        id: 1,
        notification_id: '1',
        recipient_id: 'u1000000-0000-0000-0000-000000000001',
        recipient_role: 'ADMIN',
        email: 'transport.admin@vsb.ac.in',
        phone: '+919876543210',
        channels: { email: true, sms: true, push: true, in_app: true },
        sent_at: new Date(Date.now() - 14 * 60000).toISOString(),
        delivery_status: 'DELIVERED',
        read_at: null,
        created_at: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: 2,
        notification_id: '2',
        recipient_id: 'u1000000-0000-0000-0000-000000000002',
        recipient_role: 'STAFF',
        email: 'driver.ramesh@vsb.ac.in',
        phone: '+919876543211',
        channels: { email: true, sms: false, push: true, in_app: true },
        sent_at: new Date(Date.now() - 44 * 60000).toISOString(),
        delivery_status: 'DELIVERED',
        read_at: null,
        created_at: new Date(Date.now() - 45 * 60000).toISOString()
      },
      {
        id: 3,
        notification_id: '3',
        recipient_id: 'p1000000-0000-0000-0000-000000000001',
        recipient_role: 'PARENT',
        email: 'parent.kumar@gmail.com',
        phone: '+919842100001',
        channels: { email: false, sms: true, push: true, in_app: true },
        sent_at: new Date(Date.now() - 119 * 60000).toISOString(),
        delivery_status: 'DELIVERED',
        read_at: new Date(Date.now() - 110 * 60000).toISOString(),
        created_at: new Date(Date.now() - 120 * 60000).toISOString()
      },
      {
        id: 4,
        notification_id: '4',
        recipient_id: 'u1000000-0000-0000-0000-000000000001',
        recipient_role: 'ADMIN',
        email: 'transport.admin@vsb.ac.in',
        phone: '+919876543210',
        channels: { email: true, sms: false, push: true, in_app: true },
        sent_at: new Date(Date.now() - 179 * 60000).toISOString(),
        delivery_status: 'DELIVERED',
        read_at: null,
        created_at: new Date(Date.now() - 180 * 60000).toISOString()
      }
    ],
    notification_preferences: [
      {
        id: 1,
        user_id: 'u1000000-0000-0000-0000-000000000001',
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '06:00',
        categories: { EMERGENCY_SOS: true, GEOFENCE_EXIT: true, BOARDING: true, ETA_DELAY: true, SPEED_VIOLATION: true, SYSTEM_ANNOUNCEMENT: true },
        digest_mode: 'NONE',
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 'p1000000-0000-0000-0000-000000000001',
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        quiet_hours_enabled: true,
        quiet_hours_start: '21:30',
        quiet_hours_end: '06:00',
        categories: { EMERGENCY_SOS: true, GEOFENCE_EXIT: true, BOARDING: true, ETA_DELAY: true, SPEED_VIOLATION: false, SYSTEM_ANNOUNCEMENT: true },
        digest_mode: 'DAILY',
        updated_at: new Date().toISOString()
      }
    ],
    notification_templates: [
      {
        id: 1,
        template_code: 'EMERGENCY_SOS',
        template_name: 'Emergency SOS Broadcast',
        category: 'SAFETY',
        channels: ['email', 'sms', 'push', 'in_app'],
        subject_template: '🚨 URGENT: SOS Alert on Bus {{bus_number}}',
        body_template: 'EMERGENCY ALERT: Bus {{bus_number}} (Route {{route_name}}) triggered an SOS alert at {{timestamp}} near {{location}}. Coordinates: {{latitude}}, {{longitude}}.',
        variables: ['bus_number', 'route_name', 'timestamp', 'location', 'latitude', 'longitude'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        template_code: 'GEOFENCE_EXIT',
        template_name: 'Geofence Deviation Alert',
        category: 'SECURITY',
        channels: ['email', 'push', 'in_app'],
        subject_template: '⚠️ Route Deviation: Bus {{bus_number}} Exited Corridor',
        body_template: 'Alert: Bus {{bus_number}} has crossed the assigned corridor boundary for Route {{route_name}} at {{timestamp}}. Current speed: {{speed}} km/h.',
        variables: ['bus_number', 'route_name', 'timestamp', 'speed'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        template_code: 'BOARDING_CONFIRMATION',
        template_name: 'Student Boarding / De-boarding Confirmation',
        category: 'OPERATIONS',
        channels: ['sms', 'push', 'in_app'],
        subject_template: 'Student Boarding Update - {{student_name}}',
        body_template: 'Hello {{parent_name}}, your ward {{student_name}} (Roll: {{roll_number}}) has successfully boarded Bus {{bus_number}} at {{stop_name}} at {{timestamp}}.',
        variables: ['parent_name', 'student_name', 'roll_number', 'bus_number', 'stop_name', 'timestamp'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        template_code: 'ETA_DELAY',
        template_name: 'Bus ETA Delay Notification',
        category: 'TRANSIT',
        channels: ['email', 'sms', 'push', 'in_app'],
        subject_template: 'Delay Advisory: Bus {{bus_number}} delayed by {{delay_minutes}} mins',
        body_template: 'Please note that Bus {{bus_number}} on Route {{route_name}} is experiencing a delay of approximately {{delay_minutes}} minutes due to {{reason}}. Revised ETA for {{stop_name}}: {{new_eta}}.',
        variables: ['bus_number', 'route_name', 'delay_minutes', 'reason', 'stop_name', 'new_eta'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    alert_rules: [
      {
        id: 1,
        rule_name: 'Emergency SOS Auto-Dispatch',
        event_type: 'EMERGENCY_SOS',
        condition_json: { trigger: 'SOS_BUTTON' },
        actions: { email: true, sms: true, push: true, in_app: true },
        recipients_query: 'ALL_INVOLVED',
        priority: 'CRITICAL',
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        rule_name: 'Geofence Breach Rapid Alert',
        event_type: 'GEOFENCE_EXIT',
        condition_json: { deviation_meters: { gte: 500 } },
        actions: { email: true, sms: false, push: true, in_app: true },
        recipients_query: 'STAFF_AND_ADMIN',
        priority: 'HIGH',
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        rule_name: 'Significant ETA Delay Alert',
        event_type: 'ETA_DELAY',
        condition_json: { delay_minutes: { gte: 10 } },
        actions: { email: true, sms: true, push: true, in_app: true },
        recipients_query: 'PARENTS_ONLY',
        priority: 'MEDIUM',
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        rule_name: 'Student Biometric Boarding Confirmation',
        event_type: 'BOARDING',
        condition_json: { status: 'VERIFIED' },
        actions: { email: false, sms: true, push: true, in_app: true },
        recipients_query: 'PARENTS_ONLY',
        priority: 'LOW',
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    notification_audit_log: [
      {
        id: 1,
        notification_id: '1',
        channel: 'in_app',
        recipient_identifier: 'transport.admin@vsb.ac.in',
        status: 'DELIVERED',
        provider_response: { status: 'broadcasted', socket_connected: true },
        error_message: null,
        attempts: 1,
        created_at: new Date(Date.now() - 14 * 60000).toISOString()
      },
      {
        id: 2,
        notification_id: '1',
        channel: 'email',
        recipient_identifier: 'transport.admin@vsb.ac.in',
        status: 'DELIVERED',
        provider_response: { simulated: true, messageId: 'sim-email-001' },
        error_message: null,
        attempts: 1,
        created_at: new Date(Date.now() - 14 * 60000).toISOString()
      },
      {
        id: 3,
        notification_id: '3',
        channel: 'sms',
        recipient_identifier: '+919842100001',
        status: 'DELIVERED',
        provider_response: { simulated: true, sid: 'SM_simulated_001' },
        error_message: null,
        attempts: 1,
        created_at: new Date(Date.now() - 119 * 60000).toISOString()
      }
    ]
  };

  return fallbackStore;
}

// Check real PostgreSQL connection on boot
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log(`[DB STATUS] PostgreSQL/Supabase database not reachable (${err.message}). Activating resilient in-memory fallback store.`);
    isPgConnected = false;
    initFallbackStore();
  } else {
    console.log('[DB STATUS] Connected successfully to PostgreSQL (Supabase Cloud) at:', res.rows[0].now);
    isPgConnected = true;
  }
});

// Dual-mode Query Executor
const db = {
  isPostgres: () => isPgConnected,
  
  // Real pool instance (for transactions / direct pg usage)
  pool,

  async end() {
    try {
      if (pool && pool.end) await pool.end();
    } catch (_) {}
  },

  // Universal query function
  async query(text, params = []) {
    if (isPgConnected) {
      return pool.query(text, params);
    }

    // Process using Fallback Store
    const store = initFallbackStore();
    return executeFallbackQuery(store, text, params);
  }
};

// Simple query parsing for all tables when running in fallback mode
function executeFallbackQuery(store, sql, params = []) {
  const normalized = sql.trim().replace(/\s+/g, ' ');

  // Ping / health check queries
  if (/^SELECT\s+(?:1|NOW\(\)|CURRENT_TIMESTAMP)/i.test(normalized)) {
    return {
      rows: [{ ping: 1, '?column?': 1, now: new Date().toISOString() }],
      rowCount: 1
    };
  }

  // Multi-COUNT summary query for boarding attendance
  if (/FROM\s+student_attendance_log/i.test(normalized) && /verified_boardings|completed_boardings/i.test(normalized)) {
    let targetBus = params[0];
    let atts = (store.student_attendance_log || []).filter(a => !targetBus || String(a.bus_id) === String(targetBus));
    return {
      rows: [{
        total_boardings: String(atts.length),
        verified_boardings: String(atts.filter(a => a.verified_by_biometric).length),
        completed_boardings: String(atts.filter(a => a.boarding_status === 'Boarded').length),
        absent_count: String(atts.filter(a => a.boarding_status === 'Absent').length)
      }],
      rowCount: 1
    };
  }

  // 0a. Specific alert anomaly count query
  if (/FROM\s+alerts/i.test(normalized) && /anomaly_count/i.test(normalized)) {
    const targetStudentId = params[0];
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const count = (store.alerts || []).filter(a => {
      const sMatch = !targetStudentId || String(a.student_id) === String(targetStudentId);
      const typeMatch = a.alert_type !== 'UNKNOWN_STUDENT';
      const timeMatch = !a.created_at || new Date(a.created_at).getTime() >= cutoff;
      return sMatch && typeMatch && timeMatch;
    }).length;
    return {
      rows: [{ anomaly_count: String(count), count: String(count) }],
      rowCount: 1
    };
  }

  // 0b. Specific alert statistics aggregation query
  if (/FROM\s+alerts/i.test(normalized) && /total_alerts/i.test(normalized)) {
    const targetBus = params[0];
    const intervalMatch = normalized.match(/INTERVAL\s+'(\d+)\s*hours?'/i);
    const hours = intervalMatch ? parseInt(intervalMatch[1], 10) : 24;
    const cutoff = Date.now() - hours * 3600 * 1000;
    let alertList = (store.alerts || []).filter(a => {
      const timeMatch = !a.created_at || new Date(a.created_at).getTime() >= cutoff;
      const busMatch = !targetBus || String(a.bus_id) === String(targetBus) || String(a.assigned_bus_id) === String(targetBus);
      return timeMatch && busMatch;
    });
    const studentIds = new Set(alertList.map(a => a.student_id).filter(Boolean));
    return {
      rows: [{
        total_alerts: String(alertList.length),
        active_alerts: String(alertList.filter(a => (a.alert_status || a.status) === 'ACTIVE').length),
        critical_alerts: String(alertList.filter(a => a.severity === 'CRITICAL').length),
        wrong_bus_count: String(alertList.filter(a => a.alert_type === 'WRONG_BUS').length),
        wrong_stop_count: String(alertList.filter(a => a.alert_type === 'WRONG_STOP').length),
        affected_students: String(studentIds.size)
      }],
      rowCount: 1
    };
  }

  // 0. COUNT queries (e.g., SELECT COUNT(*) as count FROM ...)
  if (/SELECT\s+COUNT\(\*\)/i.test(normalized)) {
    const fromMatch = normalized.match(/FROM\s+([a-z_]+)/i);
    if (fromMatch) {
      const tableName = fromMatch[1].toLowerCase();
      let countRows = (store[tableName] || []).map(r => ({ ...r }));
      if (/transport_status\s*=\s*'ACTIVE'/i.test(normalized)) {
        countRows = countRows.filter(r => r.transport_status === 'ACTIVE');
      } else if (/employment_status\s*=\s*'ACTIVE'/i.test(normalized)) {
        countRows = countRows.filter(r => r.employment_status === 'ACTIVE');
      } else if (/staff_type\s*=\s*'DRIVER'/i.test(normalized)) {
        countRows = countRows.filter(r => r.staff_type === 'DRIVER');
      } else if (/request_status\s*=\s*'PENDING'/i.test(normalized)) {
        countRows = countRows.filter(r => r.request_status === 'PENDING');
      } else if (/verification_result\s*=\s*'VERIFIED'/i.test(normalized)) {
        countRows = countRows.filter(r => r.verification_result === 'VERIFIED');
      }
      return { rows: [{ count: String(countRows.length) }], rowCount: 1 };
    }
    return { rows: [{ count: '0' }], rowCount: 1 };
  }

  // 1. SELECT queries
  if (/^SELECT\s+/i.test(normalized)) {
    const fromMatch = normalized.match(/FROM\s+([a-z_]+)(?:\s+[a-z_]+)?/i);
    if (!fromMatch) return { rows: [], rowCount: 0 };

    const tableName = fromMatch[1].toLowerCase();
    const table = store[tableName] || [];
    let rows = table.map(item => ({ ...item }));

    // Hydrate joined data
    if (tableName === 'stops') {
      rows = rows.map(s => {
        const route = (store.routes || []).find(r => r.route_id === s.route_id);
        return {
          ...s,
          id: s.id || s.stop_id,
          route_name: route ? route.route_name : 'Karur Urban Trunk Line',
          route_code: route ? route.route_code : 'RT-KRR-01',
          route_type: route ? route.route_type : 'MORNING'
        };
      });
    } else if (tableName === 'buses') {
      rows = rows.map(b => ({
        ...b,
        id: b.id || b.bus_id
      }));
    } else if (tableName === 'drivers') {
      rows = rows.map(d => {
        const bus = (store.buses || []).find(b => b.bus_id === d.assigned_bus_id);
        return {
          ...d,
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914'
        };
      });
    } else if (tableName === 'bus_in_charges') {
      rows = rows.map(bic => {
        const bus = (store.buses || []).find(b => b.bus_id === bic.assigned_bus_id);
        return {
          ...bic,
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914'
        };
      });
    } else if (tableName === 'bus_route_assignments') {
      rows = rows.map(a => {
        const bus = (store.buses || []).find(b => b.bus_id === a.bus_id);
        const route = (store.routes || []).find(r => r.route_id === a.route_id);
        return {
          ...a,
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914',
          route_name: route ? route.route_name : 'Karur Urban Trunk Line',
          route_code: route ? route.route_code : 'RT-KRR-01'
        };
      });
    } else if (tableName === 'cameras') {
      rows = rows.map(c => {
        const bus = (store.buses || []).find(b => b.bus_id === c.bus_id);
        return {
          ...c,
          id: c.camera_id,
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914',
          bus_status: bus ? bus.status : 'ACTIVE',
          hls_url: c.hls_url || c.stream_url || 'https://stream.vsb.ac.in/hls/default/index.m3u8',
          rtsp_url: c.rtsp_url || 'rtsp://admin:vsb123@192.168.1.100:554/live/ch0'
        };
      });
    } else if (tableName === 'students') {
      rows = rows.map(s => {
        const assign = (store.student_bus_assignments || []).find(a => (a.student_id === s.student_id || a.student_id === s.id) && (a.status === 'ACTIVE' || a.is_active) && (a.is_primary !== false));
        const bus = assign ? (store.buses || []).find(b => b.bus_id === assign.bus_id || b.id === assign.bus_id) : null;
        const route = assign ? (store.routes || []).find(r => r.route_id === assign.route_id || r.id === assign.route_id) : null;
        const bStop = assign ? (store.stops || []).find(st => st.stop_id === assign.boarding_stop_id || st.stop_id === assign.stop_id || st.id === assign.stop_id) : null;
        const dStop = assign ? (store.stops || []).find(st => st.stop_id === assign.drop_stop_id) : null;
        const fullName = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
        return {
          ...s,
          id: s.id || s.student_id,
          full_name: fullName,
          register_number: s.register_number || s.roll_number || 'N/A',
          student_name: fullName,
          bus_number: bus ? bus.bus_number : null,
          bus_id: assign ? assign.bus_id : null,
          route_name: route ? route.route_name : null,
          route_id: assign ? assign.route_id : null,
          boarding_stop_name: bStop ? bStop.stop_name : null,
          drop_stop_name: dStop ? dStop.stop_name : null
        };
      });
    } else if (tableName === 'student_bus_assignments') {
      rows = rows.map(a => {
        const student = (store.students || []).find(st => st.student_id === a.student_id || st.id === a.student_id);
        const bus = (store.buses || []).find(b => b.bus_id === a.bus_id || b.id === a.bus_id);
        const route = (store.routes || []).find(r => r.route_id === a.route_id || r.id === a.route_id);
        const bStop = (store.stops || []).find(st => st.stop_id === a.boarding_stop_id || st.stop_id === a.stop_id || st.id === a.stop_id);
        const dStop = (store.stops || []).find(st => st.stop_id === a.drop_stop_id);
        const fullName = student ? (student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()) : 'Unknown Student';
        return {
          ...a,
          id: a.id || a.assignment_id,
          stop_id: a.stop_id || a.boarding_stop_id,
          is_active: a.is_active !== undefined ? a.is_active : (a.status === 'ACTIVE'),
          roll_number: student ? (student.roll_number || student.register_number) : 'Unknown',
          register_number: student ? (student.register_number || student.roll_number) : 'Unknown',
          first_name: student ? student.first_name : '',
          last_name: student ? student.last_name : '',
          full_name: fullName,
          student_name: fullName,
          department: student ? student.department : '',
          semester: student ? student.semester : null,
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914',
          route_name: route ? route.route_name : 'Karur Urban Trunk Line',
          route_code: route ? route.route_code : 'RT-KRR-01',
          boarding_stop_name: bStop ? bStop.stop_name : 'Default Boarding Stop',
          drop_stop_name: dStop ? dStop.stop_name : 'V.S.B. Engineering College Main Gate'
        };
      });
    } else if (tableName === 'boarding_verification_events') {
      rows = rows.map(bve => {
        const st = (store.students || []).find(s => s.student_id === bve.student_id || s.id === bve.student_id);
        const bus = (store.buses || []).find(b => b.bus_id === bve.bus_id || b.id === bve.bus_id);
        const fullName = st ? (st.full_name || `${st.first_name || ''} ${st.last_name || ''}`.trim()) : 'Unknown Student';
        return {
          ...bve,
          id: bve.id || bve.event_id,
          full_name: fullName,
          register_number: st ? (st.register_number || st.roll_number) : 'N/A',
          bus_number: bus ? bus.bus_number : 'BUS-14'
        };
      });
    } else if (tableName === 'alerts') {
      rows = rows.map(al => {
        const st = (store.students || []).find(s => String(s.student_id) === String(al.student_id) || String(s.id) === String(al.student_id));
        const bus = (store.buses || []).find(b => String(b.bus_id) === String(al.bus_id) || String(b.id) === String(al.bus_id));
        const assignedBus = (store.buses || []).find(b => String(b.bus_id) === String(al.assigned_bus_id) || String(b.id) === String(al.assigned_bus_id));
        const fullName = st ? (st.full_name || `${st.first_name || ''} ${st.last_name || ''}`.trim()) : 'Unknown Student';
        return {
          ...al,
          id: al.id || al.alert_id,
          full_name: fullName,
          register_number: st ? (st.register_number || st.roll_number) : 'N/A',
          bus_number: bus ? bus.bus_number : (al.bus_id ? `BUS-${al.bus_id}` : 'BUS-14'),
          assigned_bus_number: assignedBus ? assignedBus.bus_number : (al.assigned_bus_id ? `BUS-${al.assigned_bus_id}` : null)
        };
      });
    } else if (tableName === 'anomaly_escalations') {
      rows = rows.map(ae => {
        const st = (store.students || []).find(s => String(s.student_id) === String(ae.student_id) || String(s.id) === String(ae.student_id));
        const fullName = st ? (st.full_name || `${st.first_name || ''} ${st.last_name || ''}`.trim()) : 'Unknown Student';
        return {
          ...ae,
          id: ae.id || ae.escalation_id,
          full_name: fullName,
          register_number: st ? (st.register_number || st.roll_number) : 'N/A'
        };
      });
    } else if (tableName === 'student_transport_requests') {
      rows = rows.map(req => {
        const student = (store.students || []).find(st => st.student_id === req.student_id);
        const bus = req.requested_bus_id ? (store.buses || []).find(b => b.bus_id === req.requested_bus_id) : null;
        const route = req.requested_route_id ? (store.routes || []).find(r => r.route_id === req.requested_route_id) : null;
        const bStop = req.requested_boarding_stop_id ? (store.stops || []).find(st => st.stop_id === req.requested_boarding_stop_id) : null;
        const dStop = req.requested_drop_stop_id ? (store.stops || []).find(st => st.stop_id === req.requested_drop_stop_id) : null;
        return {
          ...req,
          roll_number: student ? student.roll_number : 'Unknown',
          first_name: student ? student.first_name : '',
          last_name: student ? student.last_name : '',
          student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
          department: student ? student.department : '',
          requested_bus_number: bus ? bus.bus_number : null,
          requested_route_name: route ? route.route_name : null,
          requested_route_code: route ? route.route_code : null,
          requested_boarding_stop_name: bStop ? bStop.stop_name : null,
          requested_drop_stop_name: dStop ? dStop.stop_name : null
        };
      });
    } else if (tableName === 'student_attendance_log') {
      rows = rows.map(att => {
        const student = (store.students || []).find(st => st.student_id === att.student_id);
        const bus = att.bus_id ? (store.buses || []).find(b => b.bus_id === att.bus_id) : null;
        const cam = att.camera_id ? (store.cameras || []).find(c => c.camera_id === att.camera_id) : null;
        const bStop = att.boarding_stop_id ? (store.stops || []).find(st => st.stop_id === att.boarding_stop_id) : null;
        const dStop = att.drop_stop_id ? (store.stops || []).find(st => st.stop_id === att.drop_stop_id) : null;
        return {
          ...att,
          roll_number: student ? student.roll_number : 'Unknown',
          first_name: student ? student.first_name : '',
          last_name: student ? student.last_name : '',
          student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
          department: student ? student.department : '',
          bus_number: bus ? bus.bus_number : 'BUS-14',
          camera_name: cam ? cam.camera_name : 'Manual Scanner',
          boarding_stop_name: bStop ? bStop.stop_name : 'Boarding Stop',
          drop_stop_name: dStop ? dStop.stop_name : 'Campus Drop'
        };
      });
    } else if (tableName === 'staff_members') {
      rows = rows.map(m => {
        const bus = m.assigned_bus_id ? (store.buses || []).find(b => b.bus_id === m.assigned_bus_id) : null;
        const role = m.role_id ? (store.staff_roles || []).find(r => r.role_id === m.role_id) : null;
        return {
          ...m,
          full_name: `${m.first_name} ${m.last_name}`,
          staff_name: `${m.first_name} ${m.last_name}`,
          bus_number: bus ? bus.bus_number : null,
          registration_plate: bus ? bus.registration_plate : null,
          role_name: role ? role.role_name : m.staff_type,
          role_description: role ? role.role_description : null
        };
      });
    } else if (tableName === 'staff_shifts') {
      rows = rows.map(sh => {
        const staff = (store.staff_members || []).find(s => s.staff_id === sh.staff_id);
        const bus = (store.buses || []).find(b => b.bus_id === sh.bus_id);
        const route = (store.routes || []).find(r => r.route_id === sh.route_id);
        return {
          ...sh,
          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff',
          employee_id: staff ? staff.employee_id : '',
          staff_type: staff ? staff.staff_type : 'DRIVER',
          phone: staff ? staff.phone : '',
          bus_number: bus ? bus.bus_number : '',
          registration_plate: bus ? bus.registration_plate : '',
          route_code: route ? route.route_code : '',
          route_name: route ? route.route_name : ''
        };
      });
    } else if (tableName === 'staff_leave_requests') {
      rows = rows.map(lr => {
        const staff = (store.staff_members || []).find(s => s.staff_id === lr.staff_id);
        const repl = lr.replacement_staff_id ? (store.staff_members || []).find(s => s.staff_id === lr.replacement_staff_id) : null;
        return {
          ...lr,
          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff',
          employee_id: staff ? staff.employee_id : '',
          staff_type: staff ? staff.staff_type : '',
          department: staff ? staff.department : '',
          replacement_staff_name: repl ? `${repl.first_name} ${repl.last_name}` : null
        };
      });
    } else if (tableName === 'staff_performance_log') {
      rows = rows.map(pl => {
        const staff = (store.staff_members || []).find(s => s.staff_id === pl.staff_id);
        const student = pl.complaint_from_student_id ? (store.students || []).find(st => st.student_id === pl.complaint_from_student_id) : null;
        return {
          ...pl,
          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff',
          employee_id: staff ? staff.employee_id : '',
          staff_type: staff ? staff.staff_type : '',
          student_name: student ? `${student.first_name} ${student.last_name}` : null,
          student_roll_number: student ? student.roll_number : null
        };
      });
    } else if (tableName === 'staff_salary_structure') {
      rows = rows.map(sal => {
        const staff = (store.staff_members || []).find(s => s.staff_id === sal.staff_id);
        return {
          ...sal,
          staff_name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff',
          employee_id: staff ? staff.employee_id : '',
          designation: staff ? staff.designation : '',
          department: staff ? staff.department : '',
          staff_type: staff ? staff.staff_type : ''
        };
      });
    } else if (tableName === 'camera_network_metrics') {
      rows = rows.map(m => {
        const cam = (store.cameras || []).find(c => c.camera_id === m.camera_id);
        const bus = (store.buses || []).find(b => b.bus_id === m.bus_id || (cam && b.bus_id === cam.bus_id));
        return {
          ...m,
          camera_name: cam ? cam.camera_name : 'Camera Unit',
          camera_type: cam ? cam.camera_type : 'ENTRY',
          location_type: cam ? cam.location_type : 'FRONT_DOOR',
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914'
        };
      });
    } else if (tableName === 'camera_events') {
      rows = rows.map(ev => {
        const cam = (store.cameras || []).find(c => c.camera_id === ev.camera_id);
        const bus = (store.buses || []).find(b => b.bus_id === ev.bus_id || (cam && b.bus_id === cam.bus_id));
        return {
          ...ev,
          camera_name: cam ? cam.camera_name : 'Camera Unit',
          camera_type: cam ? cam.camera_type : 'ENTRY',
          location_type: cam ? cam.location_type : 'FRONT_DOOR',
          ip_address: cam ? cam.ip_address : '',
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914'
        };
      });
    } else if (tableName === 'camera_calibration') {
      rows = rows.map(cal => {
        const cam = (store.cameras || []).find(c => c.camera_id === cal.camera_id);
        return {
          ...cal,
          camera_name: cam ? cam.camera_name : 'Camera Unit',
          camera_type: cam ? cam.camera_type : 'ENTRY',
          location_type: cam ? cam.location_type : 'FRONT_DOOR',
          ip_address: cam ? cam.ip_address : ''
        };
      });
    } else if (tableName === 'camera_stream_segments') {
      rows = rows.map(seg => {
        const cam = (store.cameras || []).find(c => c.camera_id === seg.camera_id);
        const bus = (store.buses || []).find(b => b.bus_id === seg.bus_id || (cam && b.bus_id === cam.bus_id));
        return {
          ...seg,
          camera_name: cam ? cam.camera_name : 'Camera Unit',
          camera_type: cam ? cam.camera_type : 'ENTRY',
          bus_number: bus ? bus.bus_number : 'BUS-14'
        };
      });
    } else if (tableName === 'biometric_enrollments') {
      rows = rows.map(en => {
        let person_name = 'Unknown';
        let person_code = '';
        let department = '';
        let phone = '';
        if (en.person_type === 'STUDENT') {
          const st = (store.students || []).find(s => s.student_id === en.person_id);
          if (st) {
            person_name = `${st.first_name} ${st.last_name}`;
            person_code = st.roll_number;
            department = st.department || '';
            phone = st.phone || '';
          }
        } else {
          const sm = (store.staff_members || []).find(s => s.staff_id === en.person_id);
          if (sm) {
            person_name = `${sm.first_name} ${sm.last_name}`;
            person_code = sm.employee_id;
            department = sm.department || '';
            phone = sm.phone || '';
          }
        }
        return {
          ...en,
          person_name,
          person_code,
          department,
          phone
        };
      });
    } else if (tableName === 'recognition_results') {
      rows = rows.map(rec => {
        const cam = (store.cameras || []).find(c => c.camera_id === rec.camera_id);
        const bus = (store.buses || []).find(b => b.bus_id === rec.bus_id || (cam && b.bus_id === cam.bus_id));
        let person_name = rec.matched_person_name || 'Unidentified Individual';
        let person_code = '';
        if (rec.matched_person_id) {
          const st = (store.students || []).find(s => s.student_id === rec.matched_person_id);
          if (st) {
            person_name = `${st.first_name} ${st.last_name}`;
            person_code = st.roll_number;
          } else {
            const sm = (store.staff_members || []).find(s => s.staff_id === rec.matched_person_id);
            if (sm) {
              person_name = `${sm.first_name} ${sm.last_name}`;
              person_code = sm.employee_id;
            }
          }
        }
        return {
          ...rec,
          camera_name: cam ? cam.camera_name : 'Cabin Camera Unit',
          camera_type: cam ? cam.camera_type : 'CABIN_ENTRY',
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914',
          person_name,
          person_code
        };
      });
    } else if (tableName === 'recognition_audit_log') {
      rows = rows.map(aud => {
        const user = (store.users || []).find(u => u.user_id === aud.actor_id);
        return {
          ...aud,
          actor_email: user ? user.email : 'system@vsb.ac.in',
          actor_role: user ? user.role : 'SYSTEM'
        };
      });
    } else if (tableName === 'stop_assignments') {
      rows = rows.map(sa => {
        const st = (store.students || []).find(s => s.student_id === sa.student_id);
        const rt = (store.routes || []).find(r => r.route_id === sa.route_id);
        const pStop = (store.stops || []).find(s => s.stop_id === sa.pickup_stop_id);
        const dStop = (store.stops || []).find(s => s.stop_id === sa.dropoff_stop_id);
        const bus = (store.buses || []).find(b => b.bus_id === sa.assigned_bus_id);
        return {
          ...sa,
          student_name: st ? `${st.first_name} ${st.last_name}` : 'Unknown Student',
          roll_number: st ? st.roll_number : '',
          department: st ? st.department : '',
          year: st ? st.year : '',
          phone: st ? st.phone : '',
          route_name: rt ? rt.route_name : 'Default Route',
          route_number: rt ? rt.route_number : '',
          pickup_stop_name: pStop ? pStop.stop_name : 'Unknown Stop',
          pickup_stop_sequence: pStop ? pStop.stop_sequence : 0,
          dropoff_stop_name: dStop ? dStop.stop_name : 'Unknown Stop',
          dropoff_stop_sequence: dStop ? dStop.stop_sequence : 0,
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914'
        };
      });
    } else if (tableName === 'wrong_stop_detections') {
      rows = rows.map(wsd => {
        const st = (store.students || []).find(s => s.student_id === wsd.student_id);
        const bus = (store.buses || []).find(b => b.bus_id === wsd.bus_id);
        const rt = (store.routes || []).find(r => r.route_id === wsd.route_id);
        const dStop = (store.stops || []).find(s => s.stop_id === wsd.detected_stop_id);
        const aStop = (store.stops || []).find(s => s.stop_id === wsd.assigned_stop_id);
        return {
          ...wsd,
          student_name: st ? `${st.first_name} ${st.last_name}` : 'Unknown Student',
          roll_number: st ? st.roll_number : '',
          department: st ? st.department : '',
          bus_number: bus ? bus.bus_number : 'BUS-14',
          registration_plate: bus ? bus.registration_plate : 'TN 47 AJ 8914',
          route_name: rt ? rt.route_name : 'Route 1',
          detected_stop_name: dStop ? dStop.stop_name : (wsd.detected_stop_name || 'Detected Stop'),
          detected_stop_sequence: dStop ? dStop.stop_sequence : 0,
          assigned_stop_name: aStop ? aStop.stop_name : (wsd.assigned_stop_name || 'Assigned Stop'),
          assigned_stop_sequence: aStop ? aStop.stop_sequence : 0
        };
      });
    } else if (tableName === 'stop_detection_alerts') {
      rows = rows.map(sda => {
        const det = (store.wrong_stop_detections || []).find(d => d.id === sda.detection_id);
        const st = det ? (store.students || []).find(s => s.student_id === det.student_id) : null;
        const bus = det ? (store.buses || []).find(b => b.bus_id === det.bus_id) : null;
        const dStop = det ? (store.stops || []).find(s => s.stop_id === det.detected_stop_id) : null;
        const aStop = det ? (store.stops || []).find(s => s.stop_id === det.assigned_stop_id) : null;
        return {
          ...sda,
          student_name: st ? `${st.first_name} ${st.last_name}` : 'Student',
          roll_number: st ? st.roll_number : '',
          bus_number: bus ? bus.bus_number : 'BUS-14',
          detected_stop_name: dStop ? dStop.stop_name : 'Detected Stop',
          assigned_stop_name: aStop ? aStop.stop_name : 'Assigned Stop',
          event_type: det ? det.event_type : 'BOARDING',
          mismatch_type: det ? det.mismatch_type : 'WRONG_STOP'
        };
      });
    } else if (tableName === 'stop_events') {
      rows = rows.map(se => {
        const bus = (store.buses || []).find(b => b.bus_id === se.bus_id);
        const rt = (store.routes || []).find(r => r.route_id === se.route_id);
        const stop = (store.stops || []).find(s => s.stop_id === se.stop_id);
        return {
          ...se,
          bus_number: bus ? bus.bus_number : 'BUS-14',
          route_name: rt ? rt.route_name : 'Route 1',
          stop_name: stop ? stop.stop_name : 'Stop',
          stop_sequence: stop ? stop.stop_sequence : 0
        };
      });
    }

    // WHERE clause handling
    const whereMatch = normalized.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];

      // Check boolean literals (is_active = TRUE/FALSE)
      if (/(?:[a-z_]+\.)?is_active\s*=\s*TRUE/i.test(whereClause)) {
        rows = rows.filter(r => r.is_active === true || r.status === 'ACTIVE');
      } else if (/(?:[a-z_]+\.)?is_active\s*=\s*FALSE/i.test(whereClause)) {
        rows = rows.filter(r => r.is_active === false || r.status !== 'ACTIVE');
      }

      // Check not-equal matches (e.g., verification_status != 'VERIFIED' or <>)
      const neqMatches = [...whereClause.matchAll(/(?:[a-z_]+\.)?([a-z_]+)(?:::text)?\s*(?:!=|<>)\s*'([^']+)'/gi)];
      for (const m of neqMatches) {
        const col = m[1];
        const val = m[2];
        rows = rows.filter(r => String(r[col]) !== String(val));
      }

      // Check interval matches (e.g., created_at > NOW() - INTERVAL '24 hours')
      const intervalMatch = whereClause.match(/(?:[a-z_]+\.)?created_at\s*>\s*NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*hours?'/i);
      if (intervalMatch) {
        const hours = parseInt(intervalMatch[1], 10);
        const cutoff = Date.now() - hours * 3600 * 1000;
        rows = rows.filter(r => !r.created_at || new Date(r.created_at).getTime() >= cutoff);
      }

      if (/\s+OR\s+/i.test(whereClause)) {
        const orBranches = whereClause.split(/\s+OR\s+/i);
        const matchedRowSets = [];
        for (const branch of orBranches) {
          let bRows = [...rows];
          const bParamMatches = [...branch.matchAll(/(?:[a-z_]+\.)?([a-z_]+)(?:::text)?\s*=\s*\$(\d+)/gi)];
          for (const m of bParamMatches) {
            const col = m[1];
            const pIdx = parseInt(m[2], 10) - 1;
            const val = params[pIdx];
            if (val !== undefined && val !== null) {
              if (col === 'id') {
                bRows = bRows.filter(r => 
                  String(r.id) === String(val) || 
                  String(r[tableName + '_id']) === String(val) || 
                  String(r.student_id) === String(val) || 
                  String(r.event_id) === String(val) || 
                  String(r.assignment_id) === String(val) ||
                  String(r.bus_id) === String(val)
                );
              } else if (col === 'student_id') {
                bRows = bRows.filter(r => String(r.student_id) === String(val) || String(r.id) === String(val));
              } else if (col === 'bus_id') {
                bRows = bRows.filter(r => String(r.bus_id) === String(val) || String(r.id) === String(val));
              } else {
                bRows = bRows.filter(r => String(r[col]) === String(val));
              }
            }
          }
          const bLiteralMatches = [...branch.matchAll(/(?:[a-z_]+\.)?([a-z_]+)(?:::text)?\s*=\s*'([^']+)'/gi)];
          for (const m of bLiteralMatches) {
            const col = m[1];
            const val = m[2];
            bRows = bRows.filter(r => String(r[col]) === String(val));
          }
          matchedRowSets.push(...bRows);
        }
        const seen = new Set();
        rows = matchedRowSets.filter(r => {
          const key = r.student_id || r.enrollment_id || r.staff_id || r.driver_id || r.bus_id || r.event_id || r.id || JSON.stringify(r);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } else {
        // Check for parameter matches e.g. (?:[a-z_]+\.)?([a-z_]+)\s*=\s*\$(\d+)
        const paramMatches = [...whereClause.matchAll(/(?:[a-z_]+\.)?([a-z_]+)(?:::text)?\s*=\s*\$(\d+)/gi)];
        for (const m of paramMatches) {
          const col = m[1];
          const pIdx = parseInt(m[2], 10) - 1;
          const val = params[pIdx];
          if (val !== undefined && val !== null) {
            if (col === 'id') {
              rows = rows.filter(r => 
                String(r.id) === String(val) || 
                String(r[tableName + '_id']) === String(val) || 
                String(r.student_id) === String(val) || 
                String(r.event_id) === String(val) || 
                String(r.assignment_id) === String(val) ||
                String(r.bus_id) === String(val)
              );
            } else if (col === 'student_id') {
              rows = rows.filter(r => String(r.student_id) === String(val) || String(r.id) === String(val));
            } else if (col === 'bus_id') {
              rows = rows.filter(r => String(r.bus_id) === String(val) || String(r.id) === String(val));
            } else {
              rows = rows.filter(r => String(r[col]) === String(val));
            }
          }
        }

        // Check for literal equality matches e.g. status = 'ACTIVE'
        const literalMatches = [...whereClause.matchAll(/(?:[a-z_]+\.)?([a-z_]+)(?:::text)?\s*=\s*'([^']+)'/gi)];
        for (const m of literalMatches) {
          const col = m[1];
          const val = m[2];
          rows = rows.filter(r => String(r[col]) === String(val));
        }
      }
    }

    // ORDER BY handling
    if (/ORDER\s+BY\s+.*stop_sequence/i.test(normalized)) {
      rows.sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));
    } else if (/ORDER\s+BY\s+.*detected_at/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.detected_at || b.created_at || 0) - new Date(a.detected_at || a.created_at || 0));
    } else if (/ORDER\s+BY\s+.*boarding_time/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.boarding_time || b.created_at || 0) - new Date(a.boarding_time || a.created_at || 0));
    } else if (/ORDER\s+BY\s+.*recognition_timestamp/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.recognition_timestamp || b.created_at || 0) - new Date(a.recognition_timestamp || a.created_at || 0));
    } else if (/ORDER\s+BY\s+.*enrollment_date/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.enrollment_date || b.created_at || 0) - new Date(a.enrollment_date || a.created_at || 0));
    } else if (/ORDER\s+BY\s+.*metric_date/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.metric_date || 0) - new Date(a.metric_date || 0));
    } else if (/ORDER\s+BY\s+.*audit_timestamp/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.audit_timestamp || b.created_at || 0) - new Date(a.audit_timestamp || a.created_at || 0));
    } else if (/ORDER\s+BY\s+.*metric_timestamp/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.metric_timestamp || 0) - new Date(a.metric_timestamp || 0));
    } else if (/ORDER\s+BY\s+.*event_timestamp/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.event_timestamp || 0) - new Date(a.event_timestamp || 0));
    } else if (/ORDER\s+BY\s+.*calibration_date/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.calibration_date || 0) - new Date(a.calibration_date || 0));
    } else if (/ORDER\s+BY\s+.*start_time/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.start_time || 0) - new Date(a.start_time || 0));
    } else if (/ORDER\s+BY\s+.*shift_date/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.shift_date || 0) - new Date(a.shift_date || 0));
    } else if (/ORDER\s+BY\s+.*leave_start_date/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.leave_start_date || 0) - new Date(a.leave_start_date || 0));
    } else if (/ORDER\s+BY\s+.*log_date/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.log_date || 0) - new Date(a.log_date || 0));
    } else if (/ORDER\s+BY\s+.*created_at/i.test(normalized)) {
      rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (/ORDER\s+BY\s+.*roll_number/i.test(normalized)) {
      rows.sort((a, b) => (a.roll_number || '').localeCompare(b.roll_number || ''));
    } else if (/ORDER\s+BY\s+.*first_name/i.test(normalized)) {
      rows.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
    }

    const limitMatch = normalized.match(/LIMIT\s+(\$\d+|\d+)/i);
    if (limitMatch) {
      let limitVal = limitMatch[1];
      if (limitVal.startsWith('$')) {
        const pIdx = parseInt(limitVal.substring(1), 10) - 1;
        limitVal = params[pIdx];
      } else {
        limitVal = parseInt(limitVal, 10);
      }
      if (typeof limitVal === 'number' && limitVal > 0) {
        rows = rows.slice(0, limitVal);
      }
    }

    return { rows, rowCount: rows.length };
  }

  // 2. INSERT queries
  const insertMatch = normalized.match(/INSERT\s+INTO\s+([a-z_]+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)(?:\s*ON\s+CONFLICT.+?)?(?:\s*RETURNING\s+(.+))?$/i);
  if (insertMatch) {
    const [, tableName, colsStr] = insertMatch;
    const cols = colsStr.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const table = store[tableName] || [];
    const newRecord = {};

    const idKeyMap = {
      buses: 'bus_id',
      routes: 'route_id',
      stops: 'stop_id',
      drivers: 'driver_id',
      bus_in_charges: 'in_charge_id',
      bus_route_assignments: 'assignment_id',
      cameras: 'camera_id',
      students: 'student_id',
      student_bus_assignments: 'assignment_id',
      student_transport_requests: 'request_id',
      student_attendance_log: 'log_id',
      boarding_verification_events: 'id',
      staff_roles: 'role_id',
      staff_members: 'staff_id',
      staff_shifts: 'shift_id',
      staff_leave_requests: 'leave_id',
      staff_performance_log: 'log_id',
      staff_salary_structure: 'salary_id',
      camera_network_metrics: 'metric_id',
      camera_events: 'event_id',
      camera_calibration: 'calibration_id',
      camera_stream_segments: 'segment_id',
      biometric_enrollments: 'enrollment_id',
      recognition_results: 'result_id',
      recognition_model_performance: 'perf_id',
      recognition_audit_log: 'audit_id',
      alerts: 'id',
      alert_notifications: 'id',
      anomaly_escalations: 'id',
      stop_assignments: 'id',
      stop_events: 'id',
      wrong_stop_detections: 'id',
      stop_detection_alerts: 'id',
      stop_performance_log: 'id',
      bus_gps_locations: 'id',
      route_progress: 'id',
      live_eta_cache: 'id',
      route_performance_metrics: 'id',
      notifications: 'id',
      notification_recipients: 'id',
      notification_preferences: 'id',
      notification_templates: 'id',
      alert_rules: 'id',
      notification_audit_log: 'id'
    };
    const idKey = idKeyMap[tableName] || 'id';

    newRecord[idKey] = newRecord[idKey] || crypto.randomUUID();
    cols.forEach((col, idx) => {
      newRecord[col] = params[idx];
    });
    newRecord.id = newRecord.id || newRecord[idKey] || crypto.randomUUID();
    if (tableName === 'boarding_verification_events') {
      newRecord.event_id = newRecord.event_id || newRecord.id;
      newRecord.override_status = newRecord.override_status || 'PENDING';
    }
    if (tableName === 'anomaly_escalations') {
      newRecord.status = newRecord.status || 'ACTIVE';
    }
    if (tableName === 'alerts') {
      newRecord.alert_status = newRecord.alert_status || 'ACTIVE';
      newRecord.status = newRecord.status || newRecord.alert_status;
      newRecord.severity = newRecord.severity || 'MEDIUM';
    }
    if (tableName === 'alert_notifications') {
      newRecord.status = newRecord.status || 'PENDING';
    }
    if (tableName === 'cameras') {
      newRecord.hls_url = newRecord.hls_url || newRecord.hls_stream_url || newRecord.stream_url || 'https://stream.vsb.ac.in/hls/default/index.m3u8';
      newRecord.rtsp_url = newRecord.rtsp_url || 'rtsp://admin:vsb123@192.168.1.100:554/live/ch0';
    }
    if (tableName === 'camera_calibration') {
      newRecord.verification_status = newRecord.is_verified ? 'VERIFIED' : 'PENDING';
    }
    if (tableName === 'biometric_enrollments') {
      if (newRecord.face_embedding && !newRecord.embedding_vector) {
        newRecord.embedding_vector = newRecord.face_embedding;
      } else if (newRecord.embedding_vector && !newRecord.face_embedding) {
        newRecord.face_embedding = newRecord.embedding_vector;
      }
      if (newRecord.enrollment_status && !newRecord.status) {
        newRecord.status = newRecord.enrollment_status;
      } else if (newRecord.status && !newRecord.enrollment_status) {
        newRecord.enrollment_status = newRecord.status;
      }
    }
    newRecord.created_at = new Date().toISOString();
    newRecord.updated_at = new Date().toISOString();

    table.unshift(newRecord);
    return { rows: [newRecord], rowCount: 1 };
  }

  // 3. UPDATE queries
  const updateMatch = normalized.match(/UPDATE\s+([a-z_]+)\s+SET\s+(.+?)\s+WHERE\s+([a-z_]+)\s*=\s*\$(\d+)(?:\s*RETURNING\s+(.+))?$/i);
  if (updateMatch) {
    const [, tableName, setClause, idCol, idParamIndex] = updateMatch;
    const table = store[tableName] || [];
    const targetId = params[parseInt(idParamIndex, 10) - 1];
    const index = table.findIndex(r => 
      String(r[idCol]) === String(targetId) || 
      String(r.id) === String(targetId) || 
      String(r.event_id) === String(targetId) || 
      String(r[tableName + '_id']) === String(targetId)
    );

    if (index === -1) {
      return { rows: [], rowCount: 0 };
    }

    const assignMatches = [...setClause.matchAll(/([a-z_]+)\s*=\s*(COALESCE\s*\(\s*\$\d+\s*,\s*[a-z_]+\s*\)|\$\d+|'[^']*'|[a-z0-9_]+(?:\(\))?)/gi)];
    assignMatches.forEach(m => {
      const col = m[1];
      const expr = m[2];
      const coalesceMatch = expr.match(/COALESCE\s*\(\s*\$(\d+)\s*,\s*([a-z_]+)\s*\)/i);
      if (coalesceMatch) {
        const pIdx = parseInt(coalesceMatch[1], 10) - 1;
        const val = params[pIdx];
        if (val !== undefined && val !== null) {
          table[index][col] = val;
        }
        return;
      }
      const directMatch = expr.match(/^\$(\d+)$/);
      if (directMatch) {
        const pIdx = parseInt(directMatch[1], 10) - 1;
        table[index][col] = params[pIdx];
        return;
      }
      const literalMatch = expr.match(/^'([^']*)'$/);
      if (literalMatch) {
        table[index][col] = literalMatch[1];
        return;
      }
      if (/^true$/i.test(expr)) {
        table[index][col] = true;
        return;
      }
      if (/^false$/i.test(expr)) {
        table[index][col] = false;
        return;
      }
      if (/^null$/i.test(expr)) {
        table[index][col] = null;
        return;
      }
      if (/CURRENT_TIMESTAMP|NOW\(\)/i.test(expr)) {
        table[index][col] = new Date().toISOString();
        return;
      }
    });
    table[index].updated_at = new Date().toISOString();
    if (table[index][idCol] && !table[index].id) {
      table[index].id = table[index][idCol];
    }
    if (tableName === 'camera_calibration') {
      table[index].verification_status = table[index].is_verified ? 'VERIFIED' : 'PENDING';
    }

    return { rows: [table[index]], rowCount: 1 };
  }

  // 4. DELETE queries
  const deleteOpMatch = normalized.match(/DELETE\s+FROM\s+([a-z_]+)\s+WHERE\s+([a-z_]+)\s*(<|=)\s*\$1(?:\s*RETURNING\s+(.+))?$/i);
  if (deleteOpMatch) {
    const [, tableName, col, op] = deleteOpMatch;
    const table = store[tableName] || [];
    const targetVal = params[0];

    if (op === '<') {
      const deleted = [];
      const remaining = [];
      table.forEach(r => {
        if (new Date(r[col]) < new Date(targetVal)) {
          deleted.push(r);
        } else {
          remaining.push(r);
        }
      });
      store[tableName] = remaining;
      return { rows: deleted, rowCount: deleted.length };
    } else {
      const index = table.findIndex(r => String(r[col]) === String(targetVal));
      if (index === -1) {
        return { rows: [], rowCount: 0 };
      }
      const deleted = table.splice(index, 1);
      return { rows: deleted, rowCount: 1 };
    }
  }

  return { rows: [], rowCount: 0 };
}

module.exports = db;
