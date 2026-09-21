/**
 * ALERTS DASHBOARD (PHASE 9)
 * Real-time Wrong Bus Detection, Anomaly Alerts, and In-Charge Override Console
 * V.S.B Engineering College — Autonomous Transport Management System
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { alertsAPI } from '../../services/apiService';
import {
  ShieldAlert,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Search,
  Filter,
  Users,
  Eye,
  Check,
  X,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Bell,
  Bus,
  UserCheck,
  UserX,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function AlertsDashboard({ onNavigate }) {
  const { user } = useAuth();

  // Core state
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [historyAlerts, setHistoryAlerts] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [alertStats, setAlertStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history' | 'escalations'
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Override Modal state
  const [overrideModal, setOverrideModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [overrideAction, setOverrideAction] = useState('APPROVED');
  const [overrideReason, setOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial load
  useEffect(() => {
    loadAllData(false);
  }, []);

  // Live auto-polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const loadAllData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [activeRes, statsRes, histRes, escRes] = await Promise.all([
        alertsAPI.getActive().catch(() => ({ alerts: [] })),
        alertsAPI.getStats({ hoursBack: 24 }).catch(() => ({ stats: null })),
        alertsAPI.getHistory({ limit: 50 }).catch(() => []),
        alertsAPI.getEscalations().catch(() => [])
      ]);

      if (activeRes && Array.isArray(activeRes.alerts)) {
        setActiveAlerts(activeRes.alerts);
      } else if (Array.isArray(activeRes)) {
        setActiveAlerts(activeRes);
      }

      if (statsRes?.stats) {
        setAlertStats(statsRes.stats);
      }

      if (Array.isArray(histRes)) {
        setHistoryAlerts(histRes);
      }

      if (Array.isArray(escRes)) {
        setEscalations(escRes);
      }
    } catch (err) {
      console.error('[ALERTS DASHBOARD] Load error:', err);
      if (!isSilent) {
        showToast('Unable to connect to alert server. Operating in cached mode.', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    setActionLoading(true);
    try {
      await alertsAPI.acknowledge(alertId);
      showToast(`Alert #${alertId} acknowledged.`);
      loadAllData(true);
    } catch (err) {
      showToast(`Failed to acknowledge: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideSubmit = async () => {
    if (!selectedAlert) return;
    if (!overrideReason.trim()) {
      showToast('Please provide a reason for this override decision.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await alertsAPI.override(selectedAlert.id, {
        action: overrideAction,
        reason: overrideReason.trim()
      });

      showToast(`Alert #${selectedAlert.id} ${overrideAction.toLowerCase()} successfully.`);
      setOverrideModal(false);
      setSelectedAlert(null);
      setOverrideReason('');
      loadAllData(false);
    } catch (err) {
      showToast(`Override failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Severity utilities
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          icon: <AlertOctagon size={13} />
        };
      case 'HIGH':
        return {
          bg: 'rgba(249, 115, 22, 0.15)',
          color: '#f97316',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          icon: <ShieldAlert size={13} />
        };
      case 'MEDIUM':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          color: '#eab308',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          icon: <AlertTriangle size={13} />
        };
      default:
        return {
          bg: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          icon: <Info size={13} />
        };
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'WRONG_BUS':
        return {
          label: 'WRONG BUS',
          bg: 'rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          icon: <Bus size={13} />
        };
      case 'WRONG_STOP':
        return {
          label: 'WRONG STOP',
          bg: 'rgba(234, 179, 8, 0.2)',
          color: '#facc15',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          icon: <MapPin size={13} />
        };
      case 'UNKNOWN_STUDENT':
        return {
          label: 'UNKNOWN STUDENT',
          bg: 'rgba(168, 85, 247, 0.2)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          icon: <UserX size={13} />
        };
      default:
        return {
          label: type,
          bg: 'rgba(148, 163, 184, 0.2)',
          color: '#cbd5e1',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          icon: <Bell size={13} />
        };
    }
  };

  // Filtered lists
  const filteredActiveAlerts = useMemo(() => {
    return activeAlerts.filter((item) => {
      const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.full_name?.toLowerCase().includes(query) ||
        item.register_number?.toLowerCase().includes(query) ||
        item.bus_number?.toLowerCase().includes(query) ||
        item.assigned_bus_number?.toLowerCase().includes(query) ||
        item.alert_type?.toLowerCase().includes(query);
      return matchesSeverity && matchesSearch;
    });
  }, [activeAlerts, severityFilter, searchQuery]);

  const filteredHistoryAlerts = useMemo(() => {
    return historyAlerts.filter((item) => {
      const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.student_id?.toLowerCase().includes(query) ||
        item.action_taken?.toLowerCase().includes(query) ||
        item.alert_type?.toLowerCase().includes(query);
      return matchesSeverity && matchesSearch;
    });
  }, [historyAlerts, severityFilter, searchQuery]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070707',
      color: '#f1f5f9',
      padding: '24px 32px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? '#7f1d1d' : '#14532d',
          border: `1px solid ${toastMessage.type === 'error' ? '#ef4444' : '#22c55e'}`,
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {toastMessage.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          {toastMessage.msg}
        </div>
      )}

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #222222',
        paddingBottom: '20px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              background: '#f97316',
              color: '#000000',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '0.72rem',
              fontWeight: 900,
              letterSpacing: '0.08em'
            }}>
              PHASE 9
            </span>
            <span style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
              WRONG BUS DETECTION & REAL-TIME ALERTS
            </span>
            <span style={{
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              padding: '2px 8px',
              borderRadius: '3px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Clock size={11} />
              5s AUTO-SYNC
            </span>
          </div>

          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Bell size={26} color="#f97316" /> WRONG BUS & ANOMALY ALERT ENGINE
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.84rem',
            margin: '6px 0 0',
            maxWidth: '700px'
          }}>
            V.S.B Engineering College • Instant mismatch alert dispatcher, in-charge supervisor override control, and automated pattern escalation.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onNavigate && (
            <button
              onClick={() => onNavigate('admin')}
              style={{
                background: '#161616',
                color: '#f1f5f9',
                border: '1px solid #333333',
                padding: '8px 14px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                borderRadius: '4px',
                fontWeight: 700
              }}
            >
              [ BACK TO PORTAL ]
            </button>
          )}

          <button
            onClick={() => loadAllData(false)}
            disabled={refreshing}
            style={{
              background: refreshing ? '#222222' : '#f97316',
              color: refreshing ? '#999999' : '#000000',
              border: 'none',
              padding: '8px 16px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'POLLING...' : 'REFRESH ALERTS'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: '#111111',
          border: '1px solid #222222',
          padding: '18px',
          borderRadius: '8px',
          position: 'relative'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Total Alerts (24h)
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#f1f5f9' }}>
            {alertStats?.total_alerts ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Logged across fleet
          </div>
        </div>

        <div style={{
          background: '#111111',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          padding: '18px',
          borderRadius: '8px',
          position: 'relative'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
            Active Alerts Now
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#f97316' }}>
            {alertStats?.active_alerts ?? activeAlerts.filter(a => a.alert_status === 'ACTIVE').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            Require in-charge review
          </div>
        </div>

        <div style={{
          background: '#111111',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '18px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertOctagon size={14} />
            Critical Severity 🚨
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ef4444' }}>
            {alertStats?.critical_alerts ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            Security risks / Unknowns
          </div>
        </div>

        <div style={{
          background: '#111111',
          border: '1px solid #222222',
          padding: '18px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bus size={14} color="#f87171" />
            Wrong Bus Mismatch
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#f87171' }}>
            {alertStats?.wrong_bus_count ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            Bus-to-student mismatches
          </div>
        </div>

        <div style={{
          background: '#111111',
          border: '1px solid #222222',
          padding: '18px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} color="#a855f7" />
            Active Escalations
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#c084fc' }}>
            {escalations.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            ≥ 3 anomalies in 24h
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid #1f1f1f',
        paddingBottom: '14px',
        marginBottom: '20px'
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 18px',
              background: activeTab === 'active' ? '#f97316' : '#141414',
              color: activeTab === 'active' ? '#000000' : '#94a3b8',
              border: activeTab === 'active' ? 'none' : '1px solid #282828',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTab === 'active' ? '#000' : '#ef4444' }} />
            Active Alerts ({activeAlerts.filter(a => a.alert_status === 'ACTIVE').length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 18px',
              background: activeTab === 'history' ? '#ffffff' : '#141414',
              color: activeTab === 'history' ? '#000000' : '#94a3b8',
              border: activeTab === 'history' ? 'none' : '1px solid #282828',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={14} />
            Alert History ({historyAlerts.length})
          </button>

          <button
            onClick={() => setActiveTab('escalations')}
            style={{
              padding: '8px 18px',
              background: activeTab === 'escalations' ? '#a855f7' : '#141414',
              color: activeTab === 'escalations' ? '#ffffff' : '#94a3b8',
              border: activeTab === 'escalations' ? 'none' : '1px solid #282828',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertOctagon size={14} />
            Escalations ({escalations.length})
          </button>
        </div>

        {/* Search & Severity Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student, bus, reg no..."
              style={{
                background: '#111111',
                border: '1px solid #2c2c2c',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '6px 12px 6px 30px',
                fontSize: '0.78rem',
                width: '210px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="#94a3b8" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                background: '#111111',
                border: '1px solid #2c2c2c',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '6px 10px',
                fontSize: '0.78rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading real-time alert data...</p>
        </div>
      ) : activeTab === 'active' ? (
        // ACTIVE ALERTS TAB
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredActiveAlerts.length === 0 ? (
            <div style={{
              background: '#0d0d0d',
              border: '1px dashed #262626',
              borderRadius: '8px',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={40} color="#22c55e" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                All Clear — Zero Active Boarding Anomalies
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto' }}>
                All students currently verified for correct bus assignments. Any wrong bus attempt detected by door cameras will trigger an immediate alert card here.
              </p>
            </div>
          ) : (
            filteredActiveAlerts.map((alert) => {
              const sev = getSeverityBadge(alert.severity);
              const typeBadge = getTypeBadge(alert.alert_type);

              return (
                <div
                  key={alert.id}
                  style={{
                    background: '#121212',
                    border: '1px solid #222222',
                    borderLeft: `5px solid ${sev.color}`,
                    borderRadius: '6px',
                    padding: '18px 22px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Alert Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: typeBadge.bg,
                        color: typeBadge.color,
                        border: typeBadge.border,
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {typeBadge.icon} {typeBadge.label}
                      </span>

                      <span style={{
                        background: sev.bg,
                        color: sev.color,
                        border: sev.border,
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {sev.icon} {alert.severity} SEVERITY
                      </span>

                      <span style={{
                        background: alert.alert_status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: alert.alert_status === 'ACTIVE' ? '#ef4444' : '#eab308',
                        border: `1px solid ${alert.alert_status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}>
                        STATUS: {alert.alert_status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} />
                      {new Date(alert.created_at).toLocaleTimeString()} ({new Date(alert.created_at).toLocaleDateString()})
                    </div>
                  </div>

                  {/* Student & Bus Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '18px',
                    background: '#0a0a0a',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #1a1a1a'
                  }}>
                    {/* Student Info */}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Target Student
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} color="#f97316" />
                        {alert.full_name || 'Unidentified Individual'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                        Register No: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{alert.register_number || 'N/A'}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                        Match Confidence: <span style={{ color: '#f97316', fontWeight: 700 }}>{alert.confidence_score ? `${Math.round(Number(alert.confidence_score) * 100)}%` : '0%'}</span>
                      </div>
                    </div>

                    {/* Bus Mismatch Comparison */}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Boarding Mismatch Comparison
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          background: '#161616',
                          border: '1px solid #333333',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.68rem' }}>Assigned Bus</span>
                          <strong style={{ color: '#22c55e' }}>{alert.assigned_bus_number || `Bus ${alert.assigned_bus_id || 'None'}`}</strong>
                        </div>

                        <ArrowRight size={16} color="#ef4444" />

                        <div style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{ color: '#f87171', display: 'block', fontSize: '0.68rem' }}>Attempted Bus</span>
                          <strong style={{ color: '#ef4444' }}>{alert.bus_number || `Bus ${alert.bus_id}`}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
                    {alert.alert_status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={actionLoading}
                        style={{
                          background: '#1c1c1c',
                          border: '1px solid #333333',
                          color: '#e2e8f0',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Eye size={14} /> Acknowledge
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setOverrideAction('APPROVED');
                        setOverrideReason('');
                        setOverrideModal(true);
                      }}
                      style={{
                        background: '#f97316',
                        border: 'none',
                        color: '#000000',
                        padding: '8px 18px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <UserCheck size={14} /> Review & Override Decision
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'history' ? (
        // HISTORY TAB
        <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '6px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #222222', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Alert ID</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Student ID</th>
                <th style={{ padding: '12px 16px' }}>Severity</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Decision</th>
                <th style={{ padding: '12px 16px' }}>Reason</th>
                <th style={{ padding: '12px 16px' }}>Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistoryAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No historical alerts matching criteria.
                  </td>
                </tr>
              ) : (
                filteredHistoryAlerts.map((hist) => (
                  <tr key={hist.id} style={{ borderBottom: '1px solid #1c1c1c' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f97316' }}>#{hist.id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: hist.alert_type === 'WRONG_BUS' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: hist.alert_type === 'WRONG_BUS' ? '#ef4444' : '#eab308',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        {hist.alert_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                      {hist.student_id ? String(hist.student_id).substring(0, 12) + '...' : 'UNKNOWN'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: hist.severity === 'CRITICAL' ? '#ef4444' : hist.severity === 'HIGH' ? '#f97316' : '#eab308', fontWeight: 700 }}>
                        {hist.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: hist.alert_status === 'RESOLVED' ? '#22c55e' : '#e2e8f0' }}>
                      {hist.alert_status}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {hist.action_taken ? (
                        <span style={{
                          background: hist.action_taken === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: hist.action_taken === 'APPROVED' ? '#22c55e' : '#ef4444',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}>
                          {hist.action_taken}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hist.action_reason || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {hist.action_timestamp ? new Date(hist.action_timestamp).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // ESCALATIONS TAB
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {escalations.length === 0 ? (
            <div style={{
              background: '#0d0d0d',
              border: '1px dashed #262626',
              borderRadius: '8px',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={40} color="#a855f7" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                Zero Active Student Escalations
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto' }}>
                Students who trigger 3 or more boarding anomalies in a rolling 24-hour window are automatically flagged and dispatched to the Transport Admin here.
              </p>
            </div>
          ) : (
            escalations.map((esc) => (
              <div
                key={esc.id}
                style={{
                  background: '#121212',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderLeft: '5px solid #a855f7',
                  borderRadius: '6px',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      ESCALATION #{esc.id}
                    </span>
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                      fontWeight: 900
                    }}>
                      {esc.anomaly_count} ANOMALIES (24H)
                    </span>
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                    {esc.full_name} ({esc.register_number})
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0' }}>
                    {esc.escalation_reason}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Flagged: {new Date(esc.created_at).toLocaleString()}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    background: '#1a1a1a',
                    color: '#c084fc',
                    border: '1px solid #333333',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    STATUS: {esc.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Supervisor Review & Override Modal */}
      {overrideModal && selectedAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141414',
            border: '1px solid #2e2e2e',
            borderRadius: '8px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="#f97316" /> Review & Override Boarding Alert
              </h2>
              <button
                onClick={() => setOverrideModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Summary Box */}
            <div style={{
              background: '#0d0d0d',
              border: '1px solid #222222',
              borderRadius: '6px',
              padding: '14px',
              fontSize: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div><strong>Student:</strong> {selectedAlert.full_name} ({selectedAlert.register_number})</div>
              <div><strong>Anomaly Type:</strong> <span style={{ color: '#f87171', fontWeight: 700 }}>{selectedAlert.alert_type}</span></div>
              <div><strong>Assigned Bus:</strong> {selectedAlert.assigned_bus_number || `Bus ${selectedAlert.assigned_bus_id}`}</div>
              <div><strong>Attempted Bus:</strong> <span style={{ color: '#ef4444', fontWeight: 700 }}>{selectedAlert.bus_number || `Bus ${selectedAlert.bus_id}`}</span></div>
            </div>

            {/* Decision Radio Group */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                Supervisor Decision
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setOverrideAction('APPROVED')}
                  style={{
                    background: overrideAction === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' : '#1a1a1a',
                    border: `1px solid ${overrideAction === 'APPROVED' ? '#22c55e' : '#333333'}`,
                    color: overrideAction === 'APPROVED' ? '#22c55e' : '#94a3b8',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>APPROVE OVERRIDE</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#64748b' }}>Allow student on this bus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverrideAction('REJECTED')}
                  style={{
                    background: overrideAction === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : '#1a1a1a',
                    border: `1px solid ${overrideAction === 'REJECTED' ? '#ef4444' : '#333333'}`,
                    color: overrideAction === 'REJECTED' ? '#ef4444' : '#94a3b8',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <XCircle size={20} />
                  <span>REJECT BOARDING</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#64748b' }}>Deny boarding & notify security</span>
                </button>
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
                Audit Reason / Justification (Mandatory)
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Authorized special transit for project presentation at VSB Campus A..."
                style={{
                  width: '100%',
                  height: '80px',
                  background: '#0d0d0d',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setOverrideModal(false)}
                style={{
                  background: '#1f1f1f',
                  border: '1px solid #333333',
                  color: '#e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleOverrideSubmit}
                disabled={actionLoading}
                style={{
                  background: overrideAction === 'APPROVED' ? '#22c55e' : '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 20px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  cursor: actionLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {actionLoading ? 'RECORDING AUDIT...' : 'SUBMIT DECISION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
