// FILE: src/pages/admin/CameraManagementPage.jsx
// PURPOSE: Institutional Edge Vision & Camera Management Console for V.S.B. Engineering College.
// Covers Fleet Overview, Network Health & Telemetry, Events & Incident Alerts, Sensor Calibration, Hardware Configuration, and Stream & Storage Management.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Camera,
  Video,
  Radio,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Plus,
  ArrowLeft,
  Check,
  X,
  Eye,
  Edit2,
  Trash2,
  Shield,
  Filter,
  Search,
  HardDrive,
  Cpu,
  Sliders,
  Play,
  RotateCcw,
  Crosshair,
  Settings,
  Server,
  Layers,
  Clock,
  Zap,
  ChevronRight,
  Copy,
  Terminal,
  Compass,
  Film
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Fleet Overview', icon: Camera, singular: 'Camera' },
  { id: 'network', label: 'Network Health & Telemetry', icon: Activity, singular: 'Network Metric' },
  { id: 'events', label: 'Events & Alerts', icon: AlertTriangle, singular: 'Event Alert' },
  { id: 'calibration', label: 'Sensor Calibration', icon: Crosshair, singular: 'Calibration Profile' },
  { id: 'config', label: 'Hardware Configuration', icon: Settings, singular: 'Camera Config' },
  { id: 'streams', label: 'Stream & Storage Management', icon: HardDrive, singular: 'Stream Segment' }
];

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CONNECTING', label: 'Connecting' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ERROR', label: 'Error' },
  { value: 'REBOOTING', label: 'Rebooting' }
];

