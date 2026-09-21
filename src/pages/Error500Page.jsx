import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

/**
 * FILE: Error500Page.jsx
 * PURPOSE: Demonstrates real 500 System Error state per Phase 1 specification.
 * PHASE: Phase 1
 * USED BY: Core Phase 1 Preview Navigation, Global Error Boundary
 * NOTE: Strictly sanitized per Section 9 — no stack traces, database errors, file paths, or debug internals.
 */
export default function Error500Page({ onNavigate }) {
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
        {/* Core System Fault Indicator */}
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
          <AlertCircle size={28} color="var(--text-pure)" />
        </div>

        <div 
          className="phase-badge" 
          style={{ margin: '0 auto 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="mono-indicator-dot mono-dot-pulse" /> SYSTEM FAULT ISOLATED
        </div>

        <div className="error-code-badge">500</div>
        <div className="error-title">SYSTEM ERROR</div>

        <p className="error-description">
          The system encountered an unexpected problem while processing your request. Please try again.
        </p>

        {/* Sanitized System Status Block (No Internal Leaks) */}
        <div className="error-terminal-block">
          <div className="error-terminal-label">SYSTEM HEALTH & TELEMETRY:</div>
          <div className="error-terminal-value">INTERNAL_PROCESSING_ANOMALY [CODE 500]</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            System state secured. Diagnostic anomaly logged to institutional monitoring node.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="error-actions">
          <button
            className="mono-btn mono-btn-primary"
            onClick={handleRetry}
            disabled={retrying}
          >
            <RefreshCw size={15} className={retrying ? 'spin' : ''} />
            {retrying ? 'PROCESSING...' : 'TRY AGAIN'}
          </button>
          <button
            className="mono-btn"
            onClick={() => onNavigate && onNavigate('opening')}
          >
            <Home size={15} /> RETURN TO PORTAL
          </button>
        </div>

        <div style={{ marginTop: '28px', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          CORE RESILIENCE — V.S.B. ENGINEERING COLLEGE (AI & DS)
        </div>
      </div>
    </div>
  );
}
