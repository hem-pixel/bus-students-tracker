/**
 * BOARDING VERIFICATION DASHBOARD (PHASE 8)
 * Real-time student boarding verification, anomaly detection, and supervisor override console.
 * Integrates door vision stream events, bus assignment authorization, and live attendance logging.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, boardingAPI } from '../../services/apiService';
import {
  Bus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserX,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Search,
  Filter,
  Users,
  ChevronRight,
  ArrowRight,
  Eye,
  Check,
  X,
  HelpCircle,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function BoardingVerificationDashboard({ onNavigate }) {
  const { user } = useAuth();

  // State
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [boardingSummary, setBoardingSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'anomalies' | 'events'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedEventForOverride, setSelectedEventForOverride] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const token = localStorage.getItem('bst_auth_session_v1');

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial buses list
  useEffect(() => {
    loadBuses();
  }, []);

  // Poll for live boarding data every 3 seconds for selected bus
  useEffect(() => {
    if (!selectedBusId) return;

    fetchBoardingData(selectedBusId, false);
    const interval = setInterval(() => {
      fetchBoardingData(selectedBusId, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedBusId]);

  const loadBuses = async () => {
    setLoading(true);
    try {
      const data = await apiService.buses.getAll();
      let list = Array.isArray(data) ? data : (data?.buses || []);
      if (list.length === 0) {
        list = [
          { id: 1, bus_number: 'TN 47 B 1001', bus_name: 'Campus Express - Karur Route' },
          { id: 2, bus_number: 'TN 47 B 1002', bus_name: 'Dindigul Metro Express' },
          { id: 3, bus_number: 'TN 47 B 1003', bus_name: 'Trichy Highway Line' },
          { id: 4, bus_number: 'TN 47 B 1004', bus_name: 'Namakkal Circular Line' },
          { id: 5, bus_number: 'TN 47 B 1005', bus_name: 'Erode Semi-Express' }
        ];
      }
      setBuses(list);
      if (list.length > 0 && !selectedBusId) {
        setSelectedBusId(list[0].id);
      }
    } catch (err) {
      console.warn('[BOARDING DASHBOARD] Using local fleet cache:', err?.message || err);
      const fallbackList = [
        { id: 1, bus_number: 'TN 47 B 1001', bus_name: 'Campus Express - Karur Route' },
        { id: 2, bus_number: 'TN 47 B 1002', bus_name: 'Dindigul Metro Express' },
        { id: 3, bus_number: 'TN 47 B 1003', bus_name: 'Trichy Highway Line' },
        { id: 4, bus_number: 'TN 47 B 1004', bus_name: 'Namakkal Circular Line' },
        { id: 5, bus_number: 'TN 47 B 1005', bus_name: 'Erode Semi-Express' }
      ];
      setBuses(fallbackList);
      if (!selectedBusId) {
        setSelectedBusId(fallbackList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardingData = async (busId, isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [summaryRes, eventsRes] = await Promise.all([
        boardingAPI.getSummary(busId).catch(() => ({ summary: null, anomalies: [] })),
        boardingAPI.getEvents(busId, 30).catch(() => [])
      ]);

      if (summaryRes) {
        setBoardingSummary(summaryRes.summary || {
          total_boardings: 0,
          verified_boardings: 0,
          completed_boardings: 0,
          absent_count: 0
        });
        setAnomalies(summaryRes.anomalies || []);
      }

      if (Array.isArray(eventsRes)) {
        setRecentEvents(eventsRes);
      }
    } catch (err) {
      console.error('[BOARDING DASHBOARD] Error fetching boarding data:', err);
    } finally {
      if (!isSilent) setRefreshing(false);
    }
  };

  const handleOpenOverride = (event) => {
    setSelectedEventForOverride(event);
    setOverrideReason('Authorized by bus supervisor / transport officer');
    setOverrideModalOpen(true);
  };

  const handleConfirmOverride = async () => {
    if (!selectedEventForOverride) return;
    setActionLoading(true);
    try {
      await boardingAPI.override(selectedEventForOverride.id, {
        reason: overrideReason,
        inChargeId: user?.id || 1
      });

      showToast(`Boarding cleared for ${selectedEventForOverride.full_name || 'student'}`, 'success');
      setOverrideModalOpen(false);
      setSelectedEventForOverride(null);
      // Refresh current bus data
      if (selectedBusId) fetchBoardingData(selectedBusId, false);
    } catch (err) {
      console.error('[OVERRIDE ERROR]', err);
      showToast(err?.message || 'Failed to submit override.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#22c55e',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <CheckCircle2 size={13} /> VERIFIED
          </span>
        );
      case 'WRONG_BUS':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <XCircle size={13} /> WRONG BUS
          </span>
        );
      case 'WRONG_STOP':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(234, 179, 8, 0.12)',
            color: '#eab308',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <AlertTriangle size={13} /> WRONG STOP
          </span>
        );
      case 'UNKNOWN_STUDENT':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#a855f7',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <UserX size={13} /> UNKNOWN
          </span>
        );
      case 'SPOOFING_DETECTED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#f43f5e',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <ShieldAlert size={13} /> SPOOF ATTACK
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#222',
            color: '#aaa',
            border: '1px solid #333',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            <HelpCircle size={13} /> {status || 'PENDING'}
          </span>
        );
    }
  };

  const selectedBus = useMemo(() => {
    return buses.find((b) => b.id === selectedBusId) || null;
  }, [buses, selectedBusId]);

  const filteredEvents = useMemo(() => {
    return recentEvents.filter((ev) => {
      const matchesSearch =
        !searchQuery ||
        ev.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.register_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || ev.verification_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recentEvents, searchQuery, statusFilter]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void, #080808)',
      color: '#ffffff',
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
      padding: '28px 36px 80px'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: toastMessage.type === 'error' ? '#7f1d1d' : '#14532d',
          border: `1px solid ${toastMessage.type === 'error' ? '#ef4444' : '#22c55e'}`,
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
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
        borderBottom: '1px solid #222',
        paddingBottom: '20px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '2px 8px',
              borderRadius: '2px',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              DOOR_FOOTSTEP LIVE STREAM
            </span>
          </div>
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Bus size={26} /> STUDENT BOARDING VERIFICATION CONSOLE
          </h1>
          <p style={{
            color: 'var(--text-secondary, #888)',
            fontSize: '0.82rem',
            margin: '4px 0 0',
            maxWidth: '650px'
          }}>
            V.S.B Engineering College • Edge Vision Biometric Authorization Engine. Verifies student credentials, bus seat allocation, and boarding waypoints in real time.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => selectedBusId && fetchBoardingData(selectedBusId, false)}
            className="mono-btn"
            disabled={refreshing}
            style={{
              background: refreshing ? '#222' : '#ffffff',
              color: refreshing ? '#aaa' : '#000000',
              border: '1px solid #fff',
              padding: '8px 16px',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              borderRadius: '4px'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'SYNCING...' : '[ SYNC TELEMETRY ]'}
          </button>
        </div>
      </div>

      {/* Bus Selection Banner */}
      <div style={{
        background: '#111',
        border: '1px solid #222',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#ccc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bus size={18} /> ACTIVE BUS MONITOR:
          </label>
          <select
            value={selectedBusId || ''}
            onChange={(e) => setSelectedBusId(parseInt(e.target.value))}
            style={{
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #3b82f6',
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              fontWeight: 700,
              cursor: 'pointer',
              minWidth: '260px'
            }}
          >
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.bus_number || `BUS-${bus.id}`} — {bus.registration_number || 'TN-REG'} ({bus.capacity || 50} seats)
              </option>
            ))}
          </select>
        </div>

        {selectedBus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: '#888' }}>
            <div>REG: <strong style={{ color: '#fff' }}>{selectedBus.registration_number}</strong></div>
            <div>STATUS: <strong style={{ color: '#22c55e' }}>{selectedBus.status || 'ACTIVE'}</strong></div>
            <div>POLL INTERVAL: <strong style={{ color: '#3b82f6' }}>3.0s AUTO</strong></div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Boardings */}
        <div style={{
          background: '#121212',
          border: '1px solid #242424',
          padding: '18px 20px',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem', fontWeight: 800 }}>
            <span>TOTAL BOARDINGS TODAY</span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#ffffff' }}>
            {boardingSummary?.total_boardings || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px' }}>
            Registered door footstep passings
          </div>
        </div>

        {/* Verified */}
        <div style={{
          background: '#121212',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '18px 20px',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e', fontSize: '0.75rem', fontWeight: 800 }}>
            <span>VERIFIED PASSENGERS</span>
            <CheckCircle2 size={16} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#22c55e' }}>
            {boardingSummary?.verified_boardings || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(34, 197, 94, 0.7)', marginTop: '4px' }}>
            100% Biometric & route match
          </div>
        </div>

        {/* Anomalies Detected */}
        <div style={{
          background: '#121212',
          border: `1px solid ${anomalies.length > 0 ? 'rgba(239, 68, 68, 0.5)' : '#242424'}`,
          padding: '18px 20px',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: anomalies.length > 0 ? '#ef4444' : '#888', fontSize: '0.75rem', fontWeight: 800 }}>
            <span>ANOMALIES & BREACHES</span>
            <AlertTriangle size={16} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: anomalies.length > 0 ? '#ef4444' : '#fff' }}>
            {anomalies.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px' }}>
            Wrong bus, stop mismatch, unknown
          </div>
        </div>

        {/* Absent */}
        <div style={{
          background: '#121212',
          border: '1px solid #242424',
          padding: '18px 20px',
          borderRadius: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem', fontWeight: 800 }}>
            <span>SCHEDULED ABSENT</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#ffffff' }}>
            {boardingSummary?.absent_count || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '4px' }}>
            Allocated students not checked in
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid #222',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('summary')}
          style={{
            background: activeTab === 'summary' ? '#1c1c1c' : 'transparent',
            color: activeTab === 'summary' ? '#ffffff' : '#888',
            border: 'none',
            borderBottom: activeTab === 'summary' ? '2px solid #ffffff' : '2px solid transparent',
            padding: '10px 18px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={16} /> [ OVERVIEW & SUMMARY ]
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          style={{
            background: activeTab === 'anomalies' ? '#1c1c1c' : 'transparent',
            color: activeTab === 'anomalies' ? '#ef4444' : '#888',
            border: 'none',
            borderBottom: activeTab === 'anomalies' ? '2px solid #ef4444' : '2px solid transparent',
            padding: '10px 18px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} /> [ ANOMALIES & ALERTS ({anomalies.length}) ]
        </button>

        <button
          onClick={() => setActiveTab('events')}
          style={{
            background: activeTab === 'events' ? '#1c1c1c' : 'transparent',
            color: activeTab === 'events' ? '#ffffff' : '#888',
            border: 'none',
            borderBottom: activeTab === 'events' ? '2px solid #ffffff' : '2px solid transparent',
            padding: '10px 18px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={16} /> [ LIVE EVENT STREAM ({recentEvents.length}) ]
        </button>
      </div>

      {/* Tab 1: Summary Tab */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Left panel: Verification logic overview */}
          <div style={{
            background: '#121212',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '22px'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#22c55e" /> AUTOMATED BOARDING AUDIT CRITERIA
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#22c55e', fontWeight: 900 }}>1.</span>
                <div>
                  <strong style={{ color: '#fff' }}>Optical Face Capture (DOOR_FOOTSTEP):</strong> Door sensor camera captures 1080p frame at 30 FPS upon passenger entrance threshold trigger.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#22c55e', fontWeight: 900 }}>2.</span>
                <div>
                  <strong style={{ color: '#fff' }}>128-D Biometric Match:</strong> Euclidean distance comparison against enrolled student face embedding vector in institutional database.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#22c55e', fontWeight: 900 }}>3.</span>
                <div>
                  <strong style={{ color: '#fff' }}>Bus Allocation Verification:</strong> Validates student's active bus pass matches current bus (<span style={{ color: '#3b82f6' }}>{selectedBus?.bus_number || 'N/A'}</span>). Flags <span style={{ color: '#ef4444' }}>WRONG_BUS</span> if mismatched.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#22c55e', fontWeight: 900 }}>4.</span>
                <div>
                  <strong style={{ color: '#fff' }}>Boarding Waypoint Check:</strong> Validates GPS coordinates or stop id matches student's designated stop. Flags <span style={{ color: '#eab308' }}>WRONG_STOP</span> if boarding elsewhere.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#22c55e', fontWeight: 900 }}>5.</span>
                <div>
                  <strong style={{ color: '#fff' }}>Attendance Ledger Commit:</strong> Upon verification, automatically logs session in <code style={{ color: '#22c55e' }}>student_attendance_log</code> with <code style={{ color: '#22c55e' }}>verified_by_biometric = true</code>.
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Active Fleet Summary */}
          <div style={{
            background: '#121212',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '22px'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="#3b82f6" /> CURRENT BUS TELEMETRY
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c1c', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>BUS IDENTIFIER:</span>
                <span style={{ fontWeight: 800 }}>{selectedBus?.bus_number || `BUS-${selectedBusId}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c1c', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>REGISTRATION NUMBER:</span>
                <span style={{ fontWeight: 800 }}>{selectedBus?.registration_number || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c1c', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>CAPACITY / SEATING:</span>
                <span style={{ fontWeight: 800 }}>{selectedBus?.capacity || 50} PASSENGERS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c1c', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>OCCUPANCY RATE:</span>
                <span style={{ fontWeight: 800, color: '#22c55e' }}>
                  {Math.round(((boardingSummary?.verified_boardings || 0) / (selectedBus?.capacity || 50)) * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1c1c1c', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>UNRESOLVED ANOMALIES:</span>
                <span style={{ fontWeight: 800, color: anomalies.length > 0 ? '#ef4444' : '#22c55e' }}>
                  {anomalies.length} PENDING ACTION
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>LAST TELEMETRY UPDATE:</span>
                <span style={{ color: '#aaa' }}>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {anomalies.length > 0 && (
              <div style={{
                marginTop: '16px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 14px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700 }}>
                  ⚠️ {anomalies.length} anomaly requires supervisor attention
                </div>
                <button
                  onClick={() => setActiveTab('anomalies')}
                  className="mono-btn"
                  style={{
                    background: '#ef4444',
                    color: '#000',
                    border: 'none',
                    padding: '6px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  REVIEW NOW
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Anomalies & Alerts Tab */}
      {activeTab === 'anomalies' && (
        <div>
          <div style={{
            background: '#121212',
            border: '1px solid #222',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #222',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} /> BOARDING ANOMALIES & AUDIT BREACHES
                </h3>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.75rem' }}>
                  Showing passengers flagged with wrong bus allocation, stop mismatch, or unrecognized biometrics within last 24 hours.
                </p>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>
                COUNT: <strong>{anomalies.length}</strong>
              </span>
            </div>

            {anomalies.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#22c55e' }}>
                <CheckCircle2 size={40} style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>ZERO ACTIVE ANOMALIES</div>
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '4px' }}>
                  All passengers boarding Bus {selectedBus?.bus_number || selectedBusId} are authorized and cleared.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#161616', color: '#888', borderBottom: '1px solid #222' }}>
                      <th style={{ padding: '12px 16px' }}>VERIFICATION STATUS</th>
                      <th style={{ padding: '12px 16px' }}>STUDENT NAME</th>
                      <th style={{ padding: '12px 16px' }}>REGISTER #</th>
                      <th style={{ padding: '12px 16px' }}>CONFIDENCE</th>
                      <th style={{ padding: '12px 16px' }}>ASSIGNED ROUTE / BUS</th>
                      <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>SUPERVISOR ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((anom) => (
                      <tr key={anom.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                        <td style={{ padding: '14px 16px' }}>
                          {getStatusBadge(anom.verification_status)}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                          {anom.full_name}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#aaa' }}>
                          {anom.register_number}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            color: (anom.confidence_score || 0) >= 0.85 ? '#22c55e' : '#eab308',
                            fontWeight: 800
                          }}>
                            {Math.round((anom.confidence_score || 0) * 100)}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#aaa' }}>
                          {anom.assigned_bus_id ? `Assigned to Bus ${anom.assigned_bus_id}` : 'No Assignment'}
                          {anom.assigned_stop_id && ` (Stop ${anom.assigned_stop_id})`}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#666', fontSize: '0.75rem' }}>
                          {new Date(anom.created_at).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {anom.override_status === 'APPROVED' ? (
                            <span style={{
                              color: '#22c55e',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Check size={14} /> OVERRIDDEN
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenOverride(anom)}
                              className="mono-btn"
                              style={{
                                background: '#22c55e',
                                color: '#000000',
                                border: 'none',
                                padding: '6px 14px',
                                fontSize: '0.72rem',
                                fontWeight: 900,
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                            >
                              [ AUTHORIZE OVERRIDE ]
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Live Event Stream Tab */}
      {activeTab === 'events' && (
        <div style={{
          background: '#121212',
          border: '1px solid #222',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #222',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#3b82f6" /> REAL-TIME BOARDING AUDIT LOG
              </h3>
              <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.75rem' }}>
                All incoming door vision telemetry events sorted chronologically (latest first).
              </p>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search student or reg #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  padding: '6px 10px',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit'
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  padding: '6px 10px',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit'
                }}
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="WRONG_BUS">WRONG_BUS</option>
                <option value="WRONG_STOP">WRONG_STOP</option>
                <option value="UNKNOWN_STUDENT">UNKNOWN_STUDENT</option>
              </select>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '0.82rem' }}>
              No boarding events recorded matching the current filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    background: ev.verification_status !== 'VERIFIED' ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '130px' }}>
                      {getStatusBadge(ev.verification_status)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                        {ev.full_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                        Reg: <span style={{ color: '#bbb' }}>{ev.register_number}</span> • Match: <strong style={{ color: '#22c55e' }}>{Math.round((ev.confidence_score || 0) * 100)}%</strong>
                        {ev.override_status === 'APPROVED' && (
                          <span style={{ marginLeft: '10px', color: '#3b82f6', fontWeight: 700 }}>
                            [OVERRIDE APPROVED]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </div>
                    {ev.verification_status !== 'VERIFIED' && ev.override_status !== 'APPROVED' && (
                      <button
                        onClick={() => handleOpenOverride(ev)}
                        className="mono-btn"
                        style={{
                          background: '#1f2937',
                          color: '#e5e7eb',
                          border: '1px solid #374151',
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Override
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Override Modal */}
      {overrideModalOpen && selectedEventForOverride && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#141414',
            border: '1px solid #333',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#eab308" /> SUPERVISOR MANUAL OVERRIDE
              </h3>
              <button
                onClick={() => setOverrideModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: '#0d0d0d',
              border: '1px solid #222',
              borderRadius: '4px',
              padding: '14px',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              marginBottom: '18px'
            }}>
              <div>STUDENT: <strong style={{ color: '#fff' }}>{selectedEventForOverride.full_name}</strong></div>
              <div>REGISTER #: <strong style={{ color: '#fff' }}>{selectedEventForOverride.register_number}</strong></div>
              <div>ANOMALY: <span style={{ color: '#ef4444', fontWeight: 800 }}>{selectedEventForOverride.verification_status}</span></div>
              <div>CONFIDENCE: <strong style={{ color: '#22c55e' }}>{Math.round((selectedEventForOverride.confidence_score || 0) * 100)}%</strong></div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', fontWeight: 800, marginBottom: '6px' }}>
                AUTHORIZATION REASON (AUDIT LOG):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  padding: '10px',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit'
                }}
                placeholder="Specify clinical, administrative, or route rearrangement rationale..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="mono-btn"
                style={{
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #333',
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={actionLoading}
                className="mono-btn"
                style={{
                  background: '#22c55e',
                  color: '#000000',
                  border: 'none',
                  padding: '8px 18px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  borderRadius: '4px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {actionLoading ? 'COMMITTING...' : '[ APPROVE & RECORD ATTENDANCE ]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
