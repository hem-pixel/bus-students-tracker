import React from 'react';
import { ShieldAlert, ArrowLeft, Home, UserCheck, Ban } from 'lucide-react';

/**
 * FILE: Error403Page.jsx
 * PURPOSE: Demonstrates real 403 Access Restricted state per Phase 1 specification.
 * PHASE: Phase 1
 * USED BY: Core Phase 1 Preview Navigation, Role Access Guard
 */
export default function Error403Page({ onNavigate }) {
  return (
    <div className="error-view-wrapper">
      <div className="error-view-card">
        {/* Clearance Shield / Access Barrier Visual */}
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
          <ShieldAlert size={28} color="var(--text-pure)" />
        </div>

        <div 
          className="phase-badge" 
          style={{ margin: '0 auto 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Ban size={12} /> CLEARANCE BARRIER
        </div>

        <div className="error-code-badge">403</div>
        <div className="error-title">ACCESS RESTRICTED</div>

        <p className="error-description">
          You are authenticated, but your current role does not have permission to access this section.
        </p>

        {/* Visual: AUTHENTICATED but ACCESS DENIED */}
        <div style={{
          background: 'var(--bg-void)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          textAlign: 'center'
        }}>
          <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '8px' }}>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>IDENTITY STATE</div>
            <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-pure)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
              <UserCheck size={14} /> AUTHENTICATED
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>RESOURCE PERMISSION</div>
            <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
              <Ban size={14} /> ACCESS DENIED
            </div>
          </div>
        </div>

        {/* Diagnostic Status Box */}
        <div className="error-terminal-block">
          <div className="error-terminal-label">CLEARANCE STATUS:</div>
          <div className="error-terminal-value">INSUFFICIENT_ROLE_CLEARANCE [CODE 403]</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Controlled Area: Bus Dispatch & Transport Management Node
          </div>
        </div>

        {/* Action Buttons */}
        <div className="error-actions">
          <button
            className="mono-btn mono-btn-primary"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <Home size={15} /> RETURN TO DASHBOARD
          </button>
          <button
            className="mono-btn"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <ArrowLeft size={15} /> GO BACK
          </button>
        </div>

        <div style={{ marginTop: '28px', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          ROLE RE-EVALUATION — CONTACT V.S.B. AI & DS ADMINISTRATION
        </div>
      </div>
    </div>
  );
}
