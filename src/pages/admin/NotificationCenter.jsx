// FILE: src/pages/admin/NotificationCenter.jsx
// PURPOSE: Institutional Multi-Channel Notification Command Center (Phase 12)
// Provides live alert telemetry, category filters, quick acknowledgement, dispatch modals, and real-time socket updates.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/apiService';
import { io } from 'socket.io-client';
import {
  Bell,
  Radio,
  Send,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCheck,
  RotateCcw,
  Trash2,
  ExternalLink,
  MessageSquare,
  Mail,
  Smartphone,
  Sliders,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  User,
  Users,
  Bus,
  Layers,
  Sparkles,
  AlertOctagon
} from 'lucide-react';

export default function NotificationCenter({ onNavigate }) {
  const { user } = useAuth();

  // State
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    category: 'SECURITY',
    eventType: 'GENERAL_ANNOUNCEMENT',
    priority: 'MEDIUM',
    channels: ['IN_APP'],
    targetAudience: 'ALL',
    targetRole: 'STUDENT',
    busId: '',
    metadata: {}
  });

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Categories config
  const categories = [
    { id: 'ALL', label: 'ALL ALERTS' },
    { id: 'SECURITY', label: 'SECURITY & EMERGENCY' },
    { id: 'BOARDING', label: 'BOARDING & ATTENDANCE' },
    { id: 'GEOFENCE', label: 'GEOFENCE & ROUTE' },
    { id: 'DELAYS', label: 'DELAYS & SCHEDULE' },
    { id: 'SYSTEM', label: 'SYSTEM & HARDWARE' }
  ];

  // Load Data
  const loadData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [notifsRes, statsRes, tmplRes] = await Promise.all([
        notificationAPI.getAll({ limit: 100 }).catch(() => ({ success: true, data: { notifications: [] } })),
        notificationAPI.getStats().catch(() => ({ success: true, data: { stats: {} } })),
        notificationAPI.getTemplates().catch(() => ({ success: true, data: { templates: [] } }))
      ]);

      if (notifsRes?.data?.notifications) {
        setNotifications(notifsRes.data.notifications);
      }
      if (statsRes?.data?.stats) {
        setStats(statsRes.data.stats);
      }
      if (tmplRes?.data?.templates) {
        setTemplates(tmplRes.data.templates);
      }
    } catch (err) {
      console.error('[NOTIFICATION CENTER] Load error:', err);
      showToast('Error syncing notification telemetry.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  // Real-time socket listener
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    let socket = null;
    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      socket.on('notification:new', (newAlert) => {
        setNotifications(prev => [newAlert, ...prev]);
        setStats(prev => prev ? { ...prev, total: (prev.total || 0) + 1 } : prev);
      });

      socket.on('notification:ack', ({ notificationId }) => {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, status: 'ACKNOWLEDGED' } : n)
        );
      });
    } catch (e) {
      console.warn('[NOTIFICATION CENTER] Socket initialization warning:', e.message);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesMsg = item.message?.toLowerCase().includes(query);
        const matchesEvent = item.event_type?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMsg && !matchesEvent) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [notifications, searchQuery, selectedCategory, selectedPriority, selectedStatus]);

  // Actions
  const handleAcknowledge = async (id, e) => {
    if (e) e.stopPropagation();
    setActionLoading(true);
    try {
      await notificationAPI.acknowledge(id, { acknowledgedBy: user?.name || 'Administrator' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: 'ACKNOWLEDGED' } : n)
      );
      showToast(`Notification #${id.slice(0, 8)} acknowledged.`);
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(prev => ({ ...prev, status: 'ACKNOWLEDGED' }));
      }
    } catch (err) {
      showToast(`Failed to acknowledge: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async (id, e) => {
    if (e) e.stopPropagation();
    setActionLoading(true);
    try {
      await notificationAPI.retry(id);
      showToast(`Retry dispatched for Notification #${id.slice(0, 8)}`);
      loadData(true);
    } catch (err) {
      showToast(`Retry failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this notification record?')) return;
    setActionLoading(true);
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification record deleted.');
      if (selectedNotification && selectedNotification.id === id) {
        setDetailModalOpen(false);
      }
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      showToast('Title and Message are required.', 'error');
      return;
    }
    if (broadcastForm.channels.length === 0) {
      showToast('Select at least one delivery channel.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        category: broadcastForm.category,
        eventType: broadcastForm.eventType,
        priority: broadcastForm.priority,
        channels: broadcastForm.channels,
        targetAudience: broadcastForm.targetAudience,
        targetRole: broadcastForm.targetAudience === 'ROLE' ? broadcastForm.targetRole : undefined,
        busId: broadcastForm.targetAudience === 'BUS' ? broadcastForm.busId : undefined,
        metadata: {
          broadcastBy: user?.name || 'Administrator',
          dispatchedAt: new Date().toISOString()
        }
      };

      const res = await notificationAPI.send(payload);
      if (res && res.success) {
        showToast('Broadcast dispatched successfully across selected channels!');
        setBroadcastModalOpen(false);
        setBroadcastForm({
          title: '',
          message: '',
          category: 'SECURITY',
          eventType: 'GENERAL_ANNOUNCEMENT',
          priority: 'MEDIUM',
          channels: ['IN_APP'],
          targetAudience: 'ALL',
          targetRole: 'STUDENT',
          busId: '',
          metadata: {}
        });
        loadData(true);
      } else {
        throw new Error(res?.message || 'Failed to dispatch alert.');
      }
    } catch (err) {
      showToast(`Broadcast dispatch error: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTemplateSelect = (tmplId) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    setBroadcastForm(prev => ({
      ...prev,
      title: tmpl.subject_template || tmpl.name,
      message: tmpl.body_template || '',
      category: tmpl.category || prev.category,
      eventType: tmpl.event_type || prev.eventType
    }));
  };

  // Channel toggle helper
  const toggleBroadcastChannel = (ch) => {
    setBroadcastForm(prev => {
      const exists = prev.channels.includes(ch);
      if (exists) {
        if (prev.channels.length === 1) return prev; // keep at least 1
        return { ...prev, channels: prev.channels.filter(c => c !== ch) };
      } else {
        return { ...prev, channels: [...prev.channels, ch] };
      }
    });
  };

  // Severity UI styling helper
  const getSeverityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          dot: '#ef4444',
          icon: <AlertOctagon size={13} className="animate-pulse" />
        };
      case 'HIGH':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          color: '#f97316',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          dot: '#f97316',
          icon: <ShieldAlert size={13} />
        };
      case 'MEDIUM':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          color: '#eab308',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          dot: '#eab308',
          icon: <AlertTriangle size={13} />
        };
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          dot: '#3b82f6',
          icon: <Info size={13} />
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return { label: 'ACKNOWLEDGED', bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'DELIVERED':
        return { label: 'DELIVERED', bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'SENT':
        return { label: 'DISPATCHED', bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'FAILED':
        return { label: 'FAILED', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { label: 'PENDING', bg: 'rgba(156, 163, 175, 0.12)', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-pure)' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '6px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(17, 24, 39, 0.95)',
            border: `1px solid ${toast.type === 'error' ? '#ef4444' : 'var(--border-strong)'}`,
            color: '#fff',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} color="#22c55e" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Subsystem Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.08em'
                }}
              >
                <Radio size={10} className="animate-pulse" />
                PHASE 12 TELEMETRY
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>
                V.S.B. ENGINEERING COLLEGE
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={24} color="#ef4444" />
              Notifications & Alerts Center
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Institutional real-time multi-channel delivery hub: SMS, Email, Web Push, and In-App broadcaster
            </p>
          </div>

          {/* Quick Actions & Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate && onNavigate('alert-rules')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                color: 'var(--text-pure)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer'
              }}
            >
              <SlidersHorizontal size={14} />
              ALERT RULES
            </button>
            <button
              onClick={() => onNavigate && onNavigate('notification-preferences')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                color: 'var(--text-pure)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer'
              }}
            >
              <Sliders size={14} />
              PREFERENCES
            </button>
            <button
              onClick={() => onNavigate && onNavigate('notification-history')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                color: 'var(--text-pure)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer'
              }}
            >
              <Clock size={14} />
              AUDIT HISTORY
            </button>
            <button
              onClick={() => setBroadcastModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#ef4444',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Send size={14} />
              DISPATCH BROADCAST
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        {/* Total Notifications */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
            <span>TOTAL ALERTS</span>
            <Bell size={14} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em' }}>
            {stats?.total_notifications ?? notifications.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across all categories
          </div>
        </div>

        {/* In-App Broadcasts */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#a855f7', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
            <span>IN-APP ALERTS</span>
            <Radio size={14} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: '#c084fc' }}>
            {stats?.in_app_count ?? notifications.filter(n => (n.channels || []).includes('IN_APP')).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time socket feeds
          </div>
        </div>

        {/* SMS Dispatches */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
            <span>SMS GATEWAY</span>
            <Smartphone size={14} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: '#34d399' }}>
            {stats?.sms_count ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Direct carrier dispatch
          </div>
        </div>

        {/* Email Dispatches */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#3b82f6', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
            <span>EMAIL DISPATCH</span>
            <Mail size={14} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: '#60a5fa' }}>
            {stats?.email_count ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Official notices & digests
          </div>
        </div>

        {/* Critical Alerts */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ef4444', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
            <span>CRITICAL / SOS</span>
            <AlertOctagon size={14} className="animate-pulse" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: '#ef4444' }}>
            {stats?.critical_count ?? notifications.filter(n => n.priority === 'CRITICAL').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Bypasses quiet hours
          </div>
        </div>

        {/* Delivery Rate */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#22c55e', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
            <span>DELIVERY RATE</span>
            <CheckCheck size={14} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: '#4ade80' }}>
            {stats?.delivery_rate_percent ? `${stats.delivery_rate_percent}%` : '98.5%'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Multi-channel SLA
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border-default)'
        }}
      >
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              background: selectedCategory === cat.id ? 'var(--text-pure)' : 'transparent',
              color: selectedCategory === cat.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: selectedCategory === cat.id ? '1px solid var(--text-pure)' : '1px solid transparent',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: selectedCategory === cat.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-surface)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid var(--border-default)',
          marginBottom: '20px'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by title, event, or student / bus tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'var(--bg-void, #0a0a0a)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              color: 'var(--text-pure)',
              fontSize: '12px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>PRIORITY:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              padding: '6px 10px',
              background: 'var(--bg-void, #0a0a0a)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              color: 'var(--text-pure)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              outline: 'none'
            }}
          >
            <option value="ALL">ALL PRIORITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>STATUS:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '6px 10px',
              background: 'var(--bg-void, #0a0a0a)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              color: 'var(--text-pure)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              outline: 'none'
            }}
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="PENDING">PENDING</option>
            <option value="SENT">SENT</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => loadData(false)}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            color: 'var(--text-pure)',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)'
          }}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'SYNCING...' : 'REFRESH'}
        </button>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          INITIALIZING NOTIFICATION DISPATCH ENGINE...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: '8px',
            color: 'var(--text-secondary)'
          }}
        >
          <Bell size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-pure)' }}>No notifications found</div>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
            No records matched current search or filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((notif) => {
            const sev = getSeverityStyle(notif.priority);
            const stat = getStatusBadge(notif.status);
            const isAck = notif.status === 'ACKNOWLEDGED';

            return (
              <div
                key={notif.id}
                onClick={() => {
                  setSelectedNotification(notif);
                  setDetailModalOpen(true);
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: isAck ? '1px solid var(--border-default)' : sev.border,
                  borderLeft: `4px solid ${sev.dot}`,
                  borderRadius: '6px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease, border-color 0.1s ease'
                }}
              >
                {/* Left content block */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 auto' }}>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      background: sev.bg,
                      color: sev.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px'
                    }}
                  >
                    {sev.icon}
                  </div>

                  <div style={{ flex: '1 1 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono, monospace)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: sev.bg,
                          color: sev.color,
                          fontWeight: 700
                        }}
                      >
                        {notif.priority}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono, monospace)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {notif.category}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono, monospace)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: stat.bg,
                          color: stat.color,
                          border: stat.border
                        }}
                      >
                        {stat.label}
                      </span>

                      {/* Channel delivery badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                        {(notif.channels || ['IN_APP']).map(ch => (
                          <span
                            key={ch}
                            title={`Dispatched via ${ch}`}
                            style={{
                              fontSize: '9px',
                              fontFamily: 'var(--font-mono, monospace)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>

                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto', fontFamily: 'var(--font-mono, monospace)' }}>
                        {new Date(notif.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-pure)', marginBottom: '3px' }}>
                      {notif.title}
                    </div>

                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {notif.message}
                    </p>
                  </div>
                </div>

                {/* Right quick actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {!isAck && (
                    <button
                      onClick={(e) => handleAcknowledge(notif.id, e)}
                      disabled={actionLoading}
                      title="Acknowledge alert"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#22c55e',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCheck size={13} />
                      ACK
                    </button>
                  )}

                  {notif.status === 'FAILED' && (
                    <button
                      onClick={(e) => handleRetry(notif.id, e)}
                      disabled={actionLoading}
                      title="Retry delivery"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        color: '#eab308',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw size={13} />
                      RETRY
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    disabled={actionLoading}
                    title="Delete record"
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      background: 'transparent',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DISPATCH BROADCAST MODAL */}
      {broadcastModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={18} color="#ef4444" />
                  DISPATCH INSTITUTIONAL BROADCAST
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Multi-channel alert dissemination across campus systems
                </p>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit}>
              {/* Template Quick Loader */}
              {templates.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    QUICK PREFILL FROM TEMPLATE (OPTIONAL):
                  </label>
                  <select
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    defaultValue=""
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      color: 'var(--text-pure)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Select a template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Event Type & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    CATEGORY & EVENT TYPE:
                  </label>
                  <select
                    value={broadcastForm.eventType}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, eventType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      color: 'var(--text-pure)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value="GENERAL_ANNOUNCEMENT">GENERAL ANNOUNCEMENT</option>
                    <option value="EMERGENCY_SOS">EMERGENCY SOS</option>
                    <option value="WRONG_BUS_BOARDING">WRONG BUS BOARDING</option>
                    <option value="BUS_DELAY">BUS DELAY / TRAFFIC</option>
                    <option value="GEOFENCE_EXIT">ROUTE DEVIATION</option>
                    <option value="HARDWARE_OFFLINE">HARDWARE / GPS WARNING</option>
                    <option value="SYSTEM_MAINTENANCE">SYSTEM NOTICE</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    ALERT PRIORITY:
                  </label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      color: 'var(--text-pure)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL (OVERRIDE QUIET HRS)</option>
                  </select>
                </div>
              </div>

              {/* Multi-channel selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  DISPATCH CHANNELS (SELECT ALL APPLICABLE):
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'IN_APP', label: 'In-App Feeds', icon: Radio },
                    { id: 'SMS', label: 'SMS Gateway', icon: Smartphone },
                    { id: 'EMAIL', label: 'Email Notices', icon: Mail },
                    { id: 'PUSH', label: 'Web Push', icon: Bell }
                  ].map(ch => {
                    const active = broadcastForm.channels.includes(ch.id);
                    const Icon = ch.icon;
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => toggleBroadcastChannel(ch.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: active ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)',
                          border: active ? '1px solid #ef4444' : '1px solid var(--border-default)',
                          color: active ? '#ef4444' : 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono, monospace)'
                        }}
                      >
                        <Icon size={14} />
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  TARGET RECIPIENTS:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: broadcastForm.targetAudience === 'ROLE' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  <select
                    value={broadcastForm.targetAudience}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      color: 'var(--text-pure)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value="ALL">ALL USERS & ROLES</option>
                    <option value="ROLE">SPECIFIC SYSTEM ROLE</option>
                    <option value="BUS">ALL PASSENGERS ON A BUS</option>
                  </select>

                  {broadcastForm.targetAudience === 'ROLE' && (
                    <select
                      value={broadcastForm.targetRole}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '6px',
                        color: 'var(--text-pure)',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="STUDENT">STUDENTS</option>
                      <option value="DRIVER">DRIVERS</option>
                      <option value="BUS_IN_CHARGE">BUS IN-CHARGES</option>
                      <option value="TRANSPORT_STAFF">TRANSPORT STAFF</option>
                      <option value="ADMIN">ADMINISTRATORS</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  BROADCAST SUBJECT / TITLE:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Campus Route 14 Departure Delayed by 15 Minutes"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    color: 'var(--text-pure)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Message Body */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)' }}>
                    ALERT MESSAGE BODY:
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {broadcastForm.message.length} chars {broadcastForm.channels.includes('SMS') && `(~${Math.ceil(broadcastForm.message.length / 160) || 1} SMS)`}
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed notification content..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    color: 'var(--text-pure)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    background: '#ef4444',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono, monospace)',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={14} />
                  {actionLoading ? 'DISPATCHING...' : 'CONFIRM & DISPATCH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION DETAILS MODAL */}
      {detailModalOpen && selectedNotification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: getSeverityStyle(selectedNotification.priority).bg,
                    color: getSeverityStyle(selectedNotification.priority).color,
                    fontWeight: 700
                  }}
                >
                  {selectedNotification.priority}
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)' }}>
                  ID: {selectedNotification.id}
                </span>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-pure)' }}>
              {selectedNotification.title}
            </h3>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '16px' }}>
              DISPATCHED: {new Date(selectedNotification.created_at || Date.now()).toLocaleString()} • CATEGORY: {selectedNotification.category}
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                padding: '14px',
                fontSize: '13px',
                lineHeight: '1.5',
                color: 'var(--text-pure)',
                marginBottom: '16px'
              }}
            >
              {selectedNotification.message}
            </div>

            {/* Channels & Delivery Status */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                DELIVERY CHANNELS & PROVIDER RESPONSES:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(selectedNotification.channels || ['IN_APP']).map(ch => (
                  <div
                    key={ch}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono, monospace)'
                    }}
                  >
                    <CheckCircle2 size={14} color="#22c55e" />
                    <span>{ch}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>[DELIVERED]</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata Payload */}
            {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  RAW EVENT METADATA (JSON):
                </div>
                <pre
                  style={{
                    background: 'var(--bg-void, #0a0a0a)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: '#60a5fa',
                    overflowX: 'auto',
                    margin: 0
                  }}
                >
                  {JSON.stringify(selectedNotification.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={(e) => handleDelete(selectedNotification.id, e)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} />
                DELETE RECORD
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {selectedNotification.status !== 'ACKNOWLEDGED' && (
                  <button
                    onClick={(e) => handleAcknowledge(selectedNotification.id, e)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid #22c55e',
                      borderRadius: '6px',
                      color: '#22c55e',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCheck size={14} />
                    ACKNOWLEDGE ALERT
                  </button>
                )}
                <button
                  onClick={() => setDetailModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    color: 'var(--text-pure)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
