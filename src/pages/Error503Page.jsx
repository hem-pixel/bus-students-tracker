import React, { useState } from 'react';
import { Server, RotateCw, Home, ArrowDown } from 'lucide-react';

/**
 * FILE: Error503Page.jsx
 * PURPOSE: Demonstrates real 503 Service Temporarily Unavailable state per Phase 1 specification.
 * PHASE: Phase 1
 * USED BY: Core Phase 1 Preview Navigation, Maintenance Mode Gateway
 */
export default function Error503Page({ onNavigate }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
    }, 1200);
  };

  return (
    <div className="error-view-wrapper">
      <div className="error-view-card">
        {/* Service Gateway Visual */}
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
          <Server size={28} color="var(--text-pure)" />
        </div>

        <div 
          className="phase-badge" 
          style={{ margin: '0 auto 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="mono-indicator-dot mono-dot-hollow" /> SERVICE DISPATCH PAUSED
        </div>

        <div className="error-code-badge">503</div>
        <div className="error-title">SERVICE TEMPORARILY UNAVAILABLE</div>

        <p className="error-description">
          <strong>BUS STUDENTS TRACKER</strong> services are currently unavailable. The system may be undergoing maintenance or a required service may be temporarily offline.
        </p>

        {/* Visual: SYSTEM ↓ SERVICE UNAVAILABLE */}
        <div style={{
          background: 'var(--bg-void)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '22px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.8rem',
              color: 'var(--text-pure)',
              fontWeight: 600
            }}>
              <span className="mono-indicator-dot mono-dot-solid" />
              SYSTEM
            </div>

            <ArrowDown size={18} color="var(--text-muted)" />

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'var(--bg-void)',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontWeight: 600
            }}>
              <span className="mono-indicator-dot mono-dot-hollow" />
              SERVICE UNAVAILABLE
            </div>
          </div>
        </div>

        {/* Status Box */}
        <div className="error-terminal-block">
          <div className="error-terminal-label">GATEWAY DISPATCH STATE:</div>
          <div className="error-terminal-value">TEMPORARY_SERVICE_SUSPENSION [CODE 503]</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Operational Node: V.S.B. Transport Infrastructure (AI & DS High-Availability Mesh)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="error-actions">
          <button
            className="mono-btn mono-btn-primary"
            onClick={handleRetry}
            disabled={retrying}
          >
            <RotateCw size={15} className={retrying ? 'spin' : ''} />
            {retrying ? 'CHECKING SERVICES...' : 'TRY AGAIN'}
          </button>
          <button
            className="mono-btn"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <Home size={15} /> RETURN TO PORTAL
          </button>
        </div>

        <div style={{ marginTop: '28px', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          SYSTEMS RESILIENCE PROTOCOL — V.S.B. ENGINEERING COLLEGE
        </div>
      </div>
    </div>
  );
}
