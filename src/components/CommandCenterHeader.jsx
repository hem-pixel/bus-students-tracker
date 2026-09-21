// FILE: src/components/CommandCenterHeader.jsx
// PURPOSE: Top institutional command center header showing college identity, real-time telemetry, role clearance, and authentication status.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/App.jsx

import React from 'react';
import { Shield, Radio, Bus, User, LogOut, KeyRound, Users, UserCheck, Camera, ShieldCheck, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CommandCenterHeader({ onNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-default)',
        padding: '0 20px',
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '16px'
      }}
    >
      {/* Brand & Institution Lockup */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        onClick={() => {
          if (onNavigate) {
            if (isAuthenticated && user) {
              const rolePath = user.role.toLowerCase().replace(/_/g, '-');
              onNavigate(rolePath);
            } else {
              onNavigate('opening');
            }
          }
        }}
        title={isAuthenticated ? "Go to Dashboard" : "Return to Opening Gateway"}
      >
        <div 
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1.5px solid var(--border-strong)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <img 
            src="/college-logo.jpg" 
            alt="V.S.B. Crest" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span 
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)'
            }}
          >
            V.S.B. ENGINEERING COLLEGE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'var(--text-pure)'
              }}
            >
              BUS STUDENTS TRACKER
            </span>
            <span 
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '1px 6px',
                borderRadius: '2px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-pure)'
              }}
            >
              AI & DS
            </span>
          </div>
        </div>
      </div>

      {/* Center Telemetry & Pulse — Monochrome */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
        className="header-telemetry-group"
      >
        <div className="mono-pill">
          <span className="mono-indicator-dot mono-dot-solid" />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="mono-pill">
          <Radio size={12} color="var(--text-pure)" />
          <span>FLEET LINK SECURE</span>
        </div>
      </div>

      {/* Right Side: Authentication Status & Session Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Transport Master Data & Student Management Direct Nav for Authorized Personnel */}
            {['ADMIN', 'TRANSPORT_STAFF'].includes(user.role) && (
              <>
                <button
                  onClick={() => onNavigate && onNavigate('transport-master')}
                  className="mono-btn"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-pure)'
                  }}
                  id="header-transport-master-btn"
                  title="Open Transport Master Data Dashboard"
                >
                  <Bus size={13} />
                  <span>TRANSPORT MASTER</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('student-management')}
                  className="mono-btn"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-pure)'
                  }}
                  id="header-student-management-btn"
                  title="Open Student Transport Management Dashboard"
                >
                  <Users size={13} />
                  <span>STUDENTS</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('staff-management')}
                  className="mono-btn"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-pure)'
                  }}
                  id="header-staff-management-btn"
                  title="Open Staff & Driver Management Dashboard"
                >
                  <UserCheck size={13} />
                  <span>STAFF & DRIVERS</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('camera-management')}
                  className="mono-btn"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-pure)'
                  }}
                  id="header-camera-management-btn"
                  title="Open Edge Vision & Camera Management Dashboard"
                >
                  <Camera size={13} />
                  <span>CAMERAS</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('driver-verification')}
                  className="mono-btn"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-pure)'
                  }}
                  id="header-driver-verification-btn"
                  title="Open Driver Biometric Verification & Pre-Dispatch Clearance"
                >
                  <ShieldCheck size={13} />
                  <span>DRIVER CLEARANCE</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('biometric-enrollment')}
                  className="mono-btn"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-pure)'
                  }}
                  id="header-biometric-enrollment-btn"
                  title="Open AI Face Recognition & Biometric Profile Enrollment"
                >
                  <Fingerprint size={13} />
                  <span>BIOMETRICS</span>
                </button>
              </>
            )}

            {/* User Profile Badge */}
            <div 
              className="mono-pill" 
              style={{ 
                background: 'var(--bg-void)', 
                border: '1px solid var(--border-strong)',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <User size={13} color="var(--text-pure)" />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                  {user.name.split(' ')[0]}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                if (onNavigate) onNavigate('login');
              }}
              className="mono-btn"
              style={{
                fontSize: '0.75rem',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-void)'
              }}
              title="End session"
            >
              <LogOut size={13} />
              <span>LOGOUT</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate && onNavigate('login')}
            className="mono-btn mono-btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <KeyRound size={13} />
            <span>[ SIGN IN ]</span>
          </button>
        )}
      </div>
    </header>
  );
}
