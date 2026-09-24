// FILE: src/pages/admin/NotificationPreferences.jsx
// PURPOSE: Multi-channel delivery rules, category subscriptions, and quiet hours configuration (Phase 12)
// Institutional command center aesthetic with real-time preference persistence.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/apiService';
import {
  Sliders,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  ShieldAlert,
  Clock,
  Moon,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  RefreshCw,
  Info,
  Check,
  ChevronRight,
  Radio,
  Sparkles
} from 'lucide-react';

const CATEGORY_DEFINITIONS = [
  {
    id: 'SECURITY',
    label: 'Emergency SOS & Security Breaches',
    description: 'Driver SOS triggers, unauthorized route access, door tampering, and security breaches',
    icon: ShieldAlert,
    defaultMinPriority: 'HIGH'
  },
  {
    id: 'BOARDING',
    label: 'Wrong Bus & Wrong Stop Alerts',
    description: 'Biometric/RFID wrong bus boarding, unexpected student deboarding, or stop mismatch',
    icon: AlertTriangle,
    defaultMinPriority: 'NORMAL'
  },
  {
    id: 'GEOFENCE',
    label: 'Geofence & Route Deviations',
    description: 'Bus straying >200m outside planned route corridor or skipping designated stops',
    icon: Radio,
    defaultMinPriority: 'HIGH'
  },
  {
    id: 'DELAYS',
    label: 'Transit Delays & ETA Halts',
    description: 'Buses delayed >15 minutes due to traffic, breakdown, or road diversions',
    icon: Clock,
    defaultMinPriority: 'NORMAL'
  },
  {
    id: 'SYSTEM',
    label: 'Hardware & Sensor Telemetry',
    description: 'GPS antenna disconnection, CCTV offline, battery drain, and system diagnostics',
    icon: Sliders,
    defaultMinPriority: 'LOW'
  }
];

