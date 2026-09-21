const db = require('./config/database');

async function main() {
  const q = await db.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name IN ('students', 'student_bus_assignments', 'student_attendance_log', 'boarding_verification_events', 'buses', 'stops')
    ORDER BY table_name, ordinal_position
  `);
  
  const grouped = {};
  q.rows.forEach(r => {
    grouped[r.table_name] = grouped[r.table_name] || [];
    grouped[r.table_name].push(`${r.column_name} (${r.data_type})`);
  });
  console.log(JSON.stringify(grouped, null, 2));

  // Also check sample row from student_bus_assignments and student_attendance_log
  try {
    const sba = await db.query('SELECT * FROM student_bus_assignments LIMIT 1');
    console.log('sample student_bus_assignments:', sba.rows[0]);
  } catch (e) {
    console.log('sba error:', e.message);
  }

  try {
    const sal = await db.query('SELECT * FROM student_attendance_log LIMIT 1');
    console.log('sample student_attendance_log:', sal.rows[0]);
  } catch (e) {
    console.log('sal error:', e.message);
  }

  await db.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
