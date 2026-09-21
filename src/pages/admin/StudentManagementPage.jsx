// FILE: src/pages/admin/StudentManagementPage.jsx
// PURPOSE: Complete Phase 4 Student Management Dashboard for V.S.B. Engineering College.
// Covers Student Identity Records, Bus Allocations, Transport Change Requests, and Vision Attendance Logs.
// PHASE: Phase 4 — Student Management

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  GraduationCap,
  Bus,
  FileText,
  ScanFace,
  Search,
  RefreshCw,
  Download,
  Plus,
  ArrowLeft,
  AlertCircle,
  Check,
  X,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Shield,
  Filter
} from 'lucide-react';

const TABS = [
  { id: 'students', label: 'Students', icon: GraduationCap, singular: 'Student' },
  { id: 'assignments', label: 'Bus Allocations', icon: Bus, singular: 'Allocation' },
  { id: 'requests', label: 'Transport Requests', icon: FileText, singular: 'Request' },
  { id: 'attendance', label: 'Vision Attendance', icon: ScanFace, singular: 'Attendance Record' }
];

const DEPARTMENTS = [
  'AI & DS',
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL',
  'IT',
  'MBA'
];

export default function StudentManagementPage({ onNavigate }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTransportStaff = user?.role === 'TRANSPORT_STAFF';
  const canEdit = isAdmin || isTransportStaff;

  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Collections State
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [studentStats, setStudentStats] = useState(null);

  // Aux reference data for dropdowns
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'student-form' | 'assignment-form' | 'request-review' | 'attendance-inspect' | 'view-student' | 'delete-confirm'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load all required data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        studentsRes,
        statsRes,
        assignmentsRes,
        requestsRes,
        attendanceRes,
        busesRes,
        routesRes,
        stopsRes
      ] = await Promise.all([
        apiService.students.getAll({ limit: 200 }),
        apiService.students.getStats().catch(() => ({ data: null })),
        apiService.studentAssignments.getAll({ limit: 200 }),
        apiService.transportRequests.getAll({ limit: 200 }),
        apiService.attendance.getLogs({ limit: 100 }),
        apiService.buses.getAll().catch(() => ({ data: [] })),
        apiService.routes.getAll().catch(() => ({ data: [] })),
        apiService.stops.getAll().catch(() => ({ data: [] }))
      ]);

      setStudents(studentsRes.data || []);
      setStudentStats(statsRes?.data || null);
      setAssignments(assignmentsRes.data || []);
      setRequests(requestsRes.data || []);
      setAttendanceLogs(attendanceRes.data || []);

      setBuses((busesRes.data || []).map(b => ({
        id: b.bus_id || b.id,
        bus_number: b.bus_number,
        capacity: b.capacity
      })));

      setRoutes((routesRes.data || []).map(r => ({
        id: r.route_id || r.id,
        route_number: r.route_code || r.route_number,
        route_name: r.route_name
      })));

      setStops((stopsRes.data || []).map(s => ({
        id: s.stop_id || s.id,
        stop_name: s.stop_name,
        route_id: s.route_id
      })));
    } catch (err) {
      console.error('[StudentManagement] Failed to load data:', err);
      setError(err.message || 'Failed to communicate with transport service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered lists
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch =
        searchTerm === '' ||
        (s.roll_number && s.roll_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.first_name && s.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.last_name && s.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDept = departmentFilter === 'ALL' || s.department === departmentFilter;
      const matchesStatus = statusFilter === 'ALL' || s.transport_status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [students, searchTerm, departmentFilter, statusFilter]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchesSearch =
        searchTerm === '' ||
        (a.roll_number && a.roll_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.first_name && a.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.bus_number && a.bus_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.route_name && a.route_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, statusFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch =
        searchTerm === '' ||
        (r.roll_number && r.roll_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.first_name && r.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.request_type && r.request_type.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || r.request_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const filteredAttendance = useMemo(() => {
    return attendanceLogs.filter(log => {
      const matchesSearch =
        searchTerm === '' ||
        (log.roll_number && log.roll_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.first_name && log.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.bus_number && log.bus_number.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || log.verification_result === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceLogs, searchTerm, statusFilter]);

  // Telemetry KPIs
  const kpiStats = useMemo(() => {
    const totalCount = studentStats?.total_students ?? students.length;
    const activeCount = studentStats?.active_commuters ?? students.filter(s => s.transport_status === 'ACTIVE').length;
    const pendingReqCount = requests.filter(r => r.request_status === 'PENDING').length;
    const verifiedToday = attendanceLogs.filter(a => a.verification_result === 'MATCH').length;
    return {
      total: totalCount,
      active: activeCount,
      pendingRequests: pendingReqCount,
      verifiedToday
    };
  }, [studentStats, students, requests, attendanceLogs]);

  // Open Create Student Modal
  const handleOpenCreateStudent = () => {
    setSelectedItem(null);
    setFormData({
      roll_number: '',
      register_number: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: 'AI & DS',
      year_of_study: 2,
      section: 'A',
      blood_group: 'O+',
      gender: 'MALE',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      transport_status: 'PENDING_ALLOCATION',
      transport_fee_status: 'PAID',
      address: 'Karur, Tamil Nadu'
    });
    setModalMode('student-form');
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (student) => {
    setSelectedItem(student);
    setFormData({ ...student });
    setModalMode('student-form');
  };

  // Open View Student Modal
  const handleOpenViewStudent = (student) => {
    setSelectedItem(student);
    setModalMode('view-student');
  };

  // Open Assign Bus Modal for a student
  const handleOpenAssignBus = (student) => {
    setSelectedItem(student);
    setFormData({
      student_id: student.student_id || student.id,
      route_id: routes[0]?.id || '',
      bus_id: buses[0]?.id || '',
      boarding_stop_id: stops[0]?.id || '',
      drop_stop_id: stops[0]?.id || '',
      academic_year: '2025-2026',
      semester: 'EVEN',
      status: 'ACTIVE'
    });
    setModalMode('assignment-form');
  };

  // Open Review Request Modal
  const handleOpenReviewRequest = (req) => {
    setSelectedItem(req);
    setFormData({
      request_status: 'APPROVED',
      admin_remarks: 'Approved for campus transit service.'
    });
    setModalMode('request-review');
  };

  // Open Inspect Attendance Modal
  const handleOpenInspectAttendance = (log) => {
    setSelectedItem(log);
    setModalMode('attendance-inspect');
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (item, type = 'student') => {
    setSelectedItem({ ...item, _deleteType: type });
    setModalMode('delete-confirm');
  };

  // Submit Student Form (Create or Update)
  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (selectedItem) {
        const id = selectedItem.student_id || selectedItem.id;
        await apiService.students.update(id, formData);
        setSuccessMessage(`Student ${formData.roll_number} updated successfully.`);
      } else {
        await apiService.students.create(formData);
        setSuccessMessage(`Student ${formData.roll_number} enrolled successfully.`);
      }
      setModalMode(null);
      await loadAllData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('[StudentManagement] Student form error:', err);
      setError(err.message || 'Failed to save student profile.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Bus Assignment Form
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiService.studentAssignments.assign(formData);
      setSuccessMessage('Bus and route allocated successfully.');
      setModalMode(null);
      await loadAllData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('[StudentManagement] Assignment error:', err);
      setError(err.message || 'Failed to complete bus assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Request Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const reqId = selectedItem.request_id || selectedItem.id;
      await apiService.transportRequests.review(reqId, {
        request_status: formData.request_status,
        admin_remarks: formData.admin_remarks
      });
      setSuccessMessage(`Transport request has been ${formData.request_status.toLowerCase()}.`);
      setModalMode(null);
      await loadAllData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('[StudentManagement] Review error:', err);
      setError(err.message || 'Failed to submit review decision.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete / Unassign Action
  const handleSubmitDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (selectedItem._deleteType === 'assignment') {
        const assignId = selectedItem.assignment_id || selectedItem.id;
        await apiService.studentAssignments.remove(assignId);
        setSuccessMessage('Bus allocation removed successfully.');
      } else {
        const studentId = selectedItem.student_id || selectedItem.id;
        await apiService.students.delete(studentId);
        setSuccessMessage('Student record removed from transit directory.');
      }
      setModalMode(null);
      await loadAllData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('[StudentManagement] Delete error:', err);
      setError(err.message || 'Failed to remove record.');
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    let rows = [];
    let filename = `vsb-transport-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'students') {
      rows = filteredStudents.map(s => ({
        Roll_Number: s.roll_number,
        Register_Number: s.register_number || '',
        Name: `${s.first_name} ${s.last_name || ''}`.trim(),
        Department: s.department,
        Year: s.year_of_study,
        Section: s.section || '',
        Transport_Status: s.transport_status,
        Fee_Status: s.transport_fee_status,
        Email: s.email,
        Phone: s.phone || ''
      }));
    } else if (activeTab === 'assignments') {
      rows = filteredAssignments.map(a => ({
        Student_Roll: a.roll_number,
        Student_Name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
        Bus_Number: a.bus_number,
        Route: a.route_name || a.route_code,
        Boarding_Stop: a.boarding_stop_name || '',
        Drop_Stop: a.drop_stop_name || '',
        Academic_Year: a.academic_year,
        Semester: a.semester,
        Status: a.status
      }));
    } else if (activeTab === 'requests') {
      rows = filteredRequests.map(r => ({
        Student_Roll: r.roll_number,
        Student_Name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        Request_Type: r.request_type,
        Reason: r.reason || '',
        Status: r.request_status,
        Admin_Remarks: r.admin_remarks || '',
        Date: r.created_at
      }));
    } else if (activeTab === 'attendance') {
      rows = filteredAttendance.map(log => ({
        Roll_Number: log.roll_number,
        Name: `${log.first_name || ''} ${log.last_name || ''}`.trim(),
        Bus: log.bus_number,
        Stop: log.stop_name || '',
        Recognition_Status: log.recognition_status,
        Verification_Result: log.verification_result,
        Confidence_Score: `${((log.confidence_score || 0) * 100).toFixed(1)}%`,
        Timestamp: log.timestamp
      }));
    }

    if (!rows.length) return;

    const headers = Object.keys(rows[0]).join(',');
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows.map(row => Object.values(row).map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Route-filtered stops
  const routeStops = useMemo(() => {
    if (!formData.route_id) return stops;
    const matched = stops.filter(s => s.route_id === formData.route_id);
    return matched.length ? matched : stops;
  }, [stops, formData.route_id]);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 120px)' }}>
      {/* Institutional Header & Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border-default)',
        paddingBottom: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onNavigate && onNavigate(user?.role === 'ADMIN' ? 'admin' : 'transport-staff')}
              className="mono-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', fontSize: '0.75rem' }}
              title="Return to operational hub"
            >
              <ArrowLeft size={14} />
              <span>RETURN</span>
            </button>
            <span className="error-badge-mono" style={{ background: '#000000', color: '#ffffff', borderColor: '#ffffff' }}>
              STUDENT DIRECTORY
            </span>
            <span className="error-badge-mono" style={{ background: 'var(--bg-surface)' }}>
              IDENTITY & ALLOCATION TIER
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-pure)', margin: '8px 0 4px 0' }}>
            Student Transport Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, fontFamily: 'var(--font-mono)' }}>
            V.S.B. ENGINEERING COLLEGE • STUDENT PROFILES, FLEET ALLOCATIONS & VISION ATTENDANCE
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="mono-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            title="Reload live student records"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>REFRESH</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="mono-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            title="Export view records to CSV format"
          >
            <Download size={14} />
            <span>EXPORT CSV</span>
          </button>

          {canEdit && activeTab === 'students' && (
            <button
              onClick={handleOpenCreateStudent}
              className="mono-btn mono-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              id="btn-add-student"
            >
              <Plus size={15} />
              <span>[ + ENROLL STUDENT ]</span>
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
            <strong>System Notice:</strong> {error}
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

      {/* Institutional Telemetry KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Enrolled Students
            </span>
            <GraduationCap size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-pure)' }}>
            {kpiStats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            V.S.B. Institutional Database
          </div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Bus Commuters
            </span>
            <Bus size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-pure)' }}>
            {kpiStats.active}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            ● Verified Transit Privileges
          </div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Route Requests
            </span>
            <FileText size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-pure)' }}>
            {kpiStats.pendingRequests}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Requires Administrative Review
          </div>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', padding: '16px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Vision Matches
            </span>
            <ScanFace size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-pure)' }}>
            {kpiStats.verifiedToday}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
            AI Camera Edge Logs
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-default)',
        marginBottom: '20px',
        gap: '4px',
        overflowX: 'auto'
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
              }}
              style={{
                background: isActive ? 'var(--bg-primary)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-default) var(--border-default) transparent var(--border-default)' : 'transparent',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',
                padding: '10px 18px',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '10px',
                background: isActive ? '#000000' : 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff'
              }}>
                {tab.id === 'students' && students.length}
                {tab.id === 'assignments' && assignments.length}
                {tab.id === 'requests' && requests.length}
                {tab.id === 'attendance' && attendanceLogs.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filtering Controls */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        padding: '12px 16px',
        borderRadius: '4px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={
              activeTab === 'students'
                ? 'Filter by roll number, student name, email...'
                : activeTab === 'assignments'
                ? 'Filter by roll number, bus number, route...'
                : activeTab === 'requests'
                ? 'Filter by student roll, request type...'
                : 'Filter by roll number, bus, stop...'
            }
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'var(--bg-void)',
              border: '1px solid var(--border-subtle)',
              padding: '8px 12px',
              color: 'var(--text-pure)',
              fontSize: '0.85rem',
              borderRadius: '2px',
              width: '100%',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {activeTab === 'students' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                style={{
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-subtle)',
                  padding: '7px 10px',
                  color: 'var(--text-pure)',
                  fontSize: '0.8rem',
                  borderRadius: '2px',
                  outline: 'none'
                }}
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-void)',
                border: '1px solid var(--border-subtle)',
                padding: '7px 10px',
                color: 'var(--text-pure)',
                fontSize: '0.8rem',
                borderRadius: '2px',
                outline: 'none'
              }}
            >
              <option value="ALL">All Statuses</option>
              {activeTab === 'students' && (
                <>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_ALLOCATION">PENDING_ALLOCATION</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </>
              )}
              {activeTab === 'assignments' && (
                <>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </>
              )}
              {activeTab === 'requests' && (
                <>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </>
              )}
              {activeTab === 'attendance' && (
                <>
                  <option value="MATCH">MATCH</option>
                  <option value="MISMATCH">MISMATCH</option>
                  <option value="FLAGGED">FLAGGED</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: STUDENTS */}
      {activeTab === 'students' && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '4px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>ROLL NO</th>
                <th style={{ padding: '12px 16px' }}>NAME</th>
                <th style={{ padding: '12px 16px' }}>DEPT & YEAR</th>
                <th style={{ padding: '12px 16px' }}>TRANSPORT STATUS</th>
                <th style={{ padding: '12px 16px' }}>FEE STATUS</th>
                <th style={{ padding: '12px 16px' }}>CONTACT</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No student records match search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.student_id || student.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-pure)' }}>
                      {student.roll_number}
                      {student.register_number && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          REG: {student.register_number}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-pure)', fontWeight: 600 }}>
                      {student.first_name} {student.last_name}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {student.email}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <div>{student.department}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Year {student.year_of_study} • Sec {student.section || 'A'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '2px',
                        border: '1px solid',
                        background: student.transport_status === 'ACTIVE' ? '#000000' : 'var(--bg-surface)',
                        color: student.transport_status === 'ACTIVE' ? '#ffffff' : 'var(--text-secondary)',
                        borderColor: student.transport_status === 'ACTIVE' ? '#ffffff' : 'var(--border-subtle)'
                      }}>
                        {student.transport_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        color: student.transport_fee_status === 'PAID' ? '#ffffff' : 'var(--text-muted)'
                      }}>
                        {student.transport_fee_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                      {student.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenViewStudent(student)}
                          className="mono-btn"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="View Profile Details"
                        >
                          <Eye size={13} />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenAssignBus(student)}
                              className="mono-btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Allocate Bus & Route"
                            >
                              <Bus size={13} />
                            </button>
                            <button
                              onClick={() => handleOpenEditStudent(student)}
                              className="mono-btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Edit Student"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(student, 'student')}
                              className="mono-btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: BUS ALLOCATIONS */}
      {activeTab === 'assignments' && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '4px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>STUDENT</th>
                <th style={{ padding: '12px 16px' }}>ASSIGNED BUS</th>
                <th style={{ padding: '12px 16px' }}>TRANSIT ROUTE</th>
                <th style={{ padding: '12px 16px' }}>BOARDING & DROP POINTS</th>
                <th style={{ padding: '12px 16px' }}>ACADEMIC TERM</th>
                <th style={{ padding: '12px 16px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading bus allocation matrix...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No student allocations recorded.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(assign => (
                  <tr key={assign.assignment_id || assign.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-pure)' }}>
                        {assign.first_name} {assign.last_name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ROLL: {assign.roll_number}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-pure)' }}>
                      {assign.bus_number || 'UNASSIGNED'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <div>{assign.route_name || assign.route_code || 'Route Designated'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div><strong>Boarding:</strong> {assign.boarding_stop_name || 'Designated Stop'}</div>
                      <div><strong>Drop:</strong> {assign.drop_stop_name || 'Campus Destination'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {assign.academic_year || '2025-2026'} ({assign.semester || 'EVEN'})
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '2px',
                        border: '1px solid',
                        background: assign.status === 'ACTIVE' ? '#000000' : 'var(--bg-surface)',
                        color: assign.status === 'ACTIVE' ? '#ffffff' : 'var(--text-muted)',
                        borderColor: assign.status === 'ACTIVE' ? '#ffffff' : 'var(--border-subtle)'
                      }}>
                        {assign.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {canEdit && (
                        <button
                          onClick={() => handleOpenDelete(assign, 'assignment')}
                          className="mono-btn"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Remove Bus Allocation"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: TRANSPORT REQUESTS */}
      {activeTab === 'requests' && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '4px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>STUDENT</th>
                <th style={{ padding: '12px 16px' }}>REQUEST TYPE</th>
                <th style={{ padding: '12px 16px' }}>REQUESTED ROUTE / BUS</th>
                <th style={{ padding: '12px 16px' }}>JUSTIFICATION / REASON</th>
                <th style={{ padding: '12px 16px' }}>STATUS</th>
                <th style={{ padding: '12px 16px' }}>REQUEST DATE</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading transit modification requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transport requests in pipeline.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.request_id || req.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-pure)' }}>
                        {req.first_name} {req.last_name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ROLL: {req.roll_number}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                      {req.request_type}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <div>Route: {req.route_name || req.route_code || 'Pending Match'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Bus: {req.bus_number || 'Auto-allocated'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '280px', fontSize: '0.8rem' }}>
                      {req.reason || 'Residence address changed'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '2px',
                        border: '1px solid',
                        background: req.request_status === 'APPROVED' ? '#000000' : 'var(--bg-surface)',
                        color: req.request_status === 'APPROVED' ? '#ffffff' : req.request_status === 'PENDING' ? '#ffffff' : 'var(--text-muted)',
                        borderColor: req.request_status === 'PENDING' ? '#ffffff' : 'var(--border-subtle)'
                      }}>
                        {req.request_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Today'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {canEdit && req.request_status === 'PENDING' && (
                        <button
                          onClick={() => handleOpenReviewRequest(req)}
                          className="mono-btn mono-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          [ REVIEW ]
                        </button>
                      )}
                      {req.request_status !== 'PENDING' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          DECIDED
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: VISION ATTENDANCE LOGS */}
      {activeTab === 'attendance' && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: '4px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>COMMUTER</th>
                <th style={{ padding: '12px 16px' }}>BUS & STOP</th>
                <th style={{ padding: '12px 16px' }}>DETECTION TYPE</th>
                <th style={{ padding: '12px 16px' }}>VERIFICATION RESULT</th>
                <th style={{ padding: '12px 16px' }}>CONFIDENCE</th>
                <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>INSPECTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Streaming vision attendance telemetry...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No camera boarding logs available for current filter.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map(log => (
                  <tr key={log.log_id || log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-pure)' }}>
                        {log.first_name} {log.last_name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ROLL: {log.roll_number}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-pure)' }}>
                        {log.bus_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.stop_name || 'Designated Checkpoint'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ffffff' }}>
                      {log.recognition_status}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        borderRadius: '2px',
                        border: '1px solid',
                        background: log.verification_result === 'MATCH' ? '#000000' : 'var(--bg-surface)',
                        color: log.verification_result === 'MATCH' ? '#ffffff' : 'var(--text-muted)',
                        borderColor: log.verification_result === 'MATCH' ? '#ffffff' : 'var(--border-subtle)'
                      }}>
                        {log.verification_result === 'MATCH' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {log.verification_result}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#ffffff' }}>
                      {log.confidence_score ? `${(log.confidence_score * 100).toFixed(1)}%` : 'Manual'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenInspectAttendance(log)}
                        className="mono-btn"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        title="Inspect Edge Frame & Metadata"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: STUDENT ENROLL / EDIT */}
      {modalMode === 'student-form' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-pure)', margin: 0 }}>
                {selectedItem ? 'Edit Student Profile' : 'Enroll New Commuter Student'}
              </h2>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Roll Number *</label>
                  <input
                    type="text"
                    required
                    disabled={!!selectedItem}
                    value={formData.roll_number || ''}
                    onChange={e => setFormData({ ...formData, roll_number: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                    placeholder="e.g. 22AD001"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Register Number</label>
                  <input
                    type="text"
                    value={formData.register_number || ''}
                    onChange={e => setFormData({ ...formData, register_number: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                    placeholder="e.g. 922522102001"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name || ''}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name || ''}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                    placeholder="student@vsb.ac.in"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Department *</label>
                  <select
                    value={formData.department || 'AI & DS'}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Year of Study</label>
                  <select
                    value={formData.year_of_study || 2}
                    onChange={e => setFormData({ ...formData, year_of_study: parseInt(e.target.value) })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Section</label>
                  <input
                    type="text"
                    value={formData.section || 'A'}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Transport Status</label>
                  <select
                    value={formData.transport_status || 'PENDING_ALLOCATION'}
                    onChange={e => setFormData({ ...formData, transport_status: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_ALLOCATION">PENDING_ALLOCATION</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Transport Fee Status</label>
                  <select
                    value={formData.transport_fee_status || 'PAID'}
                    onChange={e => setFormData({ ...formData, transport_fee_status: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="EXEMPTED">EXEMPTED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="mono-btn"
                  style={{ padding: '8px 16px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mono-btn mono-btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  {submitting ? 'SAVING...' : selectedItem ? '[ UPDATE PROFILE ]' : '[ ENROLL STUDENT ]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BUS ALLOCATION MODAL */}
      {modalMode === 'assignment-form' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '540px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-pure)', margin: 0 }}>
                Allocate Bus & Transit Route
              </h2>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-pure)' }}>
                {selectedItem?.first_name} {selectedItem?.last_name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ROLL: {selectedItem?.roll_number} • {selectedItem?.department}
              </div>
            </div>

            <form onSubmit={handleSubmitAssignment}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Assigned Transit Route *</label>
                <select
                  required
                  value={formData.route_id || ''}
                  onChange={e => setFormData({ ...formData, route_id: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_number} — {r.route_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Designated Bus *</label>
                <select
                  required
                  value={formData.bus_id || ''}
                  onChange={e => setFormData({ ...formData, bus_id: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                >
                  <option value="">Select Bus</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.bus_number} (Capacity: {b.capacity})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Boarding Stop</label>
                  <select
                    value={formData.boarding_stop_id || ''}
                    onChange={e => setFormData({ ...formData, boarding_stop_id: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="">Select Stop</option>
                    {routeStops.map(s => (
                      <option key={s.id} value={s.id}>{s.stop_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Drop Stop</label>
                  <select
                    value={formData.drop_stop_id || ''}
                    onChange={e => setFormData({ ...formData, drop_stop_id: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="">Select Drop Point</option>
                    {routeStops.map(s => (
                      <option key={s.id} value={s.id}>{s.stop_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Academic Year</label>
                  <input
                    type="text"
                    value={formData.academic_year || '2025-2026'}
                    onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Semester</label>
                  <select
                    value={formData.semester || 'EVEN'}
                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="ODD">ODD</option>
                    <option value="EVEN">EVEN</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="mono-btn"
                  style={{ padding: '8px 16px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mono-btn mono-btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  {submitting ? 'ALLOCATING...' : '[ CONFIRM ALLOCATION ]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REQUEST REVIEW */}
      {modalMode === 'request-review' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-pure)', margin: 0 }}>
                Review Transport Request
              </h2>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-pure)' }}>
                {selectedItem?.first_name} {selectedItem?.last_name} ({selectedItem?.roll_number})
              </div>
              <div style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
                <strong>Request Type:</strong> {selectedItem?.request_type}
              </div>
              <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                <strong>Reason:</strong> {selectedItem?.reason || 'No additional notes provided.'}
              </div>
              <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                <strong>Target Route:</strong> {selectedItem?.route_name || selectedItem?.route_code || 'Pending'}
              </div>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Administrative Decision *</label>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVED"
                      checked={formData.request_status === 'APPROVED'}
                      onChange={() => setFormData({ ...formData, request_status: 'APPROVED' })}
                    />
                    [ APPROVE REQUEST ]
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="REJECTED"
                      checked={formData.request_status === 'REJECTED'}
                      onChange={() => setFormData({ ...formData, request_status: 'REJECTED' })}
                    />
                    [ REJECT REQUEST ]
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Admin Remarks / Justification</label>
                <textarea
                  rows="3"
                  value={formData.admin_remarks || ''}
                  onChange={e => setFormData({ ...formData, admin_remarks: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: '#ffffff', padding: '8px', fontSize: '0.85rem' }}
                  placeholder="Notes recorded in student transit dossier..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="mono-btn"
                  style={{ padding: '8px 16px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mono-btn mono-btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  {submitting ? 'RECORDING...' : '[ SUBMIT DECISION ]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ATTENDANCE INSPECTION */}
      {modalMode === 'attendance-inspect' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '540px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScanFace size={18} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-pure)', margin: 0 }}>
                  Vision Telemetry Inspection
                </h2>
              </div>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--bg-void)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Commuter Identity</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                  {selectedItem?.first_name} {selectedItem?.last_name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  ROLL: {selectedItem?.roll_number}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Vehicle & Stop</div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{selectedItem?.bus_number}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedItem?.stop_name || 'Designated Stop'}</div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Recognition Method</div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{selectedItem?.recognition_status}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Result: {selectedItem?.verification_result}</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-void)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Edge Confidence Rating</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                    {selectedItem?.confidence_score ? `${(selectedItem.confidence_score * 100).toFixed(1)}%` : 'MANUAL OVERRIDE'}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (selectedItem?.confidence_score || 1) * 100)}%`,
                    height: '100%',
                    background: '#ffffff'
                  }} />
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                TELEMETRY TIMESTAMP: {selectedItem?.timestamp ? new Date(selectedItem.timestamp).toISOString() : 'N/A'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setModalMode(null)}
                className="mono-btn mono-btn-primary"
                style={{ padding: '8px 18px' }}
              >
                [ CLOSE INSPECTOR ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW STUDENT DETAILS */}
      {modalMode === 'view-student' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '600px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-pure)', margin: 0 }}>
                Student Commuter Profile
              </h2>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--bg-void)', padding: '14px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedItem?.first_name} {selectedItem?.last_name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  ROLL: {selectedItem?.roll_number} • REG: {selectedItem?.register_number || 'NOT_REGISTERED'}
                </div>
                <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                  {selectedItem?.department} • Year {selectedItem?.year_of_study} (Section {selectedItem?.section || 'A'})
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact Email</div>
                  <div style={{ color: '#ffffff', wordBreak: 'break-all', marginTop: '2px' }}>{selectedItem?.email}</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phone Contact</div>
                  <div style={{ color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{selectedItem?.phone || 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Transport Clearance</div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {selectedItem?.transport_status}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Fee Status</div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {selectedItem?.transport_fee_status}
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-void)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Emergency Contact</div>
                <div style={{ color: '#ffffff', marginTop: '2px' }}>
                  {selectedItem?.emergency_contact_name || 'Guardian'} ({selectedItem?.emergency_contact_phone || 'N/A'})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setModalMode(null)}
                className="mono-btn mono-btn-primary"
                style={{ padding: '8px 18px' }}
              >
                [ CLOSE PROFILE ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE CONFIRMATION */}
      {modalMode === 'delete-confirm' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', marginBottom: '14px' }}>
              <AlertCircle size={22} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {selectedItem?._deleteType === 'assignment' ? 'Remove Bus Allocation?' : 'De-enroll Student Record?'}
              </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              {selectedItem?._deleteType === 'assignment'
                ? `Are you sure you want to revoke the bus seat allocation for ${selectedItem?.first_name} ${selectedItem?.last_name}?`
                : `Are you sure you want to remove ${selectedItem?.first_name} ${selectedItem?.last_name} (${selectedItem?.roll_number}) from the active transit directory?`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setModalMode(null)}
                className="mono-btn"
                style={{ padding: '8px 16px' }}
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmitDelete}
                disabled={submitting}
                className="mono-btn mono-btn-primary"
                style={{ padding: '8px 16px' }}
              >
                {submitting ? 'REMOVING...' : '[ CONFIRM REMOVAL ]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
