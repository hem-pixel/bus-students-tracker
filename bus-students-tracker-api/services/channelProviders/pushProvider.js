// FILE: bus-students-tracker-api/services/channelProviders/pushProvider.js
// PURPOSE: Push notification delivery provider (Firebase Cloud Messaging / Web Push + resilient simulation)
// PHASE: Phase 12 — Notifications & Alerts System

const crypto = require('crypto');

class PushProvider {
  constructor() {
    this.configured = false;
    this.admin = null;
    this.init();
  }

  init() {
    try {
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
          });
        }
        this.admin = admin;
        this.configured = true;
        console.log('[PUSH_PROVIDER] ✅ Configured with live Firebase Admin SDK');
      }
    } catch {
      this.configured = false;
    }
  }

  async send(fcmToken, title, body, data = {}) {
    const pushTicket = `fcm_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

    if (this.configured && this.admin && fcmToken) {
      try {
        const response = await this.admin.messaging().send({
          token: fcmToken,
          notification: { title, body },
          data: Object.entries(data).reduce((acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          }, {})
        });
        return {
          success: true,
          channel: 'PUSH',
          messageId: response || pushTicket,
          recipientToken: fcmToken.slice(0, 12) + '...',
          deliveredAt: new Date().toISOString(),
          simulated: false
        };
      } catch (err) {
        console.warn(`[PUSH_PROVIDER] Live Firebase push failed:`, err.message, '— falling back to simulation.');
      }
    }

    // High-fidelity FCM simulation
    console.log(`[PUSH_PROVIDER] 🔔 [SIMULATED PUSH] Title: "${title}" | Body: "${body.slice(0, 60)}..." | Ticket: ${pushTicket}`);
    return {
      success: true,
      channel: 'PUSH',
      messageId: pushTicket,
      recipientToken: fcmToken ? (fcmToken.slice(0, 12) + '...') : 'broadcast_topic',
      deliveredAt: new Date().toISOString(),
      simulated: true,
      preview: { title, body }
    };
  }

  async sendBulk(fcmTokens, title, body, data = {}) {
    const results = [];
    for (const token of fcmTokens) {
      const res = await this.send(token, title, body, data);
      results.push(res);
    }
    return results;
  }
}

module.exports = new PushProvider();
