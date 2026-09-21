import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Cpu, Radar, Bus, Radio } from 'lucide-react';

export default function OpeningPage({ onEnter, onProceed }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const handleAction = onEnter || onProceed;

  return (
    <div className="opening-page-wrapper">
      <div className="opening-hero-grid">
        
        {/* Left Column: Institutional Brand & Command Entry (50% Width) */}
        <div className="opening-left-col">
          <div className="mono-card">
            
            {/* Institution Brand Badge */}
            <div style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
              <div 
                style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '50%',
                  margin: '0 auto',
                  padding: '3px',
                  background: '#222222',
                  border: '1px solid #444444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
                }}
              >
                <img 
                  src="/college-logo.jpg" 
                  alt="V.S.B. Engineering College Crest" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#ffffff' }}
                />
              </div>
            </div>

            {/* College Name & Department */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '0.4rem'
              }}>
                V.S.B. ENGINEERING COLLEGE
              </h2>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '4px 12px',
                background: '#1c1c1c',
                border: '1px solid #333333',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#d1d1d1',
                letterSpacing: '0.05em'
              }}>
                <Cpu size={13} color="#ffffff" />
                <span>DEPARTMENT OF AI & DS</span>
              </div>
            </div>

            {/* Project Title & Subtitle */}
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.35rem)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '0.35rem'
            }}>
              BUS STUDENTS TRACKER
            </h1>

            <div style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.25em',
              color: '#a0a0a0',
              textTransform: 'uppercase',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid #222222',
              marginBottom: '1.25rem',
              width: '75%'
            }}>
              TRACKER
            </div>

            {/* Official Opening Text */}
            <p style={{
              fontSize: '1.1rem',
              fontWeight: 500,
              color: '#ffffff',
              marginBottom: '1.75rem',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.01em'
            }}>
              Welcome to VSB BST
            </p>

            {/* Core System Telemetry Capabilities */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <div style={{
                background: '#111111',
                border: '1px solid #282828',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem'
              }}>
                <Radar size={16} color="#ffffff" style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '0.68rem', color: '#888888', fontFamily: 'var(--font-mono)' }}>VISION TELEMETRY</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>Edge Verified</div>
              </div>

              <div style={{
                background: '#111111',
                border: '1px solid #282828',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem'
              }}>
                <ShieldCheck size={16} color="#ffffff" style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '0.68rem', color: '#888888', fontFamily: 'var(--font-mono)' }}>STUDENT SAFETY</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>Roster Guard</div>
              </div>

              <div style={{
                background: '#111111',
                border: '1px solid #282828',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem'
              }}>
                <Bus size={16} color="#ffffff" style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '0.68rem', color: '#888888', fontFamily: 'var(--font-mono)' }}>FLEET CONTROL</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>Command Active</div>
              </div>
            </div>

            {/* Enter Action */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                className="mono-btn mono-btn-primary"
                style={{ width: '100%', maxWidth: '340px', padding: '0.85rem 2rem', fontSize: '0.9rem' }}
                onClick={handleAction}
              >
                <span>ENTER COMMAND CENTER</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Responsive Bus Fleet Hero Image (50% Width) */}
        <div className="opening-right-col">
          <div className="opening-image-frame">
            
            {/* Real Fleet Image with smooth fade-in */}
            <img 
              src="/bus-fleet.jpg" 
              alt="Fleet of institutional transport buses at V.S.B. Engineering College" 
              className="opening-fleet-img"
              style={{
                opacity: imgLoaded ? 1 : 0,
                filter: 'brightness(0.92) contrast(1.05)'
              }}
              onLoad={() => setImgLoaded(true)}
            />

            {/* Subtle Vignette / Dark Theme Overlay */}
            <div className="opening-image-vignette" />

            {/* Top Fleet Status Badge */}
            <div className="opening-image-badge">
              <Radio size={13} color="#ffffff" className="mono-dot-pulse" />
              <span>FLEET COMMAND • ACTIVE LOGISTICS</span>
            </div>

            {/* Bottom Caption & Institutional Overlay */}
            <div className="opening-image-caption-panel">
              <div>
                <div style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#a0a0a0',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  TRANSPORT DIVISION
                </div>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em'
                }}>
                  V.S.B. College Bus Fleet
                </div>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: '#ffffff',
                letterSpacing: '0.04em'
              }}>
                <span className="mono-indicator-dot mono-dot-pulse" style={{ width: '6px', height: '6px' }} />
                <span>MONITORED</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

