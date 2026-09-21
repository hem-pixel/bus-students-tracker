const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Confirmed institutional accounts (one per role)
const INSTITUTIONAL_USERS = [
  {
    id: 'USR-ADM-001',
    name: 'Dr. K. Senthil Nathan',
    email: 'admin@vsb.ac.in',
    password: 'Admin@123',
    role: 'ADMIN',
    department: 'Central Administration',
    badgeId: 'EMP-ADM-01',
    status: 'ACTIVE'
  },
  {
    id: 'USR-STF-002',
    name: 'M. Anandhakumar',
    email: 'staff@vsb.ac.in',
    password: 'Staff@123',
    role: 'TRANSPORT_STAFF',
    department: 'Transport Control Office',
    badgeId: 'EMP-TRP-04',
    status: 'ACTIVE'
  },
  {
    id: 'USR-BIC-003',
    name: 'Prof. R. Revathi',
    email: 'incharge@vsb.ac.in',
    password: 'Incharge@123',
    role: 'BUS_IN_CHARGE',
    department: 'Department of AI & DS',
    badgeId: 'FAC-AIDS-12',
    assignedBusNumber: 'BUS-14',
    status: 'ACTIVE'
  },
  {
    id: 'USR-DRV-004',
    name: 'P. Murugesan',
    email: 'driver@vsb.ac.in',
    password: 'Driver@123',
    role: 'DRIVER',
    department: 'Fleet Operations',
    badgeId: 'DRV-LIC-789',
    assignedBusNumber: 'BUS-14',
    status: 'ACTIVE'
  },
  {
    id: 'USR-STU-005',
    name: 'K. Hemanth Kumar',
    email: 'student@vsb.ac.in',
    password: 'Student@123',
    role: 'STUDENT',
    department: 'AI & DS - Year III',
    rollNumber: '922521104018',
    assignedBusNumber: 'BUS-14',
    assignedStop: 'Karur Central Bus Stand',
    status: 'ACTIVE'
  }
];

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required credentials.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = INSTITUTIONAL_USERS.find(
      u => u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or institutional security passkey.'
      });
    }

    // Sign JWT
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      badgeId: user.badgeId,
      assignedBusNumber: user.assignedBusNumber,
      status: user.status
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    const safeUser = { ...payload };

    res.json({
      success: true,
      message: 'Institutional verification successful.',
      token,
      user: safeUser,
      data: {
        token,
        user: safeUser
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}

module.exports = {
  login,
  getMe
};
