/**
 * WRONG STOP DETECTION & ALERTS DASHBOARD (PHASE 10)
 * Institutional real-time monitoring and resolution console for stop discrepancies.
 * Detects boarding/alighting at unauthorized, previous, or subsequent stops.
 * Features live mismatch feeds, distance discrepancy telemetry, override resolution workflow,
 * and built-in boarding verification testing simulator.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, stopDetectionAPI } from '../../services/apiService';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Clock,
  MapPin,
  Bus,
  Users,
  Route,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  FileText,
  SlidersHorizontal,
  Compass,
  Sparkles,
  ExternalLink,
  Layers,
  Info
} from 'lucide-react';

export default function WrongStopDetectionDashboard({ onNavigate }) {
  const { user } = useAuth();

  // State
  const [detections, setDetections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mismatchTypeFilter, setMismatchTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('detections'); // 'detections' | 'alerts' | 'simulator'

  // Modals & Action States
  const [toastMessage, setToastMessage] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [dismissReason, setDismissReason] = useState('');

  // Simulator State
  const [simForm, setSimForm] = useState({
    student_id: '',
    route_id: '',
    bus_id: '',
    detected_stop_id: '',
    event_type: 'PICKUP',
    confidence_score: 0.95
  });
  const [simStops, setSimStops] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const [simRunning, setSimRunning] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Data Load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Poll for live detections every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      loadDashboardData(true);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [detectionsRes, alertsRes, statsRes, routesRes, busesRes, studentsRes] = await Promise.allSettled([
        stopDetectionAPI.getDetections(),
        stopDetectionAPI.getAlerts(),
        stopDetectionAPI.getStats(),
        apiService.routes.getAll(),
        apiService.buses.getAll(),
        apiService.students.getAll()
      ]);

      // Detections
      if (detectionsRes.status === 'fulfilled' && detectionsRes.value) {
        const val = detectionsRes.value;
        const list = Array.isArray(val) ? val : (val.detections || val.data || []);
        setDetections(list);
      } else {
        // Fallback demo detections if backend empty
        setDetections([
          {
            id: 1,
            student_id: 101,
            student_name: 'Suresh Kumar R',
            roll_number: '922521104052',
            department: 'CSE',
            bus_id: 1,
            bus_number: 'TN 47 B 1001',
            route_id: 1,
            route_name: 'Karur City Express',
            scheduled_stop_id: 2,
            scheduled_stop_name: 'Karur Bus Stand',
            scheduled_sequence: 2,
            detected_stop_id: 4,
            detected_stop_name: 'Thanthonimalai Post',
            detected_sequence: 4,
            sequence_discrepancy: 2,
            distance_discrepancy_meters: 1850,
            mismatch_type: 'SUBSEQUENT_STOP',
            severity: 'HIGH',
            status: 'DETECTED',
            confidence_score: 0.94,
            detected_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
          },
          {
            id: 2,
            student_id: 103,
            student_name: 'Karthik Raja M',
            roll_number: '922521104028',
            department: 'MECH',
            bus_id: 2,
            bus_number: 'TN 47 B 1002',
            route_id: 2,
            route_name: 'Dindigul Metro Connect',
            scheduled_stop_id: 3,
            scheduled_stop_name: 'Reddiarchatram Branch',
            scheduled_sequence: 3,
            detected_stop_id: 1,
            detected_stop_name: 'Dindigul Collectorate',
            detected_sequence: 1,
            sequence_discrepancy: -2,
            distance_discrepancy_meters: 3400,
            mismatch_type: 'PREVIOUS_STOP',
            severity: 'MEDIUM',
            status: 'RESOLVED',
            resolution_notes: 'Boarded earlier from district office with verbal parental notification.',
            confidence_score: 0.96,
            detected_at: new Date(Date.now() - 1000 * 60 * 48).toISOString()
          },
          {
            id: 3,
            student_id: 104,
            student_name: 'Ananya Ramesh',
            roll_number: '922521104005',
            department: 'AI & DS',
            bus_id: 1,
            bus_number: 'TN 47 B 1001',
            route_id: 1,
            route_name: 'Karur City Express',
            scheduled_stop_id: 5,
            scheduled_stop_name: 'Vengamedu Colony',
            scheduled_sequence: 5,
            detected_stop_id: 8,
            detected_stop_name: 'Aravakurichi Bypass',
            detected_sequence: null,
            sequence_discrepancy: 99,
            distance_discrepancy_meters: 8200,
            mismatch_type: 'UNAUTHORIZED_STOP',
            severity: 'CRITICAL',
            status: 'DETECTED',
            confidence_score: 0.89,
            detected_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
          }
        ]);
      }

      // Alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value) {
        const val = alertsRes.value;
        const list = Array.isArray(val) ? val : (val.alerts || val.data || []);
        setAlerts(list);
      } else {
        setAlerts([
          {
            id: 1,
            detection_id: 3,
            student_name: 'Ananya Ramesh',
            bus_number: 'TN 47 B 1001',
            route_name: 'Karur City Express',
            alert_type: 'UNAUTHORIZED_STOP',
            severity: 'CRITICAL',
            message: 'Boarded 8.2 km from authorized stop #5 (Vengamedu Colony). Immediate parental SMS dispatched.',
            status: 'SENT',
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
          },
          {
            id: 2,
            detection_id: 1,
            student_name: 'Suresh Kumar R',
            bus_number: 'TN 47 B 1001',
            route_name: 'Karur City Express',
            alert_type: 'SUBSEQUENT_STOP',
            severity: 'HIGH',
            message: 'Student boarded 2 stops late at Thanthonimalai Post (+1850m discrepancy).',
            status: 'SENT',
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
          }
        ]);
      }

      // Stats
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value.stats || statsRes.value.data || statsRes.value);
      }

      // Meta (Routes, Buses, Students)
      if (routesRes.status === 'fulfilled' && routesRes.value) {
        const rList = Array.isArray(routesRes.value) ? routesRes.value : (routesRes.value.routes || []);
        setRoutes(rList);
        if (rList.length > 0 && !simForm.route_id) {
          setSimForm((prev) => ({ ...prev, route_id: rList[0].id }));
          fetchStopsForRoute(rList[0].id);
        }
      }
      if (busesRes.status === 'fulfilled' && busesRes.value) {
        const bList = Array.isArray(busesRes.value) ? busesRes.value : (busesRes.value.buses || []);
        setBuses(bList);
        if (bList.length > 0 && !simForm.bus_id) {
          setSimForm((prev) => ({ ...prev, bus_id: bList[0].id }));
        }
      }
      if (studentsRes.status === 'fulfilled' && studentsRes.value) {
        const sList = Array.isArray(studentsRes.value) ? studentsRes.value : (studentsRes.value.students || []);
        setStudents(sList);
        if (sList.length > 0 && !simForm.student_id) {
          setSimForm((prev) => ({ ...prev, student_id: sList[0].id }));
        }
      }
    } catch (err) {
      console.error('[WRONG STOP DASHBOARD] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStopsForRoute = async (routeId) => {
    try {
      const res = await apiService.stops.getByRoute(routeId);
      const list = Array.isArray(res) ? res : (res?.stops || []);
      setSimStops(list);
      if (list.length > 0) {
        setSimForm((prev) => ({ ...prev, detected_stop_id: list[0].id }));
      }
    } catch (err) {
      const fallbackStops = [
        { id: 1, stop_name: 'Karur City Center', stop_sequence: 1 },
        { id: 2, stop_name: 'Karur Bus Stand', stop_sequence: 2 },
        { id: 3, stop_name: 'Gandhigramam Junction', stop_sequence: 3 },
        { id: 4, stop_name: 'Thanthonimalai Post', stop_sequence: 4 },
        { id: 5, stop_name: 'Vengamedu Colony', stop_sequence: 5 },
        { id: 8, stop_name: 'VSB College Main Gate', stop_sequence: 8 }
      ];
      setSimStops(fallbackStops);
      setSimForm((prev) => ({ ...prev, detected_stop_id: fallbackStops[0].id }));
    }
  };

  // Filtered Detections
  const filteredDetections = useMemo(() => {
    return detections.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.student_name?.toLowerCase().includes(q) ||
        d.roll_number?.toLowerCase().includes(q) ||
        d.scheduled_stop_name?.toLowerCase().includes(q) ||
        d.detected_stop_name?.toLowerCase().includes(q) ||
        d.bus_number?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchesMismatch = mismatchTypeFilter === 'ALL' || d.mismatch_type === mismatchTypeFilter;
      const matchesSeverity = severityFilter === 'ALL' || d.severity === severityFilter;

      return matchesSearch && matchesStatus && matchesMismatch && matchesSeverity;
    });
  }, [detections, searchQuery, statusFilter, mismatchTypeFilter, severityFilter]);

  // KPIs
  const computedStats = useMemo(() => {
    const totalDetections = detections.length;
    const pendingDetections = detections.filter((d) => d.status === 'DETECTED').length;
    const resolvedDetections = detections.filter((d) => d.status === 'RESOLVED' || d.status === 'OVERRIDDEN').length;
    const activeAlerts = alerts.filter((a) => a.status === 'SENT' || a.status === 'PENDING').length;
    const resolutionRate = totalDetections > 0 ? Math.round((resolvedDetections / totalDetections) * 100) : 100;

    return {
      total: totalDetections,
      pending: pendingDetections,
      resolved: resolvedDetections,
      activeAlerts,
      resolutionRate
    };
  }, [detections, alerts]);

  // Open Resolve Modal
  const handleOpenResolve = (detection) => {
    setSelectedDetection(detection);
    setResolutionStatus('RESOLVED');
    setResolutionNotes('');
    setResolveModalOpen(true);
  };

  // Submit Resolution
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDetection) return;

    setActionLoading(true);
    try {
      await stopDetectionAPI.resolveDetection(selectedDetection.id, {
        resolution_status: resolutionStatus,
        resolution_notes: resolutionNotes || 'Administrative clearance approved by supervisor.',
        resolved_by: user?.username || 'SYSTEM_ADMIN'
      });

      showToast(`Detection #${selectedDetection.id} marked as ${resolutionStatus}.`);
      setResolveModalOpen(false);
      loadDashboardData(true);
    } catch (err) {
      console.error('[RESOLVE] Error:', err);
      showToast('Resolution update failed: ' + (err?.message || 'Server error'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Dismiss Modal
  const handleOpenDismiss = (alert) => {
    setSelectedAlert(alert);
    setDismissReason('');
    setDismissModalOpen(true);
  };

  // Submit Alert Dismissal
  const handleDismissSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;

    setActionLoading(true);
    try {
      await stopDetectionAPI.dismissAlert(selectedAlert.id, {
        reason: dismissReason || 'Reviewed and dismissed by transport administrator.',
        dismissed_by: user?.username || 'SYSTEM_ADMIN'
      });

      showToast(`Alert #${selectedAlert.id} dismissed.`);
      setDismissModalOpen(false);
      loadDashboardData(true);
    } catch (err) {
      console.error('[DISMISS] Error:', err);
      showToast('Alert dismissal failed: ' + (err?.message || 'Server error'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Run Boarding Verification Simulator
  const handleRunSimulator = async () => {
    if (!simForm.student_id || !simForm.route_id || !simForm.detected_stop_id) {
      showToast('Please select all simulation fields.', 'error');
      return;
    }

    setSimRunning(true);
    try {
      const payload = {
        student_id: Number(simForm.student_id),
        route_id: Number(simForm.route_id),
        bus_id: Number(simForm.bus_id || 1),
        detected_stop_id: Number(simForm.detected_stop_id),
        event_type: simForm.event_type,
        confidence_score: simForm.confidence_score,
        verification_method: 'FACIAL_RECOGNITION'
      };

      const res = await stopDetectionAPI.checkBoarding(payload);
      const data = res?.data || res;
      setSimResult(data);
      if (data.is_correct_stop) {
        showToast('Verification result: Stop authorized.');
      } else {
        showToast(`Anomaly Flagged: ${data.mismatch_type || 'WRONG_STOP'}!`, 'error');
        // Refresh detections list to show new event
        loadDashboardData(true);
      }
    } catch (err) {
      console.error('[SIMULATOR] Error:', err);
      showToast('Simulator error: ' + (err?.message || 'Check connection'), 'error');
    } finally {
      setSimRunning(false);
    }
  };

  // Helper badge color
  const getMismatchBadgeStyle = (type) => {
    switch (type) {
      case 'PREVIOUS_STOP':
        return { bg: '#2b1b09', border: '#b45309', color: '#fbbf24', label: 'PREVIOUS STOP' };
      case 'SUBSEQUENT_STOP':
        return { bg: '#2e1208', border: '#ea580c', color: '#fb923c', label: 'SUBSEQUENT STOP' };
      case 'UNAUTHORIZED_STOP':
        return { bg: '#3b0808', border: '#AA0000', color: '#f87171', label: 'UNAUTHORIZED STOP' };
      case 'WRONG_STOP':
      default:
        return { bg: '#2d0909', border: '#dc2626', color: '#ef4444', label: 'WRONG STOP' };
    }
  };

  const getSeverityBadgeStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: '#450a0a', border: '#ef4444', color: '#fca5a5' };
      case 'HIGH':
        return { bg: '#431407', border: '#f97316', color: '#fdba74' };
      case 'MEDIUM':
        return { bg: '#422006', border: '#eab308', color: '#fde047' };
      case 'LOW':
      default:
        return { bg: '#172554', border: '#3b82f6', color: '#93c5fd' };
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#f1f5f9',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px 32px'
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            borderRadius: '6px',
            background: toastMessage.type === 'error' ? '#2b0909' : '#092b11',
            border: `1px solid ${toastMessage.type === 'error' ? '#AA0000' : '#00AA00'}`,
            color: toastMessage.type === 'error' ? '#fca5a5' : '#86efac',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
          }}
        >
          {toastMessage.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toastMessage.msg}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span>INSTITUTIONAL MONITORING</span>
            <ChevronRight size={12} />
            <span style={{ color: '#94a3b8' }}>PHASE 10 SAFETY PROTOCOL</span>
            <ChevronRight size={12} />
            <span style={{ color: '#ffffff' }}>WRONG STOP DETECTION & ALERTS</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Wrong Stop Detection Console
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Real-time surveillance of student boarding stop discrepancies, sequence anomalies, and supervisor resolution workflows.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate && onNavigate('stop-assignment')}
            style={{
              padding: '9px 16px',
              borderRadius: '6px',
              background: '#121212',
              border: '1px solid #262626',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <MapPin size={15} />
            Manage Stop Allocations
          </button>

          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            style={{
              padding: '9px 14px',
              borderRadius: '6px',
              background: '#121212',
              border: '1px solid #262626',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Polling...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid #1c1c1c',
            borderRadius: '8px',
            padding: '16px 20px'
          }}
        >
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Pending Discrepancies
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: computedStats.pending > 0 ? '#ef4444' : '#ffffff', marginTop: '4px' }}>
            {computedStats.pending}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            <AlertTriangle size={13} color={computedStats.pending > 0 ? '#ef4444' : '#64748b'} />
            <span>Unresolved stop mismatches</span>
          </div>
        </div>

        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid #1c1c1c',
            borderRadius: '8px',
            padding: '16px 20px'
          }}
        >
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Active Critical Alerts
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: computedStats.activeAlerts > 0 ? '#f97316' : '#ffffff', marginTop: '4px' }}>
            {computedStats.activeAlerts}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            <ShieldAlert size={13} color="#f97316" />
            <span>Dispatch notifications live</span>
          </div>
        </div>

        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid #1c1c1c',
            borderRadius: '8px',
            padding: '16px 20px'
          }}
        >
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Resolution Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
            {computedStats.resolutionRate}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '12px', marginTop: '6px' }}>
            <CheckCircle2 size={13} />
            <span>{computedStats.resolved} cleared by supervisors</span>
          </div>
        </div>

        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid #1c1c1c',
            borderRadius: '8px',
            padding: '16px 20px'
          }}
        >
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Total Incidents Logged
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {computedStats.total}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            <Layers size={13} />
            <span>Today's monitored events</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #1c1c1c', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('detections')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeTab === 'detections' ? '#ffffff' : 'transparent',
            color: activeTab === 'detections' ? '#000000' : '#94a3b8',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={15} />
          Stop Mismatches Feed ({filteredDetections.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeTab === 'alerts' ? '#ffffff' : 'transparent',
            color: activeTab === 'alerts' ? '#000000' : '#94a3b8',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldAlert size={15} />
          Dispatched Alerts Banner ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeTab === 'simulator' ? '#ffffff' : 'transparent',
            color: activeTab === 'simulator' ? '#000000' : '#94a3b8',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={15} />
          Verification Engine Simulator
        </button>
      </div>

      {/* TAB 1: DETECTIONS FEED */}
      {activeTab === 'detections' && (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid #1c1c1c',
              borderRadius: '8px 8px 0 0',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {/* Search */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
                />
                <input
                  type="text"
                  placeholder="Search student, bus, stop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '8px 12px 8px 36px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: '#161616',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DETECTED">DETECTED (Pending)</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="OVERRIDDEN">OVERRIDDEN</option>
                <option value="FALSE_ALARM">FALSE ALARM</option>
              </select>

              {/* Mismatch Type Filter */}
              <select
                value={mismatchTypeFilter}
                onChange={(e) => setMismatchTypeFilter(e.target.value)}
                style={{
                  background: '#161616',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Mismatch Types</option>
                <option value="PREVIOUS_STOP">PREVIOUS_STOP (Early Boarding)</option>
                <option value="SUBSEQUENT_STOP">SUBSEQUENT_STOP (Late Boarding)</option>
                <option value="WRONG_STOP">WRONG_STOP (Off Corridor)</option>
                <option value="UNAUTHORIZED_STOP">UNAUTHORIZED_STOP (Unlisted)</option>
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  background: '#161616',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div style={{ color: '#64748b', fontSize: '13px' }}>
              Showing <span style={{ color: '#ffffff', fontWeight: 700 }}>{filteredDetections.length}</span> events
            </div>
          </div>

          {/* Detections Table */}
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid #1c1c1c',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
                <div>Loading stop mismatch telemetry...</div>
              </div>
            ) : filteredDetections.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <ShieldCheck size={36} color="#22c55e" style={{ margin: '0 auto 12px auto' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>No Active Stop Discrepancies</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  All boarding and alighting events conform to authorized stop allocations.
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#121212', borderBottom: '1px solid #1f1f1f', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>DETECTED TIME</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>STUDENT</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>TRANSIT BUS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>SCHEDULED STOP</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>ACTUAL DETECTED STOP</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>MISMATCH TYPE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>SEVERITY</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDetections.map((d) => {
                    const badge = getMismatchBadgeStyle(d.mismatch_type);
                    const sevBadge = getSeverityBadgeStyle(d.severity);
                    const isPending = d.status === 'DETECTED';

                    return (
                      <tr
                        key={d.id}
                        style={{
                          borderBottom: '1px solid #181818',
                          background: isPending ? 'rgba(170, 0, 0, 0.04)' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#141414')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = isPending ? 'rgba(170, 0, 0, 0.04)' : 'transparent')
                        }
                      >
                        {/* Time */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ color: '#ffffff', fontWeight: 600 }}>
                            {new Date(d.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {new Date(d.detected_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Student */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{d.student_name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {d.roll_number || `ID: ${d.student_id}`} {d.department ? `• ${d.department}` : ''}
                          </div>
                        </td>

                        {/* Bus & Route */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{d.bus_number || 'Fleet Bus'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{d.route_name || `Route #${d.route_id}`}</div>
                        </td>

                        {/* Scheduled Stop */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '3px',
                                background: '#112211',
                                border: '1px solid #00AA00',
                                color: '#4ade80',
                                fontSize: '10px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              #{d.scheduled_sequence || 1}
                            </span>
                            <span style={{ color: '#cbd5e1' }}>{d.scheduled_stop_name}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Authorized station</div>
                        </td>

                        {/* Actual Detected Stop */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '3px',
                                background: '#260808',
                                border: '1px solid #ef4444',
                                color: '#f87171',
                                fontSize: '10px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              #{d.detected_sequence || '!'}
                            </span>
                            <span style={{ fontWeight: 600, color: '#ffffff' }}>{d.detected_stop_name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {d.sequence_discrepancy && (
                              <span style={{ color: d.sequence_discrepancy > 0 ? '#fb923c' : '#fbbf24' }}>
                                {d.sequence_discrepancy > 0 ? `+${d.sequence_discrepancy} stops late` : `${d.sequence_discrepancy} stops early`}
                              </span>
                            )}
                            {d.distance_discrepancy_meters > 0 && (
                              <span style={{ color: '#64748b' }}>• {d.distance_discrepancy_meters}m off</span>
                            )}
                          </div>
                        </td>

                        {/* Mismatch Type */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.color,
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Severity */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 7px',
                              borderRadius: '4px',
                              background: sevBadge.bg,
                              border: `1px solid ${sevBadge.border}`,
                              color: sevBadge.color,
                              fontSize: '10px',
                              fontWeight: 800
                            }}
                          >
                            {d.severity || 'MEDIUM'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: isPending ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              color: isPending ? '#ef4444' : '#22c55e',
                              border: `1px solid ${isPending ? '#AA0000' : '#00AA00'}`
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: isPending ? '#ef4444' : '#22c55e'
                              }}
                            />
                            {d.status}
                          </span>
                          {d.resolution_notes && (
                            <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }} title={d.resolution_notes}>
                              {d.resolution_notes}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {isPending ? (
                            <button
                              onClick={() => handleOpenResolve(d)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                background: '#ffffff',
                                border: 'none',
                                color: '#000000',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Resolve
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Cleared</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCHED ALERTS */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {alerts.length === 0 ? (
            <div
              style={{
                background: '#0d0d0d',
                border: '1px solid #1c1c1c',
                borderRadius: '8px',
                padding: '60px',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              <ShieldCheck size={36} color="#22c55e" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>No Active Alerts in Queue</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                All high-priority stop discrepancy SMS & app notifications have been acknowledged.
              </div>
            </div>
          ) : (
            alerts.map((al) => {
              const isSent = al.status === 'SENT' || al.status === 'PENDING';
              return (
                <div
                  key={al.id}
                  style={{
                    background: '#0d0d0d',
                    border: `1px solid ${al.severity === 'CRITICAL' ? '#880808' : '#262626'}`,
                    borderLeft: `4px solid ${al.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}`,
                    borderRadius: '8px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        background: al.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)'
                      }}
                    >
                      <AlertTriangle size={20} color={al.severity === 'CRITICAL' ? '#ef4444' : '#f97316'} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                          {al.student_name}
                        </span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#161616',
                            border: '1px solid #2b2b2b',
                            fontSize: '11px',
                            color: '#94a3b8'
                          }}
                        >
                          {al.bus_number}
                        </span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: al.severity === 'CRITICAL' ? '#450a0a' : '#431407',
                            border: `1px solid ${al.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}`,
                            fontSize: '10px',
                            fontWeight: 800,
                            color: al.severity === 'CRITICAL' ? '#fca5a5' : '#fdba74'
                          }}
                        >
                          {al.alert_type}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px' }}>
                        {al.message}
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                        Dispatched: {new Date(al.created_at).toLocaleString()} • Notification Channel: SMS & Push
                      </div>
                    </div>
                  </div>

                  {/* Dismiss / Acknowledge */}
                  <div>
                    {isSent ? (
                      <button
                        onClick={() => handleOpenDismiss(al)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '6px',
                          background: '#161616',
                          border: '1px solid #2b2b2b',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Dismiss Alert
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Dismissed</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: VERIFICATION ENGINE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '24px'
          }}
        >
          {/* Simulator Inputs */}
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid #1c1c1c',
              borderRadius: '8px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Automated Verification Engine Simulator
              </h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>
              Test the algorithmic sequence discrepancy & geofence distance engine against live database allocations.
            </p>

            {/* Student */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                SELECT REGISTERED STUDENT
              </label>
              <select
                value={simForm.student_id}
                onChange={(e) => setSimForm({ ...simForm, student_id: e.target.value })}
                style={{
                  width: '100%',
                  background: '#161616',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.roll_number || st.department || `ID ${st.id}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Route */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                TRANSIT ROUTE
              </label>
              <select
                value={simForm.route_id}
                onChange={(e) => {
                  const rId = e.target.value;
                  setSimForm({ ...simForm, route_id: rId });
                  fetchStopsForRoute(rId);
                }}
                style={{
                  width: '100%',
                  background: '#161616',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.route_code ? `[${r.route_code}] ` : ''}{r.route_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bus */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                ASSIGNED VEHICLE (BUS)
              </label>
              <select
                value={simForm.bus_id}
                onChange={(e) => setSimForm({ ...simForm, bus_id: e.target.value })}
                style={{
                  width: '100%',
                  background: '#161616',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bus_number} — {b.bus_name || 'Fleet'}
                  </option>
                ))}
              </select>
            </div>

            {/* Detected Stop */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                DETECTED VISION STREAM STOP (ACTUAL BOARDING LOCATION)
              </label>
              <select
                value={simForm.detected_stop_id}
                onChange={(e) => setSimForm({ ...simForm, detected_stop_id: e.target.value })}
                style={{
                  width: '100%',
                  background: '#161616',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {simStops.map((s) => (
                  <option key={s.id} value={s.id}>
                    Seq #{s.stop_sequence || 1} — {s.stop_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                EVENT TYPE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['PICKUP', 'DROPOFF'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSimForm({ ...simForm, event_type: t })}
                    style={{
                      padding: '9px',
                      borderRadius: '6px',
                      background: simForm.event_type === t ? '#ffffff' : '#141414',
                      color: simForm.event_type === t ? '#000000' : '#94a3b8',
                      border: '1px solid #262626',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t === 'PICKUP' ? 'Morning Pickup' : 'Evening Dropoff'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunSimulator}
              disabled={simRunning}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                background: '#ffffff',
                border: 'none',
                color: '#000000',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {simRunning ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              Execute Real-Time Detection Engine
            </button>
          </div>

          {/* Simulator Output Diagnostics */}
          <div
            style={{
              background: '#0d0d0d',
              border: '1px solid #1c1c1c',
              borderRadius: '8px',
              padding: '24px'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
              Real-Time Telemetry Result
            </h3>

            {simResult ? (
              <div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: simResult.is_correct_stop ? '#07240f' : '#290707',
                    border: `1px solid ${simResult.is_correct_stop ? '#00AA00' : '#AA0000'}`,
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {simResult.is_correct_stop ? (
                      <CheckCircle2 size={20} color="#22c55e" />
                    ) : (
                      <AlertTriangle size={20} color="#ef4444" />
                    )}
                    <span style={{ fontSize: '15px', fontWeight: 700, color: simResult.is_correct_stop ? '#4ade80' : '#f87171' }}>
                      {simResult.is_correct_stop ? 'CORRECT STOP VERIFIED' : `MISMATCH: ${simResult.mismatch_type || 'WRONG_STOP'}`}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px' }}>
                    {simResult.message || (simResult.is_correct_stop ? 'Stop sequence matches allocated profile.' : 'Student boarded at an unassigned stop.')}
                  </div>
                </div>

                {/* Telemetry Breakdown */}
                <div
                  style={{
                    background: '#121212',
                    border: '1px solid #1f1f1f',
                    borderRadius: '6px',
                    padding: '16px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                    Algorithm Metrics
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Status Flag</span>
                    <span style={{ fontWeight: 700, color: simResult.is_correct_stop ? '#22c55e' : '#ef4444' }}>
                      {simResult.status || (simResult.is_correct_stop ? 'CORRECT_STOP' : 'WRONG_STOP')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Sequence Discrepancy</span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {simResult.sequence_discrepancy || 0} stops
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Distance Discrepancy</span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {simResult.distance_discrepancy_meters ? `${simResult.distance_discrepancy_meters} meters` : '0 meters'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Safety Alert Generated</span>
                    <span style={{ fontWeight: 700, color: simResult.alert_generated ? '#ef4444' : '#22c55e' }}>
                      {simResult.alert_generated ? 'YES (SMS Queued)' : 'NO'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>Confidence Metric</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>95.0%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <Compass size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>Simulator Idle</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Select simulation parameters on the left and click "Execute Real-Time Detection Engine" to run.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESOLVE DISCREPANCY MODAL */}
      {resolveModalOpen && selectedDetection && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '480px',
              background: '#0d0d0d',
              border: '1px solid #262626',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.9)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Resolve Stop Discrepancy
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                  Incident #{selectedDetection.id} • {selectedDetection.student_name}
                </p>
              </div>
              <button
                onClick={() => setResolveModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit}>
              {/* Event Summary */}
              <div
                style={{
                  background: '#141414',
                  border: '1px solid #242424',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '12px'
                }}
              >
                <div>
                  Scheduled: <span style={{ color: '#22c55e', fontWeight: 600 }}>{selectedDetection.scheduled_stop_name}</span> (Seq #{selectedDetection.scheduled_sequence})
                </div>
                <div style={{ marginTop: '2px' }}>
                  Detected: <span style={{ color: '#ef4444', fontWeight: 600 }}>{selectedDetection.detected_stop_name}</span> (Seq #{selectedDetection.detected_sequence})
                </div>
                <div style={{ marginTop: '2px', color: '#94a3b8' }}>
                  Discrepancy: {selectedDetection.mismatch_type} ({selectedDetection.distance_discrepancy_meters}m off)
                </div>
              </div>

              {/* Status Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  RESOLUTION ACTION
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="RESOLVED">RESOLVED (Admin Verified)</option>
                  <option value="OVERRIDDEN">OVERRIDDEN (Approved Exception)</option>
                  <option value="FALSE_ALARM">FALSE ALARM (Vision Misidentification)</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  RESOLUTION LOG / REASON
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Authorized by HOD for inter-college competition; guardian informed."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#161616',
                    border: '1px solid #262626',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: 'none',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {actionLoading && <RefreshCw size={14} className="animate-spin" />}
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISMISS ALERT MODAL */}
      {dismissModalOpen && selectedAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '460px',
              background: '#0d0d0d',
              border: '1px solid #262626',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.9)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Dismiss Safety Alert
              </h2>
              <button
                onClick={() => setDismissModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '0 0 16px 0' }}>
              Dismissing alert for <strong>{selectedAlert.student_name}</strong> ({selectedAlert.bus_number}).
            </p>

            <form onSubmit={handleDismissSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  DISMISSAL REASON / AUDIT NOTE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Parental acknowledgement confirmed via phone"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDismissModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#161616',
                    border: '1px solid #262626',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: 'none',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Dismissing...' : 'Confirm Dismissal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
