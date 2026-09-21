import React, { useState } from 'react';
import { Camera, Radio, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import CameraOfflineState from '../components/CameraOfflineState';

export default function CameraStateDemoPage() {
  const [camera1State, setCamera1State] = useState('offline');
  const [camera2State, setCamera2State] = useState('connecting');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' }}>
      <div className="mono-card" style={{ marginBottom: '24px' }}>
        <div className="phase-badge" style={{ marginBottom: '12px' }}>
          HARDWARE & SENSOR STATE SIMULATOR
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
          On-Board Optical Sensor States
        </h1>
        <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginTop: '6px', marginBottom: 0, lineHeight: 1.6 }}>
          Simulating real-world vehicle camera feed states: Online streaming, Connecting synchronization, Offline disconnect, and Sensor hardware error.
        </p>

        <div style={{ marginTop: '16px', padding: '12px 16px', background: '#0d0d0d', border: '1px solid #262626', borderRadius: '6px', fontSize: '0.8rem', color: '#888888', lineHeight: 1.5 }}>
          <strong style={{ color: '#ffffff' }}>OPTICAL SENSOR SUBSYSTEM:</strong> Live WebRTC streaming and computer vision inference run on edge bus hardware. This view establishes the resilient UI states, sensor diagnostics, and reconnection controls for all vehicle cameras.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        {/* Camera Feed 1: Bus 08 - Front Entry Lens */}
        <div className="mono-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                Bus 08 — Front Entry Lens
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#666666', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                SLOT: CAM_01_PRIMARY (Wide Angle AI Gate)
              </div>
            </div>
            <span className="phase-badge" style={{ fontSize: '0.7rem' }}>
              STATE: {camera1State.toUpperCase()}
            </span>
          </div>

          <CameraOfflineState
            cameraName="Bus 08 — Front Entry Lens"
            status={camera1State}
            onRetry={() => {
              setCamera1State('connecting');
              setTimeout(() => setCamera1State('online'), 1500);
            }}
          />

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#777777', marginRight: '4px', fontFamily: 'var(--font-mono)' }}>
              FORCE STATE:
            </span>
            <button
              className={`mono-btn ${camera1State === 'online' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera1State('online')}
            >
              Online
            </button>
            <button
              className={`mono-btn ${camera1State === 'connecting' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera1State('connecting')}
            >
              Connecting
            </button>
            <button
              className={`mono-btn ${camera1State === 'offline' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera1State('offline')}
            >
              Offline
            </button>
            <button
              className={`mono-btn ${camera1State === 'error' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera1State('error')}
            >
              Error
            </button>
          </div>
        </div>

        {/* Camera Feed 2: Bus 08 - Interior Cabin Lens */}
        <div className="mono-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                Bus 08 — Cabin Overhead Lens
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#666666', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                SLOT: CAM_02_CABIN (Infrared Secondary)
              </div>
            </div>
            <span className="phase-badge" style={{ fontSize: '0.7rem' }}>
              STATE: {camera2State.toUpperCase()}
            </span>
          </div>

          <CameraOfflineState
            cameraName="Bus 08 — Cabin Overhead Lens"
            status={camera2State}
            onRetry={() => {
              setCamera2State('connecting');
              setTimeout(() => setCamera2State('online'), 1500);
            }}
          />

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#777777', marginRight: '4px', fontFamily: 'var(--font-mono)' }}>
              FORCE STATE:
            </span>
            <button
              className={`mono-btn ${camera2State === 'online' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera2State('online')}
            >
              Online
            </button>
            <button
              className={`mono-btn ${camera2State === 'connecting' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera2State('connecting')}
            >
              Connecting
            </button>
            <button
              className={`mono-btn ${camera2State === 'offline' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera2State('offline')}
            >
              Offline
            </button>
            <button
              className={`mono-btn ${camera2State === 'error' ? 'mono-btn-primary' : ''}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={() => setCamera2State('error')}
            >
              Error
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
