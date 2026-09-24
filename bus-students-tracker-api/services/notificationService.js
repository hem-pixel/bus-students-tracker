// FILE: bus-students-tracker-api/services/notificationService.js
// PURPOSE: Multi-channel alert delivery, template engine, user preference enforcement, and audit service
// PHASE: Phase 12 — Notifications & Alerts System

const crypto = require('crypto');
const db = require('../config/database');
const emailProvider = require('./channelProviders/emailProvider');
const smsProvider = require('./channelProviders/smsProvider');
const pushProvider = require('./channelProviders/pushProvider');
const inAppProvider = require('./channelProviders/inAppProvider');
const alertRulesService = require('./alertRulesService');

class NotificationService {
  constructor() {
    this.emailProvider = emailProvider;
    this.smsProvider = smsProvider;
    this.pushProvider = pushProvider;
    this.inAppProvider = inAppProvider;
  }

  /**
   * Interpolate template strings with variables
   */
  interpolate(templateStr, data = {}) {
    if (!templateStr) return '';
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return data[key] !== undefined && data[key] !== null ? data[key] : `[${key}]`;
    });
  }

  /**
   * Check if current time falls within user's quiet hours
   */
  isInQuietHours(startStr, endStr) {
    if (!startStr || !endStr) return false;
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        // Overnight quiet hours (e.g., 22:00 to 06:00)
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    } catch {
      return false;
    }
  }

  /**
   * Retrieve notification preferences for a user
   */
  async getUserPreferences(userId) {
    if (!userId) {
      return {
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        boarding_alerts: true,
        geofence_alerts: true,
        wrong_stop_alerts: true,
        delay_alerts: true,
        daily_digest: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '06:00'
      };
    }

    try {
      const res = await db.query(
        `SELECT * FROM notification_preferences WHERE user_id = $1`,
        [userId]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Fetch preferences fallback:', err.message);
    }

    return {
      user_id: userId,
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      boarding_alerts: true,
      geofence_alerts: true,
      wrong_stop_alerts: true,
      delay_alerts: true,
      daily_digest: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '06:00'
    };
  }

  /**
   * Save or update notification preferences for a user
   */
  async updateUserPreferences(userId, prefs = {}) {
    const existing = await this.getUserPreferences(userId);
    const updated = {
      ...existing,
      ...prefs,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    try {
      const checkRes = await db.query(
        `SELECT id FROM notification_preferences WHERE user_id = $1`,
        [userId]
      );

      if (checkRes.rows && checkRes.rows.length > 0) {
        await db.query(
          `UPDATE notification_preferences SET 
            email_enabled = $1, sms_enabled = $2, push_enabled = $3, in_app_enabled = $4,
            boarding_alerts = $5, geofence_alerts = $6, wrong_stop_alerts = $7, delay_alerts = $8,
            daily_digest = $9, digest_time = $10, quiet_hours_start = $11, quiet_hours_end = $12,
            updated_at = NOW()
           WHERE user_id = $13`,
          [
            updated.email_enabled, updated.sms_enabled, updated.push_enabled, updated.in_app_enabled,
            updated.boarding_alerts, updated.geofence_alerts, updated.wrong_stop_alerts, updated.delay_alerts,
            updated.daily_digest, updated.digest_time || '09:00', updated.quiet_hours_start || '22:00', updated.quiet_hours_end || '06:00',
            userId
          ]
        );
      } else {
        await db.query(
          `INSERT INTO notification_preferences (
            user_id, email_enabled, sms_enabled, push_enabled, in_app_enabled,
            boarding_alerts, geofence_alerts, wrong_stop_alerts, delay_alerts,
            daily_digest, digest_time, quiet_hours_start, quiet_hours_end
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            userId, updated.email_enabled, updated.sms_enabled, updated.push_enabled, updated.in_app_enabled,
            updated.boarding_alerts, updated.geofence_alerts, updated.wrong_stop_alerts, updated.delay_alerts,
            updated.daily_digest, updated.digest_time || '09:00', updated.quiet_hours_start || '22:00', updated.quiet_hours_end || '06:00'
          ]
        );
      }
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Preferences update fallback:', err.message);
    }

    return updated;
  }

  /**
   * Log an audit trail entry
   */
  async logAudit(notificationId, recipientId, channel, status, message, errorDetails = null) {
    try {
      await db.query(
        `INSERT INTO notification_audit_log (
          notification_id, recipient_id, channel, status, message, error_details, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [notificationId, recipientId, channel, status, message, errorDetails]
      );
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Audit log fallback:', err.message);
    }
  }

  /**
   * Fetch matching template for event type
   */
  async getTemplate(eventType) {
    try {
      const res = await db.query(
        `SELECT * FROM notification_templates WHERE event_type = $1 ORDER BY updated_at DESC LIMIT 1`,
        [eventType]
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Get template fallback:', err.message);
    }

    // Default template fallbacks
    const defaults = {
      BOARDING: {
        template_name: 'STUDENT_BOARDING_ALERT',
        subject_template: 'Student Boarding: {{student_name}} boarded Bus {{bus_number}}',
        email_template: '<div style="font-family:sans-serif;padding:16px;"><h2>VSB Transport Notification</h2><p>Student <b>{{student_name}}</b> boarded bus <b>{{bus_number}}</b> at <b>{{stop_name}}</b> at {{time}}.</p><p>ETA: {{eta}}</p></div>',
        sms_template: 'VSB Transport: {{student_name}} boarded at {{stop_name}} on Bus {{bus_number}}. ETA: {{eta}}.',
        push_title: 'Student Boarded: {{student_name}}',
        push_body: 'Boarded Bus {{bus_number}} at {{stop_name}} (ETA: {{eta}})'
      },
      WRONG_STOP: {
        template_name: 'WRONG_STOP_ALERT',
        subject_template: 'CRITICAL: {{student_name}} detected at wrong stop {{detected_stop}}',
        email_template: '<div style="font-family:sans-serif;padding:16px;border-left:4px solid #ef4444;"><h2>ALERT: Wrong Stop Detected</h2><p>Student <b>{{student_name}}</b> was detected at <b>{{detected_stop}}</b> instead of assigned stop <b>{{assigned_stop}}</b>.</p></div>',
        sms_template: 'ALERT: {{student_name}} at WRONG STOP {{detected_stop}}. Assigned: {{assigned_stop}}. Contact transport desk immediately.',
        push_title: '⚠️ Wrong Stop: {{student_name}}',
        push_body: 'Detected at {{detected_stop}} instead of {{assigned_stop}}'
      },
      GEOFENCE_VIOLATION: {
        template_name: 'GEOFENCE_ALERT',
        subject_template: 'Geofence Alert: Bus {{bus_number}} route boundary deviation',
        email_template: '<div style="font-family:sans-serif;padding:16px;"><h2>Geofence Deviation</h2><p>Bus <b>{{bus_number}}</b> exited corridor boundary at {{time}} near {{current_location}}.</p></div>',
        sms_template: 'VSB Alert: Bus {{bus_number}} geofence boundary deviation reported near {{current_location}}.',
        push_title: 'Geofence Deviation',
        push_body: 'Bus {{bus_number}} deviated near {{current_location}}'
      },
      DELAY: {
        template_name: 'ROUTE_DELAY_ALERT',
        subject_template: 'Transit Update: Bus {{bus_number}} delayed by {{delay_minutes}} mins',
        email_template: '<div style="font-family:sans-serif;padding:16px;"><h2>Bus Delay Update</h2><p>Bus <b>{{bus_number}}</b> on route {{route_name}} is running <b>{{delay_minutes}} minutes</b> late due to {{delay_reason}}.</p><p>Updated ETA: {{new_eta}}</p></div>',
        sms_template: 'Bus {{bus_number}} running {{delay_minutes}}m late. Next stop: {{next_stop}}. New ETA: {{new_eta}}.',
        push_title: 'Bus {{bus_number}} Delayed ({{delay_minutes}}m)',
        push_body: 'Next stop: {{next_stop}} | ETA: {{new_eta}}'
      }
    };

    return defaults[eventType] || {
      template_name: 'SYSTEM_NOTIFICATION',
      subject_template: 'VSB Transport Alert: {{title}}',
      email_template: '<p>{{message}}</p>',
      sms_template: 'VSB Alert: {{message}}',
      push_title: '{{title}}',
      push_body: '{{message}}'
    };
  }

  /**
   * Create notification record with recipients in database
   */
  async createNotification(eventType, title, message, priority = 'MEDIUM', recipients = [], eventId = null) {
    let notificationId = null;

    try {
      const res = await db.query(
        `INSERT INTO notifications (
          notification_type, event_id, event_type, title, message, priority, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW(), NOW()) RETURNING *`,
        [eventType, eventId, eventType, title, message, priority]
      );
      if (res.rows && res.rows[0]) {
        notificationId = res.rows[0].id;
      }
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Create notification DB fallback:', err.message);
      notificationId = `notif_${crypto.randomUUID().slice(0, 10)}`;
    }

    // Insert recipients
    const storedRecipients = [];
    for (const r of recipients) {
      const recipientId = r.id || r.recipient_id || `rec_${crypto.randomUUID().slice(0, 8)}`;
      const channels = r.channels || { email: true, sms: false, push: true, in_app: true };

      try {
        const recRes = await db.query(
          `INSERT INTO notification_recipients (
            notification_id, recipient_id, recipient_role, email, phone, channels, delivery_status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW()) RETURNING *`,
          [notificationId, recipientId, r.role || 'PARENT', r.email, r.phone, JSON.stringify(channels)]
        );
        if (recRes.rows && recRes.rows[0]) {
          storedRecipients.push(recRes.rows[0]);
        }
      } catch (rErr) {
        storedRecipients.push({
          id: `rec_${crypto.randomUUID().slice(0, 8)}`,
          notification_id: notificationId,
          recipient_id: recipientId,
          recipient_role: r.role || 'PARENT',
          email: r.email,
          phone: r.phone,
          channels,
          delivery_status: 'PENDING'
        });
      }
    }

    return {
      id: notificationId,
      notification_type: eventType,
      event_type: eventType,
      event_id: eventId,
      title,
      message,
      priority,
      status: 'PENDING',
      recipients: storedRecipients
    };
  }

  /**
   * Dispatch notification to all channels according to user preferences and quiet hours
   */
  async sendNotification(notificationId, contextData = {}) {
    // 1. Fetch notification
    let notification = null;
    try {
      const res = await db.query(`SELECT * FROM notifications WHERE id = $1`, [notificationId]);
      if (res.rows && res.rows.length > 0) {
        notification = res.rows[0];
      }
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Fetch notification fallback:', err.message);
    }

    if (!notification) {
      notification = {
        id: notificationId,
        title: contextData.title || 'VSB Transport Notification',
        message: contextData.message || 'Notification content',
        priority: contextData.priority || 'MEDIUM',
        event_type: contextData.event_type || 'SYSTEM'
      };
    }

    // 2. Fetch recipients
    let recipients = [];
    try {
      const recRes = await db.query(`SELECT * FROM notification_recipients WHERE notification_id = $1`, [notificationId]);
      if (recRes.rows && recRes.rows.length > 0) {
        recipients = recRes.rows;
      }
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Fetch recipients fallback:', err.message);
    }

    if (recipients.length === 0 && contextData.recipients) {
      recipients = contextData.recipients;
    }

    // 3. Fetch template
    const template = await this.getTemplate(notification.event_type || notification.notification_type);

    const deliveryResults = [];
    let overallSuccess = true;

    for (const recipient of recipients) {
      const userId = recipient.recipient_id;
      const prefs = await this.getUserPreferences(userId);
      const isCritical = notification.priority === 'CRITICAL';
      const inQuietHours = this.isInQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end);

      // Interpolate templates for this recipient
      const mergedData = {
        ...contextData,
        recipient_name: recipient.name || 'Valued User',
        title: notification.title,
        message: notification.message
      };

      const emailSubject = this.interpolate(template.subject_template || notification.title, mergedData);
      const emailBody = this.interpolate(template.email_template || notification.message, mergedData);
      const smsBody = this.interpolate(template.sms_template || notification.message, mergedData);
      const pushTitle = this.interpolate(template.push_title || notification.title, mergedData);
      const pushBody = this.interpolate(template.push_body || notification.message, mergedData);

      const recipientChannels = typeof recipient.channels === 'string'
        ? JSON.parse(recipient.channels || '{}')
        : (recipient.channels || { email: true, in_app: true });

      const channelsDispatched = {};

      // In-App channel (always delivered immediately)
      if (recipientChannels.in_app !== false && prefs.in_app_enabled !== false) {
        try {
          const inAppRes = await this.inAppProvider.create(
            userId,
            pushTitle,
            pushBody,
            notification.event_type,
            notification.priority,
            mergedData
          );
          channelsDispatched.in_app = inAppRes;
          await this.logAudit(notificationId, userId, 'IN_APP', 'DELIVERED', pushTitle);
        } catch (inAppErr) {
          channelsDispatched.in_app = { success: false, error: inAppErr.message };
          await this.logAudit(notificationId, userId, 'IN_APP', 'FAILED', inAppErr.message);
        }
      }

      // Email channel
      if (recipient.email && recipientChannels.email !== false && prefs.email_enabled !== false) {
        if (!inQuietHours || isCritical) {
          try {
            const emailRes = await this.emailProvider.send(recipient.email, emailSubject, emailBody);
            channelsDispatched.email = emailRes;
            await this.logAudit(notificationId, userId, 'EMAIL', 'DELIVERED', emailSubject);
          } catch (eErr) {
            channelsDispatched.email = { success: false, error: eErr.message };
            await this.logAudit(notificationId, userId, 'EMAIL', 'FAILED', eErr.message);
          }
        } else {
          channelsDispatched.email = { skipped: true, reason: 'QUIET_HOURS' };
          await this.logAudit(notificationId, userId, 'EMAIL', 'SKIPPED', 'Quiet hours active');
        }
      }

      // SMS channel (critical alerts or if SMS enabled)
      if (recipient.phone && (recipientChannels.sms || isCritical) && prefs.sms_enabled !== false) {
        if (!inQuietHours || isCritical) {
          try {
            const smsRes = await this.smsProvider.send(recipient.phone, smsBody);
            channelsDispatched.sms = smsRes;
            await this.logAudit(notificationId, userId, 'SMS', 'DELIVERED', smsBody);
          } catch (sErr) {
            channelsDispatched.sms = { success: false, error: sErr.message };
            await this.logAudit(notificationId, userId, 'SMS', 'FAILED', sErr.message);
          }
        } else {
          channelsDispatched.sms = { skipped: true, reason: 'QUIET_HOURS' };
          await this.logAudit(notificationId, userId, 'SMS', 'SKIPPED', 'Quiet hours active');
        }
      }

      // Push channel
      if (recipientChannels.push !== false && prefs.push_enabled !== false) {
        if (!inQuietHours || isCritical) {
          try {
            const pushRes = await this.pushProvider.send(recipient.fcm_token, pushTitle, pushBody, {
              notificationId: String(notificationId),
              type: notification.event_type
            });
            channelsDispatched.push = pushRes;
            await this.logAudit(notificationId, userId, 'PUSH', 'DELIVERED', pushTitle);
          } catch (pErr) {
            channelsDispatched.push = { success: false, error: pErr.message };
            await this.logAudit(notificationId, userId, 'PUSH', 'FAILED', pErr.message);
          }
        } else {
          channelsDispatched.push = { skipped: true, reason: 'QUIET_HOURS' };
          await this.logAudit(notificationId, userId, 'PUSH', 'SKIPPED', 'Quiet hours active');
        }
      }

      deliveryResults.push({
        recipient_id: userId,
        channels: channelsDispatched
      });
    }

    // Update status in database
    const newStatus = overallSuccess ? 'SENT' : 'PARTIAL';
    try {
      await db.query(
        `UPDATE notifications SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, notificationId]
      );
      await db.query(
        `UPDATE notification_recipients SET delivery_status = 'DELIVERED', sent_at = NOW() WHERE notification_id = $1`,
        [notificationId]
      );
    } catch (err) {
      console.warn('[NOTIFICATION_SERVICE] Update status fallback:', err.message);
    }

    return {
      notification_id: notificationId,
      status: newStatus,
      dispatched_at: new Date().toISOString(),
      deliveries: deliveryResults
    };
  }

  /**
   * Evaluate event against alert rules, generate notifications, and deliver
   */
  async routeNotificationByRules(eventType, eventData) {
    const triggeredRules = await alertRulesService.evaluateRulesForEvent(eventType, eventData);
    const notificationsCreated = [];

    for (const rule of triggeredRules) {
      const template = await this.getTemplate(eventType);
      const title = this.interpolate(template.push_title || `${eventType} Alert`, eventData);
      const message = this.interpolate(template.sms_template || `System alert triggered for ${eventType}`, eventData);

      const notif = await this.createNotification(
        eventType,
        title,
        message,
        rule.priority,
        rule.recipients,
        eventData.event_id || eventData.id
      );

      const dispatchResult = await this.sendNotification(notif.id, {
        ...eventData,
        title,
        message,
        priority: rule.priority
      });

      notificationsCreated.push({
        rule_name: rule.rule_name,
        notification: notif,
        delivery: dispatchResult
      });
    }

    return notificationsCreated;
  }
}

module.exports = new NotificationService();