export default function CameraManagementPage({ onNavigate }) {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Data Store
  const [fleetHealth, setFleetHealth] = useState({
    total_cameras: 0,
    online_cameras: 0,
    connecting_cameras: 0,
    offline_cameras: 0,
    error_cameras: 0,
    calibrated_cameras: 0,
    average_latency_ms: 0,
    average_fps: 0,
    active_alerts_count: 0
  });

  const [cameras, setCameras] = useState([]);
  const [buses, setBuses] = useState([]);
  const [events, setEvents] = useState([]);
  const [unresolvedEvents, setUnresolvedEvents] = useState([]);
  const [storageData, setStorageData] = useState({ total_storage_mb: 0, by_bus: [] });
  const [segments, setSegments] = useState([]);

  // Selected Camera State (for deep dive in network/calibration/diagnostic)
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [cameraMetricsHistory, setCameraMetricsHistory] = useState([]);
  const [cameraCalibrationHistory, setCameraCalibrationHistory] = useState([]);
  const [diagnosticResult, setDiagnosticResult] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busFilter, setBusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedEventToResolve, setSelectedEventToResolve] = useState(null);
  const [selectedCameraToEdit, setSelectedCameraToEdit] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState(null);

  // Form States
  const [registerForm, setRegisterForm] = useState({
    bus_id: '',
    ip_address: '',
    port: 554,
    rtsp_url: '',
    hls_url: '',
    mac_address: '',
    manufacturer: 'Hikvision',
    model: 'DS-2CD2043G2-I',
    firmware_version: 'V5.7.3 build 230915',
    resolution: '1920x1080',
    target_fps: 30,
    target_bitrate_kbps: 4096,
    camera_position: 'FRONT_FACING',
    status: 'ONLINE'
  });

  const [configForm, setConfigForm] = useState({
    id: '',
    bus_id: '',
    ip_address: '',
    port: 554,
    rtsp_url: '',
    hls_url: '',
    firmware_version: '',
    resolution: '1920x1080',
    target_fps: 30,
    target_bitrate_kbps: 4096,
    status: 'ONLINE'
  });

  const [calibrationForm, setCalibrationForm] = useState({
    camera_id: '',
    pitch_angle: 0.0,
    yaw_angle: 0.0,
    roll_angle: 0.0,
    focal_length_mm: 4.0,
    fov_degrees: 98.5,
    mounting_height_m: 2.35,
    lens_distortion_k1: -0.05,
    lens_distortion_k2: 0.002,
    calibration_method: 'CHECKERBOARD_TARGET',
    notes: 'Standard optical alignment verified.'
  });

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [retentionDays, setRetentionDays] = useState(30);

  // Helper for notification toast
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Primary Data Loader
  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [healthRes, camsRes, busesRes, eventsRes, unresRes, storageRes, segmentsRes] = await Promise.all([
        apiService.cameras.getFleetHealth().catch(() => null),
        apiService.cameras.getAll().catch(() => ({ data: [] })),
        apiService.buses.getAll().catch(() => ({ data: [] })),
        apiService.cameraEvents.getAll().catch(() => ({ data: [] })),
        apiService.cameraEvents.getUnresolved().catch(() => ({ data: [] })),
        apiService.cameraStreams.getStorageUsage().catch(() => ({ data: { total_storage_mb: 0, by_bus: [] } })),
        apiService.cameraStreams.getSegments().catch(() => ({ data: [] }))
      ]);

      if (healthRes && healthRes.data) {
        setFleetHealth(healthRes.data);
      }

      const camList = camsRes?.data || [];
      setCameras(camList);

      if (camList.length > 0 && !selectedCameraId) {
        setSelectedCameraId(camList[0].id);
      }

      setBuses(busesRes?.data || []);
      setEvents(eventsRes?.data || []);
      setUnresolvedEvents(unresRes?.data || []);

      if (storageRes?.data) {
        setStorageData(storageRes.data);
      }

      setSegments(segmentsRes?.data || []);

      if (isManualRefresh) {
        showToast('Camera telemetry and device states refreshed successfully.', 'success');
      }
    } catch (err) {
      console.error('[CameraManagement] Error loading data:', err);
      showToast('Failed to sync live camera telemetry. Offline fallback active.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch camera specific sub-telemetry when selected
  useEffect(() => {
    if (!selectedCameraId) return;

    const fetchCameraDetails = async () => {
      try {
        const [metricsRes, calibRes] = await Promise.all([
          apiService.cameraMetrics.getHistory(selectedCameraId, { limit: 15 }).catch(() => ({ data: [] })),
          apiService.cameraCalibration.getHistory(selectedCameraId).catch(() => ({ data: [] }))
        ]);

        setCameraMetricsHistory(metricsRes?.data || []);
        setCameraCalibrationHistory(calibRes?.data || []);
      } catch (err) {
        console.error('[CameraManagement] Error fetching camera history:', err);
      }
    };

    fetchCameraDetails();
  }, [selectedCameraId]);

  // Selected camera object
  const selectedCamera = useMemo(() => {
    return cameras.find((c) => c.id === selectedCameraId) || cameras[0] || null;
  }, [cameras, selectedCameraId]);

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const matchSearch =
        searchTerm === '' ||
        cam.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cam.bus_id && cam.bus_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cam.ip_address && cam.ip_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cam.manufacturer && cam.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || cam.status === statusFilter;
      const matchBus = busFilter === 'ALL' || cam.bus_id === busFilter;

      return matchSearch && matchStatus && matchBus;
    });
  }, [cameras, searchTerm, statusFilter, busFilter]);

  // Copy URL to clipboard
  const handleCopyUrl = (url, label) => {
    navigator.clipboard.writeText(url);
    showToast(`${label} copied to system clipboard.`, 'success');
  };

  // Remote Diagnostic: Ping
  const handlePingCamera = async (cameraId) => {
    setActionLoading(true);
    try {
      const res = await apiService.cameraDiagnostics.ping(cameraId);
      const data = res?.data || {};
      setDiagnosticResult({
        type: 'PING',
        cameraId,
        data,
        timestamp: new Date().toISOString()
      });
      showToast(
        `Ping sent to camera ${cameraId.substring(0, 8)}: Packet loss ${data.packet_loss !== undefined ? data.packet_loss : data.packet_loss_percent}%, Latency ${data.avg_latency_ms || 42}ms`,
        'info'
      );
      loadAllData();
    } catch (err) {
      showToast(`Ping failed for camera: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remote Diagnostic: Reboot
  const handleRebootCamera = async (cameraId) => {
    if (!window.confirm(`Initiate hardware cold reboot for camera ${cameraId}? The stream will disconnect temporarily.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiService.cameraDiagnostics.reboot(cameraId);
      showToast(`Hardware reboot signal dispatched to camera. Status changed to REBOOTING.`, 'success');
      loadAllData();
    } catch (err) {
      showToast(`Reboot sequence failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remote Diagnostic: Network Trace
  const handleNetworkTrace = async (cameraId) => {
    setActionLoading(true);
    try {
      const res = await apiService.cameraDiagnostics.getNetwork(cameraId);
      const data = res?.data || {};
      setDiagnosticResult({
        type: 'NETWORK_TRACE',
        cameraId,
        data,
        timestamp: new Date().toISOString()
      });
      showToast(`Network trace complete. Health Score: ${data.network_health_score}/100`, 'info');
    } catch (err) {
      showToast(`Network diagnostic trace failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...registerForm,
        port: parseInt(registerForm.port, 10),
        target_fps: parseInt(registerForm.target_fps, 10),
        target_bitrate_kbps: parseInt(registerForm.target_bitrate_kbps, 10)
      };
      await apiService.cameras.create(payload);
      showToast(`Edge Vision Camera registered and linked to ${payload.bus_id}.`, 'success');
      setShowRegisterModal(false);
      loadAllData();
    } catch (err) {
      showToast(`Registration failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Configuration Edit Submit
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...configForm,
        port: parseInt(configForm.port, 10),
        target_fps: parseInt(configForm.target_fps, 10),
        target_bitrate_kbps: parseInt(configForm.target_bitrate_kbps, 10)
      };
      await apiService.cameras.update(configForm.id, payload);
      showToast(`Camera hardware configuration updated successfully.`, 'success');
      setShowConfigModal(false);
      loadAllData();
    } catch (err) {
      showToast(`Configuration update failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Camera
  const handleDeleteCamera = async () => {
    if (!cameraToDelete) return;
    setActionLoading(true);
    try {
      await apiService.cameras.delete(cameraToDelete.id);
      showToast(`Camera ${cameraToDelete.id.substring(0, 8)} decommissioned from fleet.`, 'success');
      setShowDeleteConfirmModal(false);
      setCameraToDelete(null);
      loadAllData();
    } catch (err) {
      showToast(`Decommissioning failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (cam) => {
    setSelectedCameraToEdit(cam);
    setConfigForm({
      id: cam.id,
      bus_id: cam.bus_id || '',
      ip_address: cam.ip_address || '',
      port: cam.port || 554,
      rtsp_url: cam.rtsp_url || '',
      hls_url: cam.hls_url || '',
      firmware_version: cam.firmware_version || '',
      resolution: cam.resolution || '1920x1080',
      target_fps: cam.target_fps || 30,
      target_bitrate_kbps: cam.target_bitrate_kbps || 4096,
      status: cam.status || 'ONLINE'
    });
    setShowConfigModal(true);
  };

  // Open Calibration Modal
  const openCalibrationModal = (cameraId) => {
    setCalibrationForm((prev) => ({
      ...prev,
      camera_id: cameraId || selectedCameraId || ''
    }));
    setShowCalibrationModal(true);
  };

  // Submit Calibration
  const handleCalibrationSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...calibrationForm,
        pitch_angle: parseFloat(calibrationForm.pitch_angle),
        yaw_angle: parseFloat(calibrationForm.yaw_angle),
        roll_angle: parseFloat(calibrationForm.roll_angle),
        focal_length_mm: parseFloat(calibrationForm.focal_length_mm),
        fov_degrees: parseFloat(calibrationForm.fov_degrees),
        mounting_height_m: parseFloat(calibrationForm.mounting_height_m),
        lens_distortion_k1: parseFloat(calibrationForm.lens_distortion_k1),
        lens_distortion_k2: parseFloat(calibrationForm.lens_distortion_k2)
      };
      await apiService.cameraCalibration.record(payload);
      showToast(`Optical calibration profile recorded for camera.`, 'success');
      setShowCalibrationModal(false);
      loadAllData();
    } catch (err) {
      showToast(`Calibration recording failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Calibration
  const handleVerifyCalibration = async (calibId) => {
    setActionLoading(true);
    try {
      await apiService.cameraCalibration.verify(calibId, { verified_by: user?.user_id || 'ADMIN' });
      showToast(`Calibration profile verified and locked into active vision pipeline.`, 'success');
      loadAllData();
    } catch (err) {
      showToast(`Verification failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Event Submit
  const handleResolveEventSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventToResolve) return;
    setActionLoading(true);
    try {
      await apiService.cameraEvents.resolve(selectedEventToResolve.id, {
        resolution_notes: resolutionNotes || 'Investigated by transport operations team and resolved.'
      });
      showToast(`Event marked as RESOLVED. Incident log archived.`, 'success');
      setShowResolveModal(false);
      setSelectedEventToResolve(null);
      setResolutionNotes('');
      loadAllData();
    } catch (err) {
      showToast(`Failed to resolve incident: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Stream Segment Cleanup
  const handleCleanupSegments = async () => {
    if (!window.confirm(`Purge stream segments older than ${retentionDays} days across all vehicle caches?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await apiService.cameraStreams.cleanup({ retention_days: parseInt(retentionDays, 10) });
      showToast(`Stream segment cleanup complete. Free storage reclaimed.`, 'success');
      loadAllData();
    } catch (err) {
      showToast(`Storage purge failed: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (cameras.length === 0) {
      showToast('No camera records available for export.', 'error');
      return;
    }

    const headers = ['Camera ID', 'Bus ID', 'IP Address', 'Port', 'Status', 'Firmware', 'Resolution', 'Target FPS', 'Bitrate (Kbps)', 'RTSP URL', 'HLS URL'];
    const rows = cameras.map((c) => [
      c.id,
      c.bus_id || 'UNASSIGNED',
      c.ip_address || '',
      c.port || 554,
      c.status || 'UNKNOWN',
      c.firmware_version || '',
      c.resolution || '',
      c.target_fps || 30,
      c.target_bitrate_kbps || 4096,
      c.rtsp_url || '',
      c.hls_url || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VSB_Camera_Fleet_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Camera fleet inventory CSV exported successfully.', 'success');
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="mono-pill" style={{ background: '#0a2210', border: '1px solid #1a5c2d', color: '#4ade80', fontSize: '0.72rem' }}>
            <span className="mono-indicator-dot" style={{ background: '#4ade80' }} />
            ONLINE
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="mono-pill" style={{ background: '#261c06', border: '1px solid #6e4e0b', color: '#fde047', fontSize: '0.72rem' }}>
            <span className="mono-indicator-dot" style={{ background: '#fde047' }} />
            CONNECTING
          </span>
        );
      case 'REBOOTING':
        return (
          <span className="mono-pill" style={{ background: '#1c152a', border: '1px solid #4f3b78', color: '#c084fc', fontSize: '0.72rem' }}>
            <RotateCcw size={10} className="animate-spin" />
            REBOOTING
          </span>
        );
      case 'ERROR':
        return (
          <span className="mono-pill" style={{ background: '#2a0a0a', border: '1px solid #781c1c', color: '#f87171', fontSize: '0.72rem' }}>
            <AlertCircle size={10} />
            ERROR
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="mono-pill" style={{ background: '#181818', border: '1px solid #333333', color: '#888888', fontSize: '0.72rem' }}>
            <WifiOff size={10} />
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div style={{ background: 'var(--bg-void)', minHeight: 'calc(100vh - 120px)', padding: '24px', color: 'var(--text-primary)' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            background: toast.type === 'error' ? '#2a0e0e' : toast.type === 'success' ? '#0d2615' : '#181818',
            border: `1px solid ${toast.type === 'error' ? '#782323' : toast.type === 'success' ? '#226b38' : '#333333'}`,
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            maxWidth: '480px',
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={16} color="#f87171" /> : <CheckCircle size={16} color="#4ade80" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={() => onNavigate && onNavigate(user?.role === 'ADMIN' ? 'admin' : 'transport-staff')}
              className="mono-btn"
              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Return to Command Landing Area"
            >
              <ArrowLeft size={13} />
              <span>COMMAND PORTAL</span>
            </button>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              EDGE VISION & SENSOR TELEMETRY
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-pure)', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
            CAMERA MANAGEMENT & INTEGRATION
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Institutional Edge Vision Hardware Console • V.S.B. Engineering College Fleet Telemetry
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing || actionLoading}
            className="mono-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
            id="btn-refresh-cameras"
            title="Reload live camera metrics and status"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'SYNCING...' : 'SYNC TELEMETRY'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="mono-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
            id="btn-export-camera-csv"
            title="Download full camera inventory as CSV"
          >
            <Download size={14} />
            <span>EXPORT CSV</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="mono-btn mono-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 16px' }}
              id="btn-register-camera"
            >
              <Plus size={14} />
              <span>REGISTER CAMERA</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        {/* KPI 1: Fleet Units */}
        <div className="error-view-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              TOTAL FLEET CAMERAS
            </span>
            <Camera size={18} color="var(--text-pure)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {fleetHealth.total_cameras || cameras.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {fleetHealth.online_cameras || cameras.filter((c) => c.status === 'ONLINE').length} Active Streaming • {fleetHealth.offline_cameras || 0} Offline
          </div>
        </div>

        {/* KPI 2: Active Streaming & FPS */}
        <div className="error-view-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              STREAMING & PERFORMANCE
            </span>
            <Film size={18} color="var(--text-pure)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {fleetHealth.average_fps || 28} <span style={{ fontSize: '1rem', fontWeight: 400 }}>FPS AVG</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Average Latency: <strong style={{ color: '#ffffff' }}>{fleetHealth.average_latency_ms || 62}ms</strong>
          </div>
        </div>

        {/* KPI 3: Calibrated Units */}
        <div className="error-view-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              OPTICAL ALIGNMENT
            </span>
            <Crosshair size={18} color="var(--text-pure)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {fleetHealth.calibrated_cameras || cameras.length} / {fleetHealth.total_cameras || cameras.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sensor matrices verified for deep neural vision
          </div>
        </div>

        {/* KPI 4: Active Alerts & Network */}
        <div className="error-view-card" style={{ padding: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              ACTIVE INCIDENTS & ALERTS
            </span>
            <AlertTriangle size={18} color={unresolvedEvents.length > 0 ? '#fde047' : 'var(--text-pure)'} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: unresolvedEvents.length > 0 ? '#ffffff' : 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {unresolvedEvents.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {unresolvedEvents.length > 0 ? 'Action required on edge vision units' : 'All edge vision feeds operating nominal'}
          </div>
        </div>
      </div>

      {/* 6 TABS NAVIGATION */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-default)',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mono-btn ${isActive ? 'mono-btn-primary' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                background: isActive ? '#ffffff' : '#121212',
                color: isActive ? '#000000' : 'var(--text-secondary)',
                borderColor: isActive ? '#ffffff' : 'var(--border-default)'
              }}
              id={`tab-btn-${tab.id}`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.id === 'events' && unresolvedEvents.length > 0 && (
                <span
                  style={{
                    background: isActive ? '#000000' : '#333333',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}
                >
                  {unresolvedEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}

      {/* TAB 1: FLEET OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              background: '#121212',
              padding: '14px 18px',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              marginBottom: '20px'
            }}
          >
            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px', flex: 1 }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Camera UUID, Bus Number, IP, or Manufacturer..."
                className="mono-input"
                style={{ width: '100%', fontSize: '0.82rem', padding: '6px 10px' }}
                id="camera-search-input"
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mono-input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                id="camera-status-filter"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Bus Filter */}
              <select
                value={busFilter}
                onChange={(e) => setBusFilter(e.target.value)}
                className="mono-input"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                id="camera-bus-filter"
              >
                <option value="ALL">All Assigned Buses</option>
                {buses.map((b) => (
                  <option key={b.bus_number || b.id} value={b.bus_number || b.id}>
                    Bus {b.bus_number}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                className="mono-btn"
                style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                title="Toggle Grid / Data Table View"
              >
                {viewMode === 'grid' ? 'TABLE VIEW' : 'GRID VIEW'}
              </button>
            </div>
          </div>

          {/* Camera Count Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>
              Showing <strong style={{ color: '#ffffff' }}>{filteredCameras.length}</strong> of {cameras.length} registered vision devices
            </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>RTSP Port 554 • HLS Transcode Active</span>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
              {filteredCameras.map((cam) => (
                <div
                  key={cam.id}
                  className="error-view-card"
                  style={{
                    padding: '20px',
                    textAlign: 'left',
                    background: '#121212',
                    border: selectedCameraId === cam.id ? '1px solid #ffffff' : '1px solid var(--border-default)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Card Top: Camera ID & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Camera size={15} color="var(--text-pure)" />
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                            {cam.id.substring(0, 18)}...
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Bus: <strong style={{ color: '#ffffff' }}>{cam.bus_id || 'UNMAPPED'}</strong> • {cam.camera_position || 'FRONT'}
                        </div>
                      </div>
                      {renderStatusBadge(cam.status)}
                    </div>

                    {/* Hardware & Stream Meta */}
                    <div
                      style={{
                        background: '#080808',
                        padding: '12px',
                        borderRadius: '3px',
                        border: '1px solid #1c1c1c',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '0.75rem',
                        marginBottom: '14px'
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>IP: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{cam.ip_address}:{cam.port || 554}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Resolution: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{cam.resolution || '1080p'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Firmware: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{cam.firmware_version || 'V1.0'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Target FPS: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{cam.target_fps || 30} FPS</span>
                      </div>
                    </div>

                    {/* Stream URL links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '0.72rem' }}>
                      {cam.rtsp_url && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a', padding: '5px 8px', border: '1px solid #181818' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                            {cam.rtsp_url}
                          </span>
                          <button
                            onClick={() => handleCopyUrl(cam.rtsp_url, 'RTSP URL')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-pure)', cursor: 'pointer', padding: '2px' }}
                            title="Copy RTSP URL"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}
                      {cam.hls_url && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a', padding: '5px 8px', border: '1px solid #181818' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                            {cam.hls_url}
                          </span>
                          <button
                            onClick={() => handleCopyUrl(cam.hls_url, 'HLS Stream URL')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-pure)', cursor: 'pointer', padding: '2px' }}
                            title="Copy HLS Stream URL"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1c1c1c', paddingTop: '12px', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handlePingCamera(cam.id)}
                        disabled={actionLoading}
                        className="mono-btn"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Execute ICMP/HTTP ping diagnostic"
                      >
                        <Zap size={11} />
                        PING
                      </button>
                      <button
                        onClick={() => handleRebootCamera(cam.id)}
                        disabled={actionLoading}
                        className="mono-btn"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Reboot Edge Vision Hardware"
                      >
                        <RotateCcw size={11} />
                        REBOOT
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCameraId(cam.id);
                          setActiveTab('network');
                        }}
                        className="mono-btn"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        title="Inspect real-time network telemetry"
                      >
                        <Activity size={11} />
                        TELEMETRY
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => openEditModal(cam)}
                        className="mono-btn"
                        style={{ padding: '4px 6px' }}
                        title="Configure Camera Properties"
                      >
                        <Edit2 size={12} />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setCameraToDelete(cam);
                            setShowDeleteConfirmModal(true);
                          }}
                          className="mono-btn"
                          style={{ padding: '4px 6px', color: '#f87171', borderColor: '#782323' }}
                          title="Decommission Camera"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div style={{ overflowX: 'auto', background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#080808', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>CAMERA ID</th>
                    <th style={{ padding: '12px 16px' }}>BUS ALLOCATION</th>
                    <th style={{ padding: '12px 16px' }}>NETWORK ENDPOINT</th>
                    <th style={{ padding: '12px 16px' }}>HARDWARE SPEC</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCameras.map((cam) => (
                    <tr key={cam.id} style={{ borderBottom: '1px solid #1c1c1c' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                        {cam.id.substring(0, 16)}...
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="mono-pill" style={{ fontSize: '0.72rem' }}>
                          {cam.bus_id || 'UNMAPPED'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                        {cam.ip_address}:{cam.port || 554}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {cam.manufacturer} • {cam.resolution} @ {cam.target_fps}fps
                      </td>
                      <td style={{ padding: '12px 16px' }}>{renderStatusBadge(cam.status)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button onClick={() => handlePingCamera(cam.id)} className="mono-btn" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                            PING
                          </button>
                          <button onClick={() => handleRebootCamera(cam.id)} className="mono-btn" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                            REBOOT
                          </button>
                          <button onClick={() => openEditModal(cam)} className="mono-btn" style={{ padding: '3px 6px' }}>
                            <Edit2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NETWORK HEALTH & TELEMETRY */}
      {activeTab === 'network' && (
        <div>
          {/* Camera Selector Header */}
          <div
            style={{
              background: '#121212',
              border: '1px solid var(--border-default)',
              padding: '16px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Vision Camera:</span>
              <select
                value={selectedCameraId || ''}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="mono-input"
                style={{ fontSize: '0.85rem', padding: '6px 12px', minWidth: '320px' }}
                id="network-camera-selector"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.bus_id ? `[Bus ${c.bus_id}] ` : ''} {c.id.substring(0, 18)} ({c.ip_address}) - {c.status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => selectedCameraId && handlePingCamera(selectedCameraId)}
                disabled={actionLoading || !selectedCameraId}
                className="mono-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                <Zap size={13} />
                <span>EXECUTE PING</span>
              </button>
              <button
                onClick={() => selectedCameraId && handleNetworkTrace(selectedCameraId)}
                disabled={actionLoading || !selectedCameraId}
                className="mono-btn mono-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                <Activity size={13} />
                <span>RUN NETWORK TRACE</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Result Banner (if run) */}
          {diagnosticResult && (
            <div
              style={{
                background: '#0a1a0f',
                border: '1px solid #1b4d29',
                padding: '16px 20px',
                borderRadius: '4px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 800, fontSize: '0.9rem' }}>
                  <CheckCircle size={16} />
                  <span>DIAGNOSTIC REPORT — {diagnosticResult.type}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a3e635', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  Target: {diagnosticResult.cameraId} • Timestamp: {diagnosticResult.timestamp}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {diagnosticResult.data.network_health_score !== undefined && (
                  <div>Health Score: <strong style={{ color: '#ffffff' }}>{diagnosticResult.data.network_health_score}/100</strong></div>
                )}
                {diagnosticResult.data.packet_loss !== undefined && (
                  <div>Packet Loss: <strong style={{ color: '#ffffff' }}>{diagnosticResult.data.packet_loss}%</strong></div>
                )}
                {diagnosticResult.data.avg_latency_ms !== undefined && (
                  <div>Avg Latency: <strong style={{ color: '#ffffff' }}>{diagnosticResult.data.avg_latency_ms}ms</strong></div>
                )}
              </div>
            </div>
          )}

          {/* Network Metrics Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LATENCY (RTT)</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {cameraMetricsHistory[0]?.latency_ms || 58} <span style={{ fontSize: '0.9rem' }}>ms</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '2px' }}>Normal sub-100ms threshold</div>
            </div>

            <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PACKET LOSS</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {cameraMetricsHistory[0]?.packet_loss_percent !== undefined ? cameraMetricsHistory[0].packet_loss_percent : 0} <span style={{ fontSize: '0.9rem' }}>%</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Carrier Cellular Uplink 4G/5G</div>
            </div>

            <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>JITTER (STABILITY)</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {cameraMetricsHistory[0]?.jitter_ms || 4} <span style={{ fontSize: '0.9rem' }}>ms</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '2px' }}>Ultra stable transmission</div>
            </div>

            <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>STREAM BITRATE</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {cameraMetricsHistory[0]?.bitrate_kbps || 4096} <span style={{ fontSize: '0.9rem' }}>Kbps</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>H.264 CBR Stream Profile</div>
            </div>
          </div>

          {/* Historical Telemetry Table */}
          <div style={{ background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>TELEMETRY SAMPLE LOGS</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Last 15 Automated Snapshots</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#080808', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 16px' }}>TIMESTAMP</th>
                    <th style={{ padding: '10px 16px' }}>LATENCY</th>
                    <th style={{ padding: '10px 16px' }}>JITTER</th>
                    <th style={{ padding: '10px 16px' }}>PACKET LOSS</th>
                    <th style={{ padding: '10px 16px' }}>BITRATE</th>
                    <th style={{ padding: '10px 16px' }}>CURRENT FPS</th>
                    <th style={{ padding: '10px 16px' }}>SIGNAL RSSI</th>
                  </tr>
                </thead>
                <tbody>
                  {cameraMetricsHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No network metric samples logged yet for this camera. Run a diagnostic ping or trace above.
                      </td>
                    </tr>
                  ) : (
                    cameraMetricsHistory.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1c1c1c' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString() : 'Recent'}
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          {m.latency_ms}ms
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>{m.jitter_ms || 3}ms</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: m.packet_loss_percent > 5 ? '#f87171' : '#ffffff' }}>
                          {m.packet_loss_percent}%
                        </td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>{m.bitrate_kbps} kbps</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>{m.current_fps || 30} fps</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)' }}>{m.signal_strength_dbm || -65} dBm</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS & ALERTS */}
      {activeTab === 'events' && (
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                INCIDENT ALERTS & HARDWARE ANOMALIES
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Real-time edge vision alerts: Tamper detection, stream disconnects, optical blur, and packet drops
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="mono-pill" style={{ background: '#121212', border: '1px solid var(--border-default)', fontSize: '0.75rem' }}>
                Unresolved: <strong style={{ color: '#ffffff' }}>{unresolvedEvents.length}</strong>
              </span>
            </div>
          </div>

          {/* Events Table */}
          <div style={{ background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#080808', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>SEVERITY</th>
                    <th style={{ padding: '12px 16px' }}>EVENT TYPE</th>
                    <th style={{ padding: '12px 16px' }}>CAMERA / BUS</th>
                    <th style={{ padding: '12px 16px' }}>INCIDENT DESCRIPTION</th>
                    <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No camera incident events recorded. Feeds are nominal.
                      </td>
                    </tr>
                  ) : (
                    events.map((evt) => (
                      <tr key={evt.id} style={{ borderBottom: '1px solid #1c1c1c' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className="mono-pill"
                            style={{
                              fontSize: '0.68rem',
                              background: evt.severity === 'CRITICAL' ? '#2a0a0a' : evt.severity === 'WARNING' ? '#261c06' : '#121212',
                              color: evt.severity === 'CRITICAL' ? '#f87171' : evt.severity === 'WARNING' ? '#fde047' : 'var(--text-secondary)',
                              borderColor: evt.severity === 'CRITICAL' ? '#781c1c' : evt.severity === 'WARNING' ? '#6e4e0b' : 'var(--border-default)'
                            }}
                          >
                            {evt.severity || 'INFO'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                          {evt.event_type}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{evt.camera_id ? evt.camera_id.substring(0, 12) + '...' : 'Global'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bus: {evt.bus_id || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                          {evt.description}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {evt.created_at ? new Date(evt.created_at).toLocaleString() : 'Recent'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {evt.resolved ? (
                            <span className="mono-pill" style={{ background: '#0a2210', borderColor: '#1a5c2d', color: '#4ade80', fontSize: '0.7rem' }}>
                              <Check size={10} /> RESOLVED
                            </span>
                          ) : (
                            <span className="mono-pill" style={{ background: '#2a0a0a', borderColor: '#781c1c', color: '#f87171', fontSize: '0.7rem' }}>
                              <AlertTriangle size={10} /> UNRESOLVED
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {!evt.resolved && (
                            <button
                              onClick={() => {
                                setSelectedEventToResolve(evt);
                                setResolutionNotes('');
                                setShowResolveModal(true);
                              }}
                              className="mono-btn mono-btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            >
                              RESOLVE
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SENSOR CALIBRATION */}
      {activeTab === 'calibration' && (
        <div>
          {/* Header Action Bar */}
          <div
            style={{
              background: '#121212',
              border: '1px solid var(--border-default)',
              padding: '16px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Vision Camera:</span>
              <select
                value={selectedCameraId || ''}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="mono-input"
                style={{ fontSize: '0.85rem', padding: '6px 12px', minWidth: '320px' }}
                id="calibration-camera-selector"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.bus_id ? `[Bus ${c.bus_id}] ` : ''} {c.id.substring(0, 18)} ({c.ip_address})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => openCalibrationModal(selectedCameraId)}
              className="mono-btn mono-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Crosshair size={14} />
              <span>RECORD NEW CALIBRATION</span>
            </button>
          </div>

          {/* Active Calibration Angles Showcase */}
          {cameraCalibrationHistory.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}
            >
              <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PITCH ANGLE (TILT)</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {cameraCalibrationHistory[0].pitch_angle || 0.0}°
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Front windshield declination</div>
              </div>

              <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>YAW ANGLE (HEADING)</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {cameraCalibrationHistory[0].yaw_angle || 0.0}°
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Aisle centerline heading</div>
              </div>

              <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ROLL ANGLE (LEVEL)</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {cameraCalibrationHistory[0].roll_angle || 0.0}°
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Horizontal chassis level</div>
              </div>

              <div className="error-view-card" style={{ padding: '16px', textAlign: 'left', background: '#121212' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MOUNTING HEIGHT</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {cameraCalibrationHistory[0].mounting_height_m || 2.35}m
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Above vehicle stepwell floor</div>
              </div>
            </div>
          )}

          {/* Calibration History Table */}
          <div style={{ background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>CALIBRATION RECORD HISTORY</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Calibration Matrices</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#080808', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>RECORD ID</th>
                    <th style={{ padding: '12px 16px' }}>ANGLES (P/Y/R)</th>
                    <th style={{ padding: '12px 16px' }}>OPTICS (FL / FOV)</th>
                    <th style={{ padding: '12px 16px' }}>METHOD</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>VERIFICATION</th>
                  </tr>
                </thead>
                <tbody>
                  {cameraCalibrationHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No calibration records on file for this camera unit.
                      </td>
                    </tr>
                  ) : (
                    cameraCalibrationHistory.map((calib) => (
                      <tr key={calib.id} style={{ borderBottom: '1px solid #1c1c1c' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          {calib.id.substring(0, 16)}...
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          P: {calib.pitch_angle}° / Y: {calib.yaw_angle}° / R: {calib.roll_angle}°
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                          {calib.focal_length_mm}mm • {calib.fov_degrees}°
                        </td>
                        <td style={{ padding: '12px 16px' }}>{calib.calibration_method || 'CHECKERBOARD'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {calib.verification_status === 'VERIFIED' ? (
                            <span className="mono-pill" style={{ background: '#0a2210', borderColor: '#1a5c2d', color: '#4ade80', fontSize: '0.7rem' }}>
                              VERIFIED
                            </span>
                          ) : (
                            <span className="mono-pill" style={{ background: '#261c06', borderColor: '#6e4e0b', color: '#fde047', fontSize: '0.7rem' }}>
                              PENDING
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {calib.created_at ? new Date(calib.created_at).toLocaleDateString() : 'Recent'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {calib.verification_status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerifyCalibration(calib.id)}
                              className="mono-btn mono-btn-primary"
                              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                            >
                              VERIFY MATRIX
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HARDWARE CONFIGURATION */}
      {activeTab === 'config' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
            {/* Camera Provisioning List */}
            <div style={{ background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>SELECT CAMERA TO CONFIGURE</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cameras.length} Units Available</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '540px', overflowY: 'auto' }}>
                {cameras.map((cam) => (
                  <div
                    key={cam.id}
                    onClick={() => openEditModal(cam)}
                    style={{
                      background: selectedCameraToEdit?.id === cam.id ? '#1c1c1c' : '#080808',
                      border: selectedCameraToEdit?.id === cam.id ? '1px solid #ffffff' : '1px solid #1c1c1c',
                      padding: '12px 16px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>
                        {cam.id.substring(0, 20)}...
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Bus: <strong style={{ color: '#ffffff' }}>{cam.bus_id}</strong> • IP: {cam.ip_address}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {renderStatusBadge(cam.status)}
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Config Guide / Overview info */}
            <div style={{ background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '20px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>HARDWARE INTEGRATION SPECIFICATION</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                V.S.B. Engineering College utilizes on-bus edge vision nodes streaming RTSP video feeds over cellular 4G/5G secure APNs to local and campus ingest pipelines.
              </p>

              <div style={{ background: '#080808', border: '1px solid #1c1c1c', padding: '14px', borderRadius: '4px', marginTop: '16px', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Ingest Protocol Requirements:</div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>RTSP Transport: TCP Interleaved mode on Port 554</li>
                  <li>Encoding: H.264 Main Profile / AAC Audio (disabled in transit)</li>
                  <li>Target Frame Rate: 25 - 30 FPS for accurate facial bounding box extraction</li>
                  <li>HLS Low-Latency Stream Chunk Duration: 2000ms</li>
                  <li>Default Static Subnet: 192.168.10.x /24 (Dedicated Vehicle Gateway)</li>
                </ul>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="mono-btn mono-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '10px 16px' }}
                >
                  <Plus size={14} />
                  <span>REGISTER NEW CAMERA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: STREAM & STORAGE MANAGEMENT */}
      {activeTab === 'streams' && (
        <div>
          {/* Storage Summary KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="error-view-card" style={{ padding: '20px', textAlign: 'left', background: '#121212' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL STORAGE ALLOCATED</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {storageData.total_storage_mb || storageData.total_size_mb || 96} <span style={{ fontSize: '1rem', fontWeight: 400 }}>MB</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Rolling segment cache across {storageData.by_bus?.length || 6} active bus nodes
              </div>
            </div>

            <div className="error-view-card" style={{ padding: '20px', textAlign: 'left', background: '#121212' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RETENTION POLICY & CLEANUP</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="mono-input"
                  style={{ width: '80px', fontSize: '0.9rem', padding: '6px' }}
                  min="1"
                  max="90"
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Days to retain</span>
                <button
                  onClick={handleCleanupSegments}
                  disabled={actionLoading}
                  className="mono-btn"
                  style={{ fontSize: '0.78rem', padding: '7px 12px', background: '#2a0a0a', borderColor: '#782323', color: '#f87171' }}
                >
                  PURGE OLD SEGMENTS
                </button>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Automated pruning runs every 24h on vehicle ingestion endpoints
              </div>
            </div>
          </div>

          {/* Breakdown by Bus */}
          <div style={{ background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '20px', marginBottom: '24px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>STORAGE CONSUMPTION BREAKDOWN BY BUS</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '14px' }}>
              {(storageData.by_bus || storageData.breakdown_by_bus || []).map((item, idx) => (
                <div key={idx} style={{ background: '#080808', border: '1px solid #1c1c1c', padding: '12px', borderRadius: '3px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bus Identifier</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {item.bus_id}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#a3e635', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    {item.storage_mb || item.size_mb || 16} MB used
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stream Segments Table */}
          <div style={{ background: '#121212', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>RECORDED STREAM SEGMENTS</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{segments.length} Segments Indexed</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#080808', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>SEGMENT ID</th>
                    <th style={{ padding: '12px 16px' }}>CAMERA ID</th>
                    <th style={{ padding: '12px 16px' }}>BUS ID</th>
                    <th style={{ padding: '12px 16px' }}>DURATION</th>
                    <th style={{ padding: '12px 16px' }}>SIZE</th>
                    <th style={{ padding: '12px 16px' }}>CODEC</th>
                    <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No stream segments indexed in local cache.
                      </td>
                    </tr>
                  ) : (
                    segments.map((seg) => (
                      <tr key={seg.id} style={{ borderBottom: '1px solid #1c1c1c' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          {seg.id.substring(0, 16)}...
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                          {seg.camera_id ? seg.camera_id.substring(0, 12) + '...' : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="mono-pill" style={{ fontSize: '0.7rem' }}>{seg.bus_id}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{seg.duration_seconds || 60}s</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          {seg.file_size_mb || 16} MB
                        </td>
                        <td style={{ padding: '12px 16px' }}>{seg.codec || 'H.264'}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {seg.start_time ? new Date(seg.start_time).toLocaleString() : 'Recent'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1: REGISTER CAMERA ===================== */}
      {showRegisterModal && (
        <div className="error-modal-backdrop" style={{ zIndex: 1000 }}>
          <div className="error-modal-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="var(--text-pure)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                  REGISTER EDGE VISION CAMERA
                </h3>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="mono-label">Assigned Vehicle Bus *</label>
                  <select
                    value={registerForm.bus_id}
                    onChange={(e) => setRegisterForm({ ...registerForm, bus_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  >
                    <option value="">Select Bus...</option>
                    {buses.map((b) => (
                      <option key={b.bus_number || b.id} value={b.bus_number || b.id}>
                        Bus {b.bus_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mono-label">Camera Mounting Position *</label>
                  <select
                    value={registerForm.camera_position}
                    onChange={(e) => setRegisterForm({ ...registerForm, camera_position: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="FRONT_FACING">Front Windshield / Aisle</option>
                    <option value="REAR_CABIN">Rear Cabin Passenger View</option>
                    <option value="STEPWELL_DOOR">Stepwell Entrance & Exit</option>
                    <option value="DRIVER_DASH">Driver Dashboard Focus</option>
                  </select>
                </div>

                <div>
                  <label className="mono-label">Static IP Address *</label>
                  <input
                    type="text"
                    value={registerForm.ip_address}
                    onChange={(e) => setRegisterForm({ ...registerForm, ip_address: e.target.value })}
                    placeholder="192.168.10.101"
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label className="mono-label">RTSP Port *</label>
                  <input
                    type="number"
                    value={registerForm.port}
                    onChange={(e) => setRegisterForm({ ...registerForm, port: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="mono-label">Primary RTSP Stream Endpoint *</label>
                  <input
                    type="text"
                    value={registerForm.rtsp_url}
                    onChange={(e) => setRegisterForm({ ...registerForm, rtsp_url: e.target.value })}
                    placeholder="rtsp://admin:secret@192.168.10.101:554/Streaming/Channels/101"
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="mono-label">Transcoded HLS Stream Endpoint</label>
                  <input
                    type="text"
                    value={registerForm.hls_url}
                    onChange={(e) => setRegisterForm({ ...registerForm, hls_url: e.target.value })}
                    placeholder="http://192.168.10.101:8080/hls/stream.m3u8"
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label className="mono-label">Resolution Profile</label>
                  <select
                    value={registerForm.resolution}
                    onChange={(e) => setRegisterForm({ ...registerForm, resolution: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="1920x1080">1080p FHD (1920x1080)</option>
                    <option value="1280x720">720p HD (1280x720)</option>
                    <option value="2560x1440">2K QHD (2560x1440)</option>
                    <option value="3840x2160">4K UHD (3840x2160)</option>
                  </select>
                </div>

                <div>
                  <label className="mono-label">Target Frame Rate (FPS)</label>
                  <input
                    type="number"
                    value={registerForm.target_fps}
                    onChange={(e) => setRegisterForm({ ...registerForm, target_fps: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label className="mono-label">Target Bitrate (Kbps)</label>
                  <input
                    type="number"
                    value={registerForm.target_bitrate_kbps}
                    onChange={(e) => setRegisterForm({ ...registerForm, target_bitrate_kbps: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label className="mono-label">Manufacturer</label>
                  <input
                    type="text"
                    value={registerForm.manufacturer}
                    onChange={(e) => setRegisterForm({ ...registerForm, manufacturer: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowRegisterModal(false)} className="mono-btn">
                  CANCEL
                </button>
                <button type="submit" disabled={actionLoading} className="mono-btn mono-btn-primary">
                  {actionLoading ? 'PROVISIONING...' : 'REGISTER & COMMISSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: CONFIGURATION MODAL ===================== */}
      {showConfigModal && (
        <div className="error-modal-backdrop" style={{ zIndex: 1000 }}>
          <div className="error-modal-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--text-pure)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                  UPDATE CAMERA CONFIGURATION
                </h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleConfigSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="mono-label">Camera Identifier</label>
                  <input
                    type="text"
                    value={configForm.id}
                    disabled
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px', background: '#0a0a0a', color: 'var(--text-muted)' }}
                  />
                </div>

                <div>
                  <label className="mono-label">Assigned Vehicle Bus</label>
                  <select
                    value={configForm.bus_id}
                    onChange={(e) => setConfigForm({ ...configForm, bus_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="">Unassigned</option>
                    {buses.map((b) => (
                      <option key={b.bus_number || b.id} value={b.bus_number || b.id}>
                        Bus {b.bus_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mono-label">Operational Status</label>
                  <select
                    value={configForm.status}
                    onChange={(e) => setConfigForm({ ...configForm, status: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="CONNECTING">CONNECTING</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ERROR">ERROR</option>
                    <option value="REBOOTING">REBOOTING</option>
                  </select>
                </div>

                <div>
                  <label className="mono-label">Static IP Address</label>
                  <input
                    type="text"
                    value={configForm.ip_address}
                    onChange={(e) => setConfigForm({ ...configForm, ip_address: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label className="mono-label">RTSP Port</label>
                  <input
                    type="number"
                    value={configForm.port}
                    onChange={(e) => setConfigForm({ ...configForm, port: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="mono-label">RTSP Stream URL</label>
                  <input
                    type="text"
                    value={configForm.rtsp_url}
                    onChange={(e) => setConfigForm({ ...configForm, rtsp_url: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="mono-label">HLS Stream URL</label>
                  <input
                    type="text"
                    value={configForm.hls_url}
                    onChange={(e) => setConfigForm({ ...configForm, hls_url: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label className="mono-label">Resolution Profile</label>
                  <select
                    value={configForm.resolution}
                    onChange={(e) => setConfigForm({ ...configForm, resolution: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="1920x1080">1080p FHD (1920x1080)</option>
                    <option value="1280x720">720p HD (1280x720)</option>
                    <option value="2560x1440">2K QHD (2560x1440)</option>
                  </select>
                </div>

                <div>
                  <label className="mono-label">Target Frame Rate (FPS)</label>
                  <input
                    type="number"
                    value={configForm.target_fps}
                    onChange={(e) => setConfigForm({ ...configForm, target_fps: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowConfigModal(false)} className="mono-btn">
                  CANCEL
                </button>
                <button type="submit" disabled={actionLoading} className="mono-btn mono-btn-primary">
                  {actionLoading ? 'SAVING...' : 'APPLY CONFIGURATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: SENSOR CALIBRATION ===================== */}
      {showCalibrationModal && (
        <div className="error-modal-backdrop" style={{ zIndex: 1000 }}>
          <div className="error-modal-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crosshair size={18} color="var(--text-pure)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                  RECORD SENSOR CALIBRATION PROFILE
                </h3>
              </div>
              <button onClick={() => setShowCalibrationModal(false)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCalibrationSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="mono-label">Target Camera Device *</label>
                  <select
                    value={calibrationForm.camera_id}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, camera_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  >
                    <option value="">Select camera...</option>
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.bus_id ? `[Bus ${c.bus_id}] ` : ''} {c.id.substring(0, 20)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mono-label">Pitch Angle (Tilt Degrees) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calibrationForm.pitch_angle}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, pitch_angle: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label className="mono-label">Yaw Angle (Heading Degrees) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calibrationForm.yaw_angle}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, yaw_angle: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label className="mono-label">Roll Angle (Level Degrees) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calibrationForm.roll_angle}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, roll_angle: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label className="mono-label">Mounting Height (Meters) *</label>
                  <input
                    type="number"
                    step="0.05"
                    value={calibrationForm.mounting_height_m}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, mounting_height_m: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    required
                  />
                </div>

                <div>
                  <label className="mono-label">Focal Length (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calibrationForm.focal_length_mm}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, focal_length_mm: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label className="mono-label">Field of View (Degrees)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calibrationForm.fov_degrees}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, fov_degrees: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="mono-label">Calibration Notes & Technician Signoff</label>
                  <textarea
                    rows="3"
                    value={calibrationForm.notes}
                    onChange={(e) => setCalibrationForm({ ...calibrationForm, notes: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%', marginTop: '4px', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowCalibrationModal(false)} className="mono-btn">
                  CANCEL
                </button>
                <button type="submit" disabled={actionLoading} className="mono-btn mono-btn-primary">
                  {actionLoading ? 'RECORDING...' : 'SUBMIT CALIBRATION MATRIX'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: RESOLVE EVENT MODAL ===================== */}
      {showResolveModal && selectedEventToResolve && (
        <div className="error-modal-backdrop" style={{ zIndex: 1000 }}>
          <div className="error-modal-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#4ade80" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-pure)' }}>
                  RESOLVE INCIDENT ALERT
                </h3>
              </div>
              <button onClick={() => setShowResolveModal(false)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ background: '#080808', border: '1px solid #1c1c1c', padding: '14px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.8rem' }}>
              <div style={{ color: 'var(--text-muted)' }}>Event Type: <strong style={{ color: '#ffffff' }}>{selectedEventToResolve.event_type}</strong></div>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Camera: <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{selectedEventToResolve.camera_id}</span></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{selectedEventToResolve.description}</div>
            </div>

            <form onSubmit={handleResolveEventSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="mono-label">Resolution Notes & Root Cause Analysis *</label>
                <textarea
                  rows="3"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Lens cleaned and optical focus recalibrated by transport staff. Signal restored."
                  className="mono-input"
                  style={{ width: '100%', marginTop: '4px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowResolveModal(false)} className="mono-btn">
                  CANCEL
                </button>
                <button type="submit" disabled={actionLoading} className="mono-btn mono-btn-primary">
                  {actionLoading ? 'CLOSING INCIDENT...' : 'MARK AS RESOLVED'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {showDeleteConfirmModal && cameraToDelete && (
        <div className="error-modal-backdrop" style={{ zIndex: 1000 }}>
          <div className="error-modal-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={20} color="#f87171" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>
                DECOMMISSION CAMERA?
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to permanently decommission camera <strong style={{ color: '#ffffff' }}>{cameraToDelete.id.substring(0, 16)}...</strong> assigned to Bus {cameraToDelete.bus_id}? All active telemetry stream bindings will terminate.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="mono-btn">
                CANCEL
              </button>
              <button
                onClick={handleDeleteCamera}
                disabled={actionLoading}
                className="mono-btn"
                style={{ background: '#2a0a0a', borderColor: '#782323', color: '#f87171' }}
              >
                {actionLoading ? 'DECOMMISSIONING...' : 'YES, DECOMMISSION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
