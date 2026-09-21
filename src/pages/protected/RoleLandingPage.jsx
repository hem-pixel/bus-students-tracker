// FILE: src/pages/protected/RoleLandingPage.jsx
// PURPOSE: Unified minimal protected landing area for authenticated roles displaying user identity, clearance level, session token snippet, and secure logout.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/App.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Key, LogOut, CheckCircle, Clock, User, Bus, Users, UserCheck, Camera, ShieldCheck, Fingerprint, ClipboardCheck } from 'lucide-react';

const ROLE_METADATA = {
  ADMIN: {
    title: 'ADMINISTRATIVE COMMAND AREA',
    tier: 'Tier 1 — Full Operational Authority',
    description: 'Authorized for fleet management, route assignment, vision camera endpoints, and institutional transport governance.',
    boundary: 'Global System Perimeter'
  },
  TRANSPORT_STAFF: {
    title: 'TRANSPORT STAFF OPERATIONS AREA',
    tier: 'Tier 2 — Fleet Operations Center',
    description: 'Authorized for live fleet tracking, cross-bus boarding anomaly alerts, driver communications, and dispatch coordination.',
    boundary: 'Active Fleet Operations'
  },
  BUS_IN_CHARGE: {
    title: 'BUS IN-CHARGE CABIN AREA',
    tier: 'Tier 3 — Assigned Vehicle Supervision',
    description: 'Authorized for assigned bus headcount verification, student boarding validation, and on-board dispute resolution.',
    boundary: 'Assigned Vehicle Interior'
  },
  DRIVER: {
    title: 'DRIVER VEHICLE NAVIGATION AREA',
    tier: 'Tier 4 — Vehicle Operator',
    description: 'Authorized for assigned route stop schedules, trip departure confirmation, and transport office communications.',
    boundary: 'Assigned Route Telemetry'
  },
  STUDENT: {
    title: 'STUDENT COMMUTER PORTAL AREA',
    tier: 'Tier 5 — Passenger Commuter',
    description: 'Authorized for personal bus allocation lookup, live arrival forecasts, and designated boarding stop alerts.',
    boundary: 'Personal Commuter Profile'
  }
};

