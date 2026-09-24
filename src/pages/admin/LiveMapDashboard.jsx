/**
 * LIVE MAP DASHBOARD (PHASE 11)
 * Real-time GPS Tracking, Radar Telemetry, and Interactive Route Corridor Map
 * Institution: V.S.B. ENGINEERING COLLEGE (AI & DS Transport Command Center)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { liveTransportAPI } from '../../services/apiService';
import {
  MapPin,
  Bus,
  Radio,
  Navigation,
  Gauge,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Crosshair,
  Compass,
  Zap,
  Users,
  Layers,
  ArrowUpRight,
  Activity
} from 'lucide-react';

const KARUR_VSB_CENTER = [10.9165, 78.0919];
const DEFAULT_ZOOM = 12;

export default function LiveMapDashboard({ onNavigate }) {
  // State
  const [mapData, setMapData] = useState(null);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [autoSimulating, setAutoSimulating] = useState(false);
  const [simStepLoading, setSimStepLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // References
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const stopsLayerRef = useRef(null);
  const socketRef = useRef(null);
  const simIntervalRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch initial map & telemetry data
  const fetchMapData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await liveTransportAPI.getMapData();
      if (res && res.success && res.data) {
        setMapData(res.data);
        if (!selectedBusId && res.data.buses && res.data.buses.length > 0) {
          setSelectedBusId(res.data.buses[0].bus_id);
        }
      }
    } catch (err) {
      console.error('[LIVE MAP] Error fetching telemetry:', err);
      showToast('Error syncing GPS telemetry from server', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  // 2. Setup WebSocket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      socket.on('connect', () => {
        setSocketConnected(true);
        socket.emit('subscribe_fleet');
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
      });

      socket.on('bus_location_update', (data) => {
        setMapData((prev) => {
          if (!prev) return prev;
          const updatedBuses = prev.buses.map((b) =>
            b.bus_id === data.bus_id ? { ...b, ...data } : b
          );
          return { ...prev, buses: updatedBuses };
        });
      });

      socket.on('route_deviation', (data) => {
        showToast(`Route Deviation Alert: Bus ${data.bus_id} is off corridor`, 'warning');
      });

      socketRef.current = socket;
    } catch (e) {
      console.warn('[LIVE MAP] Socket connection fallback:', e);
    }

    fetchMapData();

    // Fallback polling interval every 6 seconds
    const pollInterval = setInterval(() => {
      fetchMapData();
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: KARUR_VSB_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Matter Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer groups
    routeLayerRef.current = L.layerGroup().addTo(map);
    stopsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Render Markers & Routes on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapData) return;

    // A. Render Route Polylines
    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();
      if (mapData.routes && mapData.routes.length > 0) {
        mapData.routes.forEach((route) => {
          if (route.stops && route.stops.length > 1) {
            const latlngs = route.stops.map((s) => [s.latitude, s.longitude]);

            // Route outer glow line
            L.polyline(latlngs, {
              color: '#3b82f6',
              weight: 8,
              opacity: 0.25,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(routeLayerRef.current);

            // Route inner core line
            L.polyline(latlngs, {
              color: '#60a5fa',
              weight: 3,
              opacity: 0.9,
              dashArray: '8, 6',
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(routeLayerRef.current);
          }
        });
      }
    }

    // B. Render Stops
    if (stopsLayerRef.current) {
      stopsLayerRef.current.clearLayers();
      if (mapData.routes) {
        mapData.routes.forEach((route) => {
          (route.stops || []).forEach((stop, index) => {
            const isLast = index === route.stops.length - 1;
            const isFirst = index === 0;

            const stopHtml = `
              <div style="
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                cursor: pointer;
              ">
                <!-- Geofence 100m ripple representation -->
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${isLast ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.12)'};
                  border: 1px dashed ${isLast ? '#eab308' : '#3b82f6'};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 0 12px ${isLast ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.25)'};
                ">
                  <div style="
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: ${isLast ? '#facc15' : '#ffffff'};
                    border: 2px solid ${isLast ? '#ca8a04' : '#1d4ed8'};
                  "></div>
                </div>
                <!-- Stop Name Badge -->
                <div style="
                  background: #090d16;
                  border: 1px solid #1e293b;
                  color: #e2e8f0;
                  font-size: 10px;
                  font-weight: 700;
                  padding: 2px 6px;
                  border-radius: 4px;
                  margin-top: 2px;
                  white-space: nowrap;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                ">
                  ${isLast ? '🎓 VSB MAIN GATE' : stop.name}
                </div>
              </div>
            `;

            const icon = L.divIcon({
              html: stopHtml,
              className: 'custom-stop-marker',
              iconSize: [80, 50],
              iconAnchor: [40, 16]
            });

            const marker = L.marker([stop.latitude, stop.longitude], { icon });
            marker.bindPopup(`
              <div style="background:#0d121f; color:#ffffff; padding:10px; border-radius:6px; font-family:sans-serif; min-width:180px;">
                <div style="font-weight:bold; font-size:13px; color:#60a5fa; border-bottom:1px solid #1e293b; padding-bottom:4px; margin-bottom:6px;">
                  ${stop.name}
                </div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:3px;">Sequence: <b>Stop #${stop.sequence_order || index + 1}</b></div>
                <div style="font-size:11px; color:#94a3b8; margin-bottom:3px;">Geofence: <b>100m Active Radius</b></div>
                <div style="font-size:10px; color:#64748b; font-family:monospace; margin-top:4px;">${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)}</div>
              </div>
            `);
            marker.addTo(stopsLayerRef.current);
          });
        });
      }
    }

    // C. Render Bus Markers with Pulse
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
      const busesToRender = filterActiveOnly
        ? (mapData.buses || []).filter((b) => b.status === 'ACTIVE' || b.status === 'ON_ROUTE')
        : mapData.buses || [];

      busesToRender.forEach((bus) => {
        const isSelected = bus.bus_id === selectedBusId;
        const isDeviated = bus.deviation_flag;
        const color = isDeviated ? '#ef4444' : isSelected ? '#10b981' : '#38bdf8';

        const busHtml = `
          <div style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <!-- Pulsing outer wave -->
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: ${isDeviated ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)'};
              border: 1px solid ${color};
              animation: bstRadarPulse 2s infinite ease-out;
              pointer-events: none;
              top: -6px;
            "></div>

            <!-- Bus Icon Hex Badge -->
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 8px;
              background: #090d16;
              border: 2px solid ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 16px ${isDeviated ? 'rgba(239, 68, 68, 0.7)' : 'rgba(56, 189, 248, 0.6)'};
              position: relative;
              z-index: 2;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6v6"></path>
                <path d="M16 6v6"></path>
                <path d="M4 12h16"></path>
                <path d="M6 18h12"></path>
                <rect x="4" y="3" width="16" height="16" rx="2"></rect>
                <path d="M6 21v-2"></path>
                <path d="M18 21v-2"></path>
              </svg>
            </div>

            <!-- Plate / Number Tag -->
            <div style="
              background: ${isSelected ? '#10b981' : '#0d121f'};
              color: ${isSelected ? '#000000' : '#ffffff'};
              border: 1px solid ${isSelected ? '#34d399' : '#1e293b'};
              font-size: 10px;
              font-weight: 800;
              font-family: monospace;
              padding: 2px 6px;
              border-radius: 4px;
              margin-top: 3px;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.8);
              z-index: 3;
            ">
              ${bus.bus_number || 'BUS'} • ${Math.round(bus.speed || 0)} km/h
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: busHtml,
          className: 'custom-bus-marker',
          iconSize: [60, 60],
          iconAnchor: [30, 20]
        });

        const marker = L.marker([bus.latitude, bus.longitude], { icon });

        marker.on('click', () => {
          setSelectedBusId(bus.bus_id);
          map.panTo([bus.latitude, bus.longitude], { animate: true, duration: 0.8 });
        });

        marker.addTo(markersLayerRef.current);
      });
    }
  }, [mapData, selectedBusId, filterActiveOnly]);

  // Selected Bus Detail
  const selectedBus = useMemo(() => {
    if (!mapData || !mapData.buses) return null;
    return mapData.buses.find((b) => b.bus_id === selectedBusId) || mapData.buses[0] || null;
  }, [mapData, selectedBusId]);

  // Focus map on selected bus
  const centerOnBus = (bus) => {
    if (!bus || !mapInstanceRef.current) return;
    setSelectedBusId(bus.bus_id);
    mapInstanceRef.current.flyTo([bus.latitude, bus.longitude], 14, { duration: 1.2 });
  };

  // Center on VSB Campus
  const centerOnCampus = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(KARUR_VSB_CENTER, 12, { duration: 1.2 });
  };

  // Trigger Single Simulation Step
  const handleSimulateStep = async () => {
    if (!selectedBus) return;
    try {
      setSimStepLoading(true);
      const res = await liveTransportAPI.simulateStep({
        bus_id: selectedBus.bus_id,
        route_id: selectedBus.route_id
      });
      if (res && res.success) {
        showToast(`GPS ping recorded: ${res.data.step_name} (${res.data.speed_kmh} km/h)`);
        await fetchMapData();
      }
    } catch (e) {
      showToast('Simulation step failed', 'error');
    } finally {
      setSimStepLoading(false);
    }
  };

  // Toggle Auto Simulation Loop
  const toggleAutoSimulate = () => {
    if (autoSimulating) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
      setAutoSimulating(false);
      showToast('Live movement simulation paused');
    } else {
      setAutoSimulating(true);
      showToast('Continuous live fleet movement simulation started');
      simIntervalRef.current = setInterval(() => {
        if (selectedBus) {
          liveTransportAPI
            .simulateStep({
              bus_id: selectedBus.bus_id,
              route_id: selectedBus.route_id
            })
            .then(() => fetchMapData())
            .catch(() => {});
        }
      }, 4000);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#080808',
        color: '#f5f5f5',
        fontFamily: "'Inter', sans-serif",
        padding: '24px 32px',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @keyframes bstRadarPulse {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .leaflet-container {
          background-color: #080808 !important;
          outline: none;
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 9999,
            background:
              toastMessage.type === 'error'
                ? '#7f1d1d'
                : toastMessage.type === 'warning'
                ? '#78350f'
                : '#064e3b',
            border: `1px solid ${
              toastMessage.type === 'error'
                ? '#ef4444'
                : toastMessage.type === 'warning'
                ? '#f59e0b'
                : '#10b981'
            }`,
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle size={16} />
          ) : toastMessage.type === 'warning' ? (
            <Radio size={16} />
          ) : (
            <ShieldCheck size={16} />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* TOP COMMAND HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid #1c1c1c',
          paddingBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: '#141414',
              border: '1px solid #282828',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                FLEET GPS RADAR & LIVE MAP
              </h1>
              <span
                style={{
                  background: socketConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${socketConnected ? '#10b981' : '#ef4444'}`,
                  color: socketConnected ? '#34d399' : '#f87171',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: socketConnected ? '#10b981' : '#ef4444'
                  }}
                />
                {socketConnected ? 'SOCKET TELEMETRY ACTIVE' : 'POLLING FALLBACK'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8c8c8c' }}>
              V.S.B. Engineering College Transit Corridor • Real-Time Satellite Bus Tracking & Geofence Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => fetchMapData(true)}
            disabled={refreshing}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              background: '#141414',
              border: '1px solid #262626',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={centerOnCampus}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              background: '#141414',
              border: '1px solid #262626',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Crosshair size={14} />
            <span>Center Campus</span>
          </button>

          <button
            onClick={handleSimulateStep}
            disabled={simStepLoading || autoSimulating}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: simStepLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={14} />
            <span>{simStepLoading ? 'Recording Ping...' : 'Simulate Ping'}</span>
          </button>

          <button
            onClick={toggleAutoSimulate}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: autoSimulating ? '#dc2626' : '#2563eb',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {autoSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{autoSimulating ? 'Stop Auto-Run' : 'Auto-Simulate Run'}</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT LAYOUT: MAP + INSPECTOR PANEL */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '20px',
          flex: 1,
          minHeight: '620px'
        }}
      >
        {/* LEFT: LEAFLET MAP VIEWPORT */}
        <div
          style={{
            position: 'relative',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #222222',
            background: '#0d0d0d',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Map Overlay Badge: Active Fleet Status */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              zIndex: 1000,
              background: 'rgba(13, 18, 31, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #1e293b',
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bus size={15} color="#38bdf8" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
                Active Fleet: {mapData?.buses?.length || 0}
              </span>
            </div>
            <div style={{ width: '1px', height: '14px', background: '#334155' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Navigation size={14} color="#10b981" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                Corridor: Karur — VSB
              </span>
            </div>
          </div>

          {/* Leaflet Map Div */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '580px',
              background: '#080808'
            }}
          />
        </div>

        {/* RIGHT: BUS INSPECTOR DRAWER */}
        <div
          style={{
            background: '#0d0d0d',
            border: '1px solid #1f1f1f',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Inspector Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1c1c1c', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="#38bdf8" />
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#ffffff' }}>
                Telemetry Inspector
              </span>
            </div>
            {selectedBus && (
              <span
                style={{
                  background: selectedBus.deviation_flag ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${selectedBus.deviation_flag ? '#ef4444' : '#10b981'}`,
                  color: selectedBus.deviation_flag ? '#f87171' : '#34d399',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >
                {selectedBus.deviation_flag ? 'CORRIDOR DEVIATION' : 'ON SCHEDULE'}
              </span>
            )}
          </div>

          {/* Bus Selector Pills */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Select Vehicle to Track
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {(mapData?.buses || []).map((bus) => {
                const isSelected = bus.bus_id === selectedBusId;
                return (
                  <button
                    key={bus.bus_id}
                    onClick={() => centerOnBus(bus)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: isSelected ? '#1e293b' : '#141414',
                      border: `1px solid ${isSelected ? '#38bdf8' : '#262626'}`,
                      color: isSelected ? '#38bdf8' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Bus size={13} />
                    <span>{bus.bus_number || 'BUS'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedBus ? (
            <>
              {/* Vehicle Identity Card */}
              <div
                style={{
                  background: '#141414',
                  border: '1px solid #242424',
                  borderRadius: '8px',
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                      {selectedBus.bus_number}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                      {selectedBus.registration_number || 'TN 47 B 9021'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Route</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                      {selectedBus.route_name || 'Route 1'}
                    </div>
                  </div>
                </div>

                {/* Telemetry Metric Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    marginTop: '14px',
                    borderTop: '1px solid #1f293d',
                    paddingTop: '12px'
                  }}
                >
                  <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '6px', border: '1px solid #1f1f1f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                      <Gauge size={13} />
                      <span>Speed</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                      {Math.round(selectedBus.speed || 0)}{' '}
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#8c8c8c' }}>km/h</span>
                    </div>
                  </div>

                  <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '6px', border: '1px solid #1f1f1f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                      <Navigation size={13} />
                      <span>Heading</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                      {Math.round(selectedBus.heading || 0)}°
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#8c8c8c' }}> SSE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waypoint & ETA Progress */}
              <div
                style={{
                  background: '#141414',
                  border: '1px solid #242424',
                  borderRadius: '8px',
                  padding: '14px 16px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Transit Corridor Telemetry
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="#10b981" />
                      <span style={{ fontSize: '13px', color: '#d1d1d1' }}>Current Waypoint:</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      {selectedBus.current_stop_name || 'Karur Central'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} color="#38bdf8" />
                      <span style={{ fontSize: '13px', color: '#d1d1d1' }}>Next Target Stop:</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                      {selectedBus.next_stop_name || 'Thanthonimalai'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={15} color="#f59e0b" />
                      <span style={{ fontSize: '13px', color: '#d1d1d1' }}>Estimated Arrival:</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
                      {selectedBus.eta_minutes !== undefined ? `${selectedBus.eta_minutes} mins` : '6 mins'}
                    </span>
                  </div>
                </div>

                {/* GPS Coordinates Readout */}
                <div
                  style={{
                    background: '#090909',
                    border: '1px solid #1a1a1a',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#8c8c8c'
                  }}
                >
                  <span>LAT: {Number(selectedBus.latitude).toFixed(5)}</span>
                  <span>LNG: {Number(selectedBus.longitude).toFixed(5)}</span>
                </div>
              </div>

              {/* Quick Navigation to Route Progress */}
              <button
                onClick={() => onNavigate && onNavigate('route-progress')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  background: '#181818',
                  border: '1px solid #282828',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: 'auto'
                }}
              >
                <span>View Full Route Progress & Timeline</span>
                <ChevronRight size={15} />
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <Bus size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div>No vehicle telemetry available</div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM TELEMETRY STRIP: FLEET AT A GLANCE */}
      <div
        style={{
          marginTop: '20px',
          background: '#0d0d0d',
          border: '1px solid #1c1c1c',
          borderRadius: '8px',
          padding: '14px 20px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
          Active Fleet Telemetry Stream
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {(mapData?.buses || []).map((bus) => (
            <div
              key={bus.bus_id}
              onClick={() => centerOnBus(bus)}
              style={{
                background: bus.bus_id === selectedBusId ? '#1a1a1a' : '#121212',
                border: `1px solid ${bus.bus_id === selectedBusId ? '#38bdf8' : '#222222'}`,
                borderRadius: '6px',
                padding: '10px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {bus.bus_number}
                </div>
                <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '2px' }}>
                  Next: {bus.next_stop_name || 'En Route'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>
                  {Math.round(bus.speed || 0)} km/h
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                  {bus.updated_at ? new Date(bus.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
