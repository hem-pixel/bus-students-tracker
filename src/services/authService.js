// FILE: src/services/authService.js
// PURPOSE: Handles client-side authentication modeling, credential verification, secure session token persistence, expiration checks, and pre-seeded role accounts.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/context/AuthContext.jsx, src/pages/LoginPage.jsx

const STORAGE_SESSION_KEY = 'bst_auth_session_v1';
const STORAGE_USERS_KEY = 'bst_registered_users_v1';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes

// Confirmed institutional accounts (one per role)
const DEFAULT_ACCOUNTS = [
  {
    id: 'USR-ADM-001',
    name: 'Dr. K. Senthil Nathan',
    email: 'admin@vsb.ac.in',
    passwordHash: 'Admin@123', // In production replaced by bcrypt hash on server
    role: 'ADMIN',
    department: 'Central Administration',
    badgeId: 'EMP-ADM-01',
    status: 'ACTIVE'
  },
  {
    id: 'USR-STF-002',
    name: 'M. Anandhakumar',
    email: 'staff@vsb.ac.in',
    passwordHash: 'Staff@123',
    role: 'TRANSPORT_STAFF',
    department: 'Transport Control Office',
    badgeId: 'EMP-TRP-04',
    status: 'ACTIVE'
  },
  {
    id: 'USR-BIC-003',
    name: 'Prof. R. Revathi',
    email: 'incharge@vsb.ac.in',
    passwordHash: 'Incharge@123',
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
    passwordHash: 'Driver@123',
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
    passwordHash: 'Student@123',
    role: 'STUDENT',
    department: 'AI & DS - Year III',
    rollNumber: '922521104018',
    assignedBusNumber: 'BUS-14',
    assignedStop: 'Karur Central Bus Stand',
    status: 'ACTIVE'
  }
];

// Read custom registered users
const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// Save newly registered user
const saveRegisteredUser = (newUser) => {
  const users = getRegisteredUsers();
  users.push(newUser);
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
};

// Generate realistic session token
const generateSessionToken = (userId, role) => {
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now();
  return `BST-AUTH-${role}-${userId}-${rand}-${timestamp}`;
};

export const authService = {
  /**
   * Authenticate user with email and password.
   * Simulates asynchronous server call with latency.
   */
  async login(email, password) {
    const normalizedEmail = (email || '').trim().toLowerCase();

    // 1. Try real backend API login
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      if (response.ok) {
        const result = await response.json();
        const token = result.token || result.data?.token;
        const user = result.user || result.data?.user;
        if (token && user) {
          const sessionData = {
            token,
            expiresAt: Date.now() + SESSION_DURATION_MS,
            user
          };
          try {
            sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
          } catch (e) {}

          return {
            user,
            token,
            expiresAt: sessionData.expiresAt
          };
        }
      } else {
        const errData = await response.json().catch(() => null);
        if (response.status === 401) {
          throw new Error(errData?.message || 'Invalid login credentials.');
        }
      }
    } catch (netErr) {
      // If network refused connection, fall back to offline simulation
      if (netErr.message && netErr.message.includes('Invalid login credentials')) {
        throw netErr;
      }
      console.warn('[AuthService] Backend unreachable, falling back to local institutional account directory.');
    }

    // 2. Fallback to pre-seeded / local registered users
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const allUsers = [...DEFAULT_ACCOUNTS, ...getRegisteredUsers()];
        const user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

        if (!user) {
          return reject(new Error('Invalid login credentials. User not found.'));
        }

        if (user.status === 'DISABLED') {
          return reject(new Error('Account disabled. Please contact Transport Administration.'));
        }

        if (user.passwordHash !== password) {
          return reject(new Error('Invalid login credentials. Incorrect password.'));
        }

        // Generate session data (excluding password)
        const sessionToken = generateSessionToken(user.id, user.role);
        const expiresAt = Date.now() + SESSION_DURATION_MS;

        const safeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          badgeId: user.badgeId || null,
          rollNumber: user.rollNumber || null,
          assignedBusNumber: user.assignedBusNumber || null,
          assignedStop: user.assignedStop || null
        };

        const sessionData = {
          token: sessionToken,
          expiresAt,
          user: safeUser
        };

        try {
          sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
        } catch (e) {
          // Fallback if sessionStorage fails
        }

        resolve({
          user: safeUser,
          token: sessionToken,
          expiresAt
        });
      }, 300);
    });
  },

  /**
   * Register a new Student or Staff account.
   */
  async register({ name, email, password, role, department, identifier }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = (email || '').trim().toLowerCase();

        if (!normalizedEmail.endsWith('@vsb.ac.in')) {
          return reject(new Error('Registration requires an official @vsb.ac.in institutional email address.'));
        }

        const allUsers = [...DEFAULT_ACCOUNTS, ...getRegisteredUsers()];
        if (allUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
          return reject(new Error('An account with this institutional email already exists.'));
        }

        const allowedRoles = ['STUDENT', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'];
        if (!allowedRoles.includes(role)) {
          return reject(new Error('Self-registration is only permitted for Students and Staff members.'));
        }

        const newUser = {
          id: `USR-REG-${Date.now().toString().slice(-6)}`,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash: password,
          role,
          department: department ? department.trim() : 'AI & DS',
          rollNumber: role === 'STUDENT' ? identifier.trim() : null,
          badgeId: role !== 'STUDENT' ? identifier.trim() : null,
          status: 'ACTIVE'
        };

        saveRegisteredUser(newUser);

        // Auto-login session creation
        const sessionToken = generateSessionToken(newUser.id, newUser.role);
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        const safeUser = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          badgeId: newUser.badgeId,
          rollNumber: newUser.rollNumber
        };

        sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({
          token: sessionToken,
          expiresAt,
          user: safeUser
        }));

        resolve({
          user: safeUser,
          token: sessionToken,
          expiresAt
        });
      }, 500);
    });
  },

  /**
   * Get active session if valid and not expired.
   */
  getCurrentSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (!raw) return null;

      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  },

  /**
   * Clear session data.
   */
  logout() {
    try {
      sessionStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {
      // Ignored
    }
  },

  /**
   * Quick-reference pre-seeded accounts for demo testing.
   */
  getDemoCredentials() {
    return DEFAULT_ACCOUNTS.map(a => ({
      role: a.role,
      email: a.email,
      password: a.passwordHash,
      name: a.name
    }));
  }
};
