import React from 'react';
import { Camera, VideoOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function CameraOfflineState({
  title = "CAMERA 03",
  cameraName,
  slotId = "CAM-BUS-04-FRONT",
  status = "offline", // 'online' | 'connecting' | 'offline' | 'error'
  resolution = "1080p @ 30fps",
  onStatusChange,
  onRetry
}) {
  const displayTitle = cameraName || title;

  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '3px 9px',
            background: '#1a1a1a',
            border: '1px solid #ffffff',
            borderRadius: '3px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#ffffff',
            fontWeight: 700
          }}>
            ● ONLINE
          </span>
        );
      case 'connecting':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '3px 9px',
            background: '#161616',
            border: '1px solid #777777',
            borderRadius: '3px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#cccccc',
            fontWeight: 600
          }}>
            ◌ CONNECTING
          </span>
        );
      case 'error':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '3px 9px',
            background: '#222222',
            border: '1px solid #999999',
            borderRadius: '3px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#ffffff',
            fontWeight: 700
          }}>
            ✕ ERROR
          </span>
        );
      case 'offline':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '3px 9px',
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '3px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#777777',
            fontWeight: 600
          }}>
            ○ OFFLINE
          </span>
        );
    }
  };

  return (
    <div style={{
      background: '#101010',
      border: '1px solid #282828',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid #222222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#141414'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Camera size={16} color="#ffffff" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
            {displayTitle}
          </span>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Viewport */}
      <div style={{
        position: 'relative',
        height: '240px',
        background: '#090909',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        {/* Subtle grid crosshair markers */}
        <span style={{ position: 'absolute', top: 10, left: 10, width: 8, height: 8, borderTop: '1px solid #444', borderLeft: '1px solid #444' }} />
        <span style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderTop: '1px solid #444', borderRight: '1px solid #444' }} />
        <span style={{ position: 'absolute', bottom: 10, left: 10, width: 8, height: 8, borderBottom: '1px solid #444', borderLeft: '1px solid #444' }} />
        <span style={{ position: 'absolute', bottom: 10, right: 10, width: 8, height: 8, borderBottom: '1px solid #444', borderRight: '1px solid #444' }} />

        {/* State Content */}
        {status === 'online' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#1c1c1c',
              border: '1px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.25rem'
            }}>
              <CheckCircle2 size={24} color="#ffffff" />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em' }}>
              CAMERA ONLINE
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#999999' }}>
              RTSP STREAM NOMINAL • RTSP://FLEET-HUB/{slotId}
            </div>
          </div>
        )}

        {status === 'connecting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#1c1c1c',
              border: '1px solid #888888',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.25rem'
            }}>
              <RefreshCw size={24} color="#ffffff" style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em' }}>
              CAMERA CONNECTING
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#888888' }}>
              Attempting RTSP handshake with vehicle IoT unit...
            </div>
          </div>
        )}

        {status === 'offline' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#161616',
              border: '1px solid #444444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.25rem'
            }}>
              <VideoOff size={24} color="#777777" />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em' }}>
              CAMERA OFFLINE
            </div>
            <p style={{ fontSize: '0.76rem', color: '#888888', maxWidth: '300px', margin: '0 auto', lineHeight: 1.4 }}>
              Signal lost from vehicle camera module. Sensor is powered down or disconnected.
            </p>
            {onRetry && (
              <button 
                type="button" 
                className="mono-btn" 
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem', marginTop: '0.25rem' }}
                onClick={onRetry}
              >
                <RefreshCw size={12} /> Probe Sensor
              </button>
            )}
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#222222',
              border: '1px solid #777777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.25rem'
            }}>
              <ShieldAlert size={24} color="#ffffff" />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.05em' }}>
              CAMERA ERROR
            </div>
            <p style={{ fontSize: '0.76rem', color: '#aaaaaa', maxWidth: '300px', margin: '0 auto', lineHeight: 1.4 }}>
              Driver I/O fault (ERR_SENSOR_TIMEOUT). Hardware interface unresponsive.
            </p>
            {onRetry && (
              <button 
                type="button" 
                className="mono-btn" 
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem', marginTop: '0.25rem', borderColor: '#ffffff', color: '#ffffff' }}
                onClick={onRetry}
              >
                <RefreshCw size={12} /> Reset Driver Interface
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer info & selector */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid #222222',
        background: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)',
        color: '#777777'
      }}>
        <div>
          <span>SLOT: </span>
          <span style={{ color: '#ffffff' }}>{slotId}</span>
        </div>
        <div>{resolution}</div>
        {onStatusChange && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {['online', 'connecting', 'offline', 'error'].map((s) => {
              const isActive = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  style={{
                    background: isActive ? '#000000' : '#1a1a1a',
                    color: isActive ? '#ffffff' : '#888888',
                    border: isActive ? '1px solid #ffffff' : '1px solid #333333',
                    borderRadius: '2px',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  {s.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
