// FILE: bus-students-tracker-api/services/channelProviders/inAppProvider.js
// PURPOSE: In-App notification provider with Socket.io real-time broadcast integration
// PHASE: Phase 12 — Notifications & Alerts System

const crypto = require('crypto');
const websocketService = require('../websocketService');

class InAppProvider {
  async create(userId, title, message, type = 'SYSTEM_ALERT', priority = 'MEDIUM', meta = {}) {
    const notificationId = `inapp_${crypto.randomUUID().slice(0, 12)}`;
    const payload = {
      id: notificationId,
      user_id: userId,
      type,
      title,
      message,
      priority,
      read: false,
      meta,
      created_at: new Date().toISOString()
    };

    // Real-time broadcast via WebSocket
    try {
      if (websocketService && websocketService.io) {
        // Broadcast to general notification room and user-targeted room
        websocketService.io.emit('notification:new', payload);
        if (userId) {
          websocketService.io.to(`user:${userId}`).emit('notification:personal', payload);
        }
      }
    } catch (wsErr) {
      console.warn('[IN_APP_PROVIDER] WebSocket broadcast error:', wsErr.message);
    }

    console.log(`[IN_APP_PROVIDER] 💬 [IN-APP STORED] User: ${userId || 'ALL'} | ${type} | "${title}"`);
    return {
      success: true,
      channel: 'IN_APP',
      messageId: notificationId,
      deliveredAt: new Date().toISOString(),
      payload
    };
  }

  async markAsRead(notificationId) {
    if (websocketService && websocketService.io) {
      websocketService.io.emit('notification:read', { id: notificationId, read_at: new Date().toISOString() });
    }
    return { success: true, notificationId, read_at: new Date().toISOString() };
  }
}

module.exports = new InAppProvider();
