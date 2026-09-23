const { pool } = require('./config/database');

async function migrate() {
  console.log('[MIGRATION] Creating Phase 10 tables: stop_assignments, stop_events, wrong_stop_detections, stop_detection_alerts, stop_performance_log...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.stop_assignments (
          id VARCHAR(100) PRIMARY KEY,
          student_id VARCHAR(100) NOT NULL,
          route_id VARCHAR(100) NOT NULL,
          pickup_stop_id VARCHAR(100),
          dropoff_stop_id VARCHAR(100),
          assigned_bus_id VARCHAR(100),
          effective_date DATE DEFAULT CURRENT_DATE,
          status VARCHAR(20) DEFAULT 'ACTIVE',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.stop_events (
          id VARCHAR(100) PRIMARY KEY,
          bus_id VARCHAR(100) NOT NULL,
          route_id VARCHAR(100) NOT NULL,
          stop_id VARCHAR(100) NOT NULL,
          arrival_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          departure_time TIMESTAMP WITH TIME ZONE,
          stop_sequence INT DEFAULT 1,
          dwell_time_seconds INT DEFAULT 0,
          gps_lat DECIMAL(10,8),
          gps_lng DECIMAL(11,8),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.wrong_stop_detections (
          id VARCHAR(100) PRIMARY KEY,
          student_id VARCHAR(100) NOT NULL,
          bus_id VARCHAR(100) NOT NULL,
          route_id VARCHAR(100),
          event_type VARCHAR(30) DEFAULT 'BOARDING',
          detected_stop_id VARCHAR(100) NOT NULL,
          assigned_stop_id VARCHAR(100),
          detected_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          distance_from_assigned_meters DECIMAL(10,2) DEFAULT 0,
          stop_sequence_delta INT DEFAULT 0,
          severity VARCHAR(20) DEFAULT 'MEDIUM',
          status VARCHAR(30) DEFAULT 'OPEN',
          resolution_notes TEXT,
          resolved_by VARCHAR(100),
          resolved_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.stop_detection_alerts (
          id VARCHAR(100) PRIMARY KEY,
          detection_id VARCHAR(100) REFERENCES public.wrong_stop_detections(id) ON DELETE CASCADE,
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) DEFAULT 'WARNING',
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          channels TEXT DEFAULT '["SMS","IN_APP"]',
          dismissed BOOLEAN DEFAULT FALSE,
          dismissed_by VARCHAR(100),
          dismissed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.stop_performance_log (
          id VARCHAR(100) PRIMARY KEY,
          bus_id VARCHAR(100) NOT NULL,
          route_id VARCHAR(100) NOT NULL,
          log_date DATE DEFAULT CURRENT_DATE,
          total_stops_scheduled INT DEFAULT 0,
          total_stops_serviced INT DEFAULT 0,
          skipped_stops_count INT DEFAULT 0,
          wrong_stop_events_count INT DEFAULT 0,
          on_time_stops_count INT DEFAULT 0,
          average_dwell_time_seconds DECIMAL(6,2) DEFAULT 0,
          compliance_rate DECIMAL(5,2) DEFAULT 100.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_stop_assignments_student ON public.stop_assignments(student_id);
      CREATE INDEX IF NOT EXISTS idx_stop_assignments_route ON public.stop_assignments(route_id);
      CREATE INDEX IF NOT EXISTS idx_stop_assignments_status ON public.stop_assignments(status);
      CREATE INDEX IF NOT EXISTS idx_stop_events_bus ON public.stop_events(bus_id);
      CREATE INDEX IF NOT EXISTS idx_stop_events_stop ON public.stop_events(stop_id);
      CREATE INDEX IF NOT EXISTS idx_wrong_stop_student ON public.wrong_stop_detections(student_id);
      CREATE INDEX IF NOT EXISTS idx_wrong_stop_bus ON public.wrong_stop_detections(bus_id);
      CREATE INDEX IF NOT EXISTS idx_wrong_stop_status ON public.wrong_stop_detections(status);
      CREATE INDEX IF NOT EXISTS idx_wrong_stop_detected_time ON public.wrong_stop_detections(detected_time);
      CREATE INDEX IF NOT EXISTS idx_stop_alerts_detection ON public.stop_detection_alerts(detection_id);
      CREATE INDEX IF NOT EXISTS idx_stop_alerts_dismissed ON public.stop_detection_alerts(dismissed);
      CREATE INDEX IF NOT EXISTS idx_stop_perf_bus_date ON public.stop_performance_log(bus_id, log_date);
    `);
    console.log('✅ Phase 10 tables and indexes created successfully in PostgreSQL / Supabase!');
  } catch (err) {
    console.warn('⚠️  PostgreSQL Phase 10 migration skipped or failed (Fallback store active):', err.message);
  } finally {
    // End pool if run standalone
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
