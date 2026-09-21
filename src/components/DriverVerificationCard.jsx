// FILE: src/components/DriverVerificationCard.jsx
// PURPOSE: Institutional Driver Biometric Clearance Card for fleet dispatch verification.
// Displays scheduled driver details, real-time match confidence, liveness verification, dispatch lock state, and action triggers.

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  UserCheck, 
  UserX, 
  Eye, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Scan, 
  Bus, 
  Activity, 
  CheckCircle2, 
  XCircle,
  FileCheck2
} from 'lucide-react';

export default function DriverVerificationCard({
  bus,
  driver,
  verificationStatus, // Latest verification check object (or null)
  onInspectHud,       // Trigger to open RecognitionResultViewer modal
  onOverride,         // Trigger to open Supervisor Override modal
  onVerifyLive,       // Trigger live capture & verification
  isLoading = false
}) {
  const clearance = verificationStatus?.dispatch_clearance || 'PENDING';
  const confidenceScore = verificationStatus?.confidence_score ?? 0;
  const confidenceTier = verificationStatus?.confidence_tier || 'UNVERIFIED';
  const livenessStatus = verificationStatus?.liveness_status || 'UNKNOWN';
  const isOverridden = clearance === 'OVERRIDDEN';
  const isAllowed = clearance === 'DISPATCH_ALLOWED';
  const isBlocked = clearance === 'DISPATCH_BLOCKED';

  // Badge styles based on clearance
  const getClearanceBadge = () => {
    if (isAllowed) {
      return (
        <span 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <CheckCircle2 size={12} />
          DISPATCH ALLOWED
        </span>
      );
    }
    if (isOverridden) {
      return (
        <span 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'rgba(234, 179, 8, 0.12)',
            color: '#facc15',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <AlertTriangle size={12} />
          OVERRIDDEN
        </span>
      );
    }
    if (isBlocked) {
      return (
        <span 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <XCircle size={12} />
          DISPATCH BLOCKED
        </span>
      );
    }
    return (
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.06)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-default)',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <Lock size={12} />
        AWAITING VERIFICATION
      </span>
    );
  };

  // Confidence Tier Badge
  const getTierBadge = () => {
    switch (confidenceTier) {
      case 'VERIFIED':
        return <span style={{ color: '#4ade80', fontWeight: 700 }}>VERIFIED (&ge;90%)</span>;
      case 'LIKELY':
        return <span style={{ color: '#60a5fa', fontWeight: 700 }}>LIKELY (80-89%)</span>;
      case 'UNCERTAIN':
        return <span style={{ color: '#facc15', fontWeight: 700 }}>UNCERTAIN (70-79%)</span>;
      case 'REJECTED':
        return <span style={{ color: '#f87171', fontWeight: 700 }}>REJECTED (&lt;70%)</span>;
      default:
        return <span style={{ color: 'var(--text-muted)' }}>NOT SCANNED</span>;
    }
  };

  return (
    <div 
      className="driver-verification-card"
      style={{
        background: 'var(--bg-primary, #121212)',
        border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.4)' : isAllowed ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-default, #2a2a2a)'}`,
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* Header: Bus Info & Dispatch State */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'var(--bg-surface-elevated, #1c1c1c)',
              border: '1px solid var(--border-strong, #383838)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-pure, #fff)'
            }}
          >
            <Bus size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-pure, #fff)' }}>
                {bus?.bus_number || `Bus ${bus?.id || '?'}`}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #888)', fontFamily: 'var(--font-mono)' }}>
                {bus?.registration_number || ''}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #a0a0a0)' }}>
              Route: {bus?.route_name || bus?.route || 'Assigned Route'}
            </div>
          </div>
        </div>

        <div>
          {getClearanceBadge()}
        </div>
      </div>

      {/* Driver Identity Block */}
      <div 
        style={{
          background: 'var(--bg-void, #080808)',
          border: '1px solid var(--border-subtle, #1f1f1f)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <div 
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--bg-surface, #181818)',
            border: '1.5px solid var(--border-strong, #383838)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {driver?.photo_url ? (
            <img src={driver.photo_url} alt={driver.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserCheck size={22} color="var(--text-secondary, #888)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-pure, #fff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {driver?.name || 'Unassigned Driver'}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888)', fontFamily: 'var(--font-mono)' }}>
              EMP: {driver?.employee_id || driver?.id || 'N/A'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary, #a0a0a0)', fontFamily: 'var(--font-mono)' }}>
            <span>LIC: {driver?.license_number || 'N/A'}</span>
            <span>EXP: {driver?.years_of_experience ? `${driver.years_of_experience} yrs` : 'Verified'}</span>
          </div>
        </div>
      </div>

      {/* Biometric Verification Telemetry */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
          <span style={{ color: 'var(--text-muted, #888)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} /> Biometric Match Confidence
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {confidenceScore > 0 ? `${(confidenceScore * 100).toFixed(1)}%` : '--'}
          </span>
        </div>

        {/* Progress bar */}
        <div 
          style={{
            height: '6px',
            background: 'var(--bg-void, #080808)',
            borderRadius: '3px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle, #222)'
          }}
        >
          <div 
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, confidenceScore * 100))}%`,
              background: isBlocked ? '#ef4444' : confidenceScore >= 0.9 ? '#22c55e' : confidenceScore >= 0.8 ? '#3b82f6' : '#eab308',
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        {/* Telemetry Row: Tier + Liveness + Timestamp */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            padding: '4px 0'
          }}
        >
          <div>Tier: {getTierBadge()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Liveness:</span>
            <span 
              style={{
                fontWeight: 700,
                color: livenessStatus === 'LIVE' ? '#4ade80' : livenessStatus === 'SPOOF_RISK' ? '#f87171' : 'var(--text-muted, #888)'
              }}
            >
              {livenessStatus}
            </span>
          </div>
        </div>

        {/* Override Note / Reason if present */}
        {isOverridden && verificationStatus?.override_reason && (
          <div 
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              fontSize: '0.7rem',
              color: '#fef08a'
            }}
          >
            <strong>Supervisor Override:</strong> {verificationStatus.override_reason} ({verificationStatus.supervisor_name || 'Admin'})
          </div>
        )}

        {isBlocked && verificationStatus?.failure_reason && (
          <div 
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.7rem',
              color: '#fca5a5'
            }}
          >
            <strong>Blocked Reason:</strong> {verificationStatus.failure_reason}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div 
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: 'auto',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle, #1f1f1f)'
        }}
      >
        {/* Live Verify Trigger */}
        <button
          onClick={() => onVerifyLive && onVerifyLive(bus, driver)}
          disabled={isLoading}
          className="mono-btn"
          style={{
            flex: 1,
            fontSize: '0.72rem',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            background: 'var(--bg-void, #080808)',
            border: '1px solid var(--border-strong, #383838)',
            color: 'var(--text-pure, #fff)',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          title="Perform real-time biometric verification on this driver"
        >
          <Scan size={13} />
          <span>VERIFY LIVE</span>
        </button>

        {/* HUD Frame Viewer Trigger */}
        <button
          onClick={() => onInspectHud && onInspectHud(verificationStatus, bus, driver)}
          disabled={!verificationStatus?.hud_frame_svg && !verificationStatus?.recognition_result_id}
          className="mono-btn"
          style={{
            fontSize: '0.72rem',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            background: 'var(--bg-surface-elevated, #1c1c1c)',
            border: '1px solid var(--border-default, #2a2a2a)',
            color: 'var(--text-pure, #fff)',
            cursor: (!verificationStatus?.hud_frame_svg && !verificationStatus?.recognition_result_id) ? 'not-allowed' : 'pointer',
            opacity: (!verificationStatus?.hud_frame_svg && !verificationStatus?.recognition_result_id) ? 0.5 : 1
          }}
          title="Inspect OpenCV HUD overlay & 128-D vector breakdown"
        >
          <Eye size={13} />
          <span>HUD</span>
        </button>

        {/* Supervisor Override Trigger */}
        <button
          onClick={() => onOverride && onOverride(bus, driver, verificationStatus)}
          className="mono-btn"
          style={{
            fontSize: '0.72rem',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            background: isBlocked ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-void, #080808)',
            border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-default, #2a2a2a)'}`,
            color: isBlocked ? '#f87171' : 'var(--text-secondary, #a0a0a0)',
            cursor: 'pointer'
          }}
          title="Open manual supervisor override modal"
        >
          <Unlock size={13} />
          <span>OVERRIDE</span>
        </button>
      </div>
    </div>
  );
}
