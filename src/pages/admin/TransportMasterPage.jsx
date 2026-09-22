// FILE: src/pages/admin/TransportMasterPage.jsx
// PURPOSE: Complete Phase 3 Transport Master Data Management Dashboard for V.S.B. Engineering College.
// Covers Buses, Routes, Stops, Drivers, Bus In-Charges, Route Assignments, and Vision Cameras.
// PHASE: Phase 3 — Transport Master Data

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Bus,
  MapPin,
  Route as RouteIcon,
  Users,
  ShieldCheck,
  Camera,
  Plus,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Edit2,
  Eye,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Phone,
  Hash,
  Activity
} from 'lucide-react';

const TABS = [
  { id: 'buses', label: 'Buses', icon: Bus, singular: 'Bus' },
  { id: 'routes', label: 'Routes', icon: RouteIcon, singular: 'Route' },
  { id: 'stops', label: 'Stops', icon: MapPin, singular: 'Stop' },
  { id: 'drivers', label: 'Drivers', icon: Users, singular: 'Driver' },
  { id: 'incharges', label: 'In-Charges', icon: ShieldCheck, singular: 'In-Charge' },
  { id: 'assignments', label: 'Assignments', icon: Calendar, singular: 'Assignment' },
  { id: 'cameras', label: 'Vision Cameras', icon: Camera, singular: 'Camera' }
];

