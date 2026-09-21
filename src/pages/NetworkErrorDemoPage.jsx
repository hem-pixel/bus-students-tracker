import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle2 } from 'lucide-react';
import NetworkErrorBanner from '../components/NetworkErrorBanner';

export default function NetworkErrorDemoPage() {
  const [networkState, setNetworkState] = useState('OFFLINE'); // CONNECTED, RECONNECTING, OFFLINE, RECOVERED
  const [offlineQueue] = useState([
    { id: 'EVT-101', type: 'CHECKPOINT_PASS', time: '10:32:15 AM', bus: 'BUS-08', status: 'BUFFERED_LOCAL' },
    { id: 'EVT-102', type: 'BOARDING_GATE_PULSE', time: '10:33:04 AM', bus: 'BUS-08', status: 'BUFFERED_LOCAL' },
    { id: 'EVT-103', type: 'ROUTE_COORDINATE_FIX', time: '10:33:50 AM', bus: 'BUS-08', status: 'BUFFERED_LOCAL' },
  ]);

  const handleManualRetry = () => {
    setNetworkState('RECONNECTING');
    setTimeout(() => {
      setNetworkState('RECOVERED');
    }, 1800);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Network Resilience Status Banner */}
      <div style={{ marginBottom: '24px' }}>
        <NetworkErrorBanner
          state={networkState}
          onRetry={handleManualRetry}
        />
      </div>

      <div className="mono-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div className="phase-badge" style={{ marginBottom: '10px' }}>
              RESILIENCE ARCHITECTURE TESTBED
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Network Resilience & State Transitions
            </h1>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginTop: '6px', marginBottom: 0, lineHeight: 1.6 }}>
              Verifying campus mobile packet drops, gateway timeouts, volatile event buffering, and seamless recovery.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#777777', fontFamily: 'var(--font-mono)' }}>
              SIMULATE STATE:
            </span>
            <button
              className={`mono-btn ${networkState === 'CONNECTED' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setNetworkState('CONNECTED')}
            >
              Connected
            </button>
            <button
              className={`mono-btn ${networkState === 'RECONNECTING' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setNetworkState('RECONNECTING')}
            >
              Reconnecting
            </button>
            <button
              className={`mono-btn ${networkState === 'OFFLINE' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setNetworkState('OFFLINE')}
            >
              Offline
            </button>
            <button
              className={`mono-btn ${networkState === 'RECOVERED' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setNetworkState('RECOVERED')}
            >
              Recovered
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#0e0e0e', border: '1px solid #222222', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff' }}>
                {networkState === 'CONNECTED' && '● LINK STATE: CONNECTED'}
                {networkState === 'RECONNECTING' && '◌ LINK STATE: RECONNECTING'}
                {networkState === 'OFFLINE' && '○ LINK STATE: OFFLINE'}
                {networkState === 'RECOVERED' && '✓ LINK STATE: RECOVERED'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888888', lineHeight: 1.5 }}>
              {networkState === 'CONNECTED' && 'Connection stable. Uplink active with 18ms latency to central campus dispatch.'}
              {networkState === 'RECONNECTING' && 'Attempting to restore connection... Pinging VSB gateway node with exponential backoff.'}
              {networkState === 'OFFLINE' && 'Unable to communicate with the server. Local offline caching active; zero packet loss.'}
              {networkState === 'RECOVERED' && 'Connection restored successfully. Flushing buffered telemetry queue to central server.'}
            </div>
          </div>

          <div style={{ background: '#0e0e0e', border: '1px solid #222222', borderRadius: '6px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Database size={15} color="#cccccc" />
              <strong style={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                VOLATILE LOCAL BUFFER
              </strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888888', lineHeight: 1.5 }}>
              Queue depth: <strong style={{ color: '#ffffff' }}>{networkState === 'OFFLINE' || networkState === 'RECONNECTING' ? offlineQueue.length : 0} events</strong>. High-reliability queue preserved in client memory until gateway confirmation.
            </div>
          </div>
        </div>
      </div>

      <div className="mono-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.04em' }}>
          LOCAL TELEMETRY QUEUE LOG
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {networkState === 'OFFLINE' || networkState === 'RECONNECTING' ? (
            offlineQueue.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#0d0d0d',
                  border: '1px solid #222222',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>[{item.id}]</span>
                  <span style={{ color: '#cccccc' }}>{item.type}</span>
                  <span style={{ color: '#777777' }}>{item.bus}</span>
                  <span style={{ color: '#555555' }}>{item.time}</span>
                </div>
                <span className="phase-badge" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  {item.status}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: '28px', textAlign: 'center', color: '#cccccc', background: '#0d0d0d', border: '1px solid #222222', borderRadius: '4px', fontSize: '0.85rem' }}>
              ✓ All buffered telemetry events acknowledged and synchronized with VSB central dispatch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
