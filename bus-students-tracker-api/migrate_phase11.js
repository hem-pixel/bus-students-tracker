// FILE: bus-students-tracker-api/migrate_phase11.js
// PURPOSE: PostgreSQL database migration script for Phase 11 (Live Transport Monitoring & GPS Tracking)
// RUN: node migrate_phase11.js

require('dotenv').config();
const db = require('./config/database');

async function migratePhase11() {
  console.log('================================================================');
  console.log('🚀 [PHASE 11 MIGRATION] Starting Database Schema Provisioning');
  console.log('   Institution: V.S.B. ENGINEERING COLLEGE');
  console.log('   Module: Live Transport Monitoring, GPS Tracking & Route Management');
  console.log('================================================================\n');

  const client = db.pool || db;

  try {
    // 1. bus_gps_locations
    console.log('🔹 [1/4] Provisioning table: bus_gps_locations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bus_gps_locations (
        id SERIAL PRIMARY KEY,
        bus_id VARCHAR(64) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        accuracy_meters DOUBLE PRECISION DEFAULT 5.0,
        speed_kmh DOUBLE PRECISION DEFAULT 0.0,
        heading_degrees DOUBLE PRECISION DEFAULT 0.0,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_bus_gps_latest 
        ON bus_gps_locations(bus_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_bus_gps_timestamp 
        ON bus_gps_locations(timestamp DESC);
    `);
    console.log('   ✅ bus_gps_locations created with geospatial performance indexes.');

    // 2. route_progress
    console.log('🔹 [2/4] Provisioning table: route_progress...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS route_progress (
        id SERIAL PRIMARY KEY,
        bus_id VARCHAR(64) NOT NULL,
        route_id VARCHAR(64) NOT NULL,
        current_stop_id VARCHAR(64),
        next_stop_id VARCHAR(64),
        stops_completed INTEGER DEFAULT 0,
        total_stops INTEGER DEFAULT 5,
        estimated_arrival_next_stop TIMESTAMP WITH TIME ZONE,
        on_schedule BOOLEAN DEFAULT true,
        delay_minutes INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_route_progress_bus 
        ON route_progress(bus_id);
      CREATE INDEX IF NOT EXISTS idx_route_progress_route 
        ON route_progress(route_id);
    `);
    console.log('   ✅ route_progress created with bus/route indexes.');

    // 3. live_eta_cache
    console.log('🔹 [3/4] Provisioning table: live_eta_cache...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_eta_cache (
        id SERIAL PRIMARY KEY,
        route_id VARCHAR(64) NOT NULL,
        stop_id VARCHAR(64) NOT NULL,
        estimated_arrival TIMESTAMP WITH TIME ZONE,
        confidence_percent DOUBLE PRECISION DEFAULT 85.0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_eta_route_stop 
        ON live_eta_cache(route_id, stop_id);
    `);
    console.log('   ✅ live_eta_cache created with route/stop lookup index.');

    // 4. route_performance_metrics
    console.log('🔹 [4/4] Provisioning table: route_performance_metrics...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS route_performance_metrics (
        id SERIAL PRIMARY KEY,
        route_id VARCHAR(64) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        average_delay_minutes DOUBLE PRECISION DEFAULT 0.0,
        on_time_percentage DOUBLE PRECISION DEFAULT 100.0,
        passenger_count INTEGER DEFAULT 0,
        fuel_consumed_liters DOUBLE PRECISION DEFAULT 0.0,
        total_distance_km DOUBLE PRECISION DEFAULT 0.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_date 
        ON route_performance_metrics(date DESC);
      CREATE INDEX IF NOT EXISTS idx_metrics_route 
        ON route_performance_metrics(route_id);
    `);
    console.log('   ✅ route_performance_metrics created with analytics indexes.');

    console.log('\n================================================================');
    console.log('✨ [PHASE 11 MIGRATION COMPLETE] All 4 live tracking tables active.');
    console.log('================================================================\n');

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  migratePhase11()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = migratePhase11;