export default function TransportMasterPage({ onNavigate }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTransportStaff = user?.role === 'TRANSPORT_STAFF';
  const canEdit = isAdmin || isTransportStaff;

  const [activeTab, setActiveTab] = useState('buses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Master Data Collections
  const [data, setData] = useState({
    buses: [],
    routes: [],
    stops: [],
    drivers: [],
    incharges: [],
    assignments: [],
    cameras: []
  });

  // Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'view' | 'edit' | 'create' | 'delete'
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Load all master data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        busesRes,
        routesRes,
        stopsRes,
        driversRes,
        inchargesRes,
        assignmentsRes,
        camerasRes
      ] = await Promise.all([
        apiService.buses.getAll(),
        apiService.routes.getAll(),
        apiService.stops.getAll(),
        apiService.drivers.getAll(),
        apiService.busInCharges.getAll(),
        apiService.assignments.getAll(),
        apiService.cameras.getAll()
      ]);

      setData({
        buses: (busesRes.data || []).map(b => ({
          ...b,
          id: b.bus_id || b.id,
          registration_number: b.registration_plate || b.registration_number
        })),
        routes: (routesRes.data || []).map(r => ({
          ...r,
          id: r.route_id || r.id,
          route_number: r.route_code || r.route_number,
          total_distance_km: r.distance_km || r.total_distance_km,
          estimated_duration_mins: r.estimated_duration_minutes || r.estimated_duration_mins
        })),
        stops: (stopsRes.data || []).map(s => ({
          ...s,
          id: s.stop_id || s.id,
          stop_order: s.stop_sequence || s.stop_order,
          landmark: s.address || s.landmark
        })),
        drivers: (driversRes.data || []).map(d => ({
          ...d,
          id: d.driver_id || d.id,
          name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim()
        })),
        incharges: (inchargesRes.data || []).map(i => ({
          ...i,
          id: i.in_charge_id || i.id,
          name: i.name || `${i.first_name || ''} ${i.last_name || ''}`.trim()
        })),
        assignments: (assignmentsRes.data || []).map(a => ({
          ...a,
          id: a.assignment_id || a.id
        })),
        cameras: (camerasRes.data || []).map(c => ({
          ...c,
          id: c.camera_id || c.id,
          camera_model: c.camera_name || c.camera_model,
          installation_position: c.location || c.camera_type
        }))
      });
    } catch (err) {
      console.error('[TransportMaster] Data load error:', err);
      setError(err.message || 'Failed to load transport master data. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Quick Stats Summary
  const stats = useMemo(() => {
    const totalBuses = data.buses.length;
    const activeBuses = data.buses.filter(b => b.status === 'ACTIVE').length;
    const totalRoutes = data.routes.length;
    const totalStops = data.stops.length;
    const totalDrivers = data.drivers.length;
    const totalInCharges = data.incharges.length;
    const onlineCameras = data.cameras.filter(c => c.status === 'ONLINE').length;
    const totalCameras = data.cameras.length;

    return {
      totalBuses,
      activeBuses,
      totalRoutes,
      totalStops,
      totalDrivers,
      totalInCharges,
      onlineCameras,
      totalCameras
    };
  }, [data]);

  // Filtered current tab records
  const filteredList = useMemo(() => {
    const currentList = data[activeTab] || [];
    return currentList.filter(item => {
      // Status filtering if property exists
      if (statusFilter !== 'ALL') {
        const itemStatus = item.status || (item.is_active ? 'ACTIVE' : 'INACTIVE');
        if (itemStatus !== statusFilter) return false;
      }

      // Search term matching across all string fields
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return Object.values(item).some(val => 
        val && typeof val === 'string' && val.toLowerCase().includes(term)
      );
    });
  }, [data, activeTab, searchTerm, statusFilter]);

  // Open Create Modal with clean defaults
  const handleOpenCreate = () => {
    let defaults = {};
    if (activeTab === 'buses') {
      defaults = { bus_number: '', registration_number: '', capacity: 54, model: 'Tata Starbus Ultra', fuel_type: 'DIESEL', status: 'ACTIVE' };
    } else if (activeTab === 'routes') {
      defaults = { route_number: '', route_name: '', start_location: '', end_location: 'V.S.B Engineering College', total_distance_km: 30, estimated_duration_mins: 45, status: 'ACTIVE' };
    } else if (activeTab === 'stops') {
      defaults = { route_id: data.routes[0]?.id || '', stop_name: '', stop_order: 1, arrival_time: '07:30', landmark: '', is_active: true };
    } else if (activeTab === 'drivers') {
      defaults = { name: '', license_number: '', phone: '', experience_years: 5, emergency_contact: '', status: 'ACTIVE' };
    } else if (activeTab === 'incharges') {
      defaults = { name: '', employee_id: '', department: 'AI & DS', designation: 'Assistant Professor', phone: '', email: '', is_active: true };
    } else if (activeTab === 'assignments') {
      defaults = { bus_id: data.buses[0]?.id || '', route_id: data.routes[0]?.id || '', driver_id: data.drivers[0]?.id || '', bus_in_charge_id: data.incharges[0]?.id || '', academic_year: '2025-2026', semester: 'EVEN', is_active: true };
    } else if (activeTab === 'cameras') {
      defaults = { bus_id: data.buses[0]?.id || '', camera_model: 'Hikvision DS-2CD2043G2-I', installation_position: 'ENTRANCE', ip_address: '192.168.1.100', rtsp_url: '', status: 'ONLINE' };
    }
    setFormData(defaults);
    setModalError(null);
    setModalMode('create');
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setModalError(null);
    setModalMode('edit');
  };

  // Open View Modal
  const handleOpenView = (item) => {
    setSelectedItem(item);
    setModalError(null);
    setModalMode('view');
  };

  // Open Delete Modal
  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setModalError(null);
    setModalMode('delete');
  };

  // Submit Modal Action (Create / Edit / Delete)
  const handleSubmitModal = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    setError(null);
    setSuccessMessage(null);

    try {
      const activeResource = apiService[activeTab === 'incharges' ? 'busInCharges' : activeTab];

      const itemId = selectedItem?.id || selectedItem?.bus_id || selectedItem?.route_id || selectedItem?.stop_id || selectedItem?.driver_id || selectedItem?.in_charge_id || selectedItem?.assignment_id || selectedItem?.camera_id;

      if (modalMode === 'create') {
        await activeResource.create(formData);
        setSuccessMessage(`New ${TABS.find(t => t.id === activeTab).singular} added successfully.`);
      } else if (modalMode === 'edit') {
        await activeResource.update(itemId, formData);
        setSuccessMessage(`${TABS.find(t => t.id === activeTab).singular} updated successfully.`);
      } else if (modalMode === 'delete') {
        await activeResource.delete(itemId);
        setSuccessMessage(`${TABS.find(t => t.id === activeTab).singular} removed successfully.`);
      }

      setModalMode(null);
      await loadAllData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('[TransportMaster] Mutation error:', err);
      setModalError(err.message || 'Operation failed. Please verify fields and permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    const list = data[activeTab] || [];
    if (!list.length) return;

    const headers = Object.keys(list[0]);
    const rows = list.map(item => headers.map(h => JSON.stringify(item[h] ?? '')).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vsb_${activeTab}_master_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-pure)' }}>
      {/* Navigation & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <button
            onClick={() => onNavigate && onNavigate(user?.role?.toLowerCase().replace(/_/g, '-') || 'admin')}
            className="mono-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', marginBottom: '12px' }}
          >
            <ArrowLeft size={14} />
            [ RETURN TO DASHBOARD ]
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              TRANSPORT MASTER DATA
            </h1>
            <span className="error-badge-mono" style={{ background: '#000000', color: '#ffffff', borderColor: '#ffffff' }}>
              DATABASE TIER
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0 0', fontFamily: 'var(--font-mono)' }}>
            V.S.B. ENGINEERING COLLEGE • FLEET & ROUTE DIRECTORY (AI & DS TRANSPORT CONTROL)
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="mono-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            title="Refresh database records"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>REFRESH</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!filteredList.length}
            className="mono-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            title="Export tab to CSV"
          >
            <Download size={14} />
            <span>EXPORT CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="mono-btn mono-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              <Plus size={15} />
              <span>[ + ADD {TABS.find(t => t.id === activeTab).singular.toUpperCase()} ]</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid #ffffff',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={18} color="#ffffff" />
          <div style={{ fontSize: '0.85rem', color: '#ffffff', flex: 1 }}>
            <strong>System Error:</strong> {error}
          </div>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#000000',
          border: '1px solid #ffffff',
          padding: '12px 16px',
          borderRadius: '4px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Check size={18} color="#ffffff" />
          <div style={{ fontSize: '0.85rem', color: '#ffffff', flex: 1 }}>
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Telemetry Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: '4px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fleet Buses</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-pure)' }}>{stats.totalBuses}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stats.activeBuses} Active in Service</div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: '4px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>College Routes</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-pure)' }}>{stats.totalRoutes}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across Karur, Trichy & Dindigul</div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: '4px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transit Stops</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-pure)' }}>{stats.totalStops}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sequenced Pick-up Points</div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: '4px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Drivers</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-pure)' }}>{stats.totalDrivers}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Licensed & Verified</div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: '4px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty In-Charge</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-pure)' }}>{stats.totalInCharges}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dept Supervisors Assigned</div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: '4px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vision Cameras</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-pure)' }}>{stats.onlineCameras} / {stats.totalCameras}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Stream Status Online</div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-default)',
        marginBottom: '20px',
        overflowX: 'auto',
        gap: '4px'
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = (data[tab.id] || []).length;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
              style={{
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? '#ffffff' : 'var(--bg-surface)',
                color: isActive ? '#000000' : 'var(--text-muted)',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls: Search & Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: '4px',
            padding: '8px 12px',
            width: '100%'
          }}>
            <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-pure)',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-pure)',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Records</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="STANDBY">Standby</option>
            <option value="ONLINE">Online (Cameras)</option>
            <option value="OFFLINE">Offline (Cameras)</option>
          </select>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Showing {filteredList.length} of {(data[activeTab] || []).length}
          </span>
        </div>
      </div>

      {/* Main Table View */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: '4px',
        overflowX: 'auto'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spinning" style={{ marginBottom: '12px' }} />
            <div>Synchronizing institutional records from database...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={28} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-pure)', marginBottom: '4px' }}>
              No records found
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try clearing the search filter.'
                : `No ${activeTab} registered yet. Click Add to create one.`}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
                {renderTableHeaders(activeTab)}
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-pure)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {renderTableRow(activeTab, item)}
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenView(item)}
                        className="mono-btn"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="mono-btn"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Edit Record"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="mono-btn"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#444' }}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Render Modal if active */}
      {renderActiveModal()}
    </div>
  );

  // Helper: Dynamic Table Headers
  function renderTableHeaders(tab) {
    switch (tab) {
      case 'buses':
        return (
          <>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Bus Number</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Registration</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Capacity</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Model</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Current Route</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
          </>
        );
      case 'routes':
        return (
          <>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Route No</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Route Name</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>From / To</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Distance</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Stops</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
          </>
        );
      case 'stops':
        return (
          <>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Seq</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Stop Name</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Assigned Route</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Scheduled Time</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Landmark</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Active</th>
          </>
        );
      case 'drivers':
        return (
          <>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Driver Name</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>License No</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Contact Phone</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Experience</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Assigned Bus</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
          </>
        );
      case 'incharges':
        return (
          <>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Faculty Name</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Employee ID</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Department</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Designation</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Contact Email</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
          </>
        );
      case 'assignments':
        return (
          <>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Bus</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Route</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Assigned Driver</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Bus In-Charge</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Academic Term</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
          </>
        );
      case 'cameras':
        return (
          <>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Bus ID</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Camera Model</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Position</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>IP Address</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Heartbeat</th>
            <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
          </>
        );
      default:
        return null;
    }
  }

  // Helper: Dynamic Table Rows
  function renderTableRow(tab, item) {
    switch (tab) {
      case 'buses':
        return (
          <>
            <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {item.bus_number}
            </td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {item.registration_number}
            </td>
            <td style={{ padding: '12px 16px' }}>{item.capacity} Seats</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.model}</td>
            <td style={{ padding: '12px 16px' }}>
              {item.route_number ? `${item.route_number} - ${item.route_name}` : 'Unassigned'}
            </td>
            <td style={{ padding: '12px 16px' }}>
              <span className={`mono-pill ${item.status === 'ACTIVE' ? 'mono-pill-active' : ''}`}>
                {item.status}
              </span>
            </td>
          </>
        );
      case 'routes':
        return (
          <>
            <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {item.route_number}
            </td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.route_name}</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
              {item.start_location} → {item.end_location}
            </td>
            <td style={{ padding: '12px 16px' }}>{item.total_distance_km} km ({item.estimated_duration_mins}m)</td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
              {item.stop_count || 0} stops
            </td>
            <td style={{ padding: '12px 16px' }}>
              <span className="mono-pill mono-pill-active">{item.status}</span>
            </td>
          </>
        );
      case 'stops':
        return (
          <>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              #{item.stop_order}
            </td>
            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.stop_name}</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
              {item.route_number ? `${item.route_number} (${item.route_name})` : item.route_id}
            </td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{item.arrival_time}</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.landmark || '—'}</td>
            <td style={{ padding: '12px 16px' }}>
              <span className="mono-pill mono-pill-active">{item.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
            </td>
          </>
        );
      case 'drivers':
        return (
          <>
            <td style={{ padding: '12px 16px', fontWeight: 700 }}>{item.name}</td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {item.license_number}
            </td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{item.phone}</td>
            <td style={{ padding: '12px 16px' }}>{item.experience_years} Years</td>
            <td style={{ padding: '12px 16px' }}>
              {item.assigned_bus_number || 'Unassigned'}
            </td>
            <td style={{ padding: '12px 16px' }}>
              <span className="mono-pill mono-pill-active">{item.status}</span>
            </td>
          </>
        );
      case 'incharges':
        return (
          <>
            <td style={{ padding: '12px 16px', fontWeight: 700 }}>{item.name}</td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {item.employee_id}
            </td>
            <td style={{ padding: '12px 16px' }}>{item.department}</td>
            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.designation}</td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{item.email}</td>
            <td style={{ padding: '12px 16px' }}>
              <span className="mono-pill mono-pill-active">{item.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
            </td>
          </>
        );
      case 'assignments':
        return (
          <>
            <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {item.bus_number}
            </td>
            <td style={{ padding: '12px 16px' }}>{item.route_number} ({item.route_name})</td>
            <td style={{ padding: '12px 16px' }}>{item.driver_name}</td>
            <td style={{ padding: '12px 16px' }}>{item.in_charge_name}</td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
              {item.academic_year} [{item.semester}]
            </td>
            <td style={{ padding: '12px 16px' }}>
              <span className="mono-pill mono-pill-active">{item.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
            </td>
          </>
        );
      case 'cameras':
        return (
          <>
            <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {item.bus_number}
            </td>
            <td style={{ padding: '12px 16px' }}>{item.camera_model}</td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>{item.installation_position}</td>
            <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {item.ip_address}
            </td>
            <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {item.last_heartbeat ? new Date(item.last_heartbeat).toLocaleTimeString() : 'RECENT'}
            </td>
            <td style={{ padding: '12px 16px' }}>
              <span className="mono-pill" style={{
                background: item.status === 'ONLINE' ? '#ffffff' : '#000000',
                color: item.status === 'ONLINE' ? '#000000' : '#ffffff',
                border: '1px solid #ffffff'
              }}>
                {item.status}
              </span>
            </td>
          </>
        );
      default:
        return null;
    }
  }

  // Modal Render Dispatcher
  function renderActiveModal() {
    if (!modalMode) return null;

    if (modalMode === 'view') {
      return (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '600px',
            width: '100%',
            padding: '24px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                RECORD DETAILS: {TABS.find(t => t.id === activeTab).singular.toUpperCase()}
              </h2>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  {Object.entries(selectedItem || {}).map(([key, val]) => (
                    <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px', color: 'var(--text-muted)', fontWeight: 600, width: '40%' }}>
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setModalMode(null)} className="mono-btn mono-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                [ CLOSE RECORD ]
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (modalMode === 'delete') {
      return (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 12px 0', color: '#ffffff' }}>
              CONFIRM RECORD REMOVAL
            </h2>

            {modalError && (
              <div style={{
                background: '#200808',
                border: '1px solid #7f1d1d',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)'
              }}>
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Are you sure you want to delete this {TABS.find(t => t.id === activeTab).singular} record? Any dependent route assignments or stops will be impacted according to relational integrity constraints.
            </p>

            <div style={{
              background: '#000000',
              border: '1px solid var(--border-default)',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              marginBottom: '24px'
            }}>
              ID: {selectedItem?.id}<br />
              Target: {selectedItem?.bus_number || selectedItem?.route_number || selectedItem?.name || selectedItem?.stop_name || 'Selected Item'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setModalMode(null)} disabled={submitting} className="mono-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                CANCEL
              </button>
              <button onClick={handleSubmitModal} disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                {submitting ? 'DELETING...' : '[ CONFIRM DELETE ]'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Modal Mode: Create or Edit
    return (
      <div className="modal-backdrop" style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid #ffffff',
          borderRadius: '4px',
          maxWidth: '640px',
          width: '100%',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {modalMode === 'create' ? `ADD NEW ${TABS.find(t => t.id === activeTab).singular.toUpperCase()}` : `EDIT ${TABS.find(t => t.id === activeTab).singular.toUpperCase()}`}
            </h2>
            <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {modalError && (
            <div style={{
              background: '#200808',
              border: '1px solid #7f1d1d',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono)'
            }}>
              <AlertCircle size={16} />
              <span>{modalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitModal}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {renderFormFields(activeTab, formData, setFormData, data)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
              <button type="button" onClick={() => setModalMode(null)} disabled={submitting} className="mono-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                CANCEL
              </button>
              <button type="submit" disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                {submitting ? 'SAVING...' : modalMode === 'create' ? '[ + CREATE RECORD ]' : '[ SAVE CHANGES ]'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Dynamic Form Fields Generator
  function renderFormFields(tab, fData, setFData, masterData) {
    const updateField = (key, val) => setFData(prev => ({ ...prev, [key]: val }));

    switch (tab) {
      case 'buses':
        return (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Bus Number *</label>
              <input
                required
                type="text"
                value={fData.bus_number || ''}
                onChange={e => updateField('bus_number', e.target.value)}
                placeholder="e.g. BUS-18"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Registration Number *</label>
              <input
                required
                type="text"
                value={fData.registration_number || ''}
                onChange={e => updateField('registration_number', e.target.value)}
                placeholder="TN-47-AZ-1018"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Capacity (Seats) *</label>
              <input
                required
                type="number"
                value={fData.capacity || 54}
                onChange={e => updateField('capacity', parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Bus Model</label>
              <input
                type="text"
                value={fData.model || ''}
                onChange={e => updateField('model', e.target.value)}
                placeholder="Tata Starbus Ultra"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Operational Status</label>
              <select
                value={fData.status || 'ACTIVE'}
                onChange={e => updateField('status', e.target.value)}
                style={inputStyle}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="STANDBY">STANDBY</option>
                <option value="DECOMMISSIONED">DECOMMISSIONED</option>
              </select>
            </div>
          </>
        );

      case 'routes':
        return (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Route Number *</label>
              <input
                required
                type="text"
                value={fData.route_number || ''}
                onChange={e => updateField('route_number', e.target.value)}
                placeholder="e.g. R-07"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Route Name *</label>
              <input
                required
                type="text"
                value={fData.route_name || ''}
                onChange={e => updateField('route_name', e.target.value)}
                placeholder="e.g. Karur West Express"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Starting Point *</label>
              <input
                required
                type="text"
                value={fData.start_location || ''}
                onChange={e => updateField('start_location', e.target.value)}
                placeholder="e.g. Karur Bus Stand"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Destination *</label>
              <input
                required
                type="text"
                value={fData.end_location || 'V.S.B Engineering College'}
                onChange={e => updateField('end_location', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={fData.total_distance_km || 25}
                onChange={e => updateField('total_distance_km', parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Duration (Mins)</label>
              <input
                type="number"
                value={fData.estimated_duration_mins || 45}
                onChange={e => updateField('estimated_duration_mins', parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          </>
        );

      case 'stops':
        return (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Parent Route *</label>
              <select
                required
                value={fData.route_id || ''}
                onChange={e => updateField('route_id', e.target.value)}
                style={inputStyle}
              >
                {masterData.routes.map(r => (
                  <option key={r.id} value={r.id}>{r.route_number} - {r.route_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Stop Name *</label>
              <input
                required
                type="text"
                value={fData.stop_name || ''}
                onChange={e => updateField('stop_name', e.target.value)}
                placeholder="e.g. Collectorate Junction"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Sequence Order *</label>
              <input
                required
                type="number"
                value={fData.stop_order || 1}
                onChange={e => updateField('stop_order', parseInt(e.target.value) || 1)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Scheduled Pick-up Time (HH:MM)</label>
              <input
                type="text"
                value={fData.arrival_time || '07:30'}
                onChange={e => updateField('arrival_time', e.target.value)}
                placeholder="07:35"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Prominent Landmark</label>
              <input
                type="text"
                value={fData.landmark || ''}
                onChange={e => updateField('landmark', e.target.value)}
                placeholder="Opposite Post Office"
                style={inputStyle}
              />
            </div>
          </>
        );

      case 'drivers':
        return (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Driver Full Name *</label>
              <input
                required
                type="text"
                value={fData.name || ''}
                onChange={e => updateField('name', e.target.value)}
                placeholder="e.g. K. Rajesh"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Heavy Vehicle License No *</label>
              <input
                required
                type="text"
                value={fData.license_number || ''}
                onChange={e => updateField('license_number', e.target.value)}
                placeholder="TN47-20150004589"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Phone Number *</label>
              <input
                required
                type="text"
                value={fData.phone || ''}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="9842100000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Driving Experience (Years)</label>
              <input
                type="number"
                value={fData.experience_years || 5}
                onChange={e => updateField('experience_years', parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          </>
        );

      case 'incharges':
        return (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Faculty Name *</label>
              <input
                required
                type="text"
                value={fData.name || ''}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Prof. S. Karthikeyan"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Employee ID *</label>
              <input
                required
                type="text"
                value={fData.employee_id || ''}
                onChange={e => updateField('employee_id', e.target.value)}
                placeholder="VSB-FAC-102"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Department</label>
              <input
                type="text"
                value={fData.department || 'AI & DS'}
                onChange={e => updateField('department', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Contact Email</label>
              <input
                type="email"
                value={fData.email || ''}
                onChange={e => updateField('email', e.target.value)}
                placeholder="faculty@vsb.ac.in"
                style={inputStyle}
              />
            </div>
          </>
        );

      case 'assignments':
        return (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Bus *</label>
              <select
                required
                value={fData.bus_id || ''}
                onChange={e => updateField('bus_id', e.target.value)}
                style={inputStyle}
              >
                {masterData.buses.map(b => (
                  <option key={b.id} value={b.id}>{b.bus_number} ({b.registration_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Route *</label>
              <select
                required
                value={fData.route_id || ''}
                onChange={e => updateField('route_id', e.target.value)}
                style={inputStyle}
              >
                {masterData.routes.map(r => (
                  <option key={r.id} value={r.id}>{r.route_number} - {r.route_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Driver</label>
              <select
                value={fData.driver_id || ''}
                onChange={e => updateField('driver_id', e.target.value)}
                style={inputStyle}
              >
                <option value="">None Assigned</option>
                {masterData.drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Bus In-Charge</label>
              <select
                value={fData.bus_in_charge_id || ''}
                onChange={e => updateField('bus_in_charge_id', e.target.value)}
                style={inputStyle}
              >
                <option value="">None Assigned</option>
                {masterData.incharges.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.department})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Academic Year</label>
              <input
                type="text"
                value={fData.academic_year || '2025-2026'}
                onChange={e => updateField('academic_year', e.target.value)}
                style={inputStyle}
              />
            </div>
          </>
        );

      case 'cameras':
        return (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Bus *</label>
              <select
                required
                value={fData.bus_id || ''}
                onChange={e => updateField('bus_id', e.target.value)}
                style={inputStyle}
              >
                {masterData.buses.map(b => (
                  <option key={b.id} value={b.id}>{b.bus_number} ({b.registration_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Camera Model *</label>
              <input
                required
                type="text"
                value={fData.camera_model || ''}
                onChange={e => updateField('camera_model', e.target.value)}
                placeholder="Hikvision DS-2CD2043G2-I"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Position</label>
              <select
                value={fData.installation_position || 'ENTRANCE'}
                onChange={e => updateField('installation_position', e.target.value)}
                style={inputStyle}
              >
                <option value="ENTRANCE">ENTRANCE (Doorway AI)</option>
                <option value="INTERIOR">INTERIOR (Cabin Headcount)</option>
                <option value="REAR">REAR (Emergency Exit)</option>
                <option value="DASHCAM">DASHCAM (Forward Road)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Static IP Address</label>
              <input
                type="text"
                value={fData.ip_address || ''}
                onChange={e => updateField('ip_address', e.target.value)}
                placeholder="192.168.1.105"
                style={inputStyle}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  }
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-void)',
  border: '1px solid var(--border-default)',
  color: 'var(--text-pure)',
  padding: '8px 12px',
  borderRadius: '4px',
  fontSize: '0.85rem',
  outline: 'none',
  fontFamily: 'inherit'
};
