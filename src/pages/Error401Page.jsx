import React from 'react';
import { Lock, LogIn, ArrowLeft, Shield } from 'lucide-react';

/**
 * FILE: Error401Page.jsx
 * PURPOSE: Demonstrates real 401 Unauthorized error state per Phase 1 specification.
 * PHASE: Phase 1
 * USED BY: Core Phase 1 Preview Navigation, Authentication Guard
 */
export default function Error401Page({ onNavigate }) {
  return (
    <div className="error-view-wrapper">
      <div className="error-view-card">
        {/* Subtle Session / Authentication Visual */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-void)',
            border: '1px solid var(--border-default)',
            marginBottom: '20px'
          }}
        >
          <Lock size={28} color="var(--text-pure)" />
        </div>

        <div 
          className="phase-badge" 
          style={{ margin: '0 auto 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Shield size={12} /> AUTHENTICATION REQUIRED
        </div>

        <div className="error-code-badge">401</div>
        <div className="error-title">AUTHENTICATION REQUIRED</div>

        <p className="error-description">
          Your session is missing or has expired. Please sign in again to continue accessing <strong>BUS STUDENTS TRACKER</strong>.
        </p>

        {/* Diagnostic Status Box */}
        <div className="error-terminal-block">
          <div className="error-terminal-label">SYSTEM STATUS:</div>
          <div className="error-terminal-value">AUTH_SESSION_EXPIRED [CODE 401]</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Authority: V.S.B. Institutional Access Gate (Department of AI & DS)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="error-actions">
          <button
            className="mono-btn mono-btn-primary"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <LogIn size={15} /> SIGN IN AGAIN
          </button>
          <button
            className="mono-btn"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <ArrowLeft size={15} /> RETURN TO PORTAL
          </button>
        </div>

        <div style={{ marginTop: '28px', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          SECURITY PROTOCOL — SESSION TERMINATION RECORDED
        </div>
      </div>
    </div>
  );
}
