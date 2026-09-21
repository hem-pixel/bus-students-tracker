import React, { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';

const DIAGNOSTIC_ITEMS = [
  { id: 'app_core', name: 'Application Core', detail: 'Runtime kernel and memory integrity' },
  { id: 'config', name: 'Configuration', detail: 'Institutional parameters & fleet routes' },
  { id: 'session', name: 'Session', detail: 'Cryptographic token validation & role clearance' },
  { id: 'transport', name: 'Transport Services', detail: 'Edge telemetry gateway & stream daemon' },
  { id: 'camera', name: 'Camera Services', detail: 'Optical stream receivers & edge hardware buffers' }
];

export default function LoadingPage({ onComplete }) {
  const [activeStep, setActiveStep] = useState(3); // default showing transport in-progress or simulating

  useEffect(() => {
    if (activeStep < DIAGNOSTIC_ITEMS.length) {
      const timer = setTimeout(() => {
        setActiveStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  const isComplete = activeStep >= DIAGNOSTIC_ITEMS.length;

  return (
    <div className="page-container-center">
      <div className="mono-card" style={{ maxWidth: '580px', width: '100%', position: 'relative' }}>
        
        {/* Title */}
        <div style={{ borderBottom: '1px solid #222222', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase'
            }}>
              SYSTEM DIAGNOSTIC
            </h1>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#777777',
              letterSpacing: '0.05em'
            }}>
              INITIALIZATION KERNEL
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888888', marginTop: '0.25rem' }}>
            V.S.B. Transport Telemetry Initializer
          </div>
        </div>

        {/* Checklist */}
        <div style={{
          background: '#0d0d0d',
          border: '1px solid #222222',
          borderRadius: 'var(--radius-sm)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem'
        }}>
          {DIAGNOSTIC_ITEMS.map((item, idx) => {
            const isChecked = idx < activeStep;
            const isProcessing = idx === activeStep;
            const isPending = idx > activeStep;

            return (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: isPending ? 0.35 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{
                    color: isChecked ? '#ffffff' : isProcessing ? '#d1d1d1' : '#555555',
                    fontWeight: 700,
                    width: '24px',
                    textAlign: 'center',
                    fontSize: '0.95rem'
                  }}>
                    {isChecked ? '[✓]' : isProcessing ? '[●]' : '[ ]'}
                  </span>
                  <div>
                    <div style={{
                      color: isChecked ? '#e0e0e0' : isProcessing ? '#ffffff' : '#777777',
                      fontSize: '0.85rem',
                      fontWeight: isProcessing ? 700 : 500
                    }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#666666' }}>
                      {item.detail}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                  color: isChecked ? '#999999' : isProcessing ? '#ffffff' : '#444444'
                }}>
                  {isChecked ? 'READY' : isProcessing ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status Line */}
        <div style={{
          padding: '1rem',
          background: '#141414',
          border: '1px solid #282828',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.75rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#777777', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            STATUS:
          </div>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {!isComplete && (
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ffffff',
                animation: 'pulse 1.2s infinite ease-in-out'
              }} />
            )}
            {isComplete ? 'ALL SYSTEMS NOMINAL. READY FOR OPERATION.' : 'INITIALIZING SYSTEM...'}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="mono-btn"
            onClick={() => setActiveStep(0)}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <RotateCcw size={14} />
            <span>Re-run Diagnostic</span>
          </button>

          {isComplete && (
            <button
              type="button"
              className="mono-btn mono-btn-primary"
              onClick={onComplete}
              style={{ padding: '0.65rem 1.4rem' }}
            >
              <span>Proceed to Portal</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
