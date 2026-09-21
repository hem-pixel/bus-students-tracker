const db = require('./config/database');

async function migrate() {
  console.log('[MIGRATION] Creating boarding_verification_events table...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS public.boarding_verification_events (
          id SERIAL PRIMARY KEY,
          student_id INT REFERENCES public.students(id) ON DELETE CASCADE,
          bus_id INT REFERENCES public.buses(id) ON DELETE CASCADE,
          stop_id INT REFERENCES public.stops(id) ON DELETE CASCADE,
          confidence_score DECIMAL(5,4),
          verification_status VARCHAR(30) NOT NULL CHECK (
              verification_status IN (
                  'VERIFIED', 
                  'WRONG_BUS', 
                  'WRONG_STOP', 
                  'UNKNOWN_STUDENT',
                  'SPOOFING_DETECTED',
                  'MANUAL_VERIFICATION'
              )
          ),
          assigned_bus_id INT,
          assigned_stop_id INT,
          photo_path VARCHAR(255),
          biometric_verified BOOLEAN DEFAULT FALSE,
          in_charge_id INT,
          override_status VARCHAR(20),
          override_reason TEXT,
          overridden_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_boarding_events_student ON public.boarding_verification_events(student_id);
      CREATE INDEX IF NOT EXISTS idx_boarding_events_bus ON public.boarding_verification_events(bus_id);
      CREATE INDEX IF NOT EXISTS idx_boarding_events_status ON public.boarding_verification_events(verification_status);
      CREATE INDEX IF NOT EXISTS idx_boarding_events_timestamp ON public.boarding_verification_events(created_at);
    `);
    console.log('✅ Boarding verification events table & indexes ready in database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
