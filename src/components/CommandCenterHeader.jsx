// FILE: src/components/CommandCenterHeader.jsx
// PURPOSE: Top institutional command center header showing rock-solid college identity, real-time telemetry, and session controls.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/App.jsx

import React from 'react';
import { Radio, User, LogOut, KeyRound, PanelLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CommandCenterHeader({
  currentPage,
  onNavigate,
  isSidebarCollapsed = false,
  onToggleSidebar,
  showSidebarToggle = false
}) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header
      id="command-center-header"
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
        gap: '20px',
        userSelect: 'none'
      }}
    >
      {/* Left Section: Sidebar Toggle + Brand & Institution Lockup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="mono-btn"
            style={{
              padding: '7px 9px',
              background: isSidebarCollapsed ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-pure)',
              cursor: 'pointer'
            }}
            title={isSidebarCollapsed ? "Expand Sidebar Navigation" : "Collapse Sidebar Navigation"}
            id="header-sidebar-toggle-btn"
          >
            <PanelLeft size={16} />
          </button>
        )}

        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          onClick={() => {
            if (onNavigate) {
              if (isAuthenticated && user) {
                onNavigate('dashboard');
              } else {
                onNavigate('opening');
              }
            }
          }}
          title={isAuthenticated ? "Go to Unified Dashboard" : "Return to Opening Gateway"}
        >
          {/* Logo — strictly sized, stable, circular with crisp border */}
          <div 
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1.5px solid var(--border-strong)',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
            }}
          >
            <img 
              src="/college-logo.jpg" 
              alt="V.S.B. Crest" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Institutional Title & Department Badge — rock-solid, nowrap */}
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span 
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                lineHeight: 1.2
              }}
            >
              V.S.B. ENGINEERING COLLEGE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{
                  fontSize: '1.05rem',
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
                  padding: '2px 7px',
                  borderRadius: '3px',
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
      </div>

      {/* Center Telemetry & Pulse — Clean and Stable */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0
        }}
        className="header-telemetry-group"
      >
        <div className="mono-pill">
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#00AA00',
              display: 'inline-block',
              boxShadow: '0 0 6px rgba(0, 170, 0, 0.6)'
            }}
          />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="mono-pill">
          <Radio size={12} color="var(--text-pure)" />
          <span>FLEET LINK SECURE</span>
        </div>
      </div>

      {/* Right Side: Authentication Status & Session Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* User Profile Badge */}
            <div 
              className="mono-pill" 
              style={{ 
                background: 'var(--bg-void)', 
                border: '1px solid var(--border-strong)',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <User size={14} color="var(--text-pure)" />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                  {user.name}
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
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-void)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-pure)'
              }}
              title="End secure session"
              id="header-logout-btn"
            >
              <LogOut size={13} />
              <span>LOGOUT</span>
            </button>
          </div>
        ) : !['opening', 'loading', 'login'].includes(currentPage) ? (
          <button
            onClick={() => onNavigate && onNavigate('login')}
            className="mono-btn mono-btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            id="header-login-btn"
          >
            <KeyRound size={13} />
            <span>[ SIGN IN ]</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
