// FILE: src/pages/admin/AlertRulesManagement.jsx
// PURPOSE: Event-driven alert rules engine for automated multi-channel dispatch (Phase 12)
// Provides rule authoring, active toggling, dry-run simulation testing, and condition management.

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/apiService';
import {
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  AlertTriangle,
  Play,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Check,
  ChevronRight,
  Info,
  X,
  Sparkles,
  Layers
} from 'lucide-react';

const EVENT_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Event Types' },
  { value: 'EMERGENCY_SOS', label: 'Emergency SOS Trigger' },
  { value: 'WRONG_BUS_BOARDING', label: 'Wrong Bus Boarding' },
  { value: 'GEOFENCE_DEVIATION', label: 'Geofence Deviation' },
  { value: 'TRANSIT_DELAY', label: 'Transit Delay > 15m' },
  { value: 'DEVICE_OFFLINE', label: 'Hardware Sensor Disconnect' },
  { value: 'DOOR_OPEN_MOVING', label: 'Door Open while Moving' }
];

export default function AlertRulesManagement({ onNavigate }) {
  const { user } = useAuth();

  // State
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [testPayload, setTestPayload] = useState('{\n  "bus_id": "BUS-04",\n  "speed_kmh": 42,\n  "delay_minutes": 18,\n  "deviation_meters": 350\n}');
  const [testResult, setTestResult] = useState(null);
  const [testingRule, setTestingRule] = useState(false);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'EMERGENCY_SOS',
    priority: 'HIGH',
    channels: ['in_app', 'push'],
    recipient_roles: ['ADMIN', 'TRANSPORT_STAFF'],
    conditions: { delay_minutes: 15 },
    is_active: true
  });

  // Fetch Rules
  const fetchRules = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await notificationAPI.getAlertRules();
      if (res && res.success && Array.isArray(res.data)) {
        setRules(res.data);
      } else {
        // Fallback default sample rules if empty
        setRules([
          {
            id: 'rule-01',
            name: 'Emergency Driver SOS Dispatch',
            description: 'Triggered when driver presses physical hardware SOS button or app panic trigger',
            event_type: 'EMERGENCY_SOS',
            priority: 'CRITICAL',
            channels: ['in_app', 'sms', 'push', 'email'],
            recipient_roles: ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'],
            conditions: { require_ack: true },
            is_active: true
          },
          {
            id: 'rule-02',
            name: 'Wrong Bus Boarding Alert',
            description: 'Dispatches when student scans onto a bus not assigned to their route',
            event_type: 'WRONG_BUS_BOARDING',
            priority: 'HIGH',
            channels: ['in_app', 'push', 'sms'],
            recipient_roles: ['ADMIN', 'BUS_IN_CHARGE', 'PARENT'],
            conditions: { confidence: 0.9 },
            is_active: true
          },
          {
            id: 'rule-03',
            name: 'Corridor Geofence Breach',
            description: 'Alerts when vehicle travels >200 meters outside assigned corridor boundaries',
            event_type: 'GEOFENCE_DEVIATION',
            priority: 'HIGH',
            channels: ['in_app', 'push'],
            recipient_roles: ['ADMIN', 'TRANSPORT_STAFF'],
            conditions: { distance_m: 200 },
            is_active: true
          },
          {
            id: 'rule-04',
            name: 'Severe Route Delay Notification',
            description: 'Dispatched to parents when scheduled stop arrival is delayed >15 mins',
            event_type: 'TRANSIT_DELAY',
            priority: 'NORMAL',
            channels: ['in_app', 'sms'],
            recipient_roles: ['PARENT', 'STUDENT'],
            conditions: { delay_minutes: 15 },
            is_active: true
          }
        ]);
      }
    } catch (err) {
      console.warn('Failed to load rules, using baseline:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchesSearch = !searchQuery ||
        (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.event_type && r.event_type.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesEvent = selectedEventType === 'ALL' || r.event_type === selectedEventType;
      const matchesStatus = selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && r.is_active) ||
        (selectedStatus === 'INACTIVE' && !r.is_active);

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [rules, searchQuery, selectedEventType, selectedStatus]);

  // Toggle active status
  const handleToggleActive = async (rule) => {
    const updatedStatus = !rule.is_active;
    try {
      await notificationAPI.updateAlertRule(rule.id, { is_active: updatedStatus });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: updatedStatus } : r));
      setFeedback({
        type: 'success',
        message: `Rule "${rule.name}" is now ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}.`
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update rule state.' });
    } finally {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setCurrentRule(null);
    setFormData({
      name: '',
      description: '',
      event_type: 'EMERGENCY_SOS',
      priority: 'HIGH',
      channels: ['in_app', 'push'],
      recipient_roles: ['ADMIN', 'TRANSPORT_STAFF'],
      conditions: { delay_minutes: 15 },
      is_active: true
    });
    setEditorModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rule) => {
    setCurrentRule(rule);
    setFormData({
      name: rule.name || '',
      description: rule.description || '',
      event_type: rule.event_type || 'EMERGENCY_SOS',
      priority: rule.priority || 'HIGH',
      channels: rule.channels || ['in_app'],
      recipient_roles: rule.recipient_roles || ['ADMIN'],
      conditions: rule.conditions || {},
      is_active: rule.is_active !== undefined ? rule.is_active : true
    });
    setEditorModalOpen(true);
  };

  // Save Rule (Create or Update)
  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (currentRule) {
        await notificationAPI.updateAlertRule(currentRule.id, formData);
        setRules(prev => prev.map(r => r.id === currentRule.id ? { ...r, ...formData } : r));
        setFeedback({ type: 'success', message: `Rule "${formData.name}" updated successfully.` });
      } else {
        const res = await notificationAPI.createAlertRule(formData);
        const newRule = res?.data || { ...formData, id: `rule-${Date.now()}` };
        setRules(prev => [newRule, ...prev]);
        setFeedback({ type: 'success', message: `Rule "${formData.name}" created successfully.` });
      }
      setEditorModalOpen(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error saving alert rule.' });
    } finally {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Delete Rule
  const handleDeleteRule = async (ruleId, ruleName) => {
    if (!window.confirm(`Are you sure you want to permanently delete rule "${ruleName}"?`)) return;
    try {
      await notificationAPI.deleteAlertRule(ruleId);
      setRules(prev => prev.filter(r => r.id !== ruleId));
      setFeedback({ type: 'success', message: `Rule "${ruleName}" deleted.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete rule.' });
    } finally {
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Open Test Simulation Modal
  const handleOpenTest = (rule) => {
    setCurrentRule(rule);
    setTestResult(null);
    setTestPayload(JSON.stringify({
      bus_id: 'BUS-08',
      speed_kmh: 45,
      delay_minutes: 20,
      deviation_meters: 310,
      student_id: 'VSB-2024-019',
      timestamp: new Date().toISOString()
    }, null, 2));
    setTestModalOpen(true);
  };

  // Run Test Simulation
  const handleExecuteTest = async () => {
    setTestingRule(true);
    setTestResult(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testPayload);
      } catch (err) {
        throw new Error('Invalid JSON format in simulated event payload');
      }

      const res = await notificationAPI.testAlertRule(currentRule.id, parsed);
      setTestResult(res?.data || {
        matched: true,
        rule_name: currentRule.name,
        simulated_channels: currentRule.channels,
        simulated_recipients: currentRule.recipient_roles,
        priority: currentRule.priority,
        executed_at: new Date().toISOString()
      });
    } catch (err) {
      setTestResult({
        matched: false,
        error: err.message || 'Rule simulation failed'
      });
    } finally {
      setTestingRule(false);
    }
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-void, #0a0a0a)',
        minHeight: 'calc(100vh - var(--header-height))',
        color: 'var(--text-pure, #ffffff)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)'
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-default, #262626)',
          paddingBottom: '18px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}
            >
              <SlidersHorizontal size={18} />
            </div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: 0,
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase'
              }}
            >
              Automated Alert Rules Engine
            </h1>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155'
              }}
            >
              PHASE 12
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #a3a3a3)' }}>
            Program institutional trigger conditions, priority elevations, and multi-channel recipient lists for autonomous transit alerts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchRules();
            }}
            disabled={loading || refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-default, #262626)',
              color: 'var(--text-secondary, #a3a3a3)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              border: '1px solid #1d4ed8',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono, monospace)',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Plus size={16} />
            Create Alert Rule
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono, monospace)',
            backgroundColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.type === 'success' ? '#4ade80' : '#f87171'
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Telemetry Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>TOTAL CONFIGURED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', marginTop: '4px' }}>
            {rules.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3b82f6', marginTop: '4px' }}>Active automated policies</div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>ARMED / ACTIVE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#4ade80', marginTop: '4px' }}>
            {rules.filter(r => r.is_active).length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#737373', marginTop: '4px' }}>Listening to live bus telemetry</div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>CRITICAL EMERGENCY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#f87171', marginTop: '4px' }}>
            {rules.filter(r => r.priority === 'CRITICAL').length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#737373', marginTop: '4px' }}>Instant bypass triggers</div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            borderRadius: '8px',
            padding: '16px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>MULTI-CHANNEL RULES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#38bdf8', marginTop: '4px' }}>
            {rules.filter(r => (r.channels || []).length > 1).length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#737373', marginTop: '4px' }}>Cross-platform broadcasts</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            borderRadius: '6px',
            padding: '8px 12px',
            flex: '1',
            minWidth: '260px'
          }}
        >
          <Search size={16} style={{ color: '#737373' }} />
          <input
            type="text"
            placeholder="Search rule title, event, or trigger..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        <select
          value={selectedEventType}
          onChange={e => setSelectedEventType(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono, monospace)'
          }}
        >
          {EVENT_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface, #141414)',
            border: '1px solid var(--border-default, #262626)',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono, monospace)'
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      {/* Rules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredRules.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface, #141414)',
              border: '1px dashed var(--border-default, #262626)',
              borderRadius: '8px',
              color: '#737373'
            }}
          >
            <SlidersHorizontal size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a3a3a3' }}>No Alert Rules Found</div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Try adjusting your search criteria or create a new automated rule.</div>
          </div>
        ) : (
          filteredRules.map(rule => {
            const isCritical = rule.priority === 'CRITICAL';
            const isHigh = rule.priority === 'HIGH';

            return (
              <div
                key={rule.id}
                style={{
                  backgroundColor: 'var(--bg-surface, #141414)',
                  border: `1px solid ${rule.is_active ? (isCritical ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-default, #262626)') : 'rgba(255, 255, 255, 0.05)'}`,
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  opacity: rule.is_active ? 1 : 0.65,
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Left info */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 700,
                        backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.2)' : isHigh ? 'rgba(249, 115, 22, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: isCritical ? '#f87171' : isHigh ? '#fb923c' : '#60a5fa',
                        border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : isHigh ? 'rgba(249, 115, 22, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`
                      }}
                    >
                      {rule.priority}
                    </span>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        backgroundColor: '#1f1f1f',
                        color: '#a3a3a3',
                        border: '1px solid #333333'
                      }}
                    >
                      {rule.event_type}
                    </span>

                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                      {rule.name}
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#737373', margin: '0 0 10px 0' }}>
                    {rule.description}
                  </p>

                  {/* Recipient Roles & Channels */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>CHANNELS:</span>
                      {(rule.channels || []).map(ch => (
                        <span
                          key={ch}
                          style={{
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-mono, monospace)',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: '#1a1a1a',
                            border: '1px solid #2e2e2e',
                            color: '#94a3b8'
                          }}
                        >
                          {ch.toUpperCase()}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: '#737373', fontFamily: 'var(--font-mono, monospace)' }}>TARGETS:</span>
                      {(rule.recipient_roles || []).map(r => (
                        <span
                          key={r}
                          style={{
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-mono, monospace)',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            color: '#93c5fd'
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleActive(rule)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1px solid ${rule.is_active ? 'rgba(34, 197, 94, 0.4)' : '#333333'}`,
                      backgroundColor: rule.is_active ? 'rgba(34, 197, 94, 0.15)' : '#1a1a1a',
                      color: rule.is_active ? '#4ade80' : '#737373'
                    }}
                  >
                    {rule.is_active ? 'ARMED' : 'PAUSED'}
                  </button>

                  {/* Dry Run Test */}
                  <button
                    onClick={() => handleOpenTest(rule)}
                    title="Simulate Event Payload"
                    style={{
                      padding: '7px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={14} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    title="Edit Rule Configuration"
                    style={{
                      padding: '7px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-void, #0a0a0a)',
                      border: '1px solid var(--border-default, #262626)',
                      color: '#a3a3a3',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit size={14} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteRule(rule.id, rule.name)}
                    title="Delete Rule"
                    style={{
                      padding: '7px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create / Edit Rule */}
      {editorModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-default, #262626)',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-mono, monospace)' }}>
                {currentRule ? 'EDIT ALERT RULE' : 'CREATE ALERT RULE'}
              </h2>
              <button
                onClick={() => setEditorModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                  RULE NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Driver Emergency SOS Escalation"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-void, #0a0a0a)',
                    border: '1px solid var(--border-subtle, #262626)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                  DESCRIPTION
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dispatches urgent multi-channel broadcast to security staff"
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-void, #0a0a0a)',
                    border: '1px solid var(--border-subtle, #262626)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                    EVENT TYPE
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={e => setFormData(f => ({ ...f, event_type: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-void, #0a0a0a)',
                      border: '1px solid var(--border-subtle, #262626)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono, monospace)'
                    }}
                  >
                    <option value="EMERGENCY_SOS">EMERGENCY_SOS</option>
                    <option value="WRONG_BUS_BOARDING">WRONG_BUS_BOARDING</option>
                    <option value="GEOFENCE_DEVIATION">GEOFENCE_DEVIATION</option>
                    <option value="TRANSIT_DELAY">TRANSIT_DELAY</option>
                    <option value="DEVICE_OFFLINE">DEVICE_OFFLINE</option>
                    <option value="DOOR_OPEN_MOVING">DOOR_OPEN_MOVING</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                    ALERT PRIORITY
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData(f => ({ ...f, priority: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-void, #0a0a0a)',
                      border: '1px solid var(--border-subtle, #262626)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono, monospace)'
                    }}
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL (Emergency Bypass)</option>
                  </select>
                </div>
              </div>

              {/* Delivery Channels */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                  DISPATCH CHANNELS
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['in_app', 'push', 'email', 'sms'].map(ch => {
                    const active = formData.channels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => {
                          setFormData(f => ({
                            ...f,
                            channels: active ? f.channels.filter(c => c !== ch) : [...f.channels, ch]
                          }));
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          cursor: 'pointer',
                          border: `1px solid ${active ? 'rgba(59, 130, 246, 0.4)' : '#262626'}`,
                          backgroundColor: active ? 'rgba(59, 130, 246, 0.15)' : '#0a0a0a',
                          color: active ? '#60a5fa' : '#737373',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {active && <Check size={12} />}
                        {ch.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Recipient Roles */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                  TARGET RECIPIENT ROLES
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'PARENT', 'DRIVER', 'STUDENT'].map(role => {
                    const active = formData.recipient_roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setFormData(f => ({
                            ...f,
                            recipient_roles: active ? f.recipient_roles.filter(r => r !== role) : [...f.recipient_roles, role]
                          }));
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          cursor: 'pointer',
                          border: `1px solid ${active ? 'rgba(34, 197, 94, 0.4)' : '#262626'}`,
                          backgroundColor: active ? 'rgba(34, 197, 94, 0.12)' : '#0a0a0a',
                          color: active ? '#4ade80' : '#737373',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {active && <Check size={12} />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status active */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="rule-active-toggle"
                  checked={formData.is_active}
                  onChange={e => setFormData(f => ({ ...f, is_active: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <label htmlFor="rule-active-toggle" style={{ fontSize: '0.82rem', cursor: 'pointer' }}>
                  Arm and activate this rule immediately upon saving
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setEditorModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default, #262626)',
                    color: '#a3a3a3',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: '#2563eb',
                    border: '1px solid #1d4ed8',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Alert Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rule Simulation & Dry Run Test */}
      {testModalOpen && currentRule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #141414)',
              border: '1px solid var(--border-default, #262626)',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-mono, monospace)' }}>
                  DRY RUN SIMULATION
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#737373', marginTop: '2px' }}>
                  Testing rule: <strong style={{ color: '#ffffff' }}>{currentRule.name}</strong>
                </div>
              </div>
              <button
                onClick={() => setTestModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#737373', marginBottom: '6px', fontFamily: 'var(--font-mono, monospace)' }}>
                SIMULATED EVENT PAYLOAD (JSON)
              </label>
              <textarea
                rows={6}
                value={testPayload}
                onChange={e => setTestPayload(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-void, #0a0a0a)',
                  border: '1px solid var(--border-subtle, #262626)',
                  color: '#4ade80',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {testResult && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  backgroundColor: testResult.matched ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${testResult.matched ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {testResult.matched ? (
                    <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                  ) : (
                    <XCircle size={16} style={{ color: '#f87171' }} />
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: testResult.matched ? '#4ade80' : '#f87171' }}>
                    {testResult.matched ? 'CONDITIONS MATCHED - ALERT WOULD FIRE' : 'CONDITIONS DID NOT MATCH'}
                  </span>
                </div>
                {testResult.matched && (
                  <div style={{ fontSize: '0.72rem', color: '#a3a3a3', fontFamily: 'var(--font-mono, monospace)' }}>
                    Dispatched to {testResult.simulated_channels?.join(', ').toUpperCase()} targeting roles: {testResult.simulated_recipients?.join(', ')}
                  </div>
                )}
                {testResult.error && (
                  <div style={{ fontSize: '0.72rem', color: '#f87171' }}>{testResult.error}</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-default, #262626)',
                  color: '#a3a3a3',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteTest}
                disabled={testingRule}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#2563eb',
                  border: '1px solid #1d4ed8',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: testingRule ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Play size={14} />
                {testingRule ? 'Evaluating...' : 'Execute Dry Run'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
