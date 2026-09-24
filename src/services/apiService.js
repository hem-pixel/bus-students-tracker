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
  },

  // Wrong Bus Detection & Alerts (Phase 9)
  alerts: {
    create: (data) => request('/alerts/create', { method: 'POST', body: JSON.stringify(data) }),
    getActive: () => request('/alerts/active'),
    getStats: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/alerts/stats${qs ? `?${qs}` : ''}`);
    },
    getHistory: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/alerts/history${qs ? `?${qs}` : ''}`);
    },
    getEscalations: () => request('/alerts/escalations'),
    acknowledge: (alertId) => request(`/alerts/${alertId}/acknowledge`, { method: 'POST' }),
    override: (alertId, data) => request(`/alerts/${alertId}/override`, { method: 'POST', body: JSON.stringify(data) })
  },

  // Wrong Stop Detection & Alerts (Phase 10)
  stopDetection: {
    assignStops: (data) => request('/stop-detection/assign-stops', { method: 'POST', body: JSON.stringify(data) }),
    getStudentAssignments: (studentId) => request(`/stop-detection/student-assignments/${studentId}`),
    getAssignments: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/stop-detection/assignments${qs ? `?${qs}` : ''}`);
    },
    checkBoarding: (data) => request('/stop-detection/check-boarding', { method: 'POST', body: JSON.stringify(data) }),
    getDetections: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/stop-detection/detections${qs ? `?${qs}` : ''}`);
    },
    getAlerts: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/stop-detection/alerts${qs ? `?${qs}` : ''}`);
    },
    resolveDetection: (id, data) => request(`/stop-detection/detections/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
    dismissAlert: (id, data) => request(`/stop-detection/alerts/${id}/dismiss`, { method: 'PUT', body: JSON.stringify(data) }),
    getStats: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/stop-detection/stats${qs ? `?${qs}` : ''}`);
    }
  },

  // Live Transport Monitoring & GPS Tracking (Phase 11)
  liveTransport: {
    recordLocation: (data) => request('/live/location', { method: 'POST', body: JSON.stringify(data) }),
    getBusLocation: (busId) => request(`/live/location/${busId}`),
    getAllBusLocations: () => request('/live/locations'),
    getRouteProgress: (routeId) => request(`/live/progress/${routeId}`),
    updateRouteProgress: (data) => request('/live/progress', { method: 'POST', body: JSON.stringify(data) }),
    getRouteETAs: (routeId) => request(`/live/eta/${routeId}`),
    getDeviations: () => request('/live/deviations'),
    getMapData: () => request('/live/map-data'),
    getLiveAnalytics: () => request('/live/analytics'),
    getPassengerFlow: (busId) => request(`/live/passenger-flow/${busId}`),
    simulateStep: (data) => request('/live/simulate/step', { method: 'POST', body: JSON.stringify(data) }),
    calculateDailyMetrics: (data) => request('/live/metrics/daily', { method: 'POST', body: JSON.stringify(data) })
  },

  // Notifications & Alerts System (Phase 12)
  notifications: {
    getStats: () => request('/notifications/stats'),
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notifications${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/notifications/${id}`),
    send: (data) => request('/notifications/send', { method: 'POST', body: JSON.stringify(data) }),
    sendBulk: (data) => request('/notifications/bulk', { method: 'POST', body: JSON.stringify(data) }),
    acknowledge: (id, data = {}) => request(`/notifications/${id}/acknowledge`, { method: 'POST', body: JSON.stringify(data) }),
    retry: (id) => request(`/notifications/${id}/retry`, { method: 'POST' }),
    delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

    // Preferences
    getPreferences: (userId) => request(`/notifications/preferences/${userId}`),
    updatePreferences: (userId, data) => request(`/notifications/preferences/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),

    // Alert Rules
    getAlertRules: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notifications/rules${qs ? `?${qs}` : ''}`);
    },
    getAlertRuleById: (id) => request(`/notifications/rules/${id}`),
    createAlertRule: (data) => request('/notifications/rules', { method: 'POST', body: JSON.stringify(data) }),
    updateAlertRule: (id, data) => request(`/notifications/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAlertRule: (id) => request(`/notifications/rules/${id}`, { method: 'DELETE' }),
    testAlertRule: (data) => request('/notifications/rules/test', { method: 'POST', body: JSON.stringify(data) }),

    // Templates
    getTemplates: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notifications/templates${qs ? `?${qs}` : ''}`);
    },
    getTemplateById: (id) => request(`/notifications/templates/${id}`),
    createTemplate: (data) => request('/notifications/templates', { method: 'POST', body: JSON.stringify(data) }),
    updateTemplate: (id, data) => request(`/notifications/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTemplate: (id) => request(`/notifications/templates/${id}`, { method: 'DELETE' }),

    // Audit History
    getAuditHistory: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/notifications/history/audit${qs ? `?${qs}` : ''}`);
    }
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
export const alertsAPI = apiService.alerts;
export const stopDetectionAPI = apiService.stopDetection;
export const liveTransportAPI = apiService.liveTransport;
export const notificationAPI = apiService.notifications;



