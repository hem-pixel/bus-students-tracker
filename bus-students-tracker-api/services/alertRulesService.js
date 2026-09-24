// FILE: bus-students-tracker-api/services/alertRulesService.js
// PURPOSE: Alert rules evaluation, condition checking, and recipient resolution engine
// PHASE: Phase 12 — Notifications & Alerts System

const db = require('../config/database');

class AlertRulesService {
  /**
   * Get all active alert rules for an event type
   */
  async getRulesForEventType(eventType) {
    try {
      const res = await db.query(
        `SELECT * FROM alert_rules WHERE enabled = true AND (event_type = $1 OR event_type = 'ALL')`,
        [eventType]
      );
      return res.rows || [];
    } catch (err) {
      console.warn('[ALERT_RULES] Error fetching rules for event:', err.message);
      return [];
    }
  }

  /**
   * Evaluate conditions in JSON against event data
   * Condition structure example: { "delay_minutes": { "gte": 15 }, "severity": "HIGH" }
   */
  matchesCondition(condition, data) {
    if (!condition || Object.keys(condition).length === 0) return true;

    for (const [key, expected] of Object.entries(condition)) {
      const actual = data[key];

      if (expected === null || expected === undefined) continue;

      if (typeof expected === 'object' && !Array.isArray(expected)) {
        if (expected.gte !== undefined && Number(actual) < Number(expected.gte)) return false;
        if (expected.gt !== undefined && Number(actual) <= Number(expected.gt)) return false;
        if (expected.lte !== undefined && Number(actual) > Number(expected.lte)) return false;
        if (expected.lt !== undefined && Number(actual) >= Number(expected.lt)) return false;
        if (expected.eq !== undefined && actual !== expected.eq) return false;
        if (expected.neq !== undefined && actual === expected.neq) return false;
        if (expected.in !== undefined && Array.isArray(expected.in) && !expected.in.includes(actual)) return false;
      } else {
        if (String(actual).toUpperCase() !== String(expected).toUpperCase()) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Determine priority based on event characteristics or rule override
   */
  determinePriority(eventType, eventData, rulePriority) {
    if (rulePriority) return rulePriority;
    
    if (eventType === 'WRONG_STOP' || eventType === 'EMERGENCY' || eventType === 'ACCIDENT') {
      return 'CRITICAL';
    }
    if (eventType === 'GEOFENCE_VIOLATION' || eventType === 'ROUTE_DEVIATION') {
      return 'HIGH';
    }
    if (eventType === 'DELAY') {
      const mins = Number(eventData.delay_minutes || 0);
      return mins > 20 ? 'HIGH' : mins > 10 ? 'MEDIUM' : 'LOW';
    }
    if (eventType === 'BOARDING') {
      return eventData.status === 'VERIFIED' ? 'LOW' : 'HIGH';
    }
    return 'MEDIUM';
  }

  /**
   * Resolve recipient entities based on rule recipients_query
   */
  async getRecipientsForRule(recipientsQuery, eventData = {}) {
    const recipients = [];

    // Helper: query users from database or mock
    const queryUsers = async (roleFilter) => {
      try {
        let sql = `SELECT id, name, email, phone, role FROM users`;
        const params = [];
        if (roleFilter && roleFilter.length > 0) {
          sql += ` WHERE role = ANY($1)`;
          params.push(roleFilter);
        }
        const res = await db.query(sql, params);
        return res.rows || [];
      } catch (err) {
        console.warn('[ALERT_RULES] Fallback users lookup:', err.message);
        return [];
      }
    };

    switch (recipientsQuery) {
      case 'ADMIN_ONLY': {
        const admins = await queryUsers(['ADMIN', 'SUPER_ADMIN']);
        if (admins.length) recipients.push(...admins);
        else {
          recipients.push({
            id: 'u-admin-1',
            name: 'Transport Administrator',
            email: 'transport-admin@vsb.ac.in',
            phone: '+919842400001',
            role: 'ADMIN'
          });
        }
        break;
      }

      case 'STAFF_AND_ADMIN': {
        const staffAndAdmins = await queryUsers(['ADMIN', 'STAFF', 'INCHARGE']);
        if (staffAndAdmins.length) recipients.push(...staffAndAdmins);
        else {
          recipients.push(
            { id: 'u-admin-1', name: 'Transport Admin', email: 'transport-admin@vsb.ac.in', phone: '+919842400001', role: 'ADMIN' },
            { id: 'u-staff-1', name: 'Discipline Officer', email: 'transport-desk@vsb.ac.in', phone: '+919842400002', role: 'STAFF' }
          );
        }
        break;
      }

      case 'PARENTS_ONLY': {
        if (eventData.parent_email || eventData.parent_phone) {
          recipients.push({
            id: eventData.parent_id || 'parent-' + (eventData.student_id || 'guest'),
            name: eventData.parent_name || 'Parent/Guardian',
            email: eventData.parent_email || 'parent.alerts@vsb.ac.in',
            phone: eventData.parent_phone || '+919443311111',
            role: 'PARENT'
          });
        } else {
          recipients.push({
            id: 'u-parent-mock',
            name: 'Parent / Guardian',
            email: 'parent.notification@vsb.ac.in',
            phone: '+919443322222',
            role: 'PARENT'
          });
        }
        break;
      }

      case 'ALL_INVOLVED':
      default: {
        // Admin
        recipients.push({
          id: 'u-admin-1',
          name: 'Transport Admin',
          email: 'transport-admin@vsb.ac.in',
          phone: '+919842400001',
          role: 'ADMIN'
        });
        // Parent
        if (eventData.parent_email || eventData.parent_phone) {
          recipients.push({
            id: eventData.parent_id || 'parent-' + (eventData.student_id || 'guest'),
            name: eventData.parent_name || 'Parent',
            email: eventData.parent_email,
            phone: eventData.parent_phone,
            role: 'PARENT'
          });
        }
        // Driver
        if (eventData.driver_phone) {
          recipients.push({
            id: eventData.driver_id || 'driver-' + (eventData.bus_number || '1'),
            name: eventData.driver_name || 'Bus Driver',
            phone: eventData.driver_phone,
            email: eventData.driver_email || 'driver@vsb.ac.in',
            role: 'DRIVER'
          });
        }
        break;
      }
    }

    return recipients;
  }

  /**
   * Evaluate all matching rules for an incoming event and return structured alerts
   */
  async evaluateRulesForEvent(eventType, eventData) {
    const rules = await this.getRulesForEventType(eventType);
    const triggeredAlerts = [];

    for (const rule of rules) {
      const cond = typeof rule.condition_json === 'string' 
        ? JSON.parse(rule.condition_json || '{}') 
        : (rule.condition_json || {});

      if (this.matchesCondition(cond, eventData)) {
        const priority = this.determinePriority(eventType, eventData, rule.priority);
        const recipients = await this.getRecipientsForRule(rule.recipients_query, eventData);
        const actions = typeof rule.actions === 'string'
          ? JSON.parse(rule.actions || '{}')
          : (rule.actions || { in_app: true, email: true });

        triggeredAlerts.push({
          rule_id: rule.id,
          rule_name: rule.rule_name,
          event_type: eventType,
          priority,
          actions,
          recipients,
          eventData
        });
      }
    }

    return triggeredAlerts;
  }
}

module.exports = new AlertRulesService();
