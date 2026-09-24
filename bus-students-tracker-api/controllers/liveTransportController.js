// FILE: bus-students-tracker-api/controllers/liveTransportController.js
// PURPOSE: HTTP Request handler for Phase 11 Live Transport Monitoring & GPS Tracking
// PHASE: Phase 11 — Live Transport Monitoring

const gpsTrackingService = require('../services/gpsTrackingService');

/**
 * POST /api/live/gps
 * Record new GPS telemetry for a bus
 */
async function recordLocation(req, res, next) {
  try {
    const { bus_id, latitude, longitude, accuracy_meters, speed_kmh, heading_degrees } = req.body;

    if (!bus_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'bus_id, latitude, and longitude are required'
      });
    }

    const result = await gpsTrackingService.recordGPSLocation({
      bus_id,
      latitude,
      longitude,
      accuracy_meters,
      speed_kmh,
      heading_degrees
    });

    res.status(201).json({
      success: true,
      message: 'GPS location recorded successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/bus/:busId/location
 * Get latest GPS position and metadata for a specific bus
 */
async function getBusLocation(req, res, next) {
  try {
    const { busId } = req.params;
    if (!busId) {
      return res.status(400).json({ success: false, error: 'busId param is required' });
    }

    const data = await gpsTrackingService.getBusLocation(busId);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/buses/locations
 * Get all active fleet buses with their latest GPS telemetry
 */
async function getAllBusLocations(req, res, next) {
  try {
    const data = await gpsTrackingService.getAllBusLocations();
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/route/:routeId/progress
 * Get route progress including stop sequence, completion % and dynamic ETAs
 */
async function getRouteProgress(req, res, next) {
  try {
    const { routeId } = req.params;
    if (!routeId) {
      return res.status(400).json({ success: false, error: 'routeId param is required' });
    }

    const data = await gpsTrackingService.getRouteProgress(routeId);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/live/route/progress
 * Update route progression state (current stop, next stop, completion)
 */
async function updateRouteProgress(req, res, next) {
  try {
    const {
      bus_id,
      route_id,
      current_stop_id,
      next_stop_id,
      stops_completed,
      total_stops,
      estimated_arrival_next_stop,
      on_schedule,
      delay_minutes
    } = req.body;

    if (!bus_id || !route_id) {
      return res.status(400).json({
        success: false,
        error: 'bus_id and route_id are required'
      });
    }

    const data = await gpsTrackingService.updateRouteProgress({
      bus_id,
      route_id,
      current_stop_id,
      next_stop_id,
      stops_completed,
      total_stops,
      estimated_arrival_next_stop,
      on_schedule,
      delay_minutes
    });

    res.status(200).json({
      success: true,
      message: 'Route progress updated',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/route/:routeId/eta
 * Get dynamic Haversine ETAs for all stops along a route
 */
async function getRouteETAs(req, res, next) {
  try {
    const { routeId } = req.params;
    if (!routeId) {
      return res.status(400).json({ success: false, error: 'routeId param is required' });
    }

    const data = await gpsTrackingService.getRouteETAs(routeId);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/deviations
 * Get all current corridor deviations (>500m)
 */
async function getDeviations(req, res, next) {
  try {
    const data = gpsTrackingService.getDeviations();
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/map-data
 * Aggregated live map bundle (buses, route polylines, stops, deviations)
 */
async function getMapData(req, res, next) {
  try {
    const data = await gpsTrackingService.getMapData();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/analytics
 * Aggregated live analytics & fleet performance KPIs
 */
async function getLiveAnalytics(req, res, next) {
  try {
    const data = await gpsTrackingService.getLiveAnalytics();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live/bus/:busId/passengers
 * Real-time passenger occupancy and flow for a bus
 */
async function getPassengerFlow(req, res, next) {
  try {
    const { busId } = req.params;
    if (!busId) {
      return res.status(400).json({ success: false, error: 'busId param is required' });
    }

    const data = await gpsTrackingService.getPassengerFlow(busId);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/live/simulate-step
 * Interactive simulation: advances bus coordinates along Karur - VSB corridor
 */
async function simulateStep(req, res, next) {
  try {
    const { bus_id, route_id } = req.body;
    const data = await gpsTrackingService.simulateStep(bus_id, route_id);
    res.json({
      success: true,
      message: 'Simulation step executed',
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/live/metrics/daily
 * Trigger daily performance metric calculation
 */
async function calculateDailyMetrics(req, res, next) {
  try {
    const { route_id, date } = req.body;
    const targetRouteId = route_id || 'r1000000-0000-0000-0000-000000000001';
    const data = await gpsTrackingService.calculateDailyMetrics(targetRouteId, date);
    res.status(201).json({
      success: true,
      message: 'Daily metrics recorded',
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recordLocation,
  getBusLocation,
  getAllBusLocations,
  getRouteProgress,
  updateRouteProgress,
  getRouteETAs,
  getDeviations,
  getMapData,
  getLiveAnalytics,
  getPassengerFlow,
  simulateStep,
  calculateDailyMetrics
};
