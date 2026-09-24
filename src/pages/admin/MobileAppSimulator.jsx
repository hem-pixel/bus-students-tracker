// FILE: src/pages/admin/MobileAppSimulator.jsx
// PURPOSE: Interactive Mobile Device Simulator for Phase 13 Native Mobile Applications.
// Provides live simulation of Parent/Student App, Driver App, and Admin Mobile App with realistic
// Apple iPhone 16 Pro, Google Pixel 9, and iPad Tablet frames, real-time push notification injection,
// biometric Face ID/Touch ID simulation, offline sync queue, and live GPS route simulation.
// PHASE: Phase 13 — Native Mobile Applications

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Fingerprint,
  Bell,
  BellRing,
  Navigation,
  MapPin,
  User,
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Sliders,
  Eye,
  Download,
  LogOut,
  Share2,
  Moon,
  Sun,
  ChevronRight,
  Bus,
  Search,
  Check,
  X,
  Gauge,
  Sparkles,
  Layers,
  Radio,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

// Default mock data when backend is not actively streaming
const MOCK_INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Student Boarded Successfully',
    message: 'Sarah Jenkins boarded Bus #101 at Stop 3 (Science Dept).',
    category: 'BOARDING',
    timestamp: 'Just now',
    read: false,
    priority: 'HIGH'
  },
  {
    id: 'notif-2',
    title: 'Route Delay Notice',
    message: 'Bus #101 is running ~4 min behind schedule due to traffic near Tech Circle.',
    category: 'DELAY',
    timestamp: '12m ago',
    read: false,
    priority: 'MEDIUM'
  },
  {
    id: 'notif-3',
    title: 'Geofence Entry Recorded',
    message: 'Bus #101 has entered the 500m geofence radius of Hostel Stop.',
    category: 'ROUTE',
    timestamp: '28m ago',
    read: true,
    priority: 'LOW'
  }
];

const MOCK_STUDENTS_AT_STOP = [
  { id: 'S101', name: 'Sarah Jenkins', rollNo: 'CSE-2026-042', status: 'WAITING', stop: 'Stop 5: Library', avatar: 'SJ' },
  { id: 'S102', name: 'Aarav Patel', rollNo: 'ECE-2026-118', status: 'WAITING', stop: 'Stop 5: Library', avatar: 'AP' },
  { id: 'S103', name: 'Maya Lin', rollNo: 'MEC-2026-089', status: 'BOARDED', stop: 'Stop 5: Library', avatar: 'ML' },
  { id: 'S104', name: 'David Kim', rollNo: 'CSE-2026-015', status: 'WAITING', stop: 'Stop 5: Library', avatar: 'DK' },
  { id: 'S105', name: 'Elena Rostova', rollNo: 'BBA-2026-004', status: 'BOARDED', stop: 'Stop 5: Library', avatar: 'ER' }
];

