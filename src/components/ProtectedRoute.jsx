// FILE: src/components/ProtectedRoute.jsx
// PURPOSE: Route guard enforcing authentication state and role permissions, redirecting unauthenticated users to login and unauthorized roles to the 403 page.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/App.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Error403Page from '../pages/Error403Page';

export default function ProtectedRoute({
  allowedRoles,
  onNavigateToLogin,
  onNavigate,
  children
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--text-muted)'
      }}>
        <div className="mono-spinner" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
          VERIFYING ROLE PERMISSION & SESSION INTEGRITY...
        </span>
      </div>
    );
  }

  // If unauthenticated: redirect to login
  if (!isAuthenticated || !user) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div className="error-view-card" style={{ maxWidth: '480px' }}>
          <div className="error-badge-mono">AUTHENTICATION REQUIRED</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-pure)', margin: '16px 0 8px' }}>
            SESSION NOT DETECTED
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
            This application area requires active credentials. Please log in with your authorized institutional account.
          </p>
          <button
            onClick={onNavigateToLogin}
            className="mono-btn mono-btn-primary"
            style={{ width: '100%' }}
          >
            [ GO TO LOGIN PORTAL ]
          </button>
        </div>
      </div>
    );
  }

  // If role is not permitted: show verified 403 Forbidden page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Error403Page
        onNavigate={onNavigate}
        currentRole={user.role}
        requiredRole={allowedRoles.join(', ')}
      />
    );
  }

  // Authorized: render protected content
  return <>{children}</>;
}
