// FILE: bus-students-tracker-api/services/websocketService.js
// PURPOSE: Real-time bi-directional telemetry and event streaming via Socket.io
// PHASE: Phase 11 — Live Transport Monitoring & GPS Tracking

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = 0;
  }

  /**
   * Attach Socket.io server instance
   * @param {import('socket.io').Server} io 
   */
  initialize(io) {
    this.io = io;

    this.io.on('connection', (socket) => {
      this.connectedClients++;
      console.log(`🔌 [WS] Client connected: ${socket.id} (Total: ${this.connectedClients})`);

      // Allow clients to subscribe to specific bus or route channels
      socket.on('subscribe_bus', (busId) => {
        if (busId) {
          socket.join(`bus:${busId}`);
          console.log(`📡 [WS] Socket ${socket.id} subscribed to bus:${busId}`);
        }
      });

      socket.on('unsubscribe_bus', (busId) => {
        if (busId) {
          socket.leave(`bus:${busId}`);
          console.log(`📡 [WS] Socket ${socket.id} unsubscribed from bus:${busId}`);
        }
      });

      socket.on('subscribe_route', (routeId) => {
        if (routeId) {
          socket.join(`route:${routeId}`);
          console.log(`📡 [WS] Socket ${socket.id} subscribed to route:${routeId}`);
        }
      });

      socket.on('unsubscribe_route', (routeId) => {
        if (routeId) {
          socket.leave(`route:${routeId}`);
          console.log(`📡 [WS] Socket ${socket.id} unsubscribed from route:${routeId}`);
        }
      });

      socket.on('disconnect', () => {
        this.connectedClients = Math.max(0, this.connectedClients - 1);
        console.log(`❌ [WS] Client disconnected: ${socket.id} (Remaining: ${this.connectedClients})`);
      });
    });

    console.log('✅ [WEBSOCKET] Socket.io event broker initialized.');
  }

  /**
   * Broadcast real-time bus GPS telemetry
   */
  broadcastBusLocation(payload) {
    if (!this.io) return;
    // Broadcast to global channel
    this.io.emit('bus_location_update', payload);

    // Also broadcast to bus-specific room
    if (payload && payload.bus_id) {
      this.io.to(`bus:${payload.bus_id}`).emit('bus_location_update', payload);
    }
  }

  /**
   * Broadcast route progress update
   */
  broadcastRouteProgress(payload) {
    if (!this.io) return;
    this.io.emit('route_progress_update', payload);

    if (payload && payload.route_id) {
      this.io.to(`route:${payload.route_id}`).emit('route_progress_update', payload);
    }
    if (payload && payload.bus_id) {
      this.io.to(`bus:${payload.bus_id}`).emit('route_progress_update', payload);
    }
  }

  /**
   * Broadcast ETA updates for stops
   */
  broadcastETAUpdate(payload) {
    if (!this.io) return;
    this.io.emit('eta_update', payload);

    if (payload && payload.route_id) {
      this.io.to(`route:${payload.route_id}`).emit('eta_update', payload);
    }
  }

  /**
   * Broadcast route deviation alert
   */
  broadcastDeviation(payload) {
    if (!this.io) return;
    this.io.emit('route_deviation', payload);

    if (payload && payload.bus_id) {
      this.io.to(`bus:${payload.bus_id}`).emit('route_deviation', payload);
    }
    if (payload && payload.route_id) {
      this.io.to(`route:${payload.route_id}`).emit('route_deviation', payload);
    }
  }

  /**
   * Broadcast live analytics summary
   */
  broadcastAnalytics(payload) {
    if (!this.io) return;
    this.io.emit('analytics_update', payload);
  }
}

module.exports = new WebSocketService();
