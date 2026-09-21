import React from 'react';
import { Compass, ArrowLeft, Home, MapPin, XCircle } from 'lucide-react';

/**
 * FILE: Error404Page.jsx
 * PURPOSE: Demonstrates real 404 Route Not Found error state per Phase 1 specification.
 * PHASE: Phase 1
 * USED BY: Core Phase 1 Preview Navigation, Router Fallback
 */
export default function Error404Page({ onNavigate }) {
  return (
    <div className="error-view-wrapper">
      <div className="error-view-card">
        {/* Navigation / Route Compass Visual */}
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
          <Compass size={28} color="var(--text-pure)" />
        </div>

        <div 
          className="phase-badge" 
          style={{ margin: '0 auto 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <MapPin size={12} /> TRANSPORT ROUTE UNRESOLVED
        </div>

        <div className="error-code-badge">404</div>
        <div className="error-title">ROUTE NOT FOUND</div>

        <p className="error-description">
          The requested transport-system route could not be found. The page may have been moved, removed, or the URL may be incorrect.
        </p>

        {/* Minimal Professional Route Schematic */}
        <div style={{
          background: 'var(--bg-void)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          marginBottom: '22px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span>FLEET WAYPOINT SEQUENCE</span>
            <span style={{ color: 'var(--text-dim)' }}>VSB_TRANS_GRID</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-pure)', fontWeight: 600 }}>
              <span className="mono-indicator-dot mono-dot-solid" /> CAMPUS TERMINAL
            </div>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-default)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <span className="mono-indicator-dot mono-dot-hollow" /> SECTOR CHECKPOINT
            </div>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-default)', margin: '0 4px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <XCircle size={14} color="var(--text-muted)" /> UNMAPPED
            </div>
          </div>
        </div>

        {/* Diagnostic Status Box */}
        <div className="error-terminal-block">
          <div className="error-terminal-label">ROUTING SYSTEM STATUS:</div>
          <div className="error-terminal-value">ERR_ROUTE_COORDINATES_MISSING [CODE 404]</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Target Network: V.S.B. Bus Fleet Navigation Service
          </div>
        </div>

        {/* Action Buttons */}
        <div className="error-actions">
          <button
            className="mono-btn mono-btn-primary"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <Home size={15} /> RETURN TO PORTAL
          </button>
          <button
            className="mono-btn"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <ArrowLeft size={15} /> GO BACK
          </button>
        </div>

        <div style={{ marginTop: '28px', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          NAVIGATION DISPATCH — V.S.B. ENGINEERING COLLEGE (AI & DS)
        </div>
      </div>
    </div>
  );
}
