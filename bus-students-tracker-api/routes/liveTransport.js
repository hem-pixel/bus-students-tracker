/**
 * LIVE TRANSPORT MONITORING ROUTES
 * Phase 11: Real-Time Bus Tracking & Route Management
 * 
 * Mount path: /api/live/*
 */

const express = require('express');
const router = express.Router();
const liveTransportController = require('../controllers/liveTransportController');
const { authenticateJWT, authorize } = require('../middleware/auth');

// All live routes require authentication
router.use(authenticateJWT);

// 1. Record GPS telemetry (buses, IoT devices, drivers, simulation)
router.post('/gps', liveTransportController.recordLocation);

// 2. Get latest location for a specific bus
router.get('/bus/:busId/location', liveTransportController.getBusLocation);

// 3. Get latest locations for all active fleet buses
router.get('/buses/locations', liveTransportController.getAllBusLocations);

// 4. Get route progression status and stop timeline
router.get('/route/:routeId/progress', liveTransportController.getRouteProgress);

// 5. Update route progression state
router.post('/route/progress', liveTransportController.updateRouteProgress);

// 6. Get dynamic stop-by-stop ETAs for a route
router.get('/route/:routeId/eta', liveTransportController.getRouteETAs);

// 7. Get active corridor deviations (>500m)
router.get('/deviations', liveTransportController.getDeviations);

// 8. Aggregated live map bundle (buses, route lines, stops, deviations)
router.get('/map-data', liveTransportController.getMapData);

// 9. Aggregated live analytics & fleet performance KPIs
router.get('/analytics', liveTransportController.getLiveAnalytics);

// 10. Passenger flow and load occupancy for a bus
router.get('/bus/:busId/passengers', liveTransportController.getPassengerFlow);

// 11. Interactive simulation step along the Karur - VSB corridor
router.post('/simulate-step', liveTransportController.simulateStep);

// 12. Calculate & record daily performance metrics
router.post('/metrics/daily', authorize('ADMIN', 'TRANSPORT_STAFF'), liveTransportController.calculateDailyMetrics);

module.exports = router;
