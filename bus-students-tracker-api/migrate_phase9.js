const { pool } = require('./config/database');

async function migrate() {
  console.log('[MIGRATION] Creating Phase 9 tables: alerts, alert_notifications, anomaly_escalations...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.alerts (
          id SERIAL PRIMARY KEY,
          alert_type VARCHAR(50) NOT NULL,
          student_id VARCHAR(100),
          bus_id VARCHAR(100),
          assigned_bus_id VARCHAR(100),
          confidence_score DECIMAL(5,4),
          photo_path VARCHAR(255),
          alert_status VARCHAR(30) DEFAULT 'ACTIVE',
          severity VARCHAR(20) DEFAULT 'MEDIUM',
          in_charge_id VARCHAR(100),
          action_taken VARCHAR(50),
          action_reason TEXT,
          action_timestamp TIMESTAMP WITH TIME ZONE,
          escalated_to VARCHAR(100),
          escalated_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.alert_notifications (
          id SERIAL PRIMARY KEY,
          alert_id INT REFERENCES public.alerts(id) ON DELETE CASCADE,
          recipient_id VARCHAR(100) NOT NULL,
          notification_type VARCHAR(30) DEFAULT 'IN_APP',
          status VARCHAR(20) DEFAULT 'PENDING',
          delivery_timestamp TIMESTAMP WITH TIME ZONE,
          read_timestamp TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.anomaly_escalations (
          id SERIAL PRIMARY KEY,
          student_id VARCHAR(100),
          anomaly_count INT DEFAULT 1,
          time_window_hours INT DEFAULT 24,
          escalation_reason VARCHAR(255),
          escalated_to_admin VARCHAR(100),
          status VARCHAR(20) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_student ON public.alerts(student_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_bus ON public.alerts(bus_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(alert_status);
      CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(alert_type);
      CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.alerts(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_alert ON public.alert_notifications(alert_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.alert_notifications(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_escalations_student ON public.anomaly_escalations(student_id);
    `);
    console.log('✅ Phase 9 tables and indexes created successfully in PostgreSQL / Supabase!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
