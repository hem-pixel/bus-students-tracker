// FILE: src/components/WebcamCapture.jsx
// PURPOSE: Real laptop/USB camera capture component with device enumeration, frame capture to Base64 JPEG, and monochrome HUD diagnostics.
// INSTITUTION: V.S.B. ENGINEERING COLLEGE — Department of AI & DS
// COLOR THEME: Strict Monochrome Dark (#080808, #121212, #ffffff, #00AA00, #FF6600, #AA0000). NO BLUE ACCENTS.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Video, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Maximize2,
  Sliders
} from 'lucide-react';

/**
 * Camera States
 * IDLE        → Initial standby
 * REQUESTING  → Waiting for browser permission
 * ACTIVE      → Video stream active and playing
 * DENIED      → Permission denied by user/browser
 * NO_DEVICE   → No video input hardware found
 * ERROR       → Stream error / track unreadable
 */

export default function WebcamCapture({
  onCapture = null,
  showCaptureButton = true,
  height = '100%',
  width = '100%',
  cameraId = null,
  captureLabel = 'CAPTURE FRAME',
  overlayTitle = 'EDGE VISION FEED',
  mirrored = true
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraState, setCameraState] = useState('IDLE'); // 'IDLE' | 'REQUESTING' | 'ACTIVE' | 'DENIED' | 'NO_DEVICE' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(cameraId || '');
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState(null);
  const [flashActive, setFlashActive] = useState(false);

  // Stop active media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[WebcamCapture] Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Enumerate video input devices
  const enumerateVideoDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(cameraId || videoInputs[0].deviceId);
      }
      return videoInputs;
    } catch (err) {
      console.warn('[WebcamCapture] Device enumeration failed:', err);
      return [];
    }
  }, [cameraId, selectedDeviceId]);

  // Request camera and attach to video element
  const startCamera = useCallback(async (deviceIdToUse = null) => {
    stopStream();
    setErrorMessage('');
    setCameraState('REQUESTING');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('ERROR');
      setErrorMessage('MediaDevices API not supported in this browser or environment (requires HTTPS or localhost).');
      return;
    }

    const targetId = deviceIdToUse || selectedDeviceId || cameraId;
    const constraints = {
      video: targetId 
        ? { deviceId: { exact: targetId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraState('ACTIVE');
          }).catch((playErr) => {
            console.warn('[WebcamCapture] Autoplay thwarted:', playErr);
            setCameraState('ACTIVE');
          });
        };
      }

      // Re-enumerate to get human-readable device labels now that permission was granted
      await enumerateVideoDevices();
    } catch (err) {
      console.error('[WebcamCapture] Camera access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('DENIED');
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser URL bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('NO_DEVICE');
        setErrorMessage('No camera hardware found on this system. Please connect a USB webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraState('ERROR');
        setErrorMessage('Camera is currently locked by another application or tab.');
      } else {
        setCameraState('ERROR');
        setErrorMessage(err.message || 'Unable to establish video stream.');
      }
    }
  }, [selectedDeviceId, cameraId, stopStream, enumerateVideoDevices]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera(cameraId);
    return () => {
      stopStream();
    };
  }, [cameraId, startCamera, stopStream]);

  // Handle camera switch
  const handleDeviceChange = (e) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    startCamera(newId);
  };

  // Capture frame as Base64 JPEG
  const handleCaptureFrame = () => {
    if (!videoRef.current || cameraState !== 'ACTIVE') return;

    setIsCapturing(true);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (mirrored) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        
        // Export high quality JPEG
        const base64Data = canvas.toDataURL('image/jpeg', 0.92);
        setLastCapturedImage(base64Data);

        if (onCapture) {
          onCapture(base64Data);
        }
      }
    } catch (err) {
      console.error('[WebcamCapture] Frame capture failed:', err);
      setErrorMessage('Frame extraction failed: ' + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div 
      className="webcam-capture-container"
      style={{
        width,
        height,
        position: 'relative',
        background: '#080808',
        border: '1px solid var(--border-strong)',
        borderRadius: '2px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Hidden off-screen canvas for frame extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Telemetry Bar */}
      <div
        style={{
          background: 'rgba(18, 18, 18, 0.92)',
          borderBottom: '1px solid var(--border-default)',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          zIndex: 10,
          fontFamily: 'var(--font-mono)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={13} color="var(--text-pure)" />
          <span style={{ fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-pure)' }}>
            {overlayTitle}
          </span>
          {cameraState === 'ACTIVE' && (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#00AA00',
                fontWeight: 700
              }}
            >
              <span className="mono-indicator-dot" style={{ background: '#00AA00', width: '6px', height: '6px' }} />
              LIVE
            </span>
          )}
        </div>

        {/* Device selector if multiple cameras detected */}
        {devices.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={12} color="var(--text-muted)" />
            <select
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              style={{
                background: '#121212',
                color: '#ffffff',
                border: '1px solid var(--border-default)',
                padding: '2px 6px',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                maxWidth: '160px'
              }}
            >
              {devices.map((device, idx) => (
                <option key={device.deviceId || idx} value={device.deviceId}>
                  {device.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Video Viewport */}
      <div 
        style={{ 
          flex: 1, 
          position: 'relative', 
          background: '#000000', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Live Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirrored ? 'scaleX(-1)' : 'none',
            display: cameraState === 'ACTIVE' ? 'block' : 'none'
          }}
        />

        {/* Optical Scanning HUD Grid Overlay (Visible when Active) */}
        {cameraState === 'ACTIVE' && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
            }}
          >
            {/* Corner Bracket Reticles */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '18px', height: '18px', borderTop: '2px solid #ffffff', borderLeft: '2px solid #ffffff' }} />
              <div style={{ width: '18px', height: '18px', borderTop: '2px solid #ffffff', borderRight: '2px solid #ffffff' }} />
            </div>

            {/* Center Biometric Target Reticle */}
            <div 
              style={{
                alignSelf: 'center',
                width: '160px',
                height: '210px',
                border: '1px dashed rgba(255, 255, 255, 0.35)',
                borderRadius: '50% 50% 45% 45%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <div style={{ width: '6px', height: '6px', background: '#ffffff', borderRadius: '50%' }} />
              <span 
                style={{
                  position: 'absolute',
                  bottom: '-22px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.1em'
                }}
              >
                ALIGN FACE
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '18px', height: '18px', borderBottom: '2px solid #ffffff', borderLeft: '2px solid #ffffff' }} />
              <div style={{ width: '18px', height: '18px', borderBottom: '2px solid #ffffff', borderRight: '2px solid #ffffff' }} />
            </div>
          </div>
        )}

        {/* Shutter Flash Effect */}
        {flashActive && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: '#ffffff',
              opacity: 0.8,
              zIndex: 30,
              pointerEvents: 'none',
              transition: 'opacity 0.15s ease-out'
            }}
          />
        )}

        {/* State Diagnostic Displays */}
        {cameraState === 'REQUESTING' && (
          <div style={{ textAlign: 'center', padding: '24px', zIndex: 5 }}>
            <RefreshCw size={28} color="#ffffff" className="spin-slow" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              INITIALIZING HARDWARE LINK
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Requesting browser camera permissions...
            </div>
          </div>
        )}

        {cameraState === 'DENIED' && (
          <div style={{ textAlign: 'center', padding: '24px', maxWidth: '380px', zIndex: 5 }}>
            <ShieldAlert size={36} color="#AA0000" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              PERMISSION DENIED
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '8px 0 16px' }}>
              {errorMessage || 'Camera access was blocked by browser security policy.'}
            </p>
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="mono-btn mono-btn-primary"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              <RefreshCw size={13} />
              <span>RETRY PERMISSION</span>
            </button>
          </div>
        )}

        {cameraState === 'NO_DEVICE' && (
          <div style={{ textAlign: 'center', padding: '24px', maxWidth: '380px', zIndex: 5 }}>
            <CameraOff size={36} color="#FF6600" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              NO CAMERA DETECTED
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '8px 0 16px' }}>
              {errorMessage || 'No video capture devices were detected on this machine.'}
            </p>
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="mono-btn"
              style={{ fontSize: '0.75rem', padding: '6px 14px', border: '1px solid var(--border-strong)' }}
            >
              <RefreshCw size={13} />
              <span>SCAN BUS / USB PORTS</span>
            </button>
          </div>
        )}

        {cameraState === 'ERROR' && (
          <div style={{ textAlign: 'center', padding: '24px', maxWidth: '380px', zIndex: 5 }}>
            <AlertTriangle size={36} color="#AA0000" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
              CAMERA SUBSYSTEM ERROR
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '8px 0 16px' }}>
              {errorMessage}
            </p>
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="mono-btn"
              style={{ fontSize: '0.75rem', padding: '6px 14px', border: '1px solid var(--border-strong)' }}
            >
              <RefreshCw size={13} />
              <span>RE-INITIALIZE</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Command Strip */}
      {showCaptureButton && (
        <div
          style={{
            background: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-default)',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              FEED: {cameraState === 'ACTIVE' ? '1280x720 30FPS' : 'OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => startCamera(selectedDeviceId)}
              className="mono-btn"
              style={{
                fontSize: '0.72rem',
                padding: '6px 10px',
                background: 'var(--bg-void)',
                border: '1px solid var(--border-default)'
              }}
              title="Refresh Camera Link"
            >
              <RefreshCw size={12} />
            </button>

            <button
              onClick={handleCaptureFrame}
              disabled={cameraState !== 'ACTIVE' || isCapturing}
              className="mono-btn mono-btn-primary"
              style={{
                fontSize: '0.78rem',
                padding: '6px 16px',
                fontWeight: 700,
                opacity: cameraState === 'ACTIVE' ? 1 : 0.5,
                cursor: cameraState === 'ACTIVE' ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Camera size={14} />
              <span>{captureLabel}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
