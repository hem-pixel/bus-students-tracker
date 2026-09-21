const { query } = require('../config/database');

/**
 * GET /api/camera-streams/segments
 * Optional queries: camera_id, limit
 */
async function getStreamSegments(req, res, next) {
  try {
    const { camera_id, limit } = req.query;
    let sql = `
      SELECT s.*, c.camera_name, c.camera_type, b.bus_number, b.registration_plate
      FROM camera_stream_segments s
      JOIN cameras c ON s.camera_id = c.camera_id
      JOIN buses b ON c.bus_id = b.bus_id
    `;
    const conditions = [];
    const params = [];

    if (camera_id) {
      params.push(camera_id);
      conditions.push(`s.camera_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY s.start_time DESC';

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
 * GET /api/camera-streams/storage-usage
 * Overview of video segment storage across fleet
 */
async function getStorageUsage(req, res, next) {
  try {
    const segmentsRes = await query(`
      SELECT s.*, c.camera_name, b.bus_number
      FROM camera_stream_segments s
      JOIN cameras c ON s.camera_id = c.camera_id
      JOIN buses b ON c.bus_id = b.bus_id
    `);
    const segments = segmentsRes.rows;

    const totalBytes = segments.reduce((acc, s) => acc + (parseInt(s.file_size_bytes, 10) || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);

    // Grouping by bus
    const busUsage = {};
    segments.forEach(s => {
      const bnum = s.bus_number || 'Unknown';
      if (!busUsage[bnum]) {
        busUsage[bnum] = { bus_number: bnum, segment_count: 0, bytes: 0 };
      }
      busUsage[bnum].segment_count++;
      busUsage[bnum].bytes += (parseInt(s.file_size_bytes, 10) || 0);
    });

    const breakdown = Object.values(busUsage).map(b => ({
      bus_number: b.bus_number,
      segment_count: b.segment_count,
      size_mb: parseFloat((b.bytes / (1024 * 1024)).toFixed(2))
    }));

    res.json({
      success: true,
      data: {
        total_segments: segments.length,
        total_size_mb: parseFloat(totalMB),
        total_storage_mb: parseFloat(totalMB),
        total_size_gb: parseFloat(totalGB),
        retention_days_policy: 7,
        by_bus: breakdown,
        breakdown_by_bus: breakdown
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/camera-streams/cleanup
 * Purges stream segments older than days_to_keep / retention_days (default 7 days)
 */
async function cleanupOldSegments(req, res, next) {
  try {
    const daysToKeep = parseInt(req.body.retention_days || req.body.days_to_keep, 10) || 7;
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

    const sql = `
      DELETE FROM camera_stream_segments
      WHERE start_time < $1
      RETURNING *
    `;
    const result = await query(sql, [cutoffDate]);

    res.json({
      success: true,
      message: `Cleaned up ${result.rows.length} video stream segments older than ${daysToKeep} days.`,
      purged_count: result.rows.length,
      cutoff_date: cutoffDate
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStreamSegments,
  getStorageUsage,
  cleanupOldSegments
};