export default function NotificationPreferences({ onNavigate }) {
  const { user } = useAuth();
  const userId = user?.id || 'admin-user';

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Preferences State
  const [channels, setChannels] = useState({
    in_app: true,
    email: true,
    sms: false,
    push: true
  });

  const [categories, setCategories] = useState({
    SECURITY: { enabled: true, minPriority: 'LOW', channels: ['in_app', 'email', 'sms', 'push'] },
    BOARDING: { enabled: true, minPriority: 'NORMAL', channels: ['in_app', 'push'] },
    GEOFENCE: { enabled: true, minPriority: 'HIGH', channels: ['in_app', 'email', 'push'] },
    DELAYS: { enabled: true, minPriority: 'NORMAL', channels: ['in_app', 'push'] },
    SYSTEM: { enabled: true, minPriority: 'HIGH', channels: ['in_app'] }
  });

  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: '22:00',
    endTime: '06:00',
    timezone: 'Asia/Kolkata',
    emergencyBypass: true
  });

  // Load preferences from backend
  const loadPreferences = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await notificationAPI.getPreferences(userId);
      if (res && res.success && res.data) {
        const p = res.data;
        if (p.channels) setChannels(prev => ({ ...prev, ...p.channels }));
        if (p.categories) setCategories(prev => ({ ...prev, ...p.categories }));
        if (p.quiet_hours) {
          setQuietHours({
            enabled: Boolean(p.quiet_hours.enabled),
            startTime: p.quiet_hours.start_time || p.quiet_hours.startTime || '22:00',
            endTime: p.quiet_hours.end_time || p.quiet_hours.endTime || '06:00',
            timezone: p.quiet_hours.timezone || 'Asia/Kolkata',
            emergencyBypass: p.quiet_hours.emergency_bypass !== undefined ? p.quiet_hours.emergency_bypass : true
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load preferences from backend, using current baseline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  // Save Preferences
  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        channels,
        categories,
        quiet_hours: {
          enabled: quietHours.enabled,
          start_time: quietHours.startTime,
          end_time: quietHours.endTime,
          timezone: quietHours.timezone,
          emergency_bypass: quietHours.emergencyBypass
        }
      };
      const res = await notificationAPI.updatePreferences(userId, payload);
      if (res && res.success) {
        setFeedback({ type: 'success', message: 'Delivery preferences successfully saved to central cluster.' });
      } else {
        setFeedback({ type: 'error', message: res?.error || 'Failed to update preferences.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Network error saving preferences.' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Trigger Test Notification
  const handleSendTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const activeChannelList = Object.keys(channels).filter(ch => channels[ch]);
      const res = await notificationAPI.send({
        title: 'Diagnostic Test Alert',
        message: `V.S.B. Multi-Channel Alert Probe dispatched at ${new Date().toLocaleTimeString()} IST. Channels: ${activeChannelList.join(', ').toUpperCase()}`,
        priority: 'NORMAL',
        category: 'SYSTEM',
        channels: activeChannelList.length > 0 ? activeChannelList : ['in_app'],
        recipient_id: userId,
        recipient_email: user?.email || 'admin@vsb.ac.in',
        metadata: { diagnostic: true, triggered_by: user?.name || 'Administrator' }
      });
      if (res && res.success) {
        setFeedback({ type: 'success', message: 'Test alert broadcasted! Check header notification bell and active delivery channels.' });
      } else {
        setFeedback({ type: 'error', message: res?.error || 'Test notification failed.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error triggering diagnostic test alert.' });
    } finally {
      setTesting(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  // Toggle category channel
  const toggleCategoryChannel = (catId, channelName) => {
    setCategories(prev => {
      const current = prev[catId]?.channels || [];
      const updated = current.includes(channelName)
        ? current.filter(c => c !== channelName)
        : [...current, channelName];
      return {
        ...prev,
        [catId]: {
          ...prev[catId],
          channels: updated
        }
      };
    });
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-void, #0a0a0a)',
        minHeight: 'calc(100vh - var(--header-height))',
        color: 'var(--text-pure, #ffffff)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)'
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-default, #262626)',
          paddingBottom: '18px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}
            >
              <Sliders size={18} />
            </div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: 0,
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase'
              }}
            >
              Notification & Delivery Preferences
            </h1>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155'
              }}
            >
              PHASE 12
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #a3a3a3)' }}>
            Configure institutional dispatch channels, category alert filters, and quiet hour schedules for V.S.B. transit operations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadPreferences}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-default, #262626)',
              color: 'var(--text-secondary, #a3a3a3)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
            Reset
          </button>

          <button
            onClick={handleSendTest}
            disabled={testing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60a5fa',
              cursor: testing ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            <Send size={14} />
            {testing ? 'Testing...' : 'Send Test Alert'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              border: '1px solid #1d4ed8',
              color: '#ffffff',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono, monospace)',
            backgroundColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.type === 'success' ? '#4ade80' : '#f87171'
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Master Channels & Quiet Hours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Master Channels */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-default, #262626)',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Bell size={18} style={{ color: '#60a5fa' }} />
              <h2
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                Delivery Channels
              </h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #a3a3a3)', margin: '0 0 16px 0' }}>
              Enable or disable transport notification pipelines globally across all alerts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* In-App */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-void, #0a0a0a)',
                  border: '1px solid var(--border-subtle, #1f1f1f)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3b82f6'
                    }}
                  >
                    <Bell size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>In-App Command Center</div>
                    <div style={{ fontSize: '0.72rem', color: '#737373' }}>Live WebSocket popups, bell badge & audio chimes</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={channels.in_app}
                  onChange={e => setChannels(c => ({ ...c, in_app: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
              </div>

              {/* Push */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-void, #0a0a0a)',
                  border: '1px solid var(--border-subtle, #1f1f1f)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a855f7'
                    }}
                  >
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Web / Mobile Push Notifications</div>
                    <div style={{ fontSize: '0.72rem', color: '#737373' }}>Direct browser notifications via ServiceWorker / FCM</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={channels.push}
                  onChange={e => setChannels(c => ({ ...c, push: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#a855f7', cursor: 'pointer' }}
                />
              </div>

              {/* Email */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-void, #0a0a0a)',
                  border: '1px solid var(--border-subtle, #1f1f1f)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#22c55e'
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Institutional Email</div>
                    <div style={{ fontSize: '0.72rem', color: '#737373' }}>Automated dispatch to registered college emails</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={e => setChannels(c => ({ ...c, email: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }}
                />
              </div>

              {/* SMS */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-void, #0a0a0a)',
                  border: '1px solid var(--border-subtle, #1f1f1f)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: 'rgba(234, 179, 8, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#eab308'
                    }}
                  >
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>SMS Dispatch (Fast2SMS / Twilio)</div>
                    <div style={{ fontSize: '0.72rem', color: '#737373' }}>High-priority cellular text messages to parent contacts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={e => setChannels(c => ({ ...c, sms: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#eab308', cursor: 'pointer' }}
                />
              </div>

            </div>
          </div>

          {/* Section 2: Quiet Hours */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-default, #262626)',
              borderRadius: '8px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Moon size={18} style={{ color: '#a855f7' }} />
                <h2
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    margin: 0,
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  Quiet Hours Scheduling
                </h2>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>
                <span style={{ color: quietHours.enabled ? '#4ade80' : '#737373', fontFamily: 'var(--font-mono, monospace)' }}>
                  {quietHours.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
                <input
                  type="checkbox"
                  checked={quietHours.enabled}
                  onChange={e => setQuietHours(q => ({ ...q, enabled: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#a855f7', cursor: 'pointer' }}
                />
              </label>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #a3a3a3)', margin: '0 0 16px 0' }}>
              Suppress non-critical notifications during nighttime transit halt periods.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                  START TIME
                </label>
                <input
                  type="time"
                  disabled={!quietHours.enabled}
                  value={quietHours.startTime}
                  onChange={e => setQuietHours(q => ({ ...q, startTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-void, #0a0a0a)',
                    border: '1px solid var(--border-subtle, #262626)',
                    color: quietHours.enabled ? '#ffffff' : '#525252',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                  END TIME
                </label>
                <input
                  type="time"
                  disabled={!quietHours.enabled}
                  value={quietHours.endTime}
                  onChange={e => setQuietHours(q => ({ ...q, endTime: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-void, #0a0a0a)',
                    border: '1px solid var(--border-subtle, #262626)',
                    color: quietHours.enabled ? '#ffffff' : '#525252',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fca5a5' }}>
                    Emergency SOS Bypass
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a3a3a3' }}>
                    Always dispatch CRITICAL priority alerts regardless of quiet hours
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={quietHours.emergencyBypass}
                onChange={e => setQuietHours(q => ({ ...q, emergencyBypass: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>
          </div>

        </div>

        {/* Right Column: Category Subscription Matrix */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            borderRadius: '8px',
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} style={{ color: '#38bdf8' }} />
              <h2
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                Category Subscriptions
              </h2>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>
              MIN PRIORITY & CHANNELS
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #a3a3a3)', margin: '0 0 16px 0' }}>
            Fine-tune minimum priority threshold and active delivery pipelines per incident category.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {CATEGORY_DEFINITIONS.map(cat => {
              const IconComp = cat.icon;
              const catState = categories[cat.id] || { enabled: true, minPriority: cat.defaultMinPriority, channels: ['in_app'] };

              return (
                <div
                  key={cat.id}
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-void, #0a0a0a)',
                    border: `1px solid ${catState.enabled ? 'var(--border-subtle, #262626)' : 'rgba(255,255,255,0.05)'}`,
                    opacity: catState.enabled ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={catState.enabled}
                        onChange={e => {
                          const val = e.target.checked;
                          setCategories(c => ({
                            ...c,
                            [cat.id]: { ...(c[cat.id] || {}), enabled: val }
                          }));
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                      <IconComp size={16} style={{ color: '#38bdf8' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>MIN:</span>
                      <select
                        disabled={!catState.enabled}
                        value={catState.minPriority}
                        onChange={e => {
                          const val = e.target.value;
                          setCategories(c => ({
                            ...c,
                            [cat.id]: { ...(c[cat.id] || {}), minPriority: val }
                          }));
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#1f1f1f',
                          border: '1px solid #333333',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          cursor: catState.enabled ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <option value="LOW">LOW</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: '#737373', margin: '0 0 10px 26px' }}>
                    {cat.description}
                  </p>

                  {/* Channel Pills */}
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '26px', flexWrap: 'wrap' }}>
                    {['in_app', 'push', 'email', 'sms'].map(ch => {
                      const isSelected = (catState.channels || []).includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          disabled={!catState.enabled}
                          onClick={() => toggleCategoryChannel(cat.id, ch)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontFamily: 'var(--font-mono, monospace)',
                            cursor: catState.enabled ? 'pointer' : 'not-allowed',
                            border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.4)' : '#262626'}`,
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#141414',
                            color: isSelected ? '#60a5fa' : '#737373',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isSelected && <Check size={10} />}
                          {ch.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
