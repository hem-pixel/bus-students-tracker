/**
 * ROUTE PROGRESS DASHBOARD (PHASE 11)
 * Real-Time Stop-by-Stop Corridor Progression, Dynamic Haversine ETAs & Capacity Telemetry
 * Institution: V.S.B. ENGINEERING COLLEGE (AI & DS Transport Command Center)
 */

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { liveTransportAPI, apiService } from '../../services/apiService';
import {
  Route,
  Bus,
  Clock,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Radio,
  Sliders,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export default function RouteProgressDashboard({ onNavigate }) {
  // State
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [passengerFlow, setPassengerFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simStepLoading, setSimStepLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const socketRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial list of routes
  useEffect(() => {
    let isMounted = true;
    async function loadRoutes() {
      try {
        setLoading(true);
        const res = await apiService.routes.getAll();
        const routeList = res?.data || res || [];
        if (isMounted) {
          setRoutes(routeList);
          if (routeList.length > 0) {
            // Default to route 12 or first route
            const r12 = routeList.find(r => r.route_number === '12' || r.route_number === 12);
            setSelectedRouteId(r12 ? r12.id : routeList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load routes list:', err);
        // Fallback default mock routes if offline
        const fallbackRoutes = [
          { id: 1, route_number: '12', route_name: 'Gandhigramam Express', origin: 'Gandhigramam', destination: 'VSB Campus' },
          { id: 2, route_number: '04', route_name: 'Thanthonimalai Link', origin: 'Thanthonimalai', destination: 'VSB Campus' },
          { id: 3, route_number: '07', route_name: 'Karur Central Direct', origin: 'Karur Bus Stand', destination: 'VSB Campus' }
        ];
        if (isMounted) {
          setRoutes(fallbackRoutes);
          setSelectedRouteId(fallbackRoutes[0].id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRoutes();
    return () => { isMounted = false; };
  }, []);

  // Fetch progress, ETAs, and passenger flow for selected route
  const fetchRouteDetails = async (routeId, isManualRefresh = false) => {
    if (!routeId) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      const [progRes, etaRes] = await Promise.allSettled([
        liveTransportAPI.getRouteProgress(routeId),
        liveTransportAPI.getRouteETAs(routeId)
      ]);

      let activeBusId = null;
      if (progRes.status === 'fulfilled' && progRes.value) {
        const pData = progRes.value.data || progRes.value;
        setProgressData(pData);
        activeBusId = pData.bus_id || pData.bus?.id;
      }

      if (etaRes.status === 'fulfilled' && etaRes.value) {
        const eData = etaRes.value.data || etaRes.value;
        setEtaData(eData);
      }

      // If active bus, fetch passenger flow
      if (activeBusId) {
        try {
          const pfRes = await liveTransportAPI.getPassengerFlow(activeBusId);
          setPassengerFlow(pfRes.data || pfRes);
        } catch {
          setPassengerFlow(null);
        }
      }
    } catch (err) {
      console.error('Error fetching route live details:', err);
    } finally {
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedRouteId) {
      fetchRouteDetails(selectedRouteId);
    }
  }, [selectedRouteId]);

  // Setup Socket.io and Polling Fallback
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';

    try {
      const socket = io(socketUrl, {
        reconnectionAttempts: 5,
        timeout: 8000,
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('route_progress_update', (data) => {
        if (data.route_id === selectedRouteId || data.routeId === selectedRouteId) {
          setProgressData(prev => ({ ...prev, ...data }));
          fetchRouteDetails(selectedRouteId);
        }
      });

      socket.on('bus_location_update', () => {
        if (selectedRouteId) {
          fetchRouteDetails(selectedRouteId);
        }
      });
    } catch (err) {
      console.warn('Socket connection initialization error:', err);
    }

    // Polling fallback every 6 seconds
    pollIntervalRef.current = setInterval(() => {
      if (selectedRouteId) {
        fetchRouteDetails(selectedRouteId);
      }
    }, 6000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedRouteId]);

  // Trigger Step Simulation
  const handleSimulateStep = async () => {
    if (!selectedRouteId) return;
    try {
      setSimStepLoading(true);
      const res = await liveTransportAPI.simulateStep({ route_id: selectedRouteId });
      showToast(`⚡ Simulation step applied for Route ${selectedRoute?.route_number || selectedRouteId}!`);
      await fetchRouteDetails(selectedRouteId);
    } catch (err) {
      showToast('Simulation step request failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSimStepLoading(false);
    }
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId || String(r.id) === String(selectedRouteId));

  // Compute Stops List with Status
  const stopsList = etaData?.stops || progressData?.stops || [];
  const currentStopIndex = progressData?.current_stop_index ?? progressData?.current_stop_sequence ?? 1;
  const progressPercent = progressData?.progress_percentage 
    ? Math.round(progressData.progress_percentage) 
    : stopsList.length > 0 
      ? Math.round(((currentStopIndex) / Math.max(stopsList.length, 1)) * 100) 
      : 0;

  const activeBusNumber = progressData?.bus_number || progressData?.bus?.bus_number || (selectedRoute ? `VSB-B${selectedRoute.route_number}` : 'VSB-B12');
  const delayMinutes = progressData?.delay_minutes ?? 0;
  const isDelayed = delayMinutes > 3;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        background: 'var(--bg-void, #080808)',
        color: 'var(--text-primary, #ffffff)',
        padding: '24px',
        boxSizing: 'border-box',
        gap: '20px',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #0284c7',
            color: '#38bdf8',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Activity size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-default, #1f1f1f)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.12em',
                textTransform: 'uppercase'
              }}
            >
              PHASE 11 • REAL-TIME GPS TELEMETRY
            </span>
            <span style={{ color: 'var(--border-default, #1f1f1f)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: socketConnected ? '#10b981' : '#f59e0b',
                  boxShadow: socketConnected ? '0 0 8px #10b981' : 'none'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: socketConnected ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-mono, monospace)' }}>
                {socketConnected ? 'WS STREAM ACTIVE' : 'POLLING MODE'}
              </span>
            </div>
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Route style={{ color: '#38bdf8' }} size={28} />
            Route Corridor Progress Matrix
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--text-muted, #888888)' }}>
            Sequential corridor traversal, automated Haversine geofence arrival detection, and dynamic stop ETAs.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate && onNavigate('live-map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-primary, #0d0d0d)',
              border: '1px solid var(--border-default, #1f1f1f)',
              color: 'var(--text-primary, #ffffff)',
              padding: '9px 15px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Radio size={16} style={{ color: '#38bdf8' }} />
            Open Radar Map
          </button>

          <button
            onClick={() => onNavigate && onNavigate('live-analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-primary, #0d0d0d)',
              border: '1px solid var(--border-default, #1f1f1f)',
              color: 'var(--text-primary, #ffffff)',
              padding: '9px 15px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingUp size={16} style={{ color: '#10b981' }} />
            Transit Analytics
          </button>

          <button
            onClick={handleSimulateStep}
            disabled={simStepLoading || !selectedRouteId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0284c7',
              border: 'none',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: simStepLoading ? 'wait' : 'pointer',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Play size={15} />
            {simStepLoading ? 'Advancing Bus...' : 'Simulate Stop Step'}
          </button>

          <button
            onClick={() => fetchRouteDetails(selectedRouteId, true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-primary, #0d0d0d)',
              border: '1px solid var(--border-default, #1f1f1f)',
              color: 'var(--text-muted, #888888)',
              padding: '9px 12px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
            title="Refresh Route Progress"
          >
            <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* Route Selector Strip & Corridor Quick Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-primary, #0d0d0d)',
          border: '1px solid var(--border-default, #1f1f1f)',
          borderRadius: '10px',
          padding: '12px 16px',
          flexWrap: 'wrap'
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted, #888888)',
            textTransform: 'uppercase',
            fontWeight: 700
          }}
        >
          SELECT CORRIDOR:
        </span>

        {routes.map(r => {
          const isSelected = r.id === selectedRouteId || String(r.id) === String(selectedRouteId);
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isSelected ? '#1e293b' : 'transparent',
                border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle, #1a1a1a)',
                color: isSelected ? '#38bdf8' : 'var(--text-muted, #aaaaaa)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Bus size={14} />
              <span>Route {r.route_number || r.id}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({r.route_name || r.name || 'Campus Corridor'})</span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Telemetry View: Progress Gauge & Timeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Corridor Key Metrics & Capacity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Bus & Trip Card */}
          <div
            style={{
              background: 'var(--bg-primary, #0d0d0d)',
              border: '1px solid var(--border-default, #1f1f1f)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <Bus size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    {activeBusNumber}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #888888)', fontFamily: 'var(--font-mono, monospace)' }}>
                    ROUTE {selectedRoute?.route_number || '12'} • V.S.B. TRANSIT
                  </div>
                </div>
              </div>

              <span
                style={{
                  background: isDelayed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isDelayed ? '#ef4444' : '#10b981',
                  border: `1px solid ${isDelayed ? '#ef4444' : '#10b981'}`,
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                {isDelayed ? `DELAYED +${delayMinutes}m` : 'ON SCHEDULE'}
              </span>
            </div>

            {/* Distance & Progress Bar */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted, #888888)' }}>Corridor Completion</span>
                <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                  {progressPercent}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  background: '#1a1a1a',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                    borderRadius: '5px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle, #141414)'
              }}
            >
              <div style={{ background: '#080808', padding: '12px', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '0.7rem', color: '#888888', marginBottom: '4px' }}>CURRENT SPEED</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: '#38bdf8' }}>
                  {progressData?.current_speed_kmh ? `${Math.round(progressData.current_speed_kmh)} km/h` : '38 km/h'}
                </div>
              </div>

              <div style={{ background: '#080808', padding: '12px', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: '0.7rem', color: '#888888', marginBottom: '4px' }}>NEXT STOP ETA</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: '#10b981' }}>
                  {etaData?.next_stop_eta_minutes !== undefined ? `${etaData.next_stop_eta_minutes} min` : '4 min'}
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Occupancy & Flow Card */}
          <div
            style={{
              background: 'var(--bg-primary, #0d0d0d)',
              border: '1px solid var(--border-default, #1f1f1f)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Users size={18} style={{ color: '#f59e0b' }} />
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Passenger Flow & Load
              </h4>
            </div>

            {/* Capacity gauge */}
            {(() => {
              const capacity = passengerFlow?.capacity || 54;
              const boarded = passengerFlow?.boarded_count ?? passengerFlow?.current_passengers ?? 38;
              const deboarded = passengerFlow?.deboarded_count ?? 6;
              const ratio = Math.round((boarded / capacity) * 100);
              const isFull = ratio >= 90;

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: isFull ? '#ef4444' : '#ffffff' }}>
                      {boarded}
                      <span style={{ fontSize: '0.9rem', color: '#888888', fontWeight: 400 }}> / {capacity} seats</span>
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isFull ? '#ef4444' : '#10b981',
                        fontFamily: 'var(--font-mono, monospace)'
                      }}
                    >
                      {ratio}% LOAD
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: `${Math.min(100, ratio)}%`,
                        height: '100%',
                        background: isFull ? '#ef4444' : ratio > 75 ? '#f59e0b' : '#10b981',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#888888' }}>
                    <span>Boarded today: <strong style={{ color: '#fff' }}>{boarded + deboarded}</strong></span>
                    <span>Alighted: <strong style={{ color: '#fff' }}>{deboarded}</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Corridor Waypoints Overview */}
          <div
            style={{
              background: 'var(--bg-primary, #0d0d0d)',
              border: '1px solid var(--border-default, #1f1f1f)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Navigation size={18} style={{ color: '#38bdf8' }} />
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Corridor Terminals
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                <span style={{ color: 'var(--text-muted, #888888)' }}>Origin:</span>
                <span style={{ fontWeight: 600 }}>{selectedRoute?.origin || 'Karur Central Bus Stand'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: 'var(--text-muted, #888888)' }}>Destination:</span>
                <span style={{ fontWeight: 600 }}>{selectedRoute?.destination || 'V.S.B. Engineering College'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ color: 'var(--text-muted, #888888)' }}>Total Stops:</span>
                <span style={{ fontWeight: 600 }}>{stopsList.length || 5} Corridor Checkpoints</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Stop Progression Timeline */}
        <div
          style={{
            background: 'var(--bg-primary, #0d0d0d)',
            border: '1px solid var(--border-default, #1f1f1f)',
            borderRadius: '12px',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Corridor Sequence & Stop Timeline
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #888888)' }}>
                Real-time Haversine distance geofencing, arrival status & dynamic time estimations.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: '#1a1a1a',
                  color: '#888888',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                AUTOMATED GEOFENCE: 150m
              </span>
            </div>
          </div>

          {/* Timeline Stop Items */}
          {stopsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted, #888888)' }}>
              No stops configured for this corridor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {stopsList.map((stop, index) => {
                const seq = stop.sequence_number || stop.stop_sequence || (index + 1);
                const isPassed = seq < currentStopIndex;
                const isCurrent = seq === currentStopIndex;
                const isUpcoming = seq > currentStopIndex;

                const etaMinutes = stop.eta_minutes ?? (isPassed ? 0 : isCurrent ? 2 : (index - currentStopIndex + 1) * 4);
                const scheduledTime = stop.scheduled_time || stop.arrival_time || '07:45 AM';

                return (
                  <div
                    key={stop.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '18px',
                      position: 'relative',
                      paddingBottom: index === stopsList.length - 1 ? '0' : '28px'
                    }}
                  >
                    {/* Vertical connecting line */}
                    {index < stopsList.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '19px',
                          top: '36px',
                          bottom: '0',
                          width: '2px',
                          background: isPassed ? '#10b981' : isCurrent ? 'linear-gradient(to bottom, #38bdf8, #222222)' : '#1f1f1f',
                          zIndex: 1
                        }}
                      />
                    )}

                    {/* Step Icon Node */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isPassed ? '#064e3b' : isCurrent ? '#0369a1' : '#141414',
                        border: isPassed ? '2px solid #10b981' : isCurrent ? '2px solid #38bdf8' : '2px solid #2a2a2a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isPassed ? '#10b981' : isCurrent ? '#38bdf8' : '#666666',
                        zIndex: 2,
                        flexShrink: 0,
                        boxShadow: isCurrent ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {isPassed ? (
                        <CheckCircle2 size={20} />
                      ) : isCurrent ? (
                        <Radio size={20} className="radar-pulse" />
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>
                          {seq}
                        </span>
                      )}
                    </div>

                    {/* Stop Details Card */}
                    <div
                      style={{
                        flex: 1,
                        background: isCurrent ? 'rgba(56, 189, 248, 0.04)' : '#080808',
                        border: isCurrent ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #1a1a1a',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              color: isPassed ? '#10b981' : isCurrent ? '#38bdf8' : '#888888',
                              fontWeight: 700
                            }}
                          >
                            STOP #{seq}
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                letterSpacing: '0.05em'
                              }}
                            >
                              NEXT ARRIVAL
                            </span>
                          )}
                          {isPassed && (
                            <span
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              PASSED
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 700, color: isUpcoming ? '#cccccc' : '#ffffff' }}>
                          {stop.stop_name || stop.name || `Waypoint ${seq}`}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#777777', marginTop: '2px' }}>
                          {stop.landmark || (stop.latitude && stop.longitude ? `${Number(stop.latitude).toFixed(4)}, ${Number(stop.longitude).toFixed(4)}` : 'Karur - VSB Corridor')}
                        </div>
                      </div>

                      {/* Right-side Time / ETA */}
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono, monospace)',
                            color: isPassed ? '#10b981' : isCurrent ? '#38bdf8' : '#ffffff'
                          }}
                        >
                          {isPassed ? 'Completed' : isCurrent ? 'Arriving in 2m' : `~${etaMinutes} mins`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#666666', fontFamily: 'var(--font-mono, monospace)' }}>
                          SCHED: {scheduledTime}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
