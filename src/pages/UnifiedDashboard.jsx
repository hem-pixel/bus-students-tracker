// FILE: src/pages/UnifiedDashboard.jsx
// PURPOSE: Unified Fleet Command Center & Default Landing Dashboard for all authenticated personnel.
// INSTITUTION: V.S.B. Engineering College (Autonomous), Karur • Department of AI & Data Science
// COLOR THEME: Strict Dark Monochrome (#080808, #121212, #1c1c1c, #ffffff, #00AA00, #FF6600, #AA0000). NO BLUE ACCENTS.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bus, 
  Camera, 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Clock, 
  ChevronRight, 
  Sliders, 
  Eye, 
  Maximize2, 
  Video, 
  Fingerprint, 
  ExternalLink,
  Cpu,
  Wifi,
  Search,
  Filter
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import WebcamCapture from '../components/WebcamCapture';

export default function UnifiedDashboard({ onNavigate }) {
  const { user } = useAuth();

  // Primary Data State
  const [buses, setBuses] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({ total_alerts: 0, active_alerts: 0, critical_count: 0 });
  const [studentStats, setStudentStats] = useState({ total: 0, eligible: 0, assigned: 0 });

  // UI & Network State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [backendOnline, setBackendOnline] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCameraForFeed, setSelectedCameraForFeed] = useState(null);
  const [isLiveCameraModalOpen, setIsLiveCameraModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const countdownTimerRef = useRef(null);

  // Fetch all dashboard data concurrently with full error resistance
  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    try {
      const [busesRes, camerasRes, studentsRes, alertsRes, alertStatsRes] = await Promise.allSettled([
        apiService.buses.getAll(),
        apiService.cameras.getAll(),
        apiService.students.getAll({ limit: 100 }),
        apiService.alerts.getActive(),
        apiService.alerts.getStats()
      ]);

      // Normalize Buses Data
      if (busesRes.status === 'fulfilled') {
        const rawBuses = busesRes.value;
        const normalizedBuses = Array.isArray(rawBuses) 
          ? rawBuses 
          : (rawBuses?.data || rawBuses?.buses || []);
        setBuses(normalizedBuses);
      }

      // Normalize Cameras Data
      if (camerasRes.status === 'fulfilled') {
        const rawCameras = camerasRes.value;
        const normalizedCameras = Array.isArray(rawCameras) 
          ? rawCameras 
          : (rawCameras?.data || rawCameras?.cameras || []);
        setCameras(normalizedCameras);
      }

      // Normalize Students Data
      if (studentsRes.status === 'fulfilled') {
        const rawStudents = studentsRes.value;
        const normalizedStudents = Array.isArray(rawStudents) 
          ? rawStudents 
          : (rawStudents?.data || rawStudents?.students || []);
        setStudents(normalizedStudents);
        
        // Estimate or extract stats
        const eligibleCount = normalizedStudents.filter(s => s.is_transport_eligible !== false).length;
        const assignedCount = normalizedStudents.filter(s => s.assigned_bus_id || s.bus_number).length;
        setStudentStats({
          total: normalizedStudents.length,
          eligible: eligibleCount,
          assigned: assignedCount
        });
      }

      // Normalize Alerts Data
      if (alertsRes.status === 'fulfilled') {
        const rawAlerts = alertsRes.value;
        const normalizedAlerts = rawAlerts?.alerts 
          || (Array.isArray(rawAlerts?.data) ? rawAlerts.data : (Array.isArray(rawAlerts) ? rawAlerts : []));
        setAlerts(normalizedAlerts);
      }

      // Normalize Alert Stats
      if (alertStatsRes.status === 'fulfilled') {
        const rawStats = alertStatsRes.value?.stats || alertStatsRes.value || {};
        setAlertStats({
          total_alerts: rawStats.total_alerts || rawStats.total || alerts.length,
          active_alerts: rawStats.active_alerts || rawStats.active || alerts.length,
          critical_count: rawStats.critical || alerts.filter(a => a.severity === 'CRITICAL' || a.alert_type === 'WRONG_BUS').length
        });
      }

      setBackendOnline(true);
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('[UnifiedDashboard] Error during telemetry refresh:', err);
      setBackendOnline(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setRefreshCountdown(10);
    }
  }, [alerts.length]);

  // Initial load and 10-second polling cycle
  useEffect(() => {
    fetchDashboardData();

    // 1-second interval to update countdown and poll at 0
    countdownTimerRef.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [fetchDashboardData]);

  // Handle acknowledge alert action
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiService.alerts.acknowledge(alertId);
      setActionFeedback(`Alert #${alertId} acknowledged successfully.`);
      setTimeout(() => setActionFeedback(null), 4000);
      fetchDashboardData(true);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      setActionFeedback(`Could not acknowledge alert #${alertId}.`);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  // Filtered bus list
  const filteredBuses = buses.filter(b => {
    const matchesFilter = statusFilter === 'ALL' || (b.status && b.status.toUpperCase() === statusFilter);
    const matchesSearch = !searchQuery || 
      (b.bus_number && b.bus_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.route_name && b.route_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.in_charge_name && b.in_charge_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Calculate Metrics
  const totalBuses = buses.length;
  const activeBuses = buses.filter(b => (b.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const maintenanceBuses = buses.filter(b => (b.status || '').toUpperCase() === 'MAINTENANCE').length;

  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter(c => (c.operational_status || c.status || 'ONLINE').toUpperCase() === 'ONLINE' || (c.operational_status || c.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;

  const activeAlertsCount = alerts.filter(a => !a.resolved).length;
  const criticalAlertsCount = alerts.filter(a => !a.resolved && (a.severity === 'CRITICAL' || a.alert_type === 'WRONG_BUS')).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-pure)', paddingBottom: '60px' }}>
      
      {/* Institutional Header Banner */}
      <div 
        style={{ 
          background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-surface) 100%)',
          borderBottom: '1px solid var(--border-strong)',
          padding: '20px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '4px',
              background: '#040404',
              border: '1.5px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-pure)'
            }}
          >
            <Cpu size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                V.S.B. ENGINEERING COLLEGE (AUTONOMOUS), KARUR
              </span>
              <span style={{ color: 'var(--border-default)' }}>|</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                DEPARTMENT OF AI & DS
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '4px 0 2px', color: 'var(--text-pure)' }}>
              Unified Fleet Command Center
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Real-Time Edge Vision, Biometric Boarding, & Transport Safety Operations Hub
            </p>
          </div>
        </div>

        {/* Action Center & Telemetry Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Pulse Telemetry */}
          <div 
            style={{
              background: 'var(--bg-void)',
              border: '1px solid var(--border-default)',
              padding: '6px 14px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.75rem'
            }}
          >
            <span 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: backendOnline ? '#00AA00' : '#AA0000',
                boxShadow: backendOnline ? '0 0 8px #00AA00' : '0 0 8px #AA0000'
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {backendOnline ? 'TELEMETRY ONLINE' : 'DISCONNECTED'}
            </span>
            <span style={{ color: 'var(--border-default)' }}>|</span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SYNC IN {refreshCountdown}s
            </span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="mono-btn"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isRefreshing ? 'var(--bg-surface)' : 'var(--bg-void)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-pure)',
              cursor: isRefreshing ? 'not-allowed' : 'pointer'
            }}
            id="unified-dashboard-refresh-btn"
            title="Force immediate telemetry refresh"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'SYNCING...' : 'REFRESH'}</span>
          </button>

          {/* Laptop Camera Diagnostics Quick Trigger */}
          <button
            onClick={() => setIsLiveCameraModalOpen(true)}
            className="mono-btn"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--text-pure)',
              border: '1px solid var(--text-pure)',
              color: 'var(--bg-void)',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            id="unified-dashboard-webcam-trigger"
            title="Open Live Laptop Camera Edge FeedTest"
          >
            <Camera size={14} />
            <span>TEST WEBCAM SENSOR</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            borderBottom: '2px solid #00AA00',
            padding: '10px 24px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text-pure)'
          }}
        >
          <CheckCircle2 size={16} color="#00AA00" />
          <span>{actionFeedback}</span>
        </div>
      )}

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ========================================================================= */}
        {/* SECTION 1: CORE KPI CARDS (BUSES, CAMERAS, STUDENTS, ACTIVE ALERTS)       */}
        {/* ========================================================================= */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px'
          }}
        >
          {/* Card 1: Buses */}
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  FLEET ASSETS
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', margin: '6px 0 2px' }}>
                  {isLoading ? '...' : totalBuses}
                </div>
              </div>
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-pure)'
                }}
              >
                <Bus size={20} />
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Fleet:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00AA00' }}>
                  {activeBuses} Operating
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Maintenance / Depot:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FF6600' }}>
                  {maintenanceBuses} Units
                </span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('transport-master')}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-pure)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                id="kpi-view-transport-master-btn"
              >
                <span>TRANSPORT MASTER</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 2: Edge Cameras */}
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  EDGE CAMERAS
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', margin: '6px 0 2px' }}>
                  {isLoading ? '...' : totalCameras}
                </div>
              </div>
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-pure)'
                }}
              >
                <Camera size={20} />
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Online Streaming:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00AA00' }}>
                  {onlineCameras} Operational
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Offline / Degradation:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: totalCameras - onlineCameras > 0 ? '#AA0000' : 'var(--text-muted)' }}>
                  {totalCameras - onlineCameras} Offline
                </span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('camera-management')}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-pure)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                id="kpi-view-camera-management-btn"
              >
                <span>CAMERA NETWORK</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 3: Enrolled Students */}
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  STUDENT REPOSITORY
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', margin: '6px 0 2px' }}>
                  {isLoading ? '...' : (studentStats.total || students.length)}
                </div>
              </div>
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-pure)'
                }}
              >
                <Users size={20} />
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transport Eligible:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-pure)' }}>
                  {studentStats.eligible} Students
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Route Assigned:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00AA00' }}>
                  {studentStats.assigned} Boarders
                </span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('student-management')}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-pure)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                id="kpi-view-student-management-btn"
              >
                <span>STUDENT ROSTER</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 4: Security Alerts & Wrong Bus */}
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: activeAlertsCount > 0 ? '1px solid #AA0000' : '1px solid var(--border-default)',
              borderRadius: '4px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: activeAlertsCount > 0 ? '#AA0000' : 'var(--text-muted)' }}>
                  SECURITY ALERTS
                </span>
                <div 
                  style={{ 
                    fontSize: '2.4rem', 
                    fontWeight: 900, 
                    fontFamily: 'var(--font-mono)', 
                    margin: '6px 0 2px',
                    color: activeAlertsCount > 0 ? '#AA0000' : 'var(--text-pure)'
                  }}
                >
                  {isLoading ? '...' : activeAlertsCount}
                </div>
              </div>
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  background: 'var(--bg-void)',
                  border: activeAlertsCount > 0 ? '1.5px solid #AA0000' : '1px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activeAlertsCount > 0 ? '#AA0000' : 'var(--text-pure)'
                }}
              >
                <ShieldAlert size={20} />
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wrong Bus Anomalies:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: criticalAlertsCount > 0 ? '#AA0000' : '#00AA00' }}>
                  {criticalAlertsCount} Critical
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>System Status:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: activeAlertsCount > 0 ? '#FF6600' : '#00AA00' }}>
                  {activeAlertsCount > 0 ? 'ATTENTION REQUIRED' : 'SECURE / NORMAL'}
                </span>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('alerts-dashboard')}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: activeAlertsCount > 0 ? '#AA0000' : 'var(--bg-void)',
                  border: activeAlertsCount > 0 ? '1px solid #AA0000' : '1px solid var(--border-strong)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                id="kpi-view-alerts-dashboard-btn"
              >
                <span>INCIDENT CENTER</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: FLEET STATUS AND REAL-TIME ALERTS SPLIT VIEW                   */}
        {/* ========================================================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
          
          {/* Active Fleet Telemetry Panel */}
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bus size={18} />
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                  Institutional Fleet Status
                </h2>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ({filteredBuses.length} OF {totalBuses})
                </span>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'ACTIVE', 'MAINTENANCE'].map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '4px 8px',
                      background: statusFilter === f ? 'var(--text-pure)' : 'var(--bg-void)',
                      color: statusFilter === f ? 'var(--bg-void)' : 'var(--text-muted)',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="Search by bus number, route, or faculty in-charge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '7px 12px 7px 32px',
                  fontSize: '0.75rem',
                  color: 'var(--text-pure)'
                }}
              />
            </div>

            {/* Bus List Table */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 6px', fontWeight: 700 }}>BUS NO</th>
                    <th style={{ padding: '8px 6px', fontWeight: 700 }}>ROUTE</th>
                    <th style={{ padding: '8px 6px', fontWeight: 700 }}>IN-CHARGE</th>
                    <th style={{ padding: '8px 6px', fontWeight: 700 }}>CAPACITY</th>
                    <th style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {isLoading ? 'Scanning fleet telemetry...' : 'No buses matching current filter criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredBuses.slice(0, 6).map((bus) => {
                      const isOnline = (bus.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                      const isMaint = (bus.status || '').toUpperCase() === 'MAINTENANCE';

                      return (
                        <tr 
                          key={bus.id || bus.bus_number}
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer'
                          }}
                          onClick={() => onNavigate && onNavigate('transport-master')}
                          title="Click to view in Transport Master"
                        >
                          <td style={{ padding: '10px 6px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {bus.bus_number}
                          </td>
                          <td style={{ padding: '10px 6px', color: 'var(--text-secondary)' }}>
                            {bus.route_name || bus.route_number || 'Depot Shuttle'}
                          </td>
                          <td style={{ padding: '10px 6px', color: 'var(--text-muted)' }}>
                            {bus.in_charge_name || 'Assigned Staff'}
                          </td>
                          <td style={{ padding: '10px 6px', fontFamily: 'var(--font-mono)' }}>
                            {bus.capacity || 50} Seats
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '2px 7px',
                                borderRadius: '2px',
                                fontSize: '0.65rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                background: isOnline ? 'rgba(0, 170, 0, 0.1)' : (isMaint ? 'rgba(255, 102, 0, 0.1)' : 'rgba(150, 150, 150, 0.1)'),
                                color: isOnline ? '#00AA00' : (isMaint ? '#FF6600' : 'var(--text-muted)'),
                                border: isOnline ? '1px solid #00AA00' : (isMaint ? '1px solid #FF6600' : '1px solid var(--border-default)')
                              }}
                            >
                              <span 
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background: isOnline ? '#00AA00' : (isMaint ? '#FF6600' : '#888')
                                }}
                              />
                              {bus.status || 'ACTIVE'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Drilldown Footer */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                GPS Telemetry: Polling via VSB Edge Gateway
              </span>
              <button
                onClick={() => onNavigate && onNavigate('transport-master')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-pure)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <span>View Full Fleet ({totalBuses})</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Active Security & Wrong Bus Alerts Panel */}
          <div 
            style={{
              background: 'var(--bg-primary)',
              border: activeAlertsCount > 0 ? '1px solid #AA0000' : '1px solid var(--border-default)',
              borderRadius: '4px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={18} color={activeAlertsCount > 0 ? '#AA0000' : 'var(--text-pure)'} />
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                  Live Safety & Wrong Bus Alerts
                </h2>
              </div>
              <span 
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '2px',
                  background: activeAlertsCount > 0 ? '#AA0000' : 'var(--bg-surface-elevated)',
                  color: '#ffffff'
                }}
              >
                {activeAlertsCount} ACTIVE
              </span>
            </div>

            {/* Alerts Stream List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '320px' }}>
              {alerts.length === 0 ? (
                <div 
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'var(--bg-void)',
                    border: '1px dashed var(--border-default)',
                    borderRadius: '4px'
                  }}
                >
                  <CheckCircle2 size={32} color="#00AA00" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>No Active Security Alerts</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    All boarding gates, camera edge processors, and student assignments are verified normal.
                  </div>
                </div>
              ) : (
                alerts.slice(0, 5).map((alert) => {
                  const isCritical = alert.severity === 'CRITICAL' || alert.alert_type === 'WRONG_BUS';
                  const isAcknowledged = alert.status === 'ACKNOWLEDGED' || alert.acknowledged;

                  return (
                    <div 
                      key={alert.id || alert.alert_id}
                      style={{
                        background: 'var(--bg-void)',
                        border: isCritical ? '1.5px solid #AA0000' : '1px solid var(--border-default)',
                        borderRadius: '4px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            style={{
                              fontSize: '0.62rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '2px',
                              background: isCritical ? '#AA0000' : '#FF6600',
                              color: '#ffffff'
                            }}
                          >
                            {alert.alert_type || (isCritical ? 'WRONG_BUS_DETECTED' : 'SYSTEM_ALERT')}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                            {alert.title || alert.message || 'Unauthorized Boarding Attempt'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : 'JUST NOW'}
                        </span>
                      </div>

                      {/* Alert Metadata */}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {alert.student_name && (
                          <div>
                            <strong>Student:</strong> {alert.student_name} ({alert.register_number || alert.student_id})
                          </div>
                        )}
                        {alert.assigned_bus && alert.actual_bus && (
                          <div style={{ fontFamily: 'var(--font-mono)', color: '#FF6600' }}>
                            Assigned: {alert.assigned_bus} ➔ Attempted: {alert.actual_bus}
                          </div>
                        )}
                        {alert.location && (
                          <div><strong>Location:</strong> {alert.location}</div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          ID: #{alert.id || alert.alert_id}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!isAcknowledged && (
                            <button
                              onClick={() => handleAcknowledgeAlert(alert.id || alert.alert_id)}
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-strong)',
                                color: 'var(--text-pure)',
                                cursor: 'pointer'
                              }}
                            >
                              ACKNOWLEDGE
                            </button>
                          )}
                          <button
                            onClick={() => onNavigate && onNavigate('alerts-dashboard')}
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              background: '#AA0000',
                              border: '1px solid #AA0000',
                              color: '#ffffff',
                              cursor: 'pointer'
                            }}
                          >
                            OVERRIDE / RESOLVE
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drilldown Footer */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Audited & Escalated to Bus In-Charge & Admin
              </span>
              <button
                onClick={() => onNavigate && onNavigate('alerts-dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-pure)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <span>View Full Alert Center</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: EDGE VISION CAMERA NETWORK & LIVE PREVIEWS                     */}
        {/* ========================================================================= */}
        <div 
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: '4px',
            padding: '22px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={18} />
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Edge Vision Camera Network Grid
              </h2>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ({cameras.length} UNITS CONFIGURED)
              </span>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('camera-management')}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'var(--bg-void)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-pure)',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              id="view-all-cameras-grid-btn"
            >
              <span>CAMERA MANAGEMENT PORTAL</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Camera Grid Tiles */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px'
            }}
          >
            {cameras.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {isLoading ? 'Connecting to camera edge nodes...' : 'No edge cameras provisioned in database.'}
              </div>
            ) : (
              cameras.slice(0, 8).map((cam) => {
                const isOnline = (cam.operational_status || cam.status || 'ONLINE').toUpperCase() === 'ONLINE' || (cam.operational_status || cam.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                return (
                  <div 
                    key={cam.id || cam.camera_code}
                    style={{
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Viewfinder Preview Frame */}
                    <div 
                      style={{
                        height: '140px',
                        background: '#040404',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid var(--border-default)'
                      }}
                    >
                      {/* Grid reticle overlay */}
                      <div 
                        style={{
                          position: 'absolute',
                          inset: '10px',
                          border: '1px dashed rgba(255,255,255,0.15)',
                          pointerEvents: 'none'
                        }}
                      />

                      <div style={{ textAlign: 'center' }}>
                        <Video size={24} color={isOnline ? '#00AA00' : '#666666'} style={{ margin: '0 auto 6px' }} />
                        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {isOnline ? 'RTSP RTSPS://VSB-EDGE' : 'STREAM OFFLINE'}
                        </span>
                      </div>

                      {/* Top Overlay Badges */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          right: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span 
                          style={{
                            fontSize: '0.6rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            padding: '1px 5px',
                            background: 'rgba(0,0,0,0.85)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-pure)'
                          }}
                        >
                          {cam.camera_code || `CAM-${cam.id}`}
                        </span>

                        <span 
                          style={{
                            fontSize: '0.58rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '2px',
                            background: isOnline ? '#00AA00' : '#444444',
                            color: '#ffffff'
                          }}
                        >
                          {isOnline ? 'LIVE' : 'DOWN'}
                        </span>
                      </div>

                      {/* Bottom Overlay Frame Rate */}
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          right: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.58rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <span>{cam.resolution || '1080p'}</span>
                        <span>{isOnline ? '25 FPS' : '0 FPS'}</span>
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Vehicle:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-pure)' }}>
                          {cam.bus_number || `BUS-${cam.bus_id || 'N/A'}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Position:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {cam.mount_position || cam.position || 'DOOR_ENTRY'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: QUICK ACCESS SUBSYSTEM NAVIGATION MATRIX                       */}
        {/* ========================================================================= */}
        <div 
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: '4px',
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={18} />
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Operational Modules & Mission Subsystems
            </h2>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px'
            }}
          >
            {[
              {
                title: 'Transport Master',
                desc: 'Buses, Routes, Stops & Shifts',
                icon: <Bus size={18} />,
                page: 'transport-master',
                color: 'var(--text-pure)'
              },
              {
                title: 'Student Transport',
                desc: 'Roster, Requests & Verification',
                icon: <Users size={18} />,
                page: 'student-management',
                color: 'var(--text-pure)'
              },
              {
                title: 'Camera Management',
                desc: 'Edge Vision RTSP & Calibration',
                icon: <Camera size={18} />,
                page: 'camera-management',
                color: 'var(--text-pure)'
              },
              {
                title: 'Driver Clearance',
                desc: 'Pre-Dispatch Biometric Check',
                icon: <ShieldCheck size={18} />,
                page: 'driver-verification',
                color: '#00AA00'
              },
              {
                title: 'Biometric Enrollment',
                desc: 'FaceNet 512-D Neural Profiles',
                icon: <Fingerprint size={18} />,
                page: 'biometric-enrollment',
                color: 'var(--text-pure)'
              },
              {
                title: 'Boarding Verification',
                desc: 'Real-time Facial Recognition',
                icon: <Activity size={18} />,
                page: 'boarding-verification',
                color: '#FF6600'
              },
              {
                title: 'Wrong Bus Alerts',
                desc: 'Security Override & Incident Desk',
                icon: <ShieldAlert size={18} />,
                page: 'alerts-dashboard',
                color: '#AA0000'
              }
            ].map((mod) => (
              <div 
                key={mod.page}
                onClick={() => onNavigate && onNavigate(mod.page)}
                style={{
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '4px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-pure)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div 
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '4px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: mod.color,
                    flexShrink: 0
                  }}
                >
                  {mod.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                    {mod.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {mod.desc}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: LIVE LAPTOP WEBCAM DIAGNOSTIC MODAL                            */}
      {/* ========================================================================= */}
      {isLiveCameraModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '800px',
              background: 'var(--bg-primary)',
              border: '2px solid var(--border-strong)',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                padding: '14px 20px',
                background: 'var(--bg-void)',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                  REAL LAPTOP WEBCAM / USB SENSOR DIAGNOSTIC
                </span>
              </div>
              <button
                onClick={() => setIsLiveCameraModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            {/* WebcamCapture Integration */}
            <div style={{ padding: '20px', background: 'var(--bg-void)' }}>
              <WebcamCapture 
                height="440px"
                width="100%"
                showCaptureButton={true}
                captureLabel="CAPTURE DIAGNOSTIC FRAME"
                overlayTitle="LIVE LAPTOP WEBCAM SENSOR"
                onCapture={(base64Image) => {
                  setActionFeedback('Webcam snapshot captured successfully.');
                  setTimeout(() => setActionFeedback(null), 4000);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div 
              style={{
                padding: '12px 20px',
                background: 'var(--bg-primary)',
                borderTop: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>
                Testing WebRTC getUserMedia edge pipeline. Ready for FaceNet recognition.
              </span>
              <button
                onClick={() => setIsLiveCameraModalOpen(false)}
                style={{
                  padding: '6px 14px',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-pure)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                CLOSE TESTER
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
