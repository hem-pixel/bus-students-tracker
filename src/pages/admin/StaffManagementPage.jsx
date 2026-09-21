// FILE: src/pages/admin/StaffManagementPage.jsx
// PURPOSE: Institutional Staff & Driver Management Console for V.S.B. Engineering College.
// Covers Staff Directory, Daily Duty Rosters, Leave Requests & Coverages, Driver Performance & Scorecards.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import {
  Users,
  Bus,
  Calendar,
  Clock,
  FileText,
  Award,
  AlertTriangle,
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
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Shield,
  Filter,
  DollarSign,
  Star,
  ChevronRight,
  Briefcase
} from 'lucide-react';

const TABS = [
  { id: 'directory', label: 'Staff Directory', icon: Users, singular: 'Staff Member' },
  { id: 'roster', label: 'Duty Rosters', icon: Calendar, singular: 'Duty Shift' },
  { id: 'leaves', label: 'Leave Requests', icon: Clock, singular: 'Leave Request' },
  { id: 'performance', label: 'Performance & Scorecard', icon: Award, singular: 'Performance Log' }
];

const STAFF_TYPES = [
  { value: 'ALL', label: 'All Staff Types' },
  { value: 'DRIVER', label: 'Drivers' },
  { value: 'BUS_IN_CHARGE', label: 'Bus In-Charges' },
  { value: 'TRANSPORT_STAFF', label: 'Transport Staff' },
  { value: 'ADMIN', label: 'Fleet Administrators' }
];

const EMPLOYMENT_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active Duty' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' }
];

const DEPARTMENTS = [
  'Transport',
  'Administration',
  'Operations',
  'AI & DS',
  'CSE',
  'ECE',
  'EEE',
  'MECH',
  'CIVIL'
];

