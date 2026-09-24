// FILE: bus-students-tracker-api/controllers/notificationController.js
// PURPOSE: Controller for Phase 12 Notifications & Alerts System
// PHASE: Phase 12 — Multi-Channel Alert Delivery & Notification Management

const crypto = require('crypto');
const db = require('../config/database');
const notificationService = require('../services/notificationService');
const alertRulesService = require('../services/alertRulesService');

/**
 * 1. LIST NOTIFICATIONS
 * GET /api/notifications
 */
exports.listNotifications = async (req, res, next) => {
  try {
    const { status, priority, event_type, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (priority && priority !== 'ALL') {
      params.push(priority);
      query += ` AND priority = $${params.length}`;
    }
    if (event_type && event_type !== 'ALL') {
      params.push(event_type);
      query += ` AND (event_type = $${params.length} OR notification_type = $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const countRes = await db.query(query, params);
    const notifications = countRes.rows || [];

    // Attach recipients to each notification
    for (const notif of notifications) {
      try {
        const recRes = await db.query(
          'SELECT * FROM notification_recipients WHERE notification_id = $1',
          [notif.id]
        );
        notif.recipients = recRes.rows || [];
      } catch (err) {
        notif.recipients = [];
      }
    }

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications.slice(Number(offset), Number(offset) + Number(limit))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. GET NOTIFICATION BY ID
 * GET /api/notifications/:id
 */
exports.getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notifRes = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
    if (!notifRes.rows || notifRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const notification = notifRes.rows[0];

    // Fetch recipients
    try {
      const recRes = await db.query(
        'SELECT * FROM notification_recipients WHERE notification_id = $1',
        [id]
      );
      notification.recipients = recRes.rows || [];
    } catch {
      notification.recipients = [];
    }

    // Fetch audit history
    try {
      const auditRes = await db.query(
        'SELECT * FROM notification_audit_log WHERE notification_id = $1 ORDER BY timestamp DESC',
        [id]
      );
      notification.audit_log = auditRes.rows || [];
    } catch {
      notification.audit_log = [];
    }

    res.json({
      success: true,
      notification
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. SEND DIRECT NOTIFICATION
 * POST /api/notifications/send
 */
exports.sendNotification = async (req, res, next) => {
  try {
    const {
      event_type = 'SYSTEM',
      title,
      message,
      priority = 'MEDIUM',
      recipients = [],
      event_id = null,
      ...contextData
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title and message are required' });
    }

    // If recipients is empty and role/user targeted
    let targetRecipients = recipients;
    if (!targetRecipients || targetRecipients.length === 0) {
      targetRecipients = [
        {
          recipient_id: req.user?.id || 'USR-ADM-001',
          role: req.user?.role || 'ADMIN',
          email: req.user?.email || 'transport@vsb.ac.in',
          phone: '+919443123456',
          channels: { email: true, sms: priority === 'CRITICAL', push: true, in_app: true }
        }
      ];
    }

    // 1. Create notification record
    const createdNotif = await notificationService.createNotification(
      event_type,
      title,
      message,
      priority,
      targetRecipients,
      event_id
    );

    // 2. Dispatch to channels
    const dispatchResult = await notificationService.sendNotification(createdNotif.id, {
      ...contextData,
      title,
      message,
      priority,
      event_type
    });

    res.status(201).json({
      success: true,
      message: 'Notification queued and dispatched',
      notification: createdNotif,
      delivery: dispatchResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. SEND BULK NOTIFICATIONS
 * POST /api/notifications/bulk
 */
exports.sendBulkNotification = async (req, res, next) => {
  try {
    const {
      event_type = 'ANNOUNCEMENT',
      title,
      message,
      priority = 'MEDIUM',
      route_id,
      bus_id,
      role = 'ALL',
      recipients = []
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title and message are required' });
    }

    let finalRecipients = [...recipients];

    // If route or bus filter given, query relevant students/parents
    if (finalRecipients.length === 0) {
      try {
        let studentQuery = 'SELECT s.id, s.name, s.parent_email, s.parent_phone, s.bus_id, s.route_id FROM students s WHERE 1=1';
        const qParams = [];
        if (route_id) {
          qParams.push(route_id);
          studentQuery += ` AND s.route_id = $${qParams.length}`;
        }
        if (bus_id) {
          qParams.push(bus_id);
          studentQuery += ` AND s.bus_id = $${qParams.length}`;
        }
        const stuRes = await db.query(studentQuery, qParams);
        if (stuRes.rows && stuRes.rows.length > 0) {
          finalRecipients = stuRes.rows.map((st) => ({
            recipient_id: st.id,
            role: 'PARENT',
            name: `${st.name}'s Guardian`,
            email: st.parent_email || 'parent@vsb.ac.in',
            phone: st.parent_phone || '+919876543210',
            channels: { email: true, sms: priority === 'CRITICAL', push: true, in_app: true }
          }));
        }
      } catch (err) {
        console.warn('[NOTIFICATION_CONTROLLER] Bulk query fallback:', err.message);
      }
    }

    if (finalRecipients.length === 0) {
      finalRecipients.push({
        recipient_id: 'USR-ADM-001',
        role: 'ADMIN',
        email: 'transport@vsb.ac.in',
        phone: '+919443123456',
        channels: { email: true, sms: false, push: true, in_app: true }
      });
    }

    const createdNotif = await notificationService.createNotification(
      event_type,
      title,
      message,
      priority,
      finalRecipients
    );

    const dispatchResult = await notificationService.sendNotification(createdNotif.id, {
      title,
      message,
      priority,
      event_type,
      route_id,
      bus_id
    });

    res.status(201).json({
      success: true,
      message: `Bulk notification sent to ${finalRecipients.length} recipients`,
      notification: createdNotif,
      delivery: dispatchResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. ACKNOWLEDGE NOTIFICATION
 * POST /api/notifications/:id/acknowledge
 */
exports.acknowledgeNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipientId = req.body.recipient_id || req.user?.id || 'USR-ADM-001';

    try {
      await db.query(
        `UPDATE notification_recipients 
         SET delivery_status = 'ACKNOWLEDGED', acknowledged_at = NOW() 
         WHERE notification_id = $1 AND (recipient_id = $2 OR $2 = 'USR-ADM-001')`,
        [id, recipientId]
      );
      await db.query(
        `UPDATE notifications SET status = 'ACKNOWLEDGED', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      await notificationService.logAudit(id, recipientId, 'IN_APP', 'ACKNOWLEDGED', 'User acknowledged alert');
    } catch (err) {
      console.warn('[NOTIFICATION_CONTROLLER] Acknowledge fallback:', err.message);
    }

    res.json({
      success: true,
      message: 'Notification acknowledged successfully',
      notificationId: id,
      acknowledged_by: recipientId
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. DELETE NOTIFICATION
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      await db.query('DELETE FROM notification_recipients WHERE notification_id = $1', [id]);
      await db.query('DELETE FROM notification_audit_log WHERE notification_id = $1', [id]);
      await db.query('DELETE FROM notifications WHERE id = $1', [id]);
    } catch (err) {
      console.warn('[NOTIFICATION_CONTROLLER] Delete fallback:', err.message);
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. RETRY FAILED NOTIFICATION
 * POST /api/notifications/:id/retry
 */
exports.retryNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const retryResult = await notificationService.sendNotification(id, { is_retry: true });

    await notificationService.logAudit(
      id,
      req.user?.id || 'SYSTEM',
      'SYSTEM',
      'RETRIED',
      'Manual notification retry triggered'
    );

    res.json({
      success: true,
      message: 'Notification retry initiated',
      result: retryResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. GET USER PREFERENCES
 * GET /api/notifications/preferences
 * GET /api/notifications/preferences/:userId
 */
exports.getUserPreferences = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id || 'USR-ADM-001';
    const preferences = await notificationService.getUserPreferences(userId);

    res.json({
      success: true,
      preferences
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. UPDATE USER PREFERENCES
 * PUT /api/notifications/preferences
 * PUT /api/notifications/preferences/:userId
 */
exports.updateUserPreferences = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id || 'USR-ADM-001';
    const updated = await notificationService.updateUserPreferences(userId, req.body);

    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. LIST ALERT RULES
 * GET /api/notifications/rules
 */
exports.listAlertRules = async (req, res, next) => {
  try {
    const rulesRes = await db.query('SELECT * FROM alert_rules ORDER BY created_at DESC');
    const rules = rulesRes.rows || [];

    res.json({
      success: true,
      count: rules.length,
      alert_rules: rules,
      rules
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 11. CREATE ALERT RULE
 * POST /api/notifications/rules
 */
exports.createAlertRule = async (req, res, next) => {
  try {
    const {
      rule_name,
      event_type,
      condition_json = {},
      priority = 'MEDIUM',
      recipients_query = 'ALL_INVOLVED',
      recipients_json,
      actions,
      channels_json,
      enabled = true
    } = req.body;

    if (!rule_name || !event_type) {
      return res.status(400).json({ success: false, error: 'rule_name and event_type are required' });
    }

    const resolvedActions = actions || channels_json || { email: true, sms: false, push: true, in_app: true };
    const resolvedRecipients = recipients_query || (typeof recipients_json === 'string' ? recipients_json : JSON.stringify(recipients_json || 'ALL_INVOLVED'));

    const resDb = await db.query(
      `INSERT INTO alert_rules (
        rule_name, event_type, condition_json, priority, recipients_query, actions, enabled, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [
        rule_name,
        event_type,
        typeof condition_json === 'string' ? condition_json : JSON.stringify(condition_json),
        priority,
        resolvedRecipients,
        typeof resolvedActions === 'string' ? resolvedActions : JSON.stringify(resolvedActions),
        enabled
      ]
    );

    const createdRule = resDb.rows ? resDb.rows[0] : req.body;

    res.status(201).json({
      success: true,
      message: 'Alert rule created',
      alert_rule: createdRule,
      rule: createdRule
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 12. UPDATE ALERT RULE
 * PUT /api/notifications/rules/:id
 */
exports.updateAlertRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      rule_name,
      event_type,
      condition_json,
      priority,
      recipients_query,
      recipients_json,
      actions,
      channels_json,
      enabled
    } = req.body;

    const existingRes = await db.query('SELECT * FROM alert_rules WHERE id = $1', [id]);
    if (!existingRes.rows || existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Alert rule not found' });
    }
    const cur = existingRes.rows[0];

    const updated = {
      rule_name: rule_name !== undefined ? rule_name : cur.rule_name,
      event_type: event_type !== undefined ? event_type : cur.event_type,
      condition_json: condition_json !== undefined
        ? (typeof condition_json === 'string' ? condition_json : JSON.stringify(condition_json))
        : cur.condition_json,
      priority: priority !== undefined ? priority : cur.priority,
      recipients_query: recipients_query !== undefined
        ? recipients_query
        : (recipients_json !== undefined ? (typeof recipients_json === 'string' ? recipients_json : JSON.stringify(recipients_json)) : cur.recipients_query),
      actions: actions !== undefined
        ? (typeof actions === 'string' ? actions : JSON.stringify(actions))
        : (channels_json !== undefined ? (typeof channels_json === 'string' ? channels_json : JSON.stringify(channels_json)) : cur.actions),
      enabled: enabled !== undefined ? enabled : cur.enabled
    };

    const resDb = await db.query(
      `UPDATE alert_rules SET
        rule_name = $1, event_type = $2, condition_json = $3, priority = $4,
        recipients_query = $5, actions = $6, enabled = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [
        updated.rule_name,
        updated.event_type,
        updated.condition_json,
        updated.priority,
        updated.recipients_query,
        updated.actions,
        updated.enabled,
        id
      ]
    );

    const saved = resDb.rows ? resDb.rows[0] : updated;

    res.json({
      success: true,
      message: 'Alert rule updated',
      alert_rule: saved,
      rule: saved
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 13. DELETE ALERT RULE
 * DELETE /api/notifications/rules/:id
 */
exports.deleteAlertRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM alert_rules WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Alert rule deleted'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 14. TEST ALERT RULE EVALUATION
 * POST /api/notifications/rules/:id/test
 * POST /api/notifications/rules/test
 */
exports.testAlertRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const testData = req.body.event_data || req.body || {};
    let rule = null;

    if (id && id !== 'test') {
      const ruleRes = await db.query('SELECT * FROM alert_rules WHERE id = $1', [id]);
      if (ruleRes.rows && ruleRes.rows.length > 0) {
        rule = ruleRes.rows[0];
      }
    } else if (req.body.rule) {
      rule = req.body.rule;
    }

    if (rule) {
      const condition = typeof rule.condition_json === 'string'
        ? JSON.parse(rule.condition_json || '{}')
        : (rule.condition_json || {});

      const matches = alertRulesService.matchesCondition(condition, testData);
      const priority = alertRulesService.determinePriority(rule.event_type, testData, rule.priority);
      const recipients = await alertRulesService.getRecipientsForRule(rule.recipients_query || rule.recipients_json, testData);

      return res.json({
        success: true,
        rule_name: rule.rule_name,
        triggered: matches,
        evaluated_condition: condition,
        sample_data: testData,
        computed_priority: priority,
        resolved_recipients_count: recipients.length,
        sample_recipients: recipients.slice(0, 3)
      });
    }

    // Evaluate against all active rules matching event_type
    const eventType = req.body.event_type || 'EMERGENCY_SOS';
    const alerts = await alertRulesService.evaluateRulesForEvent(eventType, testData);

    return res.json({
      success: true,
      event_type: eventType,
      sample_data: testData,
      matched_rules_count: alerts.length,
      matched_rules: alerts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 15. LIST TEMPLATES
 * GET /api/notifications/templates
 */
exports.listTemplates = async (req, res, next) => {
  try {
    const resDb = await db.query('SELECT * FROM notification_templates ORDER BY created_at DESC');
    res.json({
      success: true,
      count: resDb.rows ? resDb.rows.length : 0,
      templates: resDb.rows || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 16. CREATE TEMPLATE
 * POST /api/notifications/templates
 */
exports.createTemplate = async (req, res, next) => {
  try {
    const {
      template_name,
      event_type,
      subject_template,
      email_template,
      sms_template,
      push_title,
      push_body
    } = req.body;

    if (!template_name || !event_type) {
      return res.status(400).json({ success: false, error: 'template_name and event_type are required' });
    }

    const resDb = await db.query(
      `INSERT INTO notification_templates (
        template_name, event_type, subject_template, email_template, sms_template, push_title, push_body, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
      [template_name, event_type, subject_template, email_template, sms_template, push_title, push_body]
    );

    res.status(201).json({
      success: true,
      message: 'Template created',
      template: resDb.rows ? resDb.rows[0] : req.body
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 17. UPDATE TEMPLATE
 * PUT /api/notifications/templates/:id
 */
exports.updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      template_name,
      event_type,
      subject_template,
      email_template,
      sms_template,
      push_title,
      push_body
    } = req.body;

    const resDb = await db.query(
      `UPDATE notification_templates SET
        template_name = COALESCE($1, template_name),
        event_type = COALESCE($2, event_type),
        subject_template = COALESCE($3, subject_template),
        email_template = COALESCE($4, email_template),
        sms_template = COALESCE($5, sms_template),
        push_title = COALESCE($6, push_title),
        push_body = COALESCE($7, push_body),
        updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [template_name, event_type, subject_template, email_template, sms_template, push_title, push_body, id]
    );

    res.json({
      success: true,
      message: 'Template updated',
      template: resDb.rows ? resDb.rows[0] : req.body
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 18. DELETE TEMPLATE
 * DELETE /api/notifications/templates/:id
 */
exports.deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM notification_templates WHERE id = $1', [id]);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * 19. AUDIT HISTORY
 * GET /api/notifications/audit
 */
exports.getAuditHistory = async (req, res, next) => {
  try {
    const { notification_id, channel, status, limit = 100 } = req.query;

    let query = 'SELECT * FROM notification_audit_log WHERE 1=1';
    const params = [];

    if (notification_id) {
      params.push(notification_id);
      query += ` AND notification_id = $${params.length}`;
    }
    if (channel && channel !== 'ALL') {
      params.push(channel);
      query += ` AND channel = $${params.length}`;
    }
    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY timestamp DESC';

    const resDb = await db.query(query, params);
    const logs = (resDb.rows || []).slice(0, Number(limit));

    res.json({
      success: true,
      count: logs.length,
      audit_logs: logs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 20. GET NOTIFICATION STATS & METRICS
 * GET /api/notifications/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const notifs = (await db.query('SELECT * FROM notifications')).rows || [];
    const audit = (await db.query('SELECT * FROM notification_audit_log')).rows || [];

    const total = notifs.length;
    const sent = notifs.filter((n) => n.status === 'SENT').length;
    const pending = notifs.filter((n) => n.status === 'PENDING').length;
    const acknowledged = notifs.filter((n) => n.status === 'ACKNOWLEDGED').length;
    const critical = notifs.filter((n) => n.priority === 'CRITICAL').length;

    // Channel delivery breakdown from audit
    const channelStats = {
      email: { sent: 0, failed: 0, skipped: 0 },
      sms: { sent: 0, failed: 0, skipped: 0 },
      push: { sent: 0, failed: 0, skipped: 0 },
      in_app: { sent: 0, failed: 0, skipped: 0 }
    };

    for (const log of audit) {
      const ch = (log.channel || '').toLowerCase();
      if (channelStats[ch]) {
        if (log.status === 'DELIVERED') channelStats[ch].sent++;
        else if (log.status === 'FAILED') channelStats[ch].failed++;
        else if (log.status === 'SKIPPED') channelStats[ch].skipped++;
      }
    }

    const deliveryRate = total > 0 ? Math.round(((sent + acknowledged) / total) * 100) : 100;

    res.json({
      success: true,
      stats: {
        total,
        sent,
        pending,
        acknowledged,
        critical,
        deliveryRate,
        channelStats
      }
    });
  } catch (err) {
    next(err);
  }
};
