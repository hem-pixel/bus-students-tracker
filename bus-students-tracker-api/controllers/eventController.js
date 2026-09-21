const { query } = require('../config/database');

/**
 * GET /api/camera-events
 * Optional queries: camera_id, event_type, severity, is_resolved, limit
 */
async function getEvents(req, res, next) {
  try {
    const { camera_id, event_type, severity, is_resolved, limit } = req.query;
    let sql = `
      SELECT e.*, c.camera_name, c.camera_type, b.bus_number, b.registration_plate
      FROM camera_events e
      JOIN cameras c ON e.camera_id = c.camera_id
      JOIN buses b ON c.bus_id = b.bus_id
    `;
    const conditions = [];
    const params = [];

    if (camera_id) {
      params.push(camera_id);
      conditions.push(`e.camera_id = $${params.length}`);
    }

    if (event_type) {
      params.push(event_type.toUpperCase());
      conditions.push(`e.event_type = $${params.length}`);
    }

    if (severity) {
      params.push(severity.toUpperCase());
      conditions.push(`e.severity = $${params.length}`);
    }

    if (is_resolved !== undefined) {
      const boolVal = is_resolved === 'true' || is_resolved === true;
      params.push(boolVal);
      conditions.push(`e.is_resolved = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY e.event_timestamp DESC';

    if (limit) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }

    const result = await query(sql, params);
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
 * GET /api/camera-events/unresolved
 * Returns all open/active camera alerts
 */
async function getUnresolvedEvents(req, res, next) {
  try {
    const sql = `
      SELECT e.*, c.camera_name, c.camera_type, b.bus_number, b.registration_plate
      FROM camera_events e
      JOIN cameras c ON e.camera_id = c.camera_id
      JOIN buses b ON c.bus_id = b.bus_id
      WHERE e.is_resolved = false
      ORDER BY e.event_timestamp DESC
    `;
    const result = await query(sql);
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
 * POST /api/camera-events
 * Logs an event/incident
 */
async function createEvent(req, res, next) {
  try {
    const {
      camera_id,
      event_type,
      severity,
      description,
      metadata
    } = req.body;

    if (!camera_id || !event_type || !description) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'camera_id, event_type, and description are required.'
      });
    }

    const camCheck = await query('SELECT * FROM cameras WHERE camera_id = $1', [camera_id]);
    if (camCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Camera unit '${camera_id}' not found.`
      });
    }

    const normType = event_type.toUpperCase();
    const normSeverity = (severity || 'INFO').toUpperCase();

    const sql = `
      INSERT INTO camera_events (
        camera_id, event_type, severity, description,
        metadata, event_timestamp, is_resolved
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, false)
      RETURNING *
    `;

    const params = [
      camera_id,
      normType,
      normSeverity,
      description.trim(),
      metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null
    ];

    const result = await query(sql, params);

    // If critical, update camera status to ERROR
    if (normSeverity === 'CRITICAL') {
      await query(`UPDATE cameras SET status = 'ERROR' WHERE camera_id = $1`, [camera_id]);
    }

    const row = result.rows[0];
    if (row && !row.id) row.id = row.event_id;
    res.status(201).json({
      success: true,
      message: 'Camera event logged successfully.',
      data: row
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/camera-events/:id/resolve
 * Resolves an active event
 */
async function resolveEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;
    const resolved_by = req.user?.username || req.user?.id || 'admin';

    const existing = await query('SELECT * FROM camera_events WHERE event_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Camera event '${id}' not found.`
      });
    }

    const sql = `
      UPDATE camera_events
      SET 
        is_resolved = true,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = $1,
        resolution_notes = $2
      WHERE event_id = $3
      RETURNING *
    `;

    const notes = resolution_notes || 'Incident reviewed and verified by staff operator.';
    const result = await query(sql, [resolved_by, notes, id]);
    const resolvedRow = result.rows[0];
    if (resolvedRow && !resolvedRow.id) resolvedRow.id = resolvedRow.event_id;

    res.json({
      success: true,
      message: 'Camera alert marked as resolved.',
      data: resolvedRow
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEvents,
  getUnresolvedEvents,
  createEvent,
  resolveEvent
};
