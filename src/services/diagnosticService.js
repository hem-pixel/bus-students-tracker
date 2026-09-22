// FILE: src/services/diagnosticService.js
// PURPOSE: Real hardware and API probe client for System Initialization Diagnostics
// Hits live backend endpoints, measures true millisecond latency, and implements retry logic.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DIAGNOSTIC_PROBES = [
  {
    id: 'app_core',
    name: 'Application Core',
    detail: 'Runtime kernel and memory integrity',
    endpoint: '/health'
  },
  {
    id: 'database',
    name: 'Database Gateway',
    detail: 'Storage engine connectivity & read/write pool latency',
    endpoint: '/health/database'
  },
  {
    id: 'auth',
    name: 'Cryptographic Auth Gateway',
    detail: 'Token validation, 2FA OTP engine & policy enforcement',
    endpoint: '/health/auth'
  },
  {
    id: 'transport',
    name: 'Transport Telemetry Gateway',
    detail: 'Edge bus telemetry, routes & stop coordinate index',
    endpoint: '/health/transport'
  },
  {
    id: 'cameras',
    name: 'Camera & Optical Sensor Pipeline',
    detail: 'Camera feeds, recognition buffer & HLS stream daemon',
    endpoint: '/health/cameras'
  }
];

/**
 * Execute a single diagnostic probe with up to maxRetries.
 */
export async function runProbe(probe, maxRetries = 2) {
  let attempts = 0;
  let lastError = null;

  while (attempts <= maxRetries) {
    const t0 = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}${probe.endpoint}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });

      const latencyMs = Math.max(1, Math.round(performance.now() - t0));
      const data = await response.json().catch(() => null);

      if (response.ok) {
        return {
          id: probe.id,
          name: probe.name,
          detail: probe.detail,
          status: 'PASSED',
          latencyMs,
          data,
          attempts: attempts + 1
        };
      } else {
        lastError = new Error(data?.message || `HTTP ${response.status}`);
      }
    } catch (err) {
      lastError = err;
    }

    attempts++;
    if (attempts <= maxRetries) {
      await new Promise(res => setTimeout(res, 300 * attempts));
    }
  }

  const latencyMs = Math.round(performance.now() - performance.now());
  return {
    id: probe.id,
    name: probe.name,
    detail: probe.detail,
    status: 'FAILED',
    latencyMs,
    error: lastError?.message || 'Connection failed',
    attempts
  };
}

/**
 * Run all diagnostics sequentially, firing onUpdate for each item as it executes.
 */
export async function executeSystemDiagnostics(onUpdate) {
  const results = {};

  for (let i = 0; i < DIAGNOSTIC_PROBES.length; i++) {
    const probe = DIAGNOSTIC_PROBES[i];
    // Notify in-progress
    if (onUpdate) {
      onUpdate(probe.id, {
        id: probe.id,
        status: 'CHECKING',
        name: probe.name,
        detail: probe.detail
      });
    }

    const result = await runProbe(probe);
    results[probe.id] = result;

    if (onUpdate) {
      onUpdate(probe.id, result);
    }
  }

  const allPassed = Object.values(results).every(r => r.status === 'PASSED');
  return {
    allPassed,
    results
  };
}
