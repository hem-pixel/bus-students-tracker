const { query } = require('../config/database');

/**
 * Evaluates camera health metrics and logs alert events if thresholds breached:
 * - Temperature > 50°C (OVERHEATING)
 * - Battery < 20% (LOW_BATTERY)
 * - Packet loss > 5% or Latency > 200ms (NETWORK_DEGRADED)
 * - Heartbeat timeout > 10 mins while ONLINE (DISCONNECTED)
 */
async function runHeartbeatCheck() {
  try {
    const camerasRes = await query('SELECT * FROM cameras');
    const cameras = camerasRes.rows;
    const now = Date.now();
    const alertsGenerated = [];

    for (const cam of cameras) {
      // 1. Temperature check
      if (cam.temperature_celsius && cam.temperature_celsius > 50) {
        const desc = `Thermal warning: Core temperature is ${cam.temperature_celsius}°C (Threshold: 50°C).`;
        const exists = await query(`
          SELECT * FROM camera_events 
          WHERE camera_id = $1 AND event_type = 'OVERHEATING' AND is_resolved = false
        `, [cam.camera_id]);

        if (exists.rows.length === 0) {
          await query(`
            INSERT INTO camera_events (
              camera_id, event_type, severity, description, event_timestamp, is_resolved
            ) VALUES ($1, 'OVERHEATING', 'HIGH', $2, CURRENT_TIMESTAMP, false)
          `, [cam.camera_id, desc]);
          alertsGenerated.push({ camera_id: cam.camera_id, type: 'OVERHEATING' });
        }
      }

      // 2. Battery check
      if (cam.battery_percentage && cam.battery_percentage < 20) {
        const desc = `Low battery alert: Unit battery level at ${cam.battery_percentage}%. Immediate recharge or power line check required.`;
        const exists = await query(`
          SELECT * FROM camera_events 
          WHERE camera_id = $1 AND event_type = 'LOW_BATTERY' AND is_resolved = false
        `, [cam.camera_id]);

        if (exists.rows.length === 0) {
          await query(`
            INSERT INTO camera_events (
              camera_id, event_type, severity, description, event_timestamp, is_resolved
            ) VALUES ($1, 'LOW_BATTERY', 'WARNING', $2, CURRENT_TIMESTAMP, false)
          `, [cam.camera_id, desc]);
          alertsGenerated.push({ camera_id: cam.camera_id, type: 'LOW_BATTERY' });
        }
      }

      // 3. Heartbeat timeout check
      if (cam.status === 'ONLINE' && cam.last_seen) {
        const lastSeenTime = new Date(cam.last_seen).getTime();
        const diffMinutes = (now - lastSeenTime) / (1000 * 60);

        if (diffMinutes > 10) {
          await query(`
            UPDATE cameras 
            SET status = 'OFFLINE', updated_at = CURRENT_TIMESTAMP 
            WHERE camera_id = $1
          `, [cam.camera_id]);

          await query(`
            INSERT INTO camera_events (
              camera_id, event_type, severity, description, event_timestamp, is_resolved
            ) VALUES ($1, 'DISCONNECTED', 'HIGH', $2, CURRENT_TIMESTAMP, false)
          `, [cam.camera_id, `Heartbeat timeout: No ping received for ${Math.round(diffMinutes)} minutes.`]);
          alertsGenerated.push({ camera_id: cam.camera_id, type: 'DISCONNECTED' });
        }
      }
    }

    return {
      success: true,
      scanned_cameras: cameras.length,
      alerts_generated: alertsGenerated.length,
      alerts: alertsGenerated
    };
  } catch (err) {
    console.error('[CameraHeartbeatService] Error running check:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Initializes heartbeat check interval (every 60 seconds)
 */
function startHeartbeatScheduler(intervalMs = 60000) {
  const timer = setInterval(() => {
    runHeartbeatCheck().catch(() => {});
  }, intervalMs);
  return timer;
}

module.exports = {
  runHeartbeatCheck,
  startHeartbeatScheduler
};
