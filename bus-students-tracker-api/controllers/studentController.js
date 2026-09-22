const { query } = require('../config/database');

// Ensure photos column exists for persistent PostgreSQL environments
query('ALTER TABLE students ADD COLUMN IF NOT EXISTS photos TEXT').catch(() => {});

function normalizeStudentPhotos(student) {
  if (!student) return student;
  let parsedPhotos = null;
  if (student.photos) {
    try {
      parsedPhotos = typeof student.photos === 'string' ? JSON.parse(student.photos) : student.photos;
    } catch (e) {
      parsedPhotos = null;
    }
  }
  if (!parsedPhotos || typeof parsedPhotos !== 'object') {
    parsedPhotos = {
      profile_photo: student.profile_photo_url || '',
      id_card_front: '',
      id_card_back: '',
      parent_guardian_photo: '',
      emergency_contact_photo: ''
    };
  } else {
    parsedPhotos = {
      profile_photo: parsedPhotos.profile_photo || student.profile_photo_url || '',
      id_card_front: parsedPhotos.id_card_front || '',
      id_card_back: parsedPhotos.id_card_back || '',
      parent_guardian_photo: parsedPhotos.parent_guardian_photo || '',
      emergency_contact_photo: parsedPhotos.emergency_contact_photo || ''
    };
  }
  return {
    ...student,
    photos: parsedPhotos,
    profile_photo_url: student.profile_photo_url || parsedPhotos.profile_photo || ''
  };
}

/**
 * GET /api/students
 * Optional query filters: search, department, transport_status, year_of_study
 */