export default function RoleLandingPage({ onNavigate }) {
  const { user, sessionToken, logout } = useAuth();
  const meta = ROLE_METADATA[user?.role] || ROLE_METADATA.STUDENT;

  const handleLogout = () => {
    logout();
    if (onNavigate) {
      onNavigate('login');
    }
  };

  return (
    <div className="error-view-wrapper" style={{ padding: '32px 16px', minHeight: 'calc(100vh - 120px)' }}>
      <div className="error-view-card" style={{ maxWidth: '840px', width: '100%', textAlign: 'left' }}>
        
        {/* Top Header Row */}
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span className="error-badge-mono" style={{ background: '#000000', color: '#ffffff', borderColor: '#ffffff' }}>
                PROTECTED AREA
              </span>
              <span className="error-badge-mono" style={{ background: 'var(--bg-surface)' }}>
                {meta.tier}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-pure)', margin: '4px 0' }}>
              {meta.title}
            </h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              V.S.B. ENGINEERING COLLEGE • BUS STUDENTS TRACKER
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mono-btn mono-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            [ SECURE LOGOUT ]
          </button>
        </div>

        {/* Action Panel for Authorized Fleet & Master Data Personnel */}
        {['ADMIN', 'TRANSPORT_STAFF'].includes(user?.role) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {/* Transport Master Data Card */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #2a2a2a',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <Bus size={18} />
                  TRANSPORT MASTER DATA MANAGEMENT
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  Direct access to institutional transport assets: 7 relational entities including buses, route waypoints, stops, licensed drivers, bus in-charges, assignments, and edge vision cameras.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('transport-master')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-transport-master"
              >
                <Bus size={16} />
                [ ACCESS TRANSPORT MASTER DATA ]
              </button>
            </div>

            {/* Student Transport Management Card */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <Users size={18} />
                  STUDENT TRANSPORT MANAGEMENT
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  Institutional student directory, bus seat allocations, stop assignment workflows, transport change requests, and edge vision boarding logs.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('student-management')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-student-management"
              >
                <Users size={16} />
                [ ACCESS STUDENT MANAGEMENT ]
              </button>
            </div>

            {/* Staff & Driver Management Card */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <UserCheck size={18} />
                  STAFF & DRIVER MANAGEMENT
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  Institutional staff personnel directory, driver licensing & safety records, duty rosters & shift dispatch, leave approvals, performance scorecards, and compensation structures.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('staff-management')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-staff-management"
              >
                <UserCheck size={16} />
                [ ACCESS STAFF & DRIVER MANAGEMENT ]
              </button>
            </div>

            {/* Edge Vision & Camera Management Card */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <Camera size={18} />
                  EDGE VISION & CAMERA MANAGEMENT
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  Fleet-wide edge vision camera inventory, live network telemetry gauges, optical sensor calibration profiles, security incidents, and RTSP/HLS stream segment storage.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('camera-management')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-camera-management"
              >
                <Camera size={16} />
                [ ACCESS CAMERA MANAGEMENT ]
              </button>
            </div>

            {/* Driver Clearance & Biometric Verification Card */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <ShieldCheck size={18} />
                  DRIVER BIOMETRIC VERIFICATION & DISPATCH CLEARANCE
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  Mandatory pre-dispatch driver facial biometric clearance, 128-D embedding match verification, liveness & anti-spoofing telemetry, and supervisor emergency override controls.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('driver-verification')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-driver-verification"
              >
                <ShieldCheck size={16} />
                [ ACCESS DRIVER CLEARANCE ]
              </button>
            </div>

            {/* Biometric Profile Enrollment Card */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <Fingerprint size={18} />
                  AI RECOGNITION & BIOMETRIC PROFILE ENROLLMENT
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  Institutional face biometric template registry for students, drivers, and staff. 128-D vector feature extraction, 68 facial landmarks inspection, quality score validation, and profile status lifecycle.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('biometric-enrollment')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-biometric-enrollment"
              >
                <Fingerprint size={16} />
                [ ACCESS BIOMETRIC PROFILES ]
              </button>
            </div>

            {/* Student Boarding Verification & Anomaly Control Card (Phase 8) */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <ClipboardCheck size={18} />
                  STUDENT BOARDING VERIFICATION CONSOLE
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  Real-time door camera facial recognition verification against active bus and stop assignments. Live anomaly detection (wrong bus/wrong stop), biometric attendance logging, and supervisor overrides.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('boarding')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-boarding-verification"
              >
                <ClipboardCheck size={16} />
                [ ACCESS BOARDING VERIFICATION ]
              </button>
            </div>
          </div>
        )}

        {/* Action Panel for Bus In-Charge Role */}
        {user?.role === 'BUS_IN_CHARGE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '18px 20px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ maxWidth: '520px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  <ClipboardCheck size={18} />
                  STUDENT BOARDING VERIFICATION CONSOLE
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.5 }}>
                  On-bus supervisor view: real-time facial recognition verification, stop validation, boarding anomalies, attendance logs, and manual override controls.
                </div>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('boarding')}
                className="mono-btn mono-btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                id="btn-access-incharge-boarding"
              >
                <ClipboardCheck size={16} />
                [ ACCESS BOARDING CONSOLE ]
              </button>
            </div>
          </div>
        )}

        {/* Authenticated Identity Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Identity Card */}
          <div style={{
            background: 'var(--bg-void)',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              <User size={14} />
              AUTHENTICATED USER
            </div>
            <div style={{ color: 'var(--text-pure)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
              {user?.name}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              {user?.email}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
              {user?.department}
            </div>
          </div>

          {/* Session Token Card */}
          <div style={{
            background: 'var(--bg-void)',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              <Key size={14} />
              ACTIVE SESSION TOKEN
            </div>
            <div style={{
              background: '#000000',
              border: '1px solid var(--border-default)',
              padding: '8px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-pure)',
              wordBreak: 'break-all',
              borderRadius: '2px',
              marginBottom: '6px'
            }}>
              {sessionToken ? `${sessionToken.slice(0, 36)}...` : 'NO_TOKEN'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Clock size={12} />
              Session valid for 60 minutes
            </div>
          </div>

          {/* Clearance Card */}
          <div style={{
            background: 'var(--bg-void)',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              <Shield size={14} />
              SECURITY BOUNDARY
            </div>
            <div style={{ color: 'var(--text-pure)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
              {meta.boundary}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontSize: '0.8rem', marginTop: '8px' }}>
              <CheckCircle size={14} />
              Role claim verified by system
            </div>
          </div>
        </div>

        {/* Scope & Description Banner */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          padding: '16px 20px',
          borderRadius: '4px',
          marginBottom: '24px'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-pure)', marginBottom: '4px', letterSpacing: '0.05em' }}>
            OPERATIONAL AUTHORIZATION SCOPE:
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {meta.description}
          </p>
        </div>

        {/* Institutional System Status Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          padding: '20px',
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-pure)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
            <CheckCircle size={16} />
            NODE STATUS: OPERATIONAL & SECURE
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
            Department of Artificial Intelligence & Data Science • V.S.B. Engineering College Transport Telemetry Network. All queries and access tokens are audited under institutional policy.
          </p>
        </div>

      </div>
    </div>
  );
}