export default function MobileAppSimulator({ onNavigate }) {
  const { user } = useAuth();

  // Hardware Simulation States
  const [deviceType, setDeviceType] = useState('iphone'); // 'iphone' | 'pixel' | 'tablet'
  const [deviceScale, setDeviceScale] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [isCharging, setIsCharging] = useState(true);
  const [deviceTime, setDeviceTime] = useState('08:42');
  const [networkType, setNetworkType] = useState('5G');

  // App Selection & Navigation
  const [activeApp, setActiveApp] = useState('parent'); // 'parent' | 'driver' | 'admin'
  const [parentTab, setParentTab] = useState('map'); // 'map' | 'boarding' | 'notifications' | 'settings'
  const [driverTab, setDriverTab] = useState('guidance'); // 'guidance' | 'checklist' | 'vehicle'
  const [adminTab, setAdminTab] = useState('fleet'); // 'fleet' | 'alerts' | 'reports'

  // Push Notification Simulation
  const [notifications, setNotifications] = useState(MOCK_INITIAL_NOTIFICATIONS);
  const [activeBanner, setActiveBanner] = useState(null);
  const [bannerTimer, setBannerTimer] = useState(null);
  const [unreadCount, setUnreadCount] = useState(2);

  // Biometric Auth Modal Simulation
  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);

  // Offline Pending Operations Queue (SQLite Simulation)
  const [pendingQueue, setPendingQueue] = useState([]);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Real-time Bus GPS Movement Simulation
  const [isMoving, setIsMoving] = useState(true);
  const [busProgress, setBusProgress] = useState(42); // 0 to 100%
  const [busSpeed, setBusSpeed] = useState(36);
  const [etaSeconds, setEtaSeconds] = useState(245); // ~4m 5s

  // Driver App Interactive States
  const [currentPassengerCount, setCurrentPassengerCount] = useState(46);
  const [busCapacity] = useState(54);
  const [studentsAtStop, setStudentsAtStop] = useState(MOCK_STUDENTS_AT_STOP);
  const [currentStopIndex, setCurrentStopIndex] = useState(4); // Stop 5

  // Parent App Preferences
  const [parentPrefs, setParentPrefs] = useState({
    boardingAlerts: true,
    routeUpdates: true,
    emergencyAlerts: true,
    delayWarnings: true,
    darkMode: true,
    biometricLogin: true,
    sound: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00'
  });

  // Dynamic Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setDeviceTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Bus Movement & ETA Loop
  useEffect(() => {
    if (!isMoving) return;
    const interval = setInterval(() => {
      setBusProgress(prev => {
        const next = prev + 0.8;
        return next > 100 ? 5 : next;
      });
      setEtaSeconds(prev => (prev > 10 ? prev - 1 : 240));
      setBusSpeed(Math.floor(30 + Math.random() * 12));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMoving]);

  // Push Notification Injector
  const triggerNotification = (title, message, category = 'BOARDING', priority = 'HIGH') => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      category,
      timestamp: 'Just now',
      read: false,
      priority
    };

    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(c => c + 1);

    // Show heads-up banner / Dynamic Island expansion
    if (bannerTimer) clearTimeout(bannerTimer);
    setActiveBanner(newNotif);
    const t = setTimeout(() => {
      setActiveBanner(null);
    }, 4500);
    setBannerTimer(t);
  };

  // Enqueue offline action or execute if online
  const executeOrQueue = (actionType, payload, successCallback) => {
    if (isOnline) {
      successCallback();
    } else {
      const queuedItem = {
        id: `op-${Date.now()}`,
        type: actionType,
        payload,
        timestamp: new Date().toLocaleTimeString()
      };
      setPendingQueue(prev => [...prev, queuedItem]);
      successCallback();
      triggerNotification('Offline Action Queued', `Operation [${actionType}] stored locally in SQLite. Will sync when online.`, 'SYSTEM', 'LOW');
    }
  };

  // Sync Offline Queue
  const flushOfflineQueue = () => {
    if (pendingQueue.length === 0) return;
    setIsSyncing(true);
    setTimeout(() => {
      setPendingQueue([]);
      setIsSyncing(false);
      triggerNotification('Cloud Sync Complete', 'All offline cached operations successfully committed to Postgres DB.', 'SYSTEM', 'LOW');
    }, 1200);
  };

  // Handle Biometric Scan
  const triggerBiometricScan = () => {
    setShowBiometricsModal(true);
    setBiometricScanning(true);
    setBiometricSuccess(false);

    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      setTimeout(() => {
        setShowBiometricsModal(false);
        setBiometricUnlocked(true);
      }, 700);
    }, 1200);
  };

  // Toggle student attendance
  const toggleStudentBoarding = (studentId) => {
    executeOrQueue('UPDATE_STUDENT_BOARDING', { studentId }, () => {
      setStudentsAtStop(prev =>
        prev.map(s => {
          if (s.id === studentId) {
            const newStatus = s.status === 'BOARDED' ? 'WAITING' : 'BOARDED';
            if (newStatus === 'BOARDED') {
              setCurrentPassengerCount(c => Math.min(busCapacity + 5, c + 1));
              triggerNotification('Student Boarded', `${s.name} (${s.rollNo}) verified via biometric NFC.`, 'BOARDING');
            } else {
              setCurrentPassengerCount(c => Math.max(0, c - 1));
            }
            return { ...s, status: newStatus };
          }
          return s;
        })
      );
    });
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))', background: 'var(--bg-void)', padding: '24px', color: 'var(--text-primary)' }}>
      {/* Top Breadcrumb & Phase 13 Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>ADMINISTRATION</span>
            <span>/</span>
            <span>MOBILE ARCHITECTURE</span>
            <span>/</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>PHASE 13 NATIVE SUITE</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={28} style={{ color: '#FF6600' }} />
            Native Mobile Applications Lab & Device Simulator
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live hardware simulation of iOS & Android clients: Parent/Student Companion, Driver Cockpit, and Admin Dispatch App with WebSocket telemetry, FCM push alerts, and SQLite offline queue.
          </p>
        </div>

        {/* Global Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowQueueDrawer(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: pendingQueue.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface-elevated)',
              border: pendingQueue.length > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-default)',
              color: pendingQueue.length > 0 ? '#f59e0b' : 'var(--text-secondary)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Layers size={15} />
            Offline Queue ({pendingQueue.length})
          </button>

          <button
            onClick={() => {
              triggerNotification(
                '🚨 EMERGENCY SOS TRIGGERED',
                'Bus #101 driver signaled manual emergency dispatch override!',
                'SAFETY',
                'HIGH'
              );
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShieldAlert size={15} />
            Test SOS Broadcast
          </button>
        </div>
      </div>

      {/* Control Console Toolbar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* App Variant Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Target App:
          </span>
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveApp('parent')}
              style={{
                background: activeApp === 'parent' ? '#FF6600' : 'transparent',
                color: activeApp === 'parent' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={14} />
              1. Parent / Student App
            </button>
            <button
              onClick={() => setActiveApp('driver')}
              style={{
                background: activeApp === 'driver' ? '#10b981' : 'transparent',
                color: activeApp === 'driver' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Bus size={14} />
              2. Driver Cockpit App
            </button>
            <button
              onClick={() => setActiveApp('admin')}
              style={{
                background: activeApp === 'admin' ? '#3b82f6' : 'transparent',
                color: activeApp === 'admin' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Gauge size={14} />
              3. Admin Dispatch Mobile
            </button>
          </div>
        </div>

        {/* Hardware Frame Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hardware Frame:
          </span>
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setDeviceType('iphone')}
              style={{
                background: deviceType === 'iphone' ? 'var(--bg-primary)' : 'transparent',
                color: deviceType === 'iphone' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: deviceType === 'iphone' ? '1px solid var(--border-default)' : 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Apple iPhone 16 Pro
            </button>
            <button
              onClick={() => setDeviceType('pixel')}
              style={{
                background: deviceType === 'pixel' ? 'var(--bg-primary)' : 'transparent',
                color: deviceType === 'pixel' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: deviceType === 'pixel' ? '1px solid var(--border-default)' : 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Google Pixel 9
            </button>
            <button
              onClick={() => setDeviceType('tablet')}
              style={{
                background: deviceType === 'tablet' ? 'var(--bg-primary)' : 'transparent',
                color: deviceType === 'tablet' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: deviceType === 'tablet' ? '1px solid var(--border-default)' : 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Tablet (iPad Air)
            </button>
          </div>
        </div>

        {/* Network & Hardware Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Network Switch */}
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              if (!isOnline && pendingQueue.length > 0) {
                flushOfflineQueue();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: isOnline ? '#10b981' : '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'Online (5G)' : 'Offline Mode'}
          </button>

          {/* Biometrics Trigger */}
          <button
            onClick={triggerBiometricScan}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Fingerprint size={14} style={{ color: '#06b6d4' }} />
            Simulate Biometrics
          </button>

          {/* GPS Simulation Toggle */}
          <button
            onClick={() => setIsMoving(!isMoving)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: isMoving ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface-elevated)',
              border: isMoving ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-subtle)',
              color: isMoving ? '#3b82f6' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isMoving ? <Pause size={13} /> : <Play size={13} />}
            {isMoving ? 'GPS Moving' : 'GPS Paused'}
          </button>
        </div>
      </div>

      {/* Main Workspace: Simulator Centerpiece + Side Telemetry Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: deviceType === 'tablet' ? '1fr' : 'auto 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* ========================================================================= */}
        {/* MOBILE HARDWARE CHASSIS CONTAINER                                        */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto' }}>
          <div
            id="mobile-phone-hardware-chassis"
            style={{
              width: deviceType === 'tablet' ? '760px' : deviceType === 'pixel' ? '390px' : '393px',
              height: deviceType === 'tablet' ? '540px' : '820px',
              background: '#09090b',
              borderRadius: deviceType === 'tablet' ? '32px' : deviceType === 'pixel' ? '46px' : '52px',
              padding: deviceType === 'tablet' ? '18px' : '12px',
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 10px #27272a, 0 0 0 12px #3f3f46, 0 0 40px rgba(255, 102, 0, 0.08)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              userSelect: 'none',
              transform: `scale(${deviceScale})`,
              transformOrigin: 'top center',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Outer Physical Hardware Buttons (Simulated) */}
            <div style={{ position: 'absolute', left: '-14px', top: '110px', width: '4px', height: '32px', background: '#3f3f46', borderRadius: '4px 0 0 4px' }} title="Action Button" />
            <div style={{ position: 'absolute', left: '-14px', top: '160px', width: '4px', height: '52px', background: '#3f3f46', borderRadius: '4px 0 0 4px' }} title="Volume Up" />
            <div style={{ position: 'absolute', left: '-14px', top: '225px', width: '4px', height: '52px', background: '#3f3f46', borderRadius: '4px 0 0 4px' }} title="Volume Down" />
            <div style={{ position: 'absolute', right: '-14px', top: '175px', width: '4px', height: '70px', background: '#3f3f46', borderRadius: '0 4px 4px 0' }} title="Power Button" />

            {/* SCREEN GLASS / INNER DISPLAY */}
            <div
              style={{
                flex: 1,
                background: '#000000',
                borderRadius: deviceType === 'tablet' ? '20px' : deviceType === 'pixel' ? '38px' : '42px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* TOP STATUS BAR */}
              <div
                style={{
                  height: '44px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 24px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  zIndex: 40,
                  position: 'relative'
                }}
              >
                {/* Left: Clock */}
                <span style={{ letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>{deviceTime}</span>

                {/* Center: Dynamic Island (iPhone) or Hole Punch (Pixel) */}
                {deviceType === 'iphone' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '9px',
                      transform: 'translateX(-50%)',
                      height: activeBanner ? '48px' : '26px',
                      width: activeBanner ? '300px' : '110px',
                      background: '#000000',
                      borderRadius: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: activeBanner ? '6px 14px' : '0 10px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)',
                      transition: 'all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      cursor: 'pointer',
                      zIndex: 50
                    }}
                    onClick={() => setActiveBanner(null)}
                  >
                    {!activeBanner ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1c1917' }} />
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
                        </div>
                        {isMoving && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>Bus #101</span>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', overflow: 'hidden' }}>
                        <div style={{ background: activeBanner.category === 'SAFETY' ? '#ef4444' : '#FF6600', padding: '6px', borderRadius: '50%' }}>
                          <Bell size={12} color="#fff" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {activeBanner.title}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#a1a1aa', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {activeBanner.message}
                          </div>
                        </div>
                        <X size={13} color="#a1a1aa" />
                      </div>
                    )}
                  </div>
                )}

                {deviceType === 'pixel' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '12px',
                      transform: 'translateX(-50%)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#111827',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                )}

                {/* Right: Cellular, Wifi, Battery */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{networkType}</span>
                  {isOnline ? <Wifi size={13} /> : <WifiOff size={13} style={{ color: '#ef4444' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{batteryLevel}%</span>
                    {isCharging ? <BatteryCharging size={14} style={{ color: '#10b981' }} /> : <Battery size={14} />}
                  </div>
                </div>
              </div>

              {/* NON-IPHONE PUSH NOTIFICATION BANNER (PIXEL & TABLET) */}
              {deviceType !== 'iphone' && activeBanner && (
                <div
                  style={{
                    position: 'absolute',
                    top: '48px',
                    left: '14px',
                    right: '14px',
                    background: 'rgba(24, 24, 27, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 60,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
                    animation: 'fadeInDown 0.25s ease'
                  }}
                >
                  <div style={{ background: activeBanner.category === 'SAFETY' ? '#ef4444' : '#FF6600', padding: '8px', borderRadius: '10px' }}>
                    <Bell size={16} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{activeBanner.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginTop: '2px', lineHeight: 1.3 }}>{activeBanner.message}</div>
                  </div>
                  <button onClick={() => setActiveBanner(null)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* BIOMETRICS SCAN MODAL OVERLAY */}
              {showBiometricsModal && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 90,
                    padding: '24px'
                  }}
                >
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      border: biometricSuccess ? '3px solid #10b981' : '3px dashed #06b6d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: biometricScanning ? 'spin 2s linear infinite' : 'none',
                      transition: 'all 0.3s ease',
                      marginBottom: '16px',
                      background: biometricSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.1)'
                    }}
                  >
                    {biometricSuccess ? (
                      <CheckCircle2 size={44} color="#10b981" />
                    ) : (
                      <Fingerprint size={44} color="#06b6d4" />
                    )}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    {biometricScanning ? 'Scanning Biometrics...' : biometricSuccess ? 'Identity Verified' : 'Touch ID / Face ID'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>
                    {biometricSuccess ? 'Session unlocked with AES-256 secure enclave' : 'Hold finger on sensor or look at TrueDepth camera'}
                  </div>
                </div>
              )}

              {/* APP CONTENT CONTAINER */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative' }}>
                
                {/* ------------------------------------------------------------- */}
                {/* APP 1: PARENT & STUDENT COMPANION APP                         */}
                {/* ------------------------------------------------------------- */}
                {activeApp === 'parent' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0c', color: '#fff' }}>
                    
                    {/* Screen Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                      {/* PARENT TAB 1: LIVE MAP & TRACKING */}
                      {parentTab === 'map' && (
                        <div>
                          {/* Top Card: Live Bus Status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase' }}>Live Journey Tracking</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Bus #101 • Route 1</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>ON TIME</span>
                            </div>
                          </div>

                          {/* Interactive Map Visualizer */}
                          <div
                            style={{
                              height: '210px',
                              background: 'radial-gradient(circle at 60% 40%, #1c1c24 0%, #0d0d11 100%)',
                              borderRadius: '16px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              position: 'relative',
                              overflow: 'hidden',
                              marginBottom: '16px'
                            }}
                          >
                            {/* Grid Lines */}
                            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
                              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#fff" strokeWidth="0.8" />
                              </pattern>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>

                            {/* Simulated Route Path SVG */}
                            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                              <path
                                d="M 30 180 Q 90 120 160 130 T 260 70 T 340 40"
                                fill="none"
                                stroke="rgba(255, 102, 0, 0.35)"
                                strokeWidth="6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M 30 180 Q 90 120 160 130 T 260 70 T 340 40"
                                fill="none"
                                stroke="#FF6600"
                                strokeWidth="2.5"
                                strokeDasharray="6 4"
                              />

                              {/* Stop 1 */}
                              <circle cx="30" cy="180" r="5" fill="#10b981" />
                              <text x="35" y="195" fill="#a1a1aa" fontSize="9" fontWeight="bold">Main Gate</text>

                              {/* Stop 2 */}
                              <circle cx="160" cy="130" r="5" fill="#10b981" />
                              <text x="145" y="150" fill="#a1a1aa" fontSize="9" fontWeight="bold">Science</text>

                              {/* Stop 3 - Target Pickup */}
                              <circle cx="260" cy="70" r="8" fill="rgba(245, 158, 11, 0.3)" />
                              <circle cx="260" cy="70" r="5" fill="#f59e0b" />
                              <text x="245" y="90" fill="#f59e0b" fontSize="9" fontWeight="bold">Your Stop</text>

                              {/* Stop 4 */}
                              <circle cx="340" cy="40" r="5" fill="#3b82f6" />
                              <text x="300" y="35" fill="#a1a1aa" fontSize="9" fontWeight="bold">Hostel</text>

                              {/* Moving Bus Pin */}
                              <g transform={`translate(${30 + (busProgress / 100) * 310}, ${180 - (busProgress / 100) * 140})`}>
                                <circle cx="0" cy="0" r="14" fill="rgba(255, 102, 0, 0.25)" />
                                <circle cx="0" cy="0" r="9" fill="#FF6600" stroke="#fff" strokeWidth="2" />
                              </g>
                            </svg>

                            {/* Map HUD Overlays */}
                            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600 }}>
                              Speed: {busSpeed} km/h
                            </div>
                            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                              GPS Precision: ±2.4m
                            </div>
                          </div>

                          {/* ETA Countdown Tile */}
                          <div
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.12) 0%, rgba(24, 24, 27, 0.8) 100%)',
                              border: '1px solid rgba(255, 102, 0, 0.3)',
                              borderRadius: '14px',
                              padding: '14px',
                              marginBottom: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#FF6600', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Arrival</div>
                              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFeatureSettings: '"tnum"' }}>
                                {formatTime(etaSeconds)}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Next: Hostel Campus Gate 2</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>Driver</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Rajesh Kumar</div>
                              <div style={{ fontSize: '0.7rem', color: '#10b981' }}>★ 4.9 (124 trips)</div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                            <button
                              onClick={() => triggerNotification('Calling Driver...', 'Connecting secure VoIP call to Rajesh Kumar (Bus #101).', 'VOIP', 'MEDIUM')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: '#18181b',
                                border: '1px solid #27272a',
                                color: '#fff',
                                padding: '10px',
                                borderRadius: '10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <PhoneCall size={14} style={{ color: '#10b981' }} />
                              Call Driver
                            </button>
                            <button
                              onClick={() => triggerNotification('ETA Link Shared', 'Live tracking link copied to clipboard.', 'SYSTEM', 'LOW')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: '#18181b',
                                border: '1px solid #27272a',
                                color: '#fff',
                                padding: '10px',
                                borderRadius: '10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Share2 size={14} style={{ color: '#3b82f6' }} />
                              Share Trip ETA
                            </button>
                          </div>

                          {/* Emergency SOS Button */}
                          <button
                            onClick={() => {
                              executeOrQueue('TRIGGER_PARENT_SOS', { student: 'Sarah Jenkins', bus: 101 }, () => {
                                triggerNotification('🚨 SOS SENT TO DISPATCH', 'Campus emergency control center notified with exact coordinates.', 'SAFETY', 'HIGH');
                              });
                            }}
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                              border: 'none',
                              color: '#fff',
                              padding: '12px',
                              borderRadius: '12px',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                            }}
                          >
                            <ShieldAlert size={18} />
                            EMERGENCY SOS TO CAMPUS SECURITY
                          </button>
                        </div>
                      )}

                      {/* PARENT TAB 2: BOARDING STATUS */}
                      {parentTab === 'boarding' && (
                        <div>
                          {/* Student ID Card */}
                          <div
                            style={{
                              background: 'linear-gradient(135deg, #18181b 0%, #111113 100%)',
                              border: '1px solid #27272a',
                              borderRadius: '16px',
                              padding: '16px',
                              marginBottom: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px'
                            }}
                          >
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FF6600 0%, #ea580c 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                color: '#fff'
                              }}
                            >
                              SJ
                            </div>
                            <div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Sarah Jenkins</div>
                              <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Roll: CSE-2026-042 • Class 8-A</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  BIOMETRIC VERIFIED
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Today's Journey Stage */}
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Today's Daily Schedule (Sept 24)
                          </div>

                          {/* Morning Pickup Card */}
                          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>● MORNING PICKUP</span>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Stop 3: Science Department</div>
                              </div>
                              <span style={{ fontSize: '0.7rem', background: '#052e16', color: '#22c55e', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                BOARDED 08:14 AM
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Verified with facial recognition camera unit #02. Seat #14 allocated.</div>
                          </div>

                          {/* Afternoon Drop Card */}
                          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 700 }}>● EVENING RETURN</span>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Stop 7: South City Gate</div>
                              </div>
                              <span style={{ fontSize: '0.7rem', background: '#1e1b4b', color: '#818cf8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                SCHEDULED 03:45 PM
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Driver: Sarah Miller • Bus #101</div>
                          </div>

                          {/* Historical Trips List */}
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Recent Trips History
                          </div>
                          {[
                            { date: 'Sept 23', status: 'Completed', time: '08:12 AM - 08:44 AM' },
                            { date: 'Sept 22', status: 'Completed', time: '08:15 AM - 08:42 AM' },
                            { date: 'Sept 21', status: 'Completed', time: '08:10 AM - 08:40 AM' }
                          ].map((t, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#121214', border: '1px solid #1f1f23', borderRadius: '8px', marginBottom: '6px', fontSize: '0.75rem' }}>
                              <div>
                                <div style={{ fontWeight: 600, color: '#fff' }}>{t.date}</div>
                                <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{t.time}</div>
                              </div>
                              <span style={{ color: '#10b981', fontWeight: 700 }}>{t.status}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* PARENT TAB 3: NOTIFICATIONS */}
                      {parentTab === 'notifications' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Activity Alerts</div>
                            <button
                              onClick={() => {
                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                setUnreadCount(0);
                              }}
                              style={{ background: 'none', border: 'none', color: '#FF6600', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Mark All Read
                            </button>
                          </div>

                          {notifications.map(n => (
                            <div
                              key={n.id}
                              style={{
                                background: n.read ? '#141416' : '#1c1c20',
                                border: n.read ? '1px solid #222226' : '1px solid rgba(255, 102, 0, 0.4)',
                                borderRadius: '12px',
                                padding: '12px',
                                marginBottom: '8px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: n.category === 'SAFETY' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 102, 0, 0.2)',
                                    color: n.category === 'SAFETY' ? '#ef4444' : '#FF6600'
                                  }}
                                >
                                  {n.category}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: '#71717a' }}>{n.timestamp}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{n.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#a1a1aa', lineHeight: 1.35 }}>{n.message}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* PARENT TAB 4: SETTINGS */}
                      {parentTab === 'settings' && (
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>App Settings & Preferences</div>
                          
                          {/* Push Preferences */}
                          <div style={{ background: '#18181b', borderRadius: '12px', border: '1px solid #27272a', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF6600', marginBottom: '10px', textTransform: 'uppercase' }}>Push Notifications</div>
                            {[
                              { key: 'boardingAlerts', label: 'Student Boarding Alerts' },
                              { key: 'delayWarnings', label: 'Route Delay & Traffic Warnings' },
                              { key: 'emergencyAlerts', label: 'Emergency SOS Broadcasts' }
                            ].map(item => (
                              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                                <span style={{ fontSize: '0.78rem', color: '#fff' }}>{item.label}</span>
                                <input
                                  type="checkbox"
                                  checked={parentPrefs[item.key]}
                                  onChange={e => setParentPrefs({ ...parentPrefs, [item.key]: e.target.checked })}
                                  style={{ accentColor: '#FF6600', cursor: 'pointer' }}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Security & Offline */}
                          <div style={{ background: '#18181b', borderRadius: '12px', border: '1px solid #27272a', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: '10px', textTransform: 'uppercase' }}>Security & Storage</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                              <span style={{ fontSize: '0.78rem', color: '#fff' }}>Biometric Login (Face ID)</span>
                              <input
                                type="checkbox"
                                checked={parentPrefs.biometricLogin}
                                onChange={e => setParentPrefs({ ...parentPrefs, biometricLogin: e.target.checked })}
                                style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                              <span style={{ fontSize: '0.78rem', color: '#fff' }}>Offline SQLite Cache</span>
                              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>ACTIVE (148 KB)</span>
                            </div>
                          </div>

                          <button
                            onClick={() => triggerNotification('Session Closed', 'Logged out of parent account.', 'SYSTEM', 'LOW')}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: '#27272a',
                              border: 'none',
                              color: '#ef4444',
                              borderRadius: '10px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <LogOut size={14} />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Navigation Bar */}
                    <div
                      style={{
                        height: '56px',
                        background: '#121215',
                        borderTop: '1px solid #222226',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        padding: '0 8px'
                      }}
                    >
                      <button
                        onClick={() => setParentTab('map')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: parentTab === 'map' ? '#FF6600' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <Navigation size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Live Map</span>
                      </button>

                      <button
                        onClick={() => setParentTab('boarding')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: parentTab === 'boarding' ? '#FF6600' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Boarding</span>
                      </button>

                      <button
                        onClick={() => setParentTab('notifications')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: parentTab === 'notifications' ? '#FF6600' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <Bell size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Alerts</span>
                        {unreadCount > 0 && (
                          <div style={{ position: 'absolute', top: '-2px', right: '4px', width: '7px', height: '7px', borderRadius: '50%', background: '#FF6600' }} />
                        )}
                      </button>

                      <button
                        onClick={() => setParentTab('settings')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: parentTab === 'settings' ? '#FF6600' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <Sliders size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Settings</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* APP 2: DRIVER COCKPIT APP                                     */}
                {/* ------------------------------------------------------------- */}
                {activeApp === 'driver' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#090a0d', color: '#fff' }}>
                    
                    {/* Screen Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                      {/* DRIVER TAB 1: ROUTE GUIDANCE HUD */}
                      {driverTab === 'guidance' && (
                        <div>
                          {/* Next Turn Navigation Banner */}
                          <div
                            style={{
                              background: '#10b981',
                              borderRadius: '16px',
                              padding: '16px',
                              color: '#000',
                              marginBottom: '14px',
                              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Compass size={32} />
                              <div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>In 180m • Turn Right</div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.9 }}>Onto Campus Academic Avenue</div>
                              </div>
                            </div>
                          </div>

                          {/* Target Stop HUD */}
                          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>NEXT PASSENGER STOP (5/12)</span>
                              <span style={{ fontSize: '0.7rem', background: '#27272a', padding: '2px 8px', borderRadius: '6px' }}>250m away</span>
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>Library Plaza Hub</div>
                            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '12px' }}>ETA: 3 mins • 8 students waiting to board</div>

                            {/* Action Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  executeOrQueue('MARK_STOP_ARRIVED', { stopId: 'S5', bus: 101 }, () => {
                                    triggerNotification('Stop Arrival Logged', 'Geofence stop arrival timestamp verified.', 'ROUTE', 'LOW');
                                  });
                                }}
                                style={{
                                  background: '#10b981',
                                  border: 'none',
                                  color: '#000',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Mark Arrived
                              </button>
                              <button
                                onClick={() => triggerNotification('Dispatch Dialed', 'Calling Central Dispatcher on frequency channel 4.', 'VOIP', 'MEDIUM')}
                                style={{
                                  background: '#27272a',
                                  border: 'none',
                                  color: '#fff',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Dispatch HQ
                              </button>
                            </div>
                          </div>

                          {/* Capacity Meter Tile */}
                          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 700 }}>PASSENGER OCCUPANCY</span>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  color: currentPassengerCount > busCapacity ? '#ef4444' : currentPassengerCount > busCapacity * 0.85 ? '#f59e0b' : '#10b981'
                                }}
                              >
                                {currentPassengerCount} / {busCapacity} Seats
                              </span>
                            </div>
                            {/* Bar */}
                            <div style={{ height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min(100, (currentPassengerCount / busCapacity) * 100)}%`,
                                  background: currentPassengerCount > busCapacity ? '#ef4444' : currentPassengerCount > busCapacity * 0.85 ? '#f59e0b' : '#10b981',
                                  transition: 'all 0.3s ease'
                                }}
                              />
                            </div>
                            {currentPassengerCount > busCapacity && (
                              <div style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700, marginTop: '6px' }}>
                                ⚠️ OVER CAPACITY WARNING (+{currentPassengerCount - busCapacity} students)
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* DRIVER TAB 2: STOP CHECKLIST & ATTENDANCE */}
                      {driverTab === 'checklist' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Stop 5: Library Plaza</div>
                              <div style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>Student Roster for this stop</div>
                            </div>
                            <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#000', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                              {studentsAtStop.filter(s => s.status === 'BOARDED').length} / {studentsAtStop.length} Boarded
                            </span>
                          </div>

                          {studentsAtStop.map(s => (
                            <div
                              key={s.id}
                              style={{
                                background: '#18181b',
                                border: s.status === 'BOARDED' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #27272a',
                                borderRadius: '12px',
                                padding: '10px 12px',
                                marginBottom: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: s.status === 'BOARDED' ? '#052e16' : '#27272a',
                                    color: s.status === 'BOARDED' ? '#22c55e' : '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 700
                                  }}
                                >
                                  {s.avatar}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{s.name}</div>
                                  <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{s.rollNo}</div>
                                </div>
                              </div>

                              <button
                                onClick={() => toggleStudentBoarding(s.id)}
                                style={{
                                  background: s.status === 'BOARDED' ? '#10b981' : '#27272a',
                                  color: s.status === 'BOARDED' ? '#000' : '#fff',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {s.status === 'BOARDED' ? (
                                  <>
                                    <Check size={12} />
                                    Boarded
                                  </>
                                ) : (
                                  'Tap Board'
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* DRIVER TAB 3: VEHICLE STATUS */}
                      {driverTab === 'vehicle' && (
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>Vehicle Health & Shift</div>
                          
                          {/* Metrics Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px' }}>
                              <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Fuel Level</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>78%</div>
                              <div style={{ fontSize: '0.65rem', color: '#71717a' }}>~280 km range</div>
                            </div>
                            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px' }}>
                              <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Engine Temp</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>88°C</div>
                              <div style={{ fontSize: '0.65rem', color: '#10b981' }}>Normal range</div>
                            </div>
                          </div>

                          {/* Pre-Trip Inspection Checklist */}
                          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Pre-Trip Safety Inspection
                            </div>
                            {['Brake pressure verified', 'All 4 security cameras streaming', 'First Aid & Fire Extinguisher checked', 'Emergency exit latch functional'].map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#fff', padding: '4px 0' }}>
                                <CheckCircle2 size={13} color="#10b981" />
                                {item}
                              </div>
                            ))}
                          </div>

                          {/* End Shift Button */}
                          <button
                            onClick={() => {
                              triggerBiometricScan();
                              setTimeout(() => {
                                triggerNotification('Shift Completed', 'Shift summary logged and telemetry sent to Admin dashboard.', 'SYSTEM', 'LOW');
                              }, 1500);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px',
                              background: '#27272a',
                              border: '1px solid #3f3f46',
                              color: '#fff',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            End Shift & Log Out (Requires Biometrics)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Driver Bottom Navigation Bar */}
                    <div
                      style={{
                        height: '56px',
                        background: '#121215',
                        borderTop: '1px solid #222226',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        padding: '0 8px'
                      }}
                    >
                      <button
                        onClick={() => setDriverTab('guidance')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: driverTab === 'guidance' ? '#10b981' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <Compass size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Route HUD</span>
                      </button>

                      <button
                        onClick={() => setDriverTab('checklist')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: driverTab === 'checklist' ? '#10b981' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <Users size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Roster</span>
                      </button>

                      <button
                        onClick={() => setDriverTab('vehicle')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: driverTab === 'vehicle' ? '#10b981' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <Gauge size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Vehicle</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* APP 3: ADMIN DISPATCH MOBILE/TABLET APP                       */}
                {/* ------------------------------------------------------------- */}
                {activeApp === 'admin' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#07080a', color: '#fff' }}>
                    
                    {/* Screen Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                      {/* ADMIN TAB 1: FLEET RADAR */}
                      {adminTab === 'fleet' && (
                        <div>
                          {/* Fleet KPI Banner */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ background: '#131418', border: '1px solid #222228', borderRadius: '10px', padding: '10px' }}>
                              <div style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>Active Fleet</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6' }}>12 / 14</div>
                            </div>
                            <div style={{ background: '#131418', border: '1px solid #222228', borderRadius: '10px', padding: '10px' }}>
                              <div style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>On-Time</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>95.4%</div>
                            </div>
                            <div style={{ background: '#131418', border: '1px solid #222228', borderRadius: '10px', padding: '10px' }}>
                              <div style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>Students</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF6600' }}>482</div>
                            </div>
                          </div>

                          {/* Live Buses Mini Cards */}
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Live Vehicles
                          </div>
                          {[
                            { id: '101', route: 'Route 1', driver: 'Rajesh K.', speed: '36 km/h', pass: '46/54', status: 'ON TIME', color: '#10b981' },
                            { id: '102', route: 'Route 2', driver: 'Sunil V.', speed: '42 km/h', pass: '51/54', status: 'DELAYED (+4m)', color: '#f59e0b' },
                            { id: '103', route: 'Route 3', driver: 'Amit S.', speed: '38 km/h', pass: '38/54', status: 'ON TIME', color: '#10b981' }
                          ].map(bus => (
                            <div
                              key={bus.id}
                              style={{
                                background: '#131418',
                                border: '1px solid #222228',
                                borderRadius: '12px',
                                padding: '12px',
                                marginBottom: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Bus #{bus.id} • {bus.route}</div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: bus.color, background: `${bus.color}20`, padding: '2px 6px', borderRadius: '4px' }}>
                                  {bus.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>Driver: {bus.driver} • Speed: {bus.speed} • Load: {bus.pass}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ADMIN TAB 2: ALERTS & INCIDENTS */}
                      {adminTab === 'alerts' && (
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Active Incidents</div>
                          {[
                            { title: 'Wrong Stop Alighting Detected', bus: 'Bus #102', desc: 'Student Rahul M. got down at Stop 2 instead of Stop 4.', level: 'HIGH' },
                            { title: 'Speed Limit Threshold Warning', bus: 'Bus #104', desc: 'Vehicle reached 58 km/h in 40 km/h campus zone.', level: 'MEDIUM' }
                          ].map((alt, idx) => (
                            <div key={idx} style={{ background: '#151518', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444' }}>{alt.level} PRIORITY</span>
                                <span style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>{alt.bus}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{alt.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#a1a1aa', marginBottom: '10px' }}>{alt.desc}</div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => triggerNotification('Incident Dispatched', 'Patrol unit assigned to verify student location.', 'SAFETY', 'HIGH')}
                                  style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Dispatch Patrol
                                </button>
                                <button
                                  onClick={() => triggerNotification('Alert Resolved', 'Incident marked verified by safety officer.', 'SYSTEM', 'LOW')}
                                  style={{ flex: 1, background: '#27272a', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Resolve
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ADMIN TAB 3: REPORTS & CCTV PREVIEW */}
                      {adminTab === 'reports' && (
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Daily Reports & Vision</div>
                          
                          {/* Camera Snapshot Mock */}
                          <div style={{ background: '#141416', border: '1px solid #242428', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Bus #101 Door Cam (Live Vision)</div>
                            <div style={{ height: '110px', background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                              <Radio size={20} color="#10b981" />
                              <div style={{ position: 'absolute', bottom: '6px', left: '8px', fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                                ● LIVE AI FACE VERIFICATION ACTIVE
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => triggerNotification('Report Exported', 'Mobile shift report PDF sent to administrator email.', 'SYSTEM', 'LOW')}
                            style={{
                              width: '100%',
                              padding: '10px',
                              background: '#3b82f6',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '10px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Export Fleet Summary PDF
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Admin Bottom Navigation Bar */}
                    <div
                      style={{
                        height: '56px',
                        background: '#121215',
                        borderTop: '1px solid #222226',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        padding: '0 8px'
                      }}
                    >
                      <button
                        onClick={() => setAdminTab('fleet')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: adminTab === 'fleet' ? '#3b82f6' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <Bus size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Fleet</span>
                      </button>

                      <button
                        onClick={() => setAdminTab('alerts')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: adminTab === 'alerts' ? '#3b82f6' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <AlertTriangle size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Incidents</span>
                      </button>

                      <button
                        onClick={() => setAdminTab('reports')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: adminTab === 'reports' ? '#3b82f6' : '#71717a',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Vision</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM HOME GESTURE INDICATOR */}
              <div style={{ height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                <div style={{ width: '134px', height: '4px', background: '#ffffff', opacity: 0.35, borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SIDEBAR TELEMETRY & SIMULATOR CONTROL LAB                                */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SIMULATOR INTERACTION PAD */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BellRing size={18} style={{ color: '#FF6600' }} />
              Push Notification Delivery Injector (FCM / APNs)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 14px 0' }}>
              Simulate high-priority push events broadcast from the backend event bus to the active mobile device.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <button
                onClick={() => triggerNotification('Student Boarded Stop 3', 'Sarah Jenkins verified on Bus #101 via facial biometrics.', 'BOARDING', 'HIGH')}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🟢 Boarding Verification
              </button>

              <button
                onClick={() => triggerNotification('Traffic Delay +7m', 'Heavy road construction near Ring Road. ETA updated.', 'DELAY', 'MEDIUM')}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🟠 Route Delay Notice
              </button>

              <button
                onClick={() => triggerNotification('⚠️ Wrong Stop Alert', 'Aarav Patel alighting at Stop 2 (Expected: Stop 5).', 'SAFETY', 'HIGH')}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🔴 Wrong Stop Detected
              </button>

              <button
                onClick={() => triggerNotification('Geofence Arrival in 2m', 'Bus #101 will arrive at your pickup point in 120s.', 'ROUTE', 'LOW')}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🔵 Geofence Arrival Proximity
              </button>
            </div>
          </div>

          {/* CODEBASE & ARCHITECTURE OVERVIEW */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#10b981' }} />
              React Native Mobile App Architecture
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)' }}>bus-students-tracker-mobile/</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platforms:</span>
                <span style={{ fontWeight: 600 }}>iOS (SwiftUI/UIKit) & Android (Kotlin)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Offline Storage:</span>
                <span style={{ fontWeight: 600 }}>SQLite (`local_trips`, `local_notifications`)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Push Notification Service:</span>
                <span style={{ fontWeight: 600 }}>Firebase Cloud Messaging (FCM) + APNs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Security Layer:</span>
                <span style={{ fontWeight: 600 }}>Face ID / Fingerprint Biometrics + SecureStore</span>
              </div>
            </div>
          </div>

          {/* OFFLINE QUEUE DETAILS DRAWER */}
          {showQueueDrawer && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '14px',
                padding: '20px',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={16} />
                  Offline SQLite Transaction Log
                </h4>
                <button onClick={() => setShowQueueDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              {pendingQueue.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
                  Queue is clean. No pending offline mutations.
                </div>
              ) : (
                <div>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '12px' }}>
                    {pendingQueue.map(op => (
                      <div key={op.id} style={{ padding: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', marginBottom: '6px', fontSize: '0.72rem' }}>
                        <div style={{ fontWeight: 700, color: '#f59e0b' }}>{op.type}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Time: {op.timestamp}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={flushOfflineQueue}
                    disabled={isSyncing}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#f59e0b',
                      border: 'none',
                      color: '#000',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {isSyncing ? 'Flushing Transactions...' : 'Sync Transactions to Cloud Now'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