export default function StaffManagementPage({ onNavigate }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTransportStaff = user?.role === 'TRANSPORT_STAFF';
  const canManage = isAdmin || isTransportStaff;

  const [activeTab, setActiveTab] = useState('directory');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [shiftDateFilter, setShiftDateFilter] = useState('');

  // Primary Collections
  const [staffList, setStaffList] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [performanceLogs, setPerformanceLogs] = useState([]);
  const [staffStats, setStaffStats] = useState(null);

  // Reference Data
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [students, setStudents] = useState([]);

  // Modals state
  const [modalMode, setModalMode] = useState(null);
  // 'staff-form' | 'shift-form' | 'shift-update' | 'leave-form' | 'leave-review' | 'perf-form' | 'salary-modal' | 'view-staff' | 'delete-confirm'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [salaryData, setSalaryData] = useState(null);

  // Load all primary and reference data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        staffRes,
        statsRes,
        shiftsRes,
        leavesRes,
        perfRes,
        busesRes,
        routesRes,
        studentsRes
      ] = await Promise.all([
        apiService.staff.getAll().catch(err => ({ success: false, message: err.message })),
        apiService.staff.getStats().catch(err => ({ success: false, message: err.message })),
        apiService.shifts.getAll().catch(err => ({ success: false, message: err.message })),
        apiService.leaves.getAll().catch(err => ({ success: false, message: err.message })),
        apiService.performance.getAll().catch(err => ({ success: false, message: err.message })),
        apiService.buses.getAll().catch(() => ({ data: [] })),
        apiService.routes.getAll().catch(() => ({ data: [] })),
        apiService.students.getAll().catch(() => ({ data: [] }))
      ]);

      if (staffRes?.success) setStaffList(staffRes.data || []);
      if (statsRes?.success) setStaffStats(statsRes.data || null);
      if (shiftsRes?.success) setShifts(shiftsRes.data || []);
      if (leavesRes?.success) setLeaves(leavesRes.data || []);
      if (perfRes?.success) setPerformanceLogs(perfRes.data || []);

      setBuses(busesRes?.data || []);
      setRoutes(routesRes?.data || []);
      setStudents(studentsRes?.data || []);
    } catch (err) {
      console.error('Failed to load staff management records:', err);
      setError(err.message || 'Error communicating with college database cluster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const triggerNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // Filtered Collections
  // -------------------------------------------------------------
  const filteredStaff = useMemo(() => {
    return staffList.filter(item => {
      const matchesSearch =
        !searchTerm ||
        item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.license_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'ALL' || item.staff_type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || item.employment_status === statusFilter;
      const matchesDept = departmentFilter === 'ALL' || item.department === departmentFilter;

      return matchesSearch && matchesType && matchesStatus && matchesDept;
    });
  }, [staffList, searchTerm, typeFilter, statusFilter, departmentFilter]);

  const filteredShifts = useMemo(() => {
    return shifts.filter(item => {
      const matchesDate = !shiftDateFilter || item.shift_date === shiftDateFilter;
      const matchesSearch =
        !searchTerm ||
        item.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bus_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.route_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.route_name?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDate && matchesSearch;
    });
  }, [shifts, shiftDateFilter, searchTerm]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(item => {
      const matchesSearch =
        !searchTerm ||
        item.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || item.request_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, statusFilter]);

  const filteredPerformance = useMemo(() => {
    return performanceLogs.filter(item => {
      const matchesSearch =
        !searchTerm ||
        item.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.incident_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.incident_description?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [performanceLogs, searchTerm]);

  // -------------------------------------------------------------
  // KPI Metrics Calculation
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const totalStaff = staffList.length;
    const activeDrivers = staffList.filter(s => s.staff_type === 'DRIVER' && s.employment_status === 'ACTIVE').length;
    const onLeave = staffList.filter(s => s.employment_status === 'ON_LEAVE').length;
    const pendingLeaves = leaves.filter(l => l.request_status === 'PENDING').length;
    const totalShiftsToday = shifts.length;

    return {
      totalStaff,
      activeDrivers,
      onLeave,
      pendingLeaves,
      totalShiftsToday
    };
  }, [staffList, leaves, shifts]);

  // -------------------------------------------------------------
  // Staff CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenStaffCreate = () => {
    setFormData({
      staff_type: 'DRIVER',
      employee_id: `STF-${String(staffList.length + 1).padStart(3, '0')}`,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: 'Transport',
      designation: 'Heavy Vehicle Operator',
      employment_status: 'ACTIVE',
      hire_date: new Date().toISOString().split('T')[0],
      license_number: '',
      license_expiry: '',
      license_category: 'HMV',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      assigned_bus_id: ''
    });
    setSelectedItem(null);
    setModalMode('staff-form');
  };

  const handleOpenStaffEdit = (staff) => {
    setSelectedItem(staff);
    setFormData({
      staff_type: staff.staff_type || 'DRIVER',
      employee_id: staff.employee_id || '',
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      department: staff.department || 'Transport',
      designation: staff.designation || '',
      employment_status: staff.employment_status || 'ACTIVE',
      hire_date: staff.hire_date ? String(staff.hire_date).split('T')[0] : '',
      license_number: staff.license_number || '',
      license_expiry: staff.license_expiry ? String(staff.license_expiry).split('T')[0] : '',
      license_category: staff.license_category || 'HMV',
      emergency_contact_name: staff.emergency_contact_name || '',
      emergency_contact_phone: staff.emergency_contact_phone || '',
      assigned_bus_id: staff.assigned_bus_id || ''
    });
    setModalMode('staff-form');
  };

  const handleSubmitStaffForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      };

      if (!payload.assigned_bus_id) payload.assigned_bus_id = null;

      let res;
      if (selectedItem) {
        res = await apiService.staff.update(selectedItem.staff_id, payload);
      } else {
        res = await apiService.staff.create(payload);
      }

      if (res.success) {
        triggerNotification(selectedItem ? 'Staff profile updated successfully.' : 'New staff member registered.');
        setModalMode(null);
        await loadAllData();
      } else {
        setError(res.message || 'Operation failed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit staff form.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await apiService.staff.delete(selectedItem.staff_id);
      if (res.success) {
        triggerNotification('Staff record deactivated / deleted.');
        setModalMode(null);
        await loadAllData();
      } else {
        setError(res.message || 'Delete operation failed.');
      }
    } catch (err) {
      setError(err.message || 'Error deleting staff record.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Shift Roster Handlers
  // -------------------------------------------------------------
  const handleOpenShiftCreate = () => {
    const activeStaff = staffList.filter(s => s.employment_status === 'ACTIVE');
    setFormData({
      staff_id: activeStaff[0]?.staff_id || '',
      bus_id: buses[0]?.bus_id || '',
      route_id: routes[0]?.route_id || '',
      shift_date: new Date().toISOString().split('T')[0],
      shift_type: 'MORNING',
      scheduled_start_time: '06:00',
      scheduled_end_time: '09:00',
      shift_notes: ''
    });
    setSelectedItem(null);
    setModalMode('shift-form');
  };

  const handleSubmitShiftForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiService.shifts.create(formData);
      if (res.success) {
        triggerNotification('Duty shift assigned to roster.');
        setModalMode(null);
        await loadAllData();
      } else {
        setError(res.message || 'Could not assign shift.');
      }
    } catch (err) {
      setError(err.message || 'Shift assignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenShiftUpdate = (shift) => {
    setSelectedItem(shift);
    setFormData({
      status: shift.status || 'SCHEDULED',
      actual_start_time: shift.actual_start_time ? String(shift.actual_start_time).slice(0, 16) : '',
      actual_end_time: shift.actual_end_time ? String(shift.actual_end_time).slice(0, 16) : '',
      shift_notes: shift.shift_notes || ''
    });
    setModalMode('shift-update');
  };

  const handleSubmitShiftUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData
      };
      if (!payload.actual_start_time) payload.actual_start_time = null;
      if (!payload.actual_end_time) payload.actual_end_time = null;

      const res = await apiService.shifts.update(selectedItem.shift_id, payload);
      if (res.success) {
        triggerNotification('Shift log and status updated.');
        setModalMode(null);
        await loadAllData();
      } else {
        setError(res.message || 'Update failed.');
      }
    } catch (err) {
      setError(err.message || 'Could not update shift log.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Leave Request Handlers
  // -------------------------------------------------------------
  const handleOpenLeaveCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      staff_id: staffList[0]?.staff_id || '',
      leave_type: 'CASUAL',
      leave_start_date: today,
      leave_end_date: today,
      reason: '',
      replacement_staff_id: ''
    });
    setSelectedItem(null);
    setModalMode('leave-form');
  };

  const handleSubmitLeaveCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiService.leaves.create(formData);
      if (res.success) {
        triggerNotification('Leave application registered.');
        setModalMode(null);
        await loadAllData();
      } else {
        setError(res.message || 'Failed to submit leave.');
      }
    } catch (err) {
      setError(err.message || 'Leave submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenLeaveReview = (leave) => {
    setSelectedItem(leave);
    setFormData({
      approval_notes: '',
      replacement_staff_id: leave.replacement_staff_id || ''
    });
    setModalMode('leave-review');
  };

  const handleReviewLeave = async (action) => {
    setSubmitting(true);
    setError(null);
    try {
      let res;
      if (action === 'APPROVE') {
        res = await apiService.leaves.approve(selectedItem.leave_id, {
          approval_notes: formData.approval_notes,
          replacement_staff_id: formData.replacement_staff_id || null
        });
      } else {
        res = await apiService.leaves.reject(selectedItem.leave_id, {
          approval_notes: formData.approval_notes
        });
      }

      if (res.success) {
        triggerNotification(`Leave request ${action === 'APPROVE' ? 'approved' : 'rejected'}.`);
        setModalMode(null);
        await loadAllData();
      } else {
        setError(res.message || `Failed to ${action.toLowerCase()} leave request.`);
      }
    } catch (err) {
      setError(err.message || 'Error processing leave review.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Performance Log Handlers
  // -------------------------------------------------------------
  const handleOpenPerfCreate = (presetStaffId = '') => {
    setFormData({
      staff_id: presetStaffId || staffList[0]?.staff_id || '',
      log_type: 'FEEDBACK',
      incident_type: '',
      incident_description: '',
      severity: 'LOW',
      safety_score: '5.0',
      punctuality_score: '5.0',
      student_interaction_score: '5.0',
      professionalism_score: '5.0',
      commendation_reason: '',
      complaint_from_student_id: '',
      complaint_description: '',
      action_taken: '',
      follow_up_required: false
    });
    setSelectedItem(null);
    setModalMode('perf-form');
  };

  const handleSubmitPerformanceLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...formData };
      if (!payload.complaint_from_student_id) payload.complaint_from_student_id = null;

      const res = await apiService.performance.log(payload);
      if (res.success) {
        triggerNotification('Performance record & scorecard logged.');
        setModalMode(null);
        await loadAllData();
      } else {
        setError(res.message || 'Failed to log performance.');
      }
    } catch (err) {
      setError(err.message || 'Performance logging error.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Salary Structure Handlers
  // -------------------------------------------------------------
  const handleOpenSalaryModal = async (staff) => {
    setSelectedItem(staff);
    setLoading(true);
    try {
      const res = await apiService.salary.getStaffSalary(staff.staff_id);
      if (res.success && res.data) {
        setSalaryData(res.data);
        setFormData({
          base_salary: res.data.base_salary || '25000',
          dearness_allowance: res.data.dearness_allowance || '3000',
          house_rent_allowance: res.data.house_rent_allowance || '2500',
          conveyance_allowance: res.data.conveyance_allowance || '1500',
          medical_allowance: res.data.medical_allowance || '1000',
          performance_bonus: res.data.performance_bonus || '2000',
          provident_fund: res.data.provident_fund || '2400',
          income_tax: res.data.income_tax || '1500',
          salary_status: res.data.salary_status || 'ACTIVE'
        });
      } else {
        setSalaryData(null);
        setFormData({
          base_salary: '25000',
          dearness_allowance: '3000',
          house_rent_allowance: '2500',
          conveyance_allowance: '1500',
          medical_allowance: '1000',
          performance_bonus: '1500',
          provident_fund: '2400',
          income_tax: '1200',
          salary_status: 'ACTIVE'
        });
      }
      setModalMode('salary-modal');
    } catch (err) {
      setError(err.message || 'Failed to retrieve salary breakdown.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSalary = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiService.salary.updateStaffSalary(selectedItem.staff_id, formData);
      if (res.success) {
        triggerNotification('Staff salary structure updated.');
        setModalMode(null);
      } else {
        setError(res.message || 'Salary update failed.');
      }
    } catch (err) {
      setError(err.message || 'Could not update salary structure.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // CSV Export Utility
  // -------------------------------------------------------------
  const exportToCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (type === 'directory') {
      filename = `vsb_staff_directory_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Employee ID', 'Name', 'Type', 'Department', 'Phone', 'Email', 'Status', 'License Number', 'Assigned Bus'];
      rows = filteredStaff.map(s => [
        `"${s.employee_id || ''}"`,
        `"${s.first_name || ''} ${s.last_name || ''}"`,
        `"${s.staff_type || ''}"`,
        `"${s.department || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.email || ''}"`,
        `"${s.employment_status || ''}"`,
        `"${s.license_number || 'N/A'}"`,
        `"${s.bus_number || 'Unassigned'}"`
      ]);
    } else if (type === 'roster') {
      filename = `vsb_duty_roster_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Date', 'Shift Type', 'Staff Member', 'Employee ID', 'Bus Number', 'Route', 'Start Time', 'End Time', 'Status'];
      rows = filteredShifts.map(sh => [
        `"${sh.shift_date || ''}"`,
        `"${sh.shift_type || ''}"`,
        `"${sh.staff_name || ''}"`,
        `"${sh.employee_id || ''}"`,
        `"${sh.bus_number || ''}"`,
        `"${sh.route_code || ''} - ${sh.route_name || ''}"`,
        `"${sh.scheduled_start_time || ''}"`,
        `"${sh.scheduled_end_time || ''}"`,
        `"${sh.status || ''}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate && onNavigate(user?.role?.toLowerCase().replace(/_/g, '-') || 'admin')}
            className="mono-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-default)'
            }}
            id="btn-back-landing"
          >
            <ArrowLeft size={14} />
            <span>COMMAND CENTER</span>
          </button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-pure)' }}>
            STAFF & DRIVER MANAGEMENT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadAllData}
            className="mono-btn"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh database records"
            id="btn-refresh-staff-data"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>SYNC DATA</span>
          </button>

          <button
            onClick={() => exportToCSV(activeTab === 'roster' ? 'roster' : 'directory')}
            className="mono-btn"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Export view to CSV"
            id="btn-export-csv"
          >
            <Download size={13} />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Banner / Identity Lockup */}
      <div
        style={{
          background: 'var(--bg-void)',
          border: '1px solid var(--border-strong)',
          borderRadius: '4px',
          padding: '24px',
          marginBottom: '24px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="mono-pill" style={{ background: '#000000', color: '#ffffff', borderColor: '#ffffff' }}>
                PERSONNEL & ROSTER REPOSITORY
              </span>
              <span className="mono-pill" style={{ background: 'var(--bg-surface)' }}>
                V.S.B. ENGINEERING COLLEGE
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0', letterSpacing: '-0.02em', color: 'var(--text-pure)' }}>
              STAFF & DRIVER MANAGEMENT CONSOLE
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
              Centralized authority for bus driver licensing, bus in-charge personnel, daily duty rosters, leave coverage workflows, driver safety metrics, and compensation structures.
            </p>
          </div>

          {canManage && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleOpenStaffCreate}
                className="mono-btn mono-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.82rem', fontWeight: 700 }}
                id="btn-register-staff"
              >
                <Plus size={16} />
                <span>REGISTER STAFF</span>
              </button>

              <button
                onClick={handleOpenShiftCreate}
                className="mono-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.82rem', fontWeight: 700, border: '1px solid var(--border-strong)' }}
                id="btn-schedule-shift"
              >
                <Calendar size={15} />
                <span>SCHEDULE SHIFT</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '18px 20px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            <span>TOTAL PERSONNEL</span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {kpis.totalStaff}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across all transport and administration roles
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '18px 20px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            <span>ACTIVE DRIVERS</span>
            <Bus size={16} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {kpis.activeDrivers}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Licensed heavy vehicle operators on active status
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '18px 20px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            <span>SCHEDULED SHIFTS</span>
            <Calendar size={16} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {kpis.totalShiftsToday}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Total duty rosters assigned on fleet schedule
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '18px 20px', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            <span>PENDING LEAVES</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>
            {kpis.pendingLeaves}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {kpis.pendingLeaves > 0 ? 'Awaiting administrative clearance' : 'All leave applications processed'}
          </div>
        </div>
      </div>

      {/* Notifications and Alerts */}
      {successMessage && (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid #ffffff',
            padding: '12px 18px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            color: '#ffffff',
            fontSize: '0.85rem'
          }}
        >
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'var(--bg-void)',
            border: '1px solid #666666',
            padding: '12px 18px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '20px',
            color: '#ffffff',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '24px',
          gap: '8px',
          overflowX: 'auto'
        }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              id={`tab-btn-${tab.id}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'leaves' && kpis.pendingLeaves > 0 && (
                <span style={{ background: '#ffffff', color: '#000000', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '10px' }}>
                  {kpis.pendingLeaves}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Control Bar: Search & Filter */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          padding: '16px',
          borderRadius: '4px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flex: '1 1 300px', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={`Search ${TABS.find(t => t.id === activeTab)?.singular.toLowerCase()}s by name, ID, or keywords...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mono-input"
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem' }}
            id="input-table-search"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {activeTab === 'directory' && (
            <>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mono-input"
                style={{ fontSize: '0.82rem', padding: '6px 12px', minWidth: '150px' }}
                id="select-staff-type-filter"
              >
                {STAFF_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mono-input"
                style={{ fontSize: '0.82rem', padding: '6px 12px', minWidth: '140px' }}
                id="select-staff-status-filter"
              >
                {EMPLOYMENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </>
          )}

          {activeTab === 'roster' && (
            <input
              type="date"
              value={shiftDateFilter}
              onChange={(e) => setShiftDateFilter(e.target.value)}
              className="mono-input"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              title="Filter by shift date"
              id="input-shift-date-filter"
            />
          )}

          {activeTab === 'leaves' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mono-input"
              style={{ fontSize: '0.82rem', padding: '6px 12px', minWidth: '140px' }}
              id="select-leave-status-filter"
            >
              <option value="ALL">All Requests</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          )}

          {activeTab === 'performance' && canManage && (
            <button
              onClick={() => handleOpenPerfCreate()}
              className="mono-btn mono-btn-primary"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
              id="btn-log-performance"
            >
              <Plus size={14} />
              <span>LOG INCIDENT / FEEDBACK</span>
            </button>
          )}

          {activeTab === 'leaves' && (
            <button
              onClick={handleOpenLeaveCreate}
              className="mono-btn mono-btn-primary"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
              id="btn-submit-leave"
            >
              <Plus size={14} />
              <span>APPLY LEAVE</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STAFF DIRECTORY */}
      {/* ========================================================= */}
      {activeTab === 'directory' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-void)', borderBottom: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>EMPLOYEE ID</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>NAME & CONTACT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>ROLE / DESIGNATION</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>DEPARTMENT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>ASSIGNED VEHICLE</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>RATINGS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No personnel records match the specified filters.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff, idx) => (
                    <tr
                      key={staff.staff_id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-pure)' }}>
                        {staff.employee_id}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>
                          {staff.first_name} {staff.last_name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Mail size={12} /> {staff.email}
                        </div>
                        {staff.phone && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} /> {staff.phone}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className="mono-pill" style={{ background: staff.staff_type === 'DRIVER' ? 'var(--bg-void)' : 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)' }}>
                          {staff.staff_type}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {staff.designation || 'Staff'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {staff.department || 'Transport'}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {staff.bus_number ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Bus size={14} /> {staff.bus_number}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {staff.bus_plate}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          className="mono-pill"
                          style={{
                            background: staff.employment_status === 'ACTIVE' ? '#ffffff' : 'transparent',
                            color: staff.employment_status === 'ACTIVE' ? '#000000' : 'var(--text-secondary)',
                            borderColor: staff.employment_status === 'ACTIVE' ? '#ffffff' : 'var(--border-strong)',
                            fontWeight: 700
                          }}
                        >
                          {staff.employment_status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {staff.staff_type === 'DRIVER' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Star size={14} color="#ffffff" fill="#ffffff" />
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                              {parseFloat(staff.safety_rating || 5.0).toFixed(1)}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                              ({staff.total_incidents || 0} inc)
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setSelectedItem(staff);
                              setModalMode('view-staff');
                            }}
                            className="mono-btn"
                            style={{ padding: '6px 8px' }}
                            title="View Staff Profile"
                          >
                            <Eye size={14} />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenSalaryModal(staff)}
                                className="mono-btn"
                                style={{ padding: '6px 8px' }}
                                title="Compensation & Salary Breakdown"
                              >
                                <DollarSign size={14} />
                              </button>

                              <button
                                onClick={() => handleOpenStaffEdit(staff)}
                                className="mono-btn"
                                style={{ padding: '6px 8px' }}
                                title="Edit Record"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedItem(staff);
                                  setModalMode('delete-confirm');
                                }}
                                className="mono-btn"
                                style={{ padding: '6px 8px', color: '#ff6666' }}
                                title="Deactivate / Delete"
                              >
                                <Trash2 size={14} />
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DUTY ROSTERS & SHIFTS */}
      {/* ========================================================= */}
      {activeTab === 'roster' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-void)', borderBottom: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>DATE & SHIFT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>STAFF / OPERATOR</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>ASSIGNED VEHICLE</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>ROUTE ASSIGNMENT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>SCHEDULED WINDOW</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>ACTUAL TIMINGS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No shifts assigned on this date or matching query.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift, idx) => (
                    <tr
                      key={shift.shift_id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          {shift.shift_date}
                        </div>
                        <span className="mono-pill" style={{ fontSize: '0.68rem', marginTop: '4px' }}>
                          {shift.shift_type}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>
                          {shift.staff_name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                          {shift.employee_id}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>
                          {shift.bus_number}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {shift.bus_plate}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>
                          {shift.route_code}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {shift.route_name}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {shift.scheduled_start_time || '--:--'} — {shift.scheduled_end_time || '--:--'}
                      </td>

                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {shift.actual_start_time ? (
                          <div>
                            <div>IN: {new Date(shift.actual_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            {shift.actual_end_time && <div>OUT: {new Date(shift.actual_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                          </div>
                        ) : (
                          <span>Pending Log</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          className="mono-pill"
                          style={{
                            background: shift.status === 'COMPLETED' ? '#ffffff' : 'transparent',
                            color: shift.status === 'COMPLETED' ? '#000000' : '#ffffff',
                            borderColor: shift.status === 'COMPLETED' ? '#ffffff' : 'var(--border-strong)',
                            fontWeight: 700
                          }}
                        >
                          {shift.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {canManage && (
                          <button
                            onClick={() => handleOpenShiftUpdate(shift)}
                            className="mono-btn"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            title="Log Actual Timings & Update Shift"
                            id={`btn-update-shift-${shift.shift_id}`}
                          >
                            LOG TIMES
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
      )}

      {/* ========================================================= */}
      {/* TAB 3: LEAVE REQUESTS */}
      {/* ========================================================= */}
      {activeTab === 'leaves' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-void)', borderBottom: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>APPLICANT</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>DATES & DURATION</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>REASON</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>REPLACEMENT COVERAGE</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No leave requests in this category.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave, idx) => (
                    <tr
                      key={leave.leave_id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>
                          {leave.staff_name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                          {leave.employee_id} • {leave.staff_type}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className="mono-pill" style={{ background: 'var(--bg-void)' }}>
                          {leave.leave_type}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>
                        <div>{leave.leave_start_date} → {leave.leave_end_date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {leave.total_days} Day(s)
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', maxWidth: '280px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {leave.reason}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {leave.replacement_staff_name ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserCheck size={14} /> {leave.replacement_staff_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Assigned Cover
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          className="mono-pill"
                          style={{
                            background: leave.request_status === 'APPROVED' ? '#ffffff' : 'transparent',
                            color: leave.request_status === 'APPROVED' ? '#000000' : '#ffffff',
                            borderColor: leave.request_status === 'APPROVED' ? '#ffffff' : 'var(--border-strong)',
                            fontWeight: 700
                          }}
                        >
                          {leave.request_status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {canManage && leave.request_status === 'PENDING' ? (
                          <button
                            onClick={() => handleOpenLeaveReview(leave)}
                            className="mono-btn mono-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            id={`btn-review-leave-${leave.leave_id}`}
                          >
                            REVIEW & APPROVE
                          </button>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {leave.approved_at ? `Processed on ${new Date(leave.approved_at).toLocaleDateString()}` : '--'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PERFORMANCE & SCORECARD */}
      {/* ========================================================= */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Driver Leaderboard & KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {staffList
              .filter(s => s.staff_type === 'DRIVER')
              .slice(0, 3)
              .map((drv, idx) => (
                <div
                  key={drv.staff_id || idx}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    padding: '20px',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                        {drv.first_name} {drv.last_name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                        {drv.employee_id} • Bus {drv.bus_number || 'Unassigned'}
                      </div>
                    </div>
                    <span className="mono-pill" style={{ background: '#000000', color: '#ffffff', borderColor: '#ffffff', fontWeight: 800 }}>
                      SAFETY: {parseFloat(drv.safety_rating || 5.0).toFixed(1)} / 5.0
                    </span>
                  </div>

                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-void)', padding: '10px 8px', borderRadius: '2px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PUNCTUALITY</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {parseFloat(drv.punctuality_rating || 5.0).toFixed(1)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-void)', padding: '10px 8px', borderRadius: '2px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>SATISFACTION</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {parseFloat(drv.student_satisfaction || 5.0).toFixed(1)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-void)', padding: '10px 8px', borderRadius: '2px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>INCIDENTS</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {drv.total_incidents || 0}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleOpenPerfCreate(drv.staff_id)}
                      className="mono-btn"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      LOG FEEDBACK / INCIDENT
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Incident and Feedback Log Stream */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
              INCIDENT, COMPLAINT & FEEDBACK AUDIT LOG
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-void)', borderBottom: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>LOG DATE</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>STAFF MEMBER</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>TYPE</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>DETAILS / SUMMARY</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>SEVERITY</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>ACTION TAKEN</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>SCORES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No recorded incidents or feedback entries. Fleet operations running smoothly.
                      </td>
                    </tr>
                  ) : (
                    filteredPerformance.map((log, idx) => (
                      <tr
                        key={log.log_id || idx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)'
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-pure)' }}>
                          {log.log_date}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>
                            {log.staff_name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            {log.employee_id}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span className="mono-pill" style={{ background: 'var(--bg-void)' }}>
                            {log.log_type}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', maxWidth: '320px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {log.incident_description || log.commendation_reason || log.complaint_description || 'General observation recorded.'}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            className="mono-pill"
                            style={{
                              background: log.severity === 'HIGH' || log.severity === 'CRITICAL' ? '#000000' : 'transparent',
                              borderColor: log.severity === 'HIGH' || log.severity === 'CRITICAL' ? '#ffffff' : 'var(--border-strong)',
                              color: '#ffffff',
                              fontWeight: 700
                            }}
                          >
                            {log.severity || 'LOW'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                          {log.action_taken || 'Logged to file'}
                        </td>

                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {log.safety_score ? `S:${log.safety_score} P:${log.punctuality_score}` : '--'}
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

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT STAFF MEMBER */}
      {/* ========================================================= */}
      {modalMode === 'staff-form' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                {selectedItem ? 'EDIT PERSONNEL DOSSIER' : 'REGISTER NEW STAFF MEMBER'}
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitStaffForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    STAFF CLASSIFICATION *
                  </label>
                  <select
                    value={formData.staff_type}
                    onChange={(e) => setFormData({ ...formData, staff_type: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="DRIVER">Driver</option>
                    <option value="BUS_IN_CHARGE">Bus In-Charge</option>
                    <option value="TRANSPORT_STAFF">Transport Staff</option>
                    <option value="ADMIN">Fleet Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    EMPLOYEE ID *
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                    disabled={!!selectedItem}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    FIRST NAME *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    LAST NAME *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    INSTITUTIONAL EMAIL * (@vsb.ac.in)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    DEPARTMENT
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    DESIGNATION
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {formData.staff_type === 'DRIVER' && (
                <div style={{ background: 'var(--bg-void)', padding: '14px', border: '1px solid var(--border-default)', borderRadius: '4px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#ffffff', marginBottom: '10px' }}>
                    DRIVER LICENSING MANDATE
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>LICENSE NUMBER *</label>
                      <input
                        type="text"
                        value={formData.license_number}
                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                        className="mono-input"
                        style={{ width: '100%' }}
                        required={formData.staff_type === 'DRIVER'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>EXPIRY DATE *</label>
                      <input
                        type="date"
                        value={formData.license_expiry}
                        onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                        className="mono-input"
                        style={{ width: '100%' }}
                        required={formData.staff_type === 'DRIVER'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>CATEGORY</label>
                      <input
                        type="text"
                        value={formData.license_category}
                        onChange={(e) => setFormData({ ...formData, license_category: e.target.value })}
                        className="mono-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    PERMANENT VEHICLE ALLOCATION
                  </label>
                  <select
                    value={formData.assigned_bus_id}
                    onChange={(e) => setFormData({ ...formData, assigned_bus_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">-- No Bus Allocated --</option>
                    {buses.map(b => (
                      <option key={b.bus_id} value={b.bus_id}>
                        {b.bus_number} ({b.registration_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    EMPLOYMENT STATUS
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '8px 16px' }}>
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                  {submitting ? 'SAVING...' : selectedItem ? 'UPDATE DOSSIER' : 'REGISTER PERSONNEL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SCHEDULE SHIFT ASSIGNMENT */}
      {/* ========================================================= */}
      {modalMode === 'shift-form' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                ASSIGN DUTY SHIFT ROSTER
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitShiftForm}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  DUTY OPERATOR / DRIVER *
                </label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%' }}
                  required
                >
                  {staffList
                    .filter(s => s.employment_status === 'ACTIVE')
                    .map(s => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.first_name} {s.last_name} ({s.employee_id} • {s.staff_type})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    BUS ALLOCATION *
                  </label>
                  <select
                    value={formData.bus_id}
                    onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  >
                    {buses.map(b => (
                      <option key={b.bus_id} value={b.bus_id}>
                        {b.bus_number} ({b.registration_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    ROUTE TRANSIT *
                  </label>
                  <select
                    value={formData.route_id}
                    onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  >
                    {routes.map(r => (
                      <option key={r.route_id} value={r.route_id}>
                        {r.route_code} — {r.route_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    DUTY DATE *
                  </label>
                  <input
                    type="date"
                    value={formData.shift_date}
                    onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    SHIFT INTERVAL *
                  </label>
                  <select
                    value={formData.shift_type}
                    onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="MORNING">Morning Transit</option>
                    <option value="EVENING">Evening Transit</option>
                    <option value="FULL_DAY">Full Day Duty</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    SCHEDULED START
                  </label>
                  <input
                    type="time"
                    value={formData.scheduled_start_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_start_time: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    SCHEDULED END
                  </label>
                  <input
                    type="time"
                    value={formData.scheduled_end_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_end_time: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '8px 16px' }}>
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                  {submitting ? 'RECORDING...' : 'ENROLL DUTY SHIFT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LOG SHIFT TIMES & UPDATE STATUS */}
      {/* ========================================================= */}
      {modalMode === 'shift-update' && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                RECORD ACTUAL SHIFT TIMINGS
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-void)', padding: '12px', border: '1px solid var(--border-default)', borderRadius: '4px', marginBottom: '16px', fontSize: '0.82rem' }}>
              <div><strong style={{ color: '#ffffff' }}>Operator:</strong> {selectedItem.staff_name}</div>
              <div><strong style={{ color: '#ffffff' }}>Vehicle:</strong> {selectedItem.bus_number} • {selectedItem.route_code}</div>
              <div><strong style={{ color: '#ffffff' }}>Scheduled:</strong> {selectedItem.scheduled_start_time} - {selectedItem.scheduled_end_time}</div>
            </div>

            <form onSubmit={handleSubmitShiftUpdate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  ACTUAL START TIMESTAMP
                </label>
                <input
                  type="datetime-local"
                  value={formData.actual_start_time}
                  onChange={(e) => setFormData({ ...formData, actual_start_time: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  ACTUAL END TIMESTAMP
                </label>
                <input
                  type="datetime-local"
                  value={formData.actual_end_time}
                  onChange={(e) => setFormData({ ...formData, actual_end_time: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  DUTY STATUS
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%' }}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  LOG / INCIDENT NOTES
                </label>
                <textarea
                  value={formData.shift_notes}
                  onChange={(e) => setFormData({ ...formData, shift_notes: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%', minHeight: '60px' }}
                  placeholder="Transit remarks, student boarding headcount, route detours..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '8px 16px' }}>
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                  {submitting ? 'LOGGING...' : 'SAVE TIMINGS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: APPLY FOR LEAVE */}
      {/* ========================================================= */}
      {modalMode === 'leave-form' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                SUBMIT LEAVE APPLICATION
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitLeaveCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  APPLICANT *
                </label>
                <select
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%' }}
                  required
                >
                  {staffList.map(s => (
                    <option key={s.staff_id} value={s.staff_id}>
                      {s.first_name} {s.last_name} ({s.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  LEAVE CATEGORY *
                </label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%' }}
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="PERSONAL">Personal Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    START DATE *
                  </label>
                  <input
                    type="date"
                    value={formData.leave_start_date}
                    onChange={(e) => setFormData({ ...formData, leave_start_date: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    END DATE *
                  </label>
                  <input
                    type="date"
                    value={formData.leave_end_date}
                    onChange={(e) => setFormData({ ...formData, leave_end_date: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  REASON & JUSTIFICATION *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%', minHeight: '80px' }}
                  placeholder="State the reason for absence and emergency contact instructions..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '8px 16px' }}>
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                  {submitting ? 'SUBMITTING...' : 'TRANSMIT LEAVE APPLICATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVIEW & APPROVE LEAVE */}
      {/* ========================================================= */}
      {modalMode === 'leave-review' && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                REVIEW LEAVE APPLICATION
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-void)', padding: '14px', border: '1px solid var(--border-default)', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Applicant:</strong> {selectedItem.staff_name} ({selectedItem.employee_id})</div>
              <div style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Leave Period:</strong> {selectedItem.leave_start_date} to {selectedItem.leave_end_date} ({selectedItem.total_days} Days)</div>
              <div style={{ marginBottom: '4px' }}><strong style={{ color: '#ffffff' }}>Category:</strong> {selectedItem.leave_type}</div>
              <div style={{ marginTop: '8px', color: 'var(--text-secondary)', lineHeight: 1.4 }}><strong style={{ color: '#ffffff' }}>Reason:</strong> {selectedItem.reason}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                REPLACEMENT OPERATOR / RELIEF STAFF
              </label>
              <select
                value={formData.replacement_staff_id}
                onChange={(e) => setFormData({ ...formData, replacement_staff_id: e.target.value })}
                className="mono-input"
                style={{ width: '100%' }}
              >
                <option value="">-- No Replacement Necessary --</option>
                {staffList
                  .filter(s => s.staff_id !== selectedItem.staff_id && s.employment_status === 'ACTIVE')
                  .map(s => (
                    <option key={s.staff_id} value={s.staff_id}>
                      {s.first_name} {s.last_name} ({s.employee_id} • {s.staff_type})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                ADMINISTRATIVE REVIEW NOTES
              </label>
              <textarea
                value={formData.approval_notes}
                onChange={(e) => setFormData({ ...formData, approval_notes: e.target.value })}
                className="mono-input"
                style={{ width: '100%', minHeight: '60px' }}
                placeholder="Remarks regarding driver substitution or duty coverage..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => handleReviewLeave('REJECT')}
                disabled={submitting}
                className="mono-btn"
                style={{ color: '#ff6666', borderColor: '#ff6666' }}
              >
                REJECT LEAVE
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setModalMode(null)} className="mono-btn">
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewLeave('APPROVE')}
                  disabled={submitting}
                  className="mono-btn mono-btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  APPROVE LEAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LOG PERFORMANCE / INCIDENT */}
      {/* ========================================================= */}
      {modalMode === 'perf-form' && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                RECORD PERFORMANCE & SAFETY OBSERVATION
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitPerformanceLog}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    OPERATOR / STAFF MEMBER *
                  </label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                    required
                  >
                    {staffList.map(s => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.first_name} {s.last_name} ({s.employee_id} • {s.staff_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    ENTRY TYPE *
                  </label>
                  <select
                    value={formData.log_type}
                    onChange={(e) => setFormData({ ...formData, log_type: e.target.value })}
                    className="mono-input"
                    style={{ width: '100%' }}
                  >
                    <option value="FEEDBACK">Routine Performance Feedback</option>
                    <option value="INCIDENT">Safety Incident</option>
                    <option value="COMPLAINT">Student / Parent Complaint</option>
                    <option value="COMMENDATION">Commendation / Honor</option>
                  </select>
                </div>
              </div>

              {formData.log_type === 'INCIDENT' && (
                <div style={{ background: 'var(--bg-void)', padding: '12px', border: '1px solid var(--border-default)', borderRadius: '4px', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>INCIDENT CATEGORY</label>
                      <input
                        type="text"
                        value={formData.incident_type}
                        onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                        className="mono-input"
                        placeholder="e.g. SPEEDING, SIGNAL_VIOLATION"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>SEVERITY TIER</label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                        className="mono-input"
                        style={{ width: '100%' }}
                      >
                        <option value="LOW">Low (Procedural)</option>
                        <option value="MEDIUM">Medium (Traffic Infraction)</option>
                        <option value="HIGH">High (Safety Compromise)</option>
                        <option value="CRITICAL">Critical (Collision Risk)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  OBSERVATION SUMMARY *
                </label>
                <textarea
                  value={formData.incident_description}
                  onChange={(e) => setFormData({ ...formData, incident_description: e.target.value })}
                  className="mono-input"
                  style={{ width: '100%', minHeight: '60px' }}
                  placeholder="Detailed description of the observed conduct or event..."
                  required
                />
              </div>

              <div style={{ background: 'var(--bg-void)', padding: '12px', border: '1px solid var(--border-default)', borderRadius: '4px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  SCORECARD ADJUSTMENT (0.0 to 5.0)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>SAFETY SCORE</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.safety_score}
                      onChange={(e) => setFormData({ ...formData, safety_score: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>PUNCTUALITY SCORE</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.punctuality_score}
                      onChange={(e) => setFormData({ ...formData, punctuality_score: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  CORRECTIVE ACTION TAKEN
                </label>
                <input
                  type="text"
                  value={formData.action_taken}
                  onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                  className="mono-input"
                  placeholder="Warning issued, retraining scheduled, commendation presented..."
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '8px 16px' }}>
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                  {submitting ? 'RECORDING...' : 'SAVE PERFORMANCE LOG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COMPENSATION & SALARY BREAKDOWN */}
      {/* ========================================================= */}
      {modalMode === 'salary-modal' && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                COMPENSATION BREAKDOWN: {selectedItem.first_name} {selectedItem.last_name}
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitSalary}>
              <div style={{ background: 'var(--bg-void)', padding: '14px', border: '1px solid var(--border-default)', borderRadius: '4px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#ffffff', marginBottom: '10px' }}>
                  EARNINGS & ALLOWANCES (INR)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>BASE SALARY *</label>
                    <input
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>DEARNESS ALLOWANCE</label>
                    <input
                      type="number"
                      value={formData.dearness_allowance}
                      onChange={(e) => setFormData({ ...formData, dearness_allowance: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>HOUSE RENT ALLOWANCE</label>
                    <input
                      type="number"
                      value={formData.house_rent_allowance}
                      onChange={(e) => setFormData({ ...formData, house_rent_allowance: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>CONVEYANCE</label>
                    <input
                      type="number"
                      value={formData.conveyance_allowance}
                      onChange={(e) => setFormData({ ...formData, conveyance_allowance: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>MEDICAL ALLOWANCE</label>
                    <input
                      type="number"
                      value={formData.medical_allowance}
                      onChange={(e) => setFormData({ ...formData, medical_allowance: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>PERFORMANCE BONUS</label>
                    <input
                      type="number"
                      value={formData.performance_bonus}
                      onChange={(e) => setFormData({ ...formData, performance_bonus: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-void)', padding: '14px', border: '1px solid var(--border-default)', borderRadius: '4px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#ffffff', marginBottom: '10px' }}>
                  STATUTORY DEDUCTIONS (INR)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>PROVIDENT FUND (PF)</label>
                    <input
                      type="number"
                      value={formData.provident_fund}
                      onChange={(e) => setFormData({ ...formData, provident_fund: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', marginBottom: '4px' }}>INCOME TAX (TDS)</label>
                    <input
                      type="number"
                      value={formData.income_tax}
                      onChange={(e) => setFormData({ ...formData, income_tax: e.target.value })}
                      className="mono-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '8px 16px' }}>
                  CANCEL
                </button>
                <button type="submit" disabled={submitting} className="mono-btn mono-btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                  {submitting ? 'REVISING...' : 'REVISE COMPENSATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW FULL STAFF DOSSIER */}
      {/* ========================================================= */}
      {modalMode === 'view-staff' && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-default)', paddingBottom: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>
                PERSONNEL DOSSIER: {selectedItem.first_name} {selectedItem.last_name}
              </div>
              <button onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>EMPLOYEE ID</div>
                <div style={{ fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{selectedItem.employee_id}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CLASSIFICATION</div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{selectedItem.staff_type} ({selectedItem.designation || 'Staff'})</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>DEPARTMENT</div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{selectedItem.department || 'Transport'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>EMPLOYMENT STATUS</div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{selectedItem.employment_status}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>CONTACT EMAIL</div>
                <div style={{ color: '#ffffff' }}>{selectedItem.email}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PHONE</div>
                <div style={{ color: '#ffffff' }}>{selectedItem.phone || 'N/A'}</div>
              </div>
              {selectedItem.staff_type === 'DRIVER' && (
                <>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>LICENSE NUMBER</div>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{selectedItem.license_number || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>LICENSE EXPIRY</div>
                    <div style={{ color: '#ffffff' }}>{selectedItem.license_expiry ? String(selectedItem.license_expiry).split('T')[0] : 'N/A'}</div>
                  </div>
                </>
              )}
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ASSIGNED BUS</div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{selectedItem.bus_number || 'None'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SAFETY RATING</div>
                <div style={{ fontWeight: 800, color: '#ffffff' }}>{parseFloat(selectedItem.safety_rating || 5.0).toFixed(2)} / 5.00</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
              <button onClick={() => setModalMode(null)} className="mono-btn mono-btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                CLOSE DOSSIER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {modalMode === 'delete-confirm' && selectedItem && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff6666', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>DEACTIVATE RECORD?</div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to deactivate or remove <strong style={{ color: '#ffffff' }}>{selectedItem.first_name} {selectedItem.last_name}</strong> ({selectedItem.employee_id})? Active shifts linked to this personnel will be unassigned.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setModalMode(null)} className="mono-btn" style={{ padding: '8px 16px' }}>
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={submitting}
                className="mono-btn"
                style={{ background: '#ff4444', color: '#ffffff', borderColor: '#ff4444', fontWeight: 700, padding: '8px 18px' }}
              >
                {submitting ? 'DELETING...' : 'CONFIRM REMOVAL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
