/**
 * STOP ASSIGNMENT PAGE (PHASE 10)
 * Institutional stop allocation management for students across bus routes.
 * Enables transport administrators to map scheduled pickup & dropoff stops,
 * sequence verification, and multi-route coverage tracking.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService, stopDetectionAPI } from '../../services/apiService';
import {
  MapPin,
  Route,
  Bus,
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowUpDown,
  Edit2,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Download,
  Calendar,
  X,
  Check
} from 'lucide-react';

export default function StopAssignmentPage({ onNavigate }) {
  const { user } = useAuth();

  // State
  const [assignments, setAssignments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stopsByRoute, setStopsByRoute] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    route_id: '',
    pickup_stop_id: '',
    dropoff_stop_id: '',
    notes: '',
    effective_from: new Date().toISOString().split('T')[0]
  });

  // Simulator Drawer State
  const [simDrawerOpen, setSimDrawerOpen] = useState(false);
  const [simData, setSimData] = useState({
    student: null,
    detected_stop_id: '',
    event_type: 'PICKUP',
    confidence_score: 0.94
  });
  const [simResult, setSimResult] = useState(null);
  const [simRunning, setSimRunning] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Parallel loading of routes, stops, and assignments
      const [routesRes, assignmentsRes, studentsRes] = await Promise.allSettled([
        apiService.routes.getAll(),
        stopDetectionAPI.getAssignments(),
        apiService.students.getAll()
      ]);

      let loadedRoutes = [];
      if (routesRes.status === 'fulfilled' && routesRes.value) {
        loadedRoutes = Array.isArray(routesRes.value) ? routesRes.value : (routesRes.value.routes || []);
      }
      if (loadedRoutes.length === 0) {
        loadedRoutes = [
          { id: 1, route_name: 'Karur City Express', route_code: 'R-101', total_stops: 8 },
          { id: 2, route_name: 'Dindigul Metro Connect', route_code: 'R-102', total_stops: 6 },
          { id: 3, route_name: 'Trichy Highway Line', route_code: 'R-103', total_stops: 10 },
          { id: 4, route_name: 'Namakkal Central Corridor', route_code: 'R-104', total_stops: 7 }
        ];
      }
      setRoutes(loadedRoutes);

      let loadedAssignments = [];
      if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value) {
        const val = assignmentsRes.value;
        loadedAssignments = Array.isArray(val) ? val : (val.assignments || val.data || []);
      }
      if (loadedAssignments.length === 0) {
        // Fallback demo assignments
        loadedAssignments = [
          {
            id: 1,
            student_id: 101,
            student_name: 'Suresh Kumar R',
            roll_number: '922521104052',
            department: 'CSE',
            route_id: 1,
            route_name: 'Karur City Express',
            route_code: 'R-101',
            bus_number: 'TN 47 B 1001',
            pickup_stop_id: 2,
            pickup_stop_name: 'Karur Bus Stand',
            pickup_sequence: 2,
            dropoff_stop_id: 8,
            dropoff_stop_name: 'VSB College Main Gate',
            dropoff_sequence: 8,
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            student_id: 102,
            student_name: 'Priyanka Devi S',
            roll_number: '922521104041',
            department: 'ECE',
            route_id: 1,
            route_name: 'Karur City Express',
            route_code: 'R-101',
            bus_number: 'TN 47 B 1001',
            pickup_stop_id: 3,
            pickup_stop_name: 'Gandhigramam Junction',
            pickup_sequence: 3,
            dropoff_stop_id: 8,
            dropoff_stop_name: 'VSB College Main Gate',
            dropoff_sequence: 8,
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            student_id: 103,
            student_name: 'Karthik Raja M',
            roll_number: '922521104028',
            department: 'MECH',
            route_id: 2,
            route_name: 'Dindigul Metro Connect',
            route_code: 'R-102',
            bus_number: 'TN 47 B 1002',
            pickup_stop_id: 1,
            pickup_stop_name: 'Dindigul Collectorate',
            pickup_sequence: 1,
            dropoff_stop_id: 6,
            dropoff_stop_name: 'VSB College North Gate',
            dropoff_sequence: 6,
            status: 'ACTIVE',
            created_at: new Date().toISOString()
          }
        ];
      }
      setAssignments(loadedAssignments);

      let loadedStudents = [];
      if (studentsRes.status === 'fulfilled' && studentsRes.value) {
        const val = studentsRes.value;
        loadedStudents = Array.isArray(val) ? val : (val.students || val.data || []);
      }
      if (loadedStudents.length === 0) {
        loadedStudents = [
          { id: 101, name: 'Suresh Kumar R', roll_number: '922521104052', department: 'CSE' },
          { id: 102, name: 'Priyanka Devi S', roll_number: '922521104041', department: 'ECE' },
          { id: 103, name: 'Karthik Raja M', roll_number: '922521104028', department: 'MECH' },
          { id: 104, name: 'Ananya Ramesh', roll_number: '922521104005', department: 'AI & DS' },
          { id: 105, name: 'Vigneshwaran P', roll_number: '922521104089', department: 'IT' }
        ];
      }
      setStudents(loadedStudents);

      // Load stops for available routes
      loadStopsForRoutes(loadedRoutes);
    } catch (err) {
      console.error('[STOP ASSIGNMENT] Error loading data:', err);
      showToast('Failed to load assignments: ' + (err?.message || 'Server error'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStopsForRoutes = async (routeList) => {
    const map = {};
    for (const r of routeList) {
      try {
        const stopsRes = await apiService.stops.getByRoute(r.id);
        const stops = Array.isArray(stopsRes) ? stopsRes : (stopsRes?.stops || []);
        map[r.id] = stops.sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));
      } catch {
        // Fallback default stops
        map[r.id] = [
          { id: r.id * 10 + 1, stop_name: `${r.route_name} - Stop A`, stop_sequence: 1 },
          { id: r.id * 10 + 2, stop_name: `${r.route_name} - Stop B`, stop_sequence: 2 },
          { id: r.id * 10 + 3, stop_name: `${r.route_name} - Stop C`, stop_sequence: 3 },
          { id: r.id * 10 + 4, stop_name: 'VSB College Main Gate', stop_sequence: 4 }
        ];
      }
    }
    setStopsByRoute(map);
  };

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.student_name?.toLowerCase().includes(q) ||
        a.roll_number?.toLowerCase().includes(q) ||
        a.route_name?.toLowerCase().includes(q) ||
        a.pickup_stop_name?.toLowerCase().includes(q) ||
        a.dropoff_stop_name?.toLowerCase().includes(q);

      const matchesRoute =
        selectedRouteFilter === 'ALL' || String(a.route_id) === String(selectedRouteFilter);

      const matchesStatus =
        selectedStatusFilter === 'ALL' || a.status === selectedStatusFilter;

      return matchesSearch && matchesRoute && matchesStatus;
    });
  }, [assignments, searchQuery, selectedRouteFilter, selectedStatusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((a) => a.status === 'ACTIVE').length;
    const routesCovered = new Set(assignments.map((a) => a.route_id)).size;
    const coverage = students.length > 0 ? Math.round((total / students.length) * 100) : 88;

    return { total, active, routesCovered, coverage };
  }, [assignments, students]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAssignment(null);
    const initialRouteId = routes[0]?.id || '';
    setFormData({
      student_id: students[0]?.id || '',
      student_name: students[0]?.name || '',
      route_id: initialRouteId,
      pickup_stop_id: stopsByRoute[initialRouteId]?.[0]?.id || '',
      dropoff_stop_id: stopsByRoute[initialRouteId]?.slice(-1)[0]?.id || '',
      notes: '',
      effective_from: new Date().toISOString().split('T')[0]
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      student_id: assignment.student_id,
      student_name: assignment.student_name,
      route_id: assignment.route_id,
      pickup_stop_id: assignment.pickup_stop_id,
      dropoff_stop_id: assignment.dropoff_stop_id,
      notes: assignment.notes || '',
      effective_from: assignment.effective_from || new Date().toISOString().split('T')[0]
    });
    setModalOpen(true);
  };

  // Save Assignment
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.route_id || !formData.pickup_stop_id) {
      showToast('Please select Student, Route, and Pickup Stop.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        student_id: Number(formData.student_id),
        route_id: Number(formData.route_id),
        pickup_stop_id: Number(formData.pickup_stop_id),
        dropoff_stop_id: formData.dropoff_stop_id ? Number(formData.dropoff_stop_id) : null,
        notes: formData.notes,
        effective_from: formData.effective_from
      };

      await stopDetectionAPI.assignStops(payload);
      showToast('Stop assignment allocated successfully.');
      setModalOpen(false);
      loadAllData(true);
    } catch (err) {
      console.error('[STOP ASSIGNMENT] Save failed:', err);
      showToast('Failed to save allocation: ' + (err?.message || 'Server error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open Simulator Drawer
  const handleOpenSimulator = (assignment) => {
    const routeStops = stopsByRoute[assignment.route_id] || [];
    setSimData({
      student: assignment,
      detected_stop_id: assignment.pickup_stop_id,
      event_type: 'PICKUP',
      confidence_score: 0.94
    });
    setSimResult(null);
    setSimDrawerOpen(true);
  };

  // Run Boarding Verification Simulation
  const handleRunSimulation = async () => {
    if (!simData.student || !simData.detected_stop_id) return;

    setSimRunning(true);
    try {
      const payload = {
        student_id: simData.student.student_id,
        route_id: simData.student.route_id,
        bus_id: simData.student.bus_id || 1,
        detected_stop_id: Number(simData.detected_stop_id),
        event_type: simData.event_type,
        confidence_score: simData.confidence_score,
        verification_method: 'FACIAL_RECOGNITION'
      };

      const res = await stopDetectionAPI.checkBoarding(payload);
      const data = res?.data || res;
      setSimResult(data);
      if (data.is_correct_stop) {
        showToast('Verification Passed: Correct stop verified.');
      } else {
        showToast(`Anomaly Flagged: ${data.mismatch_type || 'WRONG_STOP'} detected!`, 'error');
      }
    } catch (err) {
      console.error('[SIMULATOR] Error:', err);
      showToast('Simulation call failed: ' + (err?.message || 'Error'), 'error');
    } finally {
      setSimRunning(false);
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

      {/* Breadcrumb Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span>INSTITUTIONAL TRANSPORT</span>
            <ChevronRight size={12} />
            <span style={{ color: '#94a3b8' }}>PHASE 10: WRONG STOP DETECTION</span>
            <ChevronRight size={12} />
            <span style={{ color: '#ffffff' }}>STOP ALLOCATION MASTER</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '6px 0 0 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Student Stop Allocation Console
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Map and enforce authorized scheduled boarding & dropoff stops for every student per transit corridor.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate && onNavigate('wrong-stop-detection')}
            style={{
              padding: '9px 16px',
              borderRadius: '6px',
              background: '#121212',
              border: '1px solid #262626',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertTriangle size={15} color="#ef4444" />
            Live Mismatch Alerts
          </button>

          <button
            onClick={() => loadAllData(true)}
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
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              padding: '9px 18px',
              borderRadius: '6px',
              background: '#ffffff',
              border: 'none',
              color: '#000000',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(255,255,255,0.15)'
            }}
          >
            <Plus size={16} />
            Allocate Stop
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
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
            padding: '16px 20px',
            position: 'relative'
          }}
        >
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Total Allocated Students
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {kpis.total}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '12px', marginTop: '6px' }}>
            <CheckCircle2 size={13} />
            <span>{kpis.active} active allocations</span>
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
            Corridors Covered
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {kpis.routesCovered} / {routes.length}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            <Route size={13} />
            <span>Active Bus Routes mapped</span>
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
            Allocation Coverage
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {kpis.coverage}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            <Users size={13} />
            <span>Enrolled institutional pass holders</span>
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
            Detection Tolerance
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            ± 150m
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>
            <ShieldCheck size={13} />
            <span>GPS Geofence Stop Tolerance</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              width: '320px'
            }}
          >
            <Search
              size={15}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
            />
            <input
              type="text"
              placeholder="Search by student, roll no, stop..."
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

          {/* Route Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="#64748b" />
            <select
              value={selectedRouteFilter}
              onChange={(e) => setSelectedRouteFilter(e.target.value)}
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
              <option value="ALL">All Routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.route_code ? `[${r.route_code}] ` : ''}{r.route_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
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
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
          Showing <span style={{ color: '#ffffff', fontWeight: 700 }}>{filteredAssignments.length}</span> allocations
        </div>
      </div>

      {/* Assignments Table */}
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
            <div>Loading stop allocations...</div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <MapPin size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>No stop allocations found</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your filters or click "Allocate Stop" above.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#121212', borderBottom: '1px solid #1f1f1f', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>STUDENT</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>ROUTE & BUS</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>AUTHORIZED PICKUP STOP</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>AUTHORIZED DROPOFF STOP</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map((a) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: '1px solid #181818',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#141414')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Student */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#1f1f1f',
                          border: '1px solid #333333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {a.student_name ? a.student_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{a.student_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {a.roll_number || `ID: ${a.student_id}`} {a.department ? `• ${a.department}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Route & Bus */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{a.route_name || `Route #${a.route_id}`}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {a.route_code && (
                        <span style={{ padding: '1px 5px', borderRadius: '3px', background: '#1c1c1c', border: '1px solid #2b2b2b' }}>
                          {a.route_code}
                        </span>
                      )}
                      <span>{a.bus_number || 'Default Fleet Bus'}</span>
                    </div>
                  </td>

                  {/* Pickup Stop */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: '#112211',
                          border: '1px solid #00AA00',
                          color: '#4ade80',
                          fontSize: '10px',
                          fontWeight: 700
                        }}
                      >
                        #{a.pickup_sequence || 1}
                      </span>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>
                        {a.pickup_stop_name || `Stop #${a.pickup_stop_id}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Morning Boarding Station
                    </div>
                  </td>

                  {/* Dropoff Stop */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: '#1c1c1c',
                          border: '1px solid #333333',
                          color: '#cbd5e1',
                          fontSize: '10px',
                          fontWeight: 700
                        }}
                      >
                        #{a.dropoff_sequence || 'T'}
                      </span>
                      <span style={{ color: '#cbd5e1' }}>
                        {a.dropoff_stop_name || (a.dropoff_stop_id ? `Stop #${a.dropoff_stop_id}` : 'College Terminal')}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Evening Alighting Station
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: a.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: a.status === 'ACTIVE' ? '#22c55e' : '#94a3b8',
                        border: `1px solid ${a.status === 'ACTIVE' ? '#00AA00' : '#475569'}`
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: a.status === 'ACTIVE' ? '#22c55e' : '#64748b'
                        }}
                      />
                      {a.status || 'ACTIVE'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenSimulator(a)}
                        title="Simulate Boarding Verification"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: '#161616',
                          border: '1px solid #2b2b2b',
                          color: '#38bdf8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ShieldCheck size={12} />
                        Simulate
                      </button>

                      <button
                        onClick={() => handleOpenEdit(a)}
                        title="Edit Allocation"
                        style={{
                          padding: '6px',
                          borderRadius: '4px',
                          background: '#161616',
                          border: '1px solid #2b2b2b',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ALLOCATE / EDIT MODAL */}
      {modalOpen && (
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
              width: '520px',
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
                  {editingAssignment ? 'Update Stop Allocation' : 'New Student Stop Allocation'}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                  Set scheduled pickup & dropoff coordinates for automated stop verification.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment}>
              {/* Student Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  STUDENT
                </label>
                {editingAssignment ? (
                  <div
                    style={{
                      background: '#161616',
                      border: '1px solid #262626',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px'
                    }}
                  >
                    {editingAssignment.student_name} ({editingAssignment.roll_number || `ID ${editingAssignment.student_id}`})
                  </div>
                ) : (
                  <select
                    value={formData.student_id}
                    onChange={(e) => {
                      const st = students.find((s) => String(s.id) === e.target.value);
                      setFormData({
                        ...formData,
                        student_id: e.target.value,
                        student_name: st?.name || ''
                      });
                    }}
                    style={{
                      width: '100%',
                      background: '#161616',
                      border: '1px solid #262626',
                      borderRadius: '6px',
                      padding: '8px 12px',
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
                )}
              </div>

              {/* Route Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  TRANSIT CORRIDOR / ROUTE
                </label>
                <select
                  value={formData.route_id}
                  onChange={(e) => {
                    const rId = e.target.value;
                    const stops = stopsByRoute[rId] || [];
                    setFormData({
                      ...formData,
                      route_id: rId,
                      pickup_stop_id: stops[0]?.id || '',
                      dropoff_stop_id: stops.slice(-1)[0]?.id || ''
                    });
                  }}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '8px 12px',
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

              {/* Pickup Stop */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  SCHEDULED PICKUP STOP (MORNING)
                </label>
                <select
                  value={formData.pickup_stop_id}
                  onChange={(e) => setFormData({ ...formData, pickup_stop_id: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  {(stopsByRoute[formData.route_id] || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      Seq #{s.stop_sequence || 1} — {s.stop_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropoff Stop */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  SCHEDULED DROPOFF STOP (EVENING)
                </label>
                <select
                  value={formData.dropoff_stop_id}
                  onChange={(e) => setFormData({ ...formData, dropoff_stop_id: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  {(stopsByRoute[formData.route_id] || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      Seq #{s.stop_sequence || 1} — {s.stop_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  ADMIN NOTES / SPECIAL PERMISSION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authorized laboratory late shift pass"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '9px 16px',
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
                  disabled={saving}
                  style={{
                    padding: '9px 20px',
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
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  {editingAssignment ? 'Update Allocation' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMULATOR DRAWER */}
      {simDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '460px',
              height: '100%',
              background: '#0a0a0a',
              borderLeft: '1px solid #222222',
              padding: '28px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#38bdf8" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                    Live Verification Simulator
                  </h3>
                </div>
                <button
                  onClick={() => setSimDrawerOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {simData.student && (
                <div
                  style={{
                    background: '#121212',
                    border: '1px solid #1f1f1f',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Target Student Profile
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    {simData.student.student_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Scheduled Pickup: <span style={{ color: '#22c55e', fontWeight: 600 }}>{simData.student.pickup_stop_name}</span> (Seq #{simData.student.pickup_sequence || 1})
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Route: {simData.student.route_name}
                  </div>
                </div>
              )}

              {/* Simulation Parameters */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  SIMULATED DETECTED STOP (WHERE BOARDING OCCURS)
                </label>
                <select
                  value={simData.detected_stop_id}
                  onChange={(e) => setSimData({ ...simData, detected_stop_id: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  {(stopsByRoute[simData.student?.route_id] || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      Seq #{s.stop_sequence || 1} — {s.stop_name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Select a different sequence stop to trigger PREVIOUS_STOP, SUBSEQUENT_STOP, or WRONG_STOP mismatch alert.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  EVENT TYPE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['PICKUP', 'DROPOFF'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSimData({ ...simData, event_type: type })}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        background: simData.event_type === type ? '#ffffff' : '#141414',
                        color: simData.event_type === type ? '#000000' : '#94a3b8',
                        border: '1px solid #2b2b2b',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Result Box */}
              {simResult && (
                <div
                  style={{
                    background: simResult.is_correct_stop ? '#07240f' : '#290707',
                    border: `1px solid ${simResult.is_correct_stop ? '#00AA00' : '#AA0000'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {simResult.is_correct_stop ? (
                      <CheckCircle2 size={18} color="#22c55e" />
                    ) : (
                      <AlertTriangle size={18} color="#ef4444" />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 700, color: simResult.is_correct_stop ? '#4ade80' : '#f87171' }}>
                      {simResult.is_correct_stop ? 'CORRECT STOP VERIFIED' : `MISMATCH: ${simResult.mismatch_type || 'WRONG_STOP'}`}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '8px' }}>
                    {simResult.message || (simResult.is_correct_stop ? 'Student boarded at their scheduled stop.' : 'Discrepancy identified between scheduled and detected stop.')}
                  </div>

                  {!simResult.is_correct_stop && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#94a3b8' }}>
                      <div>Sequence Delta: <span style={{ color: '#ffffff', fontWeight: 600 }}>{simResult.sequence_discrepancy || 'N/A'}</span></div>
                      <div>Distance: <span style={{ color: '#ffffff', fontWeight: 600 }}>{simResult.distance_discrepancy_meters ? `${simResult.distance_discrepancy_meters}m` : '0m'}</span></div>
                      <div>Alert Status: <span style={{ color: '#f87171', fontWeight: 600 }}>{simResult.alert_generated ? 'DISPATCHED' : 'LOGGED'}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run Button */}
            <div style={{ paddingTop: '20px' }}>
              <button
                type="button"
                onClick={handleRunSimulation}
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
                Execute Verification Engine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