async function getAllStudents(req, res, next) {
  try {
    const { search, department, transport_status, year_of_study } = req.query;
    let sql = 'SELECT * FROM students';
    const conditions = [];
    const params = [];

    if (department) {
      params.push(department);
      conditions.push(`department = $${params.length}`);
    }

    if (transport_status) {
      params.push(transport_status.toUpperCase());
      conditions.push(`transport_status = $${params.length}`);
    }

    if (year_of_study) {
      params.push(parseInt(year_of_study, 10));
      conditions.push(`year_of_study = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(roll_number ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY roll_number ASC';

    const result = await query(sql, params);
    const students = result.rows.map(normalizeStudentPhotos);
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/students/stats
 * Aggregate KPIs for dashboard cards
 */
async function getStudentStats(req, res, next) {
  try {
    const [totalRes, activeRes, requestedRes, pendingReqRes, verifiedTodayRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM students'),
      query("SELECT COUNT(*) as count FROM students WHERE transport_status = 'ACTIVE'"),
      query("SELECT COUNT(*) as count FROM students WHERE transport_status = 'REQUESTED'"),
      query("SELECT COUNT(*) as count FROM student_transport_requests WHERE request_status = 'PENDING'"),
      query("SELECT COUNT(DISTINCT student_id) as count FROM student_attendance_log WHERE boarding_time >= CURRENT_DATE")
    ]);

    const totalStudents = parseInt(totalRes.rows[0].count, 10);
    const activeTransport = parseInt(activeRes.rows[0].count, 10);
    const requestedTransport = parseInt(requestedRes.rows[0].count, 10);
    const pendingRequests = parseInt(pendingReqRes.rows[0].count, 10);
    const verifiedToday = parseInt(verifiedTodayRes.rows[0].count, 10);

    res.json({
      success: true,
      data: {
        total_students: totalStudents,
        active_transport: activeTransport,
        inactive_transport: totalStudents - activeTransport - requestedTransport,
        requested_transport: requestedTransport,
        pending_requests: pendingRequests,
        verified_boardings_today: verifiedToday,
        transport_enrollment_rate: totalStudents > 0 ? ((activeTransport / totalStudents) * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/students/:id
 */
async function getStudentById(req, res, next) {
  try {
    const { id } = req.params;
    const studentRes = await query('SELECT * FROM students WHERE student_id = $1', [id]);
    
    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Student with identifier '${id}' not found in college directory.`
      });
    }

    const student = normalizeStudentPhotos(studentRes.rows[0]);

    // Concurrently fetch assignments, transport requests, and attendance records
    const [assignmentsRes, requestsRes, attendanceRes] = await Promise.all([
      query('SELECT * FROM student_bus_assignments WHERE student_id = $1 ORDER BY created_at DESC', [id]),
      query('SELECT * FROM student_transport_requests WHERE student_id = $1 ORDER BY created_at DESC', [id]),
      query('SELECT * FROM student_attendance_log WHERE student_id = $1 ORDER BY boarding_time DESC', [id])
    ]);

    res.json({
      success: true,
      data: {
        ...student,
        assignments: assignmentsRes.rows,
        transport_requests: requestsRes.rows,
        attendance_records: attendanceRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/students
 */
async function createStudent(req, res, next) {
  try {
    const {
      roll_number,
      first_name,
      last_name,
      email,
      phone,
      emergency_contact_name,
      emergency_contact_phone,
      date_of_birth,
      department,
      semester,
      section,
      transport_status = 'INACTIVE',
      profile_photo_url = '',
      bio_enrolled = false,
      face_recognition_id = null,
      parent_name = '',
      parent_phone = '',
      address = '',
      city = 'Karur',
      postal_code = '639005',
      notes = '',
      photos = null
    } = req.body;

    if (!roll_number || !first_name || !last_name || !email || !department) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: roll_number, first_name, last_name, email, and department are required.'
      });
    }

    // Check duplicate roll number
    const existing = await query('SELECT student_id FROM students WHERE roll_number = $1', [roll_number.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'DUPLICATE_RECORD',
        message: `Student with roll number '${roll_number}' is already registered.`
      });
    }

    let photosJson = null;
    let finalProfilePhoto = profile_photo_url;
    if (photos && typeof photos === 'object') {
      photosJson = JSON.stringify(photos);
      if (!finalProfilePhoto && photos.profile_photo) {
        finalProfilePhoto = photos.profile_photo;
      }
    } else if (typeof photos === 'string') {
      photosJson = photos;
    }

    const insertSql = `
      INSERT INTO students (
        roll_number, first_name, last_name, email, phone,
        emergency_contact_name, emergency_contact_phone, date_of_birth,
        department, semester, section, transport_status,
        profile_photo_url, bio_enrolled, face_recognition_id,
        parent_name, parent_phone, address, city, postal_code, notes, photos
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *
    `;

    const params = [
      roll_number.trim(),
      first_name.trim(),
      last_name.trim(),
      email.trim(),
      phone || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      date_of_birth || null,
      department,
      semester ? parseInt(semester, 10) : 6,
      section || 'A',
      transport_status,
      finalProfilePhoto,
      Boolean(bio_enrolled),
      face_recognition_id,
      parent_name,
      parent_phone,
      address,
      city,
      postal_code,
      notes,
      photosJson
    ];

    const result = await query(insertSql, params);
    const createdStudent = normalizeStudentPhotos(result.rows[0]);
    res.status(201).json({
      success: true,
      message: `Student record '${roll_number}' registered successfully.`,
      data: createdStudent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/students/:id
 */
async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const fields = { ...req.body };

    const existingRes = await query('SELECT * FROM students WHERE student_id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Student with identifier '${id}' not found.`
      });
    }

    if (fields.photos && typeof fields.photos === 'object') {
      if (!fields.profile_photo_url && fields.photos.profile_photo) {
        fields.profile_photo_url = fields.photos.profile_photo;
      }
      fields.photos = JSON.stringify(fields.photos);
    }

    const updateable = [
      'first_name', 'last_name', 'email', 'phone',
      'emergency_contact_name', 'emergency_contact_phone', 'date_of_birth',
      'department', 'semester', 'section', 'transport_status',
      'profile_photo_url', 'bio_enrolled', 'face_recognition_id',
      'parent_name', 'parent_phone', 'address', 'city', 'postal_code', 'notes',
      'photos'
    ];

    const setClauses = [];
    const params = [];

    updateable.forEach(col => {
      if (fields[col] !== undefined) {
        params.push(fields[col]);
        setClauses.push(`${col} = $${params.length}`);
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'No valid fields provided for modification.'
      });
    }

    params.push(id);
    const sql = `UPDATE students SET ${setClauses.join(', ')} WHERE student_id = $${params.length} RETURNING *`;
    const result = await query(sql, params);
    const updatedStudent = normalizeStudentPhotos(result.rows[0]);

    res.json({
      success: true,
      message: 'Student record updated successfully.',
      data: updatedStudent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/students/:id
 */
async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    const checkRes = await query('SELECT roll_number FROM students WHERE student_id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Student with identifier '${id}' not found.`
      });
    }

    // Remove student assignments first if any
    await query('DELETE FROM student_bus_assignments WHERE student_id = $1', [id]);
    await query('DELETE FROM student_transport_requests WHERE student_id = $1', [id]);
    await query('DELETE FROM student_attendance_log WHERE student_id = $1', [id]);

    const delRes = await query('DELETE FROM students WHERE student_id = $1 RETURNING *', [id]);
    res.json({
      success: true,
      message: `Student '${checkRes.rows[0].roll_number}' deregistered successfully.`,
      data: delRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllStudents,
  getStudentStats,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
