import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, RotateCcw, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { DIAGNOSTIC_PROBES, executeSystemDiagnostics } from '../services/diagnosticService';

export default function LoadingPage({ onComplete }) {
  const [probeStates, setProbeStates] = useState(() => {
    const initial = {};
    DIAGNOSTIC_PROBES.forEach(p => {
      initial[p.id] = { id: p.id, status: 'PENDING', name: p.name, detail: p.detail };
    });
    return initial;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState('INITIALIZING'); // 'INITIALIZING' | 'ALL_PASSED' | 'FAILED'

  const runAllChecks = useCallback(async () => {
    setIsRunning(true);
    setOverallStatus('INITIALIZING');

    // Reset all to pending
    const reset = {};
    DIAGNOSTIC_PROBES.forEach(p => {
      reset[p.id] = { id: p.id, status: 'PENDING', name: p.name, detail: p.detail };
    });
    setProbeStates(reset);

    const outcome = await executeSystemDiagnostics((probeId, state) => {
      setProbeStates(prev => ({
        ...prev,
        [probeId]: state
      }));
    });

    setIsRunning(false);
    if (outcome.allPassed) {
      setOverallStatus('ALL_PASSED');
    } else {
      setOverallStatus('FAILED');
    }
  }, []);

  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  const passedCount = Object.values(probeStates).filter(p => p.status === 'PASSED').length;
  const isComplete = overallStatus === 'ALL_PASSED';

  return (
    <div className="page-container-center">
      <div className="mono-card" style={{ maxWidth: '620px', width: '100%', position: 'relative' }}>
        
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
            V.S.B. Transport Telemetry & Sensor Integrity Probes
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
          gap: '1rem'
        }}>
          {DIAGNOSTIC_PROBES.map(probe => {
            const state = probeStates[probe.id] || { status: 'PENDING' };
            const isChecked = state.status === 'PASSED';
            const isChecking = state.status === 'CHECKING';
            const isFailed = state.status === 'FAILED';
            const isPending = state.status === 'PENDING';

            return (
              <div 
                key={probe.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: isPending ? 0.38 : 1,
                  transition: 'opacity 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <span style={{
                    color: isChecked ? '#ffffff' : isFailed ? '#ff4d4d' : isChecking ? '#d1d1d1' : '#555555',
                    fontWeight: 700,
                    width: '24px',
                    textAlign: 'center',
                    fontSize: '0.95rem',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.3'
                  }}>
                    {isChecked ? '[✓]' : isFailed ? '[✕]' : isChecking ? '[●]' : '[ ]'}
                  </span>
                  <div>
                    <div style={{
                      color: isChecked ? '#ffffff' : isFailed ? '#ff6b6b' : isChecking ? '#ffffff' : '#777777',
                      fontSize: '0.85rem',
                      fontWeight: isChecking || isChecked ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>{probe.name}</span>
                      {state.latencyMs !== undefined && isChecked && (
                        <span style={{ fontSize: '0.7rem', color: '#888888', fontWeight: 400 }}>
                          ({state.latencyMs}ms)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#666666', marginTop: '0.15rem' }}>
                      {state.status === 'FAILED' ? (
                        <span style={{ color: '#ff6666' }}>Error: {state.error || 'Check failed'}</span>
                      ) : (
                        probe.detail
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '2px',
                    background: isChecked ? '#1a2e1a' : isFailed ? '#331111' : isChecking ? '#222222' : 'transparent',
                    color: isChecked ? '#4ade80' : isFailed ? '#ff4d4d' : isChecking ? '#ffffff' : '#555555'
                  }}>
                    {isChecked ? 'PASS' : isFailed ? 'FAIL' : isChecking ? 'PROBING' : 'WAIT'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Line */}
        <div style={{
          padding: '1rem',
          background: overallStatus === 'FAILED' ? '#1c1010' : '#141414',
          border: `1px solid ${overallStatus === 'FAILED' ? '#442222' : '#282828'}`,
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.75rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#777777', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            SYSTEM INTEGRITY REPORT ({passedCount}/{DIAGNOSTIC_PROBES.length} PASS):
          </div>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: overallStatus === 'FAILED' ? '#ff6b6b' : '#ffffff',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isRunning && (
              <RefreshCw size={14} className="spin" style={{ color: '#ffffff' }} />
            )}
            {overallStatus === 'ALL_PASSED' && (
              <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
            )}
            {overallStatus === 'FAILED' && (
              <AlertTriangle size={16} style={{ color: '#ff4d4d' }} />
            )}
            <span>
              {overallStatus === 'ALL_PASSED'
                ? 'ALL SUBSYSTEMS NOMINAL. READY FOR OPERATION.'
                : overallStatus === 'FAILED'
                ? 'SYSTEM INITIALIZATION FAILURE. PLEASE RETRY OR VERIFY BACKEND.'
                : 'PROBING LIVE TELEMETRY & GATEWAYS...'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="mono-btn"
            onClick={runAllChecks}
            disabled={isRunning}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <RotateCcw size={14} className={isRunning ? 'spin' : ''} />
            <span>{isRunning ? 'Probing...' : 'Re-run Diagnostics'}</span>
          </button>

          <button
            type="button"
            className="mono-btn mono-btn-primary"
            onClick={onComplete}
            disabled={!isComplete || isRunning}
            style={{
              padding: '0.65rem 1.4rem',
              opacity: isComplete ? 1 : 0.45,
              cursor: isComplete ? 'pointer' : 'not-allowed'
            }}
          >
            <span>Proceed to Portal</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
