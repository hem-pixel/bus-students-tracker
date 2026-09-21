// FILE: src/services/apiService.js
// PURPOSE: Unified API client for Phase 3 Transport Master Data backend communications.
// Handles authentication headers, error mapping, and fallback data resilience.
// PHASE: Phase 3 — Transport Master Data

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Standard fetch helper with JWT token injection and JSON handling
 */
async function request(endpoint, options = {}) {
  const session = authService.getCurrentSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (session && session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || `HTTP Error ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.errors = data?.errors || [];
      throw error;
    }

    return data;
  } catch (err) {
    // If backend isn't running or network error, provide intelligent error message
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[APIService] Backend at ${API_BASE_URL} unreachable. Falling back to local offline mode.`);
      const offlineError = new Error('API server is temporarily offline or unreachable.');
      offlineError.isOffline = true;
      throw offlineError;
    }
    throw err;
  }
}

export const apiService = {
  // System Health
  async getHealth() {
    return request('/health');
  },

  // Buses
  buses: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/buses${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/buses/${id}`),
    create: (busData) => request('/buses', { method: 'POST', body: JSON.stringify(busData) }),
    update: (id, busData) => request(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(busData) }),
    delete: (id) => request(`/buses/${id}`, { method: 'DELETE' })
  },

  // Routes
  routes: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/routes${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/routes/${id}`),
    create: (routeData) => request('/routes', { method: 'POST', body: JSON.stringify(routeData) }),
    update: (id, routeData) => request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(routeData) }),
    delete: (id) => request(`/routes/${id}`, { method: 'DELETE' })
  },

  // Stops
  stops: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/stops${qs ? `?${qs}` : ''}`);
    },
    getByRoute: (routeId) => request(`/stops/route/${routeId}`),
    getById: (id) => request(`/stops/${id}`),
    create: (stopData) => request('/stops', { method: 'POST', body: JSON.stringify(stopData) }),
    update: (id, stopData) => request(`/stops/${id}`, { method: 'PUT', body: JSON.stringify(stopData) }),
    delete: (id) => request(`/stops/${id}`, { method: 'DELETE' })
  },

  // Drivers
  drivers: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/drivers${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/drivers/${id}`),
    create: (driverData) => request('/drivers', { method: 'POST', body: JSON.stringify(driverData) }),
    update: (id, driverData) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(driverData) }),
    delete: (id) => request(`/drivers/${id}`, { method: 'DELETE' })
  },

  // Bus In-Charges (Faculty)
  busInCharges: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/bus-in-charges${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/bus-in-charges/${id}`),
    create: (data) => request('/bus-in-charges', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/bus-in-charges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/bus-in-charges/${id}`, { method: 'DELETE' })
  },

  // Bus Route Assignments
  assignments: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/assignments${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/assignments/${id}`),
    create: (assignmentData) => request('/assignments', { method: 'POST', body: JSON.stringify(assignmentData) }),
    update: (id, assignmentData) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(assignmentData) }),
    delete: (id) => request(`/assignments/${id}`, { method: 'DELETE' })
  },

  // Cameras (Phase 6 Core)
  cameras: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/cameras${qs ? `?${qs}` : ''}`);
    },
    getByBus: (busId) => request(`/cameras/bus/${busId}`),
    getById: (id) => request(`/cameras/${id}`),
    getStatus: (id) => request(`/cameras/${id}/status`),
    getFleetHealth: () => request('/cameras/dashboard/health'),
    create: (cameraData) => request('/cameras', { method: 'POST', body: JSON.stringify(cameraData) }),
    update: (id, cameraData) => request(`/cameras/${id}`, { method: 'PUT', body: JSON.stringify(cameraData) }),
    delete: (id) => request(`/cameras/${id}`, { method: 'DELETE' })
  },

  // Camera Network Metrics (Phase 6)
  cameraMetrics: {
    record: (data) => request('/camera-metrics', { method: 'POST', body: JSON.stringify(data) }),
    getLatest: (cameraId) => request(`/camera-metrics/camera/${cameraId}/latest`),
    getHistory: (cameraId, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/camera-metrics/camera/${cameraId}/history${qs ? `?${qs}` : ''}`);
    }
  },

  // Camera Events & Alerts (Phase 6)
  cameraEvents: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/camera-events${qs ? `?${qs}` : ''}`);
    },
    getUnresolved: () => request('/camera-events/unresolved'),
    create: (data) => request('/camera-events', { method: 'POST', body: JSON.stringify(data) }),
    resolve: (id, data = {}) => request(`/camera-events/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Camera Calibration & Alignment (Phase 6)
  cameraCalibration: {
    getHistory: (cameraId) => request(`/camera-calibration/camera/${cameraId}`),
    record: (data) => request('/camera-calibration', { method: 'POST', body: JSON.stringify(data) }),
    verify: (id, data = {}) => request(`/camera-calibration/${id}/verify`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Stream Segments & Storage Management (Phase 6)
  cameraStreams: {
    getSegments: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/camera-streams/segments${qs ? `?${qs}` : ''}`);
    },
    getStorageUsage: () => request('/camera-streams/storage'),
    cleanup: (data = { retention_days: 30 }) => request('/camera-streams/cleanup', { method: 'POST', body: JSON.stringify(data) })
  },

  // Camera Remote Diagnostics (Phase 6)
  cameraDiagnostics: {
    ping: (cameraId) => request('/camera-diagnostics/ping', { method: 'POST', body: JSON.stringify({ camera_id: cameraId }) }),
    reboot: (cameraId) => request('/camera-diagnostics/reboot', { method: 'POST', body: JSON.stringify({ camera_id: cameraId }) }),
    getNetwork: (cameraId) => request(`/camera-diagnostics/${cameraId}/network`)
  },

  // Students (Phase 4)
  students: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/students${qs ? `?${qs}` : ''}`);
    },
    getStats: () => request('/students/stats'),
    getById: (id) => request(`/students/${id}`),
    create: (studentData) => request('/students', { method: 'POST', body: JSON.stringify(studentData) }),
    update: (id, studentData) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(studentData) }),
    delete: (id) => request(`/students/${id}`, { method: 'DELETE' })
  },

  // Student Bus Assignments (Phase 4)
  studentAssignments: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/students/assignments${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/students/assignments/${id}`),
    create: (assignmentData) => request('/students/assignments', { method: 'POST', body: JSON.stringify(assignmentData) }),
    assign: (assignmentData) => request('/students/assignments', { method: 'POST', body: JSON.stringify(assignmentData) }),
    update: (id, assignmentData) => request(`/students/assignments/${id}`, { method: 'PUT', body: JSON.stringify(assignmentData) }),
    delete: (id) => request(`/students/assignments/${id}`, { method: 'DELETE' }),
    remove: (id) => request(`/students/assignments/${id}`, { method: 'DELETE' })
  },

  // Transport Requests (Phase 4)
  transportRequests: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/transport-requests${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/transport-requests/${id}`),
    create: (reqData) => request('/transport-requests', { method: 'POST', body: JSON.stringify(reqData) }),
    review: (id, reviewData) => request(`/transport-requests/${id}/review`, { method: 'PUT', body: JSON.stringify(reviewData) })
  },

  // Student Attendance Logs (Phase 4)
  attendance: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/attendance${qs ? `?${qs}` : ''}`);
    },
    getLogs: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/attendance${qs ? `?${qs}` : ''}`);
    },
    getSummary: () => request('/attendance/summary'),
    log: (logData) => request('/attendance', { method: 'POST', body: JSON.stringify(logData) })
  },

  // Staff & Drivers (Phase 5)
  staff: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/staff${qs ? `?${qs}` : ''}`);
    },
    getStats: () => request('/staff/stats'),
    getById: (id) => request(`/staff/${id}`),
    create: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
    getMetrics: (id) => request(`/staff/${id}/metrics`),
    getShifts: (id, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/staff/${id}/shifts${qs ? `?${qs}` : ''}`);
    },
    getLeaves: (id) => request(`/staff/${id}/leaves`)
  },

  // Staff Shifts & Roster (Phase 5)
  shifts: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/shifts${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/shifts/${id}`),
    create: (data) => request('/shifts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/shifts/${id}`, { method: 'DELETE' }),
    getByBusAndDate: (busId, date) => request(`/shifts/bus/${busId}/date/${date}`)
  },

  // Leave Requests (Phase 5)
  leaves: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/leave-requests${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/leave-requests/${id}`),
    create: (data) => request('/leave-requests', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id, data = {}) => request(`/leave-requests/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
    reject: (id, data = {}) => request(`/leave-requests/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Performance Logs & Scorecard (Phase 5)
  performance: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/performance-logs${qs ? `?${qs}` : ''}`);
    },
    log: (data) => request('/performance-logs', { method: 'POST', body: JSON.stringify(data) }),
    getIncidents: () => request('/performance-logs/incidents'),
    getStaffLogs: (id) => request(`/performance-logs/staff/${id}`),
    getStaffMetrics: (id) => request(`/performance-logs/staff/${id}/metrics`)
  },

  // Salary Structure (Phase 5)
  salary: {
    getStaffSalary: (staffId) => request(`/salary/staff/${staffId}`),
    updateStaffSalary: (staffId, data) => request(`/salary/staff/${staffId}`, { method: 'POST', body: JSON.stringify(data) })
  },

  // Biometric Enrollments (Phase 7)
  enrollments: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/enrollments${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/enrollments/${id}`),
    enroll: (data) => request('/enrollments', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, payload) => {
      const body = typeof payload === 'string' ? { status: payload } : payload;
      return request(`/enrollments/${id}/status`, { method: 'PUT', body: JSON.stringify(body) });
    },
    delete: (id) => request(`/enrollments/${id}`, { method: 'DELETE' })
  },

  // Face Recognition Engine (Phase 7)
  recognition: {
    recognize: (data) => request('/recognize', { method: 'POST', body: JSON.stringify(data) }),
    getResults: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/recognition-results${qs ? `?${qs}` : ''}`);
    },
    getHudFrame: (resultId) => request(`/recognition-results/${resultId}/hud`)
  },

  // Pre-Dispatch Driver Biometric Verification (Phase 7)
  verification: {
    verifyDriver: (data) => request('/verification/verify-driver', { method: 'POST', body: JSON.stringify(data) }),
    override: (data) => request('/verification/override', { method: 'POST', body: JSON.stringify(data) }),
    getStatusByBus: (busId) => request(`/verification/status/${busId}`),
    getLogs: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/verification/logs${qs ? `?${qs}` : ''}`);
    }
  },

  // Model Architecture & Performance Metrics (Phase 7)
  modelPerformance: {
    getMetrics: () => request('/models')
  },

  // Student Boarding Verification (Phase 8)
  boarding: {
    verify: (data) => request('/boarding/verify', { method: 'POST', body: JSON.stringify(data) }),
    quickCheck: (studentId, busId, stopId) => request(`/boarding/check/${studentId}/${busId}/${stopId}`),
    getSummary: (busId, date) => request(`/boarding/summary/${busId}${date ? `?date=${date}` : ''}`),
    getAnomalies: (busId, hoursBack = 24) => request(`/boarding/anomalies/${busId}?hoursBack=${hoursBack}`),
    getEvents: (busId, limit = 50) => request(`/boarding/events/${busId}?limit=${limit}`),
    override: (eventId, data) => request(`/boarding/${eventId}/override`, { method: 'POST', body: JSON.stringify(data) }),
    getStudentAttendance: (studentId, daysBack = 30) => request(`/boarding/attendance/${studentId}?daysBack=${daysBack}`)
  }
};

export const cameraService = apiService.cameras;
export const cameraMetricsService = apiService.cameraMetrics;
export const cameraEventsService = apiService.cameraEvents;
export const cameraCalibrationService = apiService.cameraCalibration;
export const cameraStreamsService = apiService.cameraStreams;
export const cameraDiagnosticsService = apiService.cameraDiagnostics;

export const enrollmentsAPI = apiService.enrollments;
export const recognitionAPI = apiService.recognition;
export const verificationAPI = apiService.verification;
export const modelPerformanceAPI = apiService.modelPerformance;
export const boardingAPI = apiService.boarding;


