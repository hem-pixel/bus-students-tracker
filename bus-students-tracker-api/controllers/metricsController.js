const { query } = require('../config/database');

/**
 * GET /api/camera-metrics/camera/:cameraId/latest
 */
async function getLatestMetrics(req, res, next) {
  try {
    const { cameraId } = req.params;
    const sql = `
      SELECT m.*, c.camera_name, c.camera_type, b.bus_number, b.registration_plate
      FROM camera_network_metrics m
      JOIN cameras c ON m.camera_id = c.camera_id
      JOIN buses b ON c.bus_id = b.bus_id
      WHERE m.camera_id = $1
      ORDER BY m.metric_timestamp DESC
      LIMIT 1
    `;
    const result = await query(sql, [cameraId]);
    if (result.rows.length === 0) {
      // Fallback default if camera exists but no metrics yet
      return res.json({
        success: true,
        data: {
          camera_id: cameraId,
          latency_ms: 25,
          packet_loss_percent: 0.0,
          jitter_ms: 2,
          bandwidth_mbps: 4.2,
          signal_strength_dbm: -58,
          connection_type: '5G_CELLULAR',
          metric_timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/camera-metrics/camera/:cameraId/history
 * Optional query: limit (default 30)
 */
async function getMetricsHistory(req, res, next) {
  try {
    const { cameraId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 30;

    const sql = `
      SELECT m.*, c.camera_name, b.bus_number
      FROM camera_network_metrics m
      JOIN cameras c ON m.camera_id = c.camera_id
      JOIN buses b ON c.bus_id = b.bus_id
      WHERE m.camera_id = $1
      ORDER BY m.metric_timestamp DESC
      LIMIT $2
    `;
    const result = await query(sql, [cameraId, limit]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/camera-metrics
 * Logs real-time network telemetry for a camera
 */
async function recordMetrics(req, res, next) {
  try {
    const {
      camera_id,
      latency_ms,
      packet_loss_percent,
      jitter_ms,
      bandwidth_mbps,
      signal_strength_dbm,
      connection_type
    } = req.body;

    if (!camera_id) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'camera_id is required to record network metrics.'
      });
    }

    const camCheck = await query('SELECT * FROM cameras WHERE camera_id = $1', [camera_id]);
    if (camCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Camera unit '${camera_id}' not found.`
      });
    }

    const sql = `
      INSERT INTO camera_network_metrics (
        camera_id, latency_ms, packet_loss_percent, jitter_ms,
        bandwidth_mbps, signal_strength_dbm, connection_type, metric_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const params = [
      camera_id,
      latency_ms !== undefined ? parseInt(latency_ms, 10) : 25,
      packet_loss_percent !== undefined ? parseFloat(packet_loss_percent) : 0.0,
      jitter_ms !== undefined ? parseInt(jitter_ms, 10) : 2,
      bandwidth_mbps !== undefined ? parseFloat(bandwidth_mbps) : 4.0,
      signal_strength_dbm !== undefined ? parseInt(signal_strength_dbm, 10) : -60,
      connection_type || '5G_CELLULAR'
    ];

    const result = await query(sql, params);

    // Update camera last_seen
    await query(`
      UPDATE cameras 
      SET last_seen = CURRENT_TIMESTAMP,
          status = CASE WHEN status = 'OFFLINE' THEN 'ONLINE' ELSE status END
      WHERE camera_id = $1
    `, [camera_id]);

    // Check thresholds to automatically record alert events if abnormal
    if (parseFloat(packet_loss_percent) > 5.0 || parseInt(latency_ms, 10) > 200) {
      await query(`
        INSERT INTO camera_events (
          camera_id, event_type, severity, description, event_timestamp, is_resolved
        ) VALUES ($1, 'NETWORK_DEGRADED', 'WARNING', $2, CURRENT_TIMESTAMP, false)
      `, [camera_id, `High network degradation detected: ${latency_ms}ms latency, ${packet_loss_percent}% packet loss.`]);
    }

    res.status(201).json({
      success: true,
      message: 'Network telemetry recorded successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLatestMetrics,
  getMetricsHistory,
  recordMetrics
};
