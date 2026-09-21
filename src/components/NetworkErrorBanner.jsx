import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

export default function NetworkErrorBanner({ state = 'OFFLINE', onRetry, onNavigate }) {
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (state !== 'OFFLINE') return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 8));
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const handleManualRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (onRetry) onRetry();
    }, 1200);
  };

  const getStateMeta = () => {
    switch (state) {
      case 'CONNECTED':
        return {
          title: 'CONNECTED',
          description: 'Connection stable.',
          symbol: '●'
        };
      case 'RECONNECTING':
        return {
          title: 'RECONNECTING',
          description: 'Attempting to restore connection...',
          symbol: '◌'
        };
      case 'RECOVERED':
        return {
          title: 'RECOVERED',
          description: 'Connection restored successfully.',
          symbol: '✓'
        };
      case 'OFFLINE':
      default:
        return {
          title: 'OFFLINE',
          description: `Unable to communicate with the server. Automatic link re-poll in ${countdown}s...`,
          symbol: '○'
        };
    }
  };

  const meta = getStateMeta();

  return (
    <div
      role="alert"
      style={{
        background: '#121212',
        border: '1px solid #333333',
        borderRadius: '8px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#ffffff'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            background: '#1a1a1a',
            border: '1px solid #333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: '#ffffff'
          }}
        >
          {meta.symbol}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: '#ffffff' }}>
              [{meta.title}]
            </span>
            <span style={{ fontSize: '0.85rem', color: '#cccccc' }}>
              {meta.description}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#777777', marginTop: '2px' }}>
            VSB Transport Telemetry Gateway Node: ai-ds-gw-01.vsb.local
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          className="mono-btn"
          style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          onClick={handleManualRetry}
          disabled={retrying}
        >
          <RefreshCw size={12} style={{ animation: retrying ? 'spin 1s linear infinite' : 'none' }} />
          {retrying ? 'Pinging Gateway...' : 'Retry Link'}
        </button>

        {onNavigate && (
          <button
            type="button"
            className="mono-btn"
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
            onClick={onNavigate}
          >
            Offline Queue
          </button>
        )}
      </div>
    </div>
  );
}
