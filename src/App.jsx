// FILE: src/App.jsx
// PURPOSE: Root application component coordinating AuthProvider, routing between Phase 1 core views and Phase 2 role-protected views, and navigation testbeds.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/main.jsx

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import CommandCenterHeader from './components/CommandCenterHeader';
import AppSidebar from './components/AppSidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Core System Views
import OpeningPage from './pages/OpeningPage';
import LoadingPage from './pages/LoadingPage';
import Error401Page from './pages/Error401Page';
import Error403Page from './pages/Error403Page';
import Error404Page from './pages/Error404Page';
import Error500Page from './pages/Error500Page';
import Error503Page from './pages/Error503Page';
import NetworkErrorDemoPage from './pages/NetworkErrorDemoPage';
import CameraStateDemoPage from './pages/CameraStateDemoPage';

// Authentication & Protected Role Views
import LoginPage from './pages/LoginPage';
import UnifiedDashboard from './pages/UnifiedDashboard';
import RoleLandingPage from './pages/protected/RoleLandingPage';
import TransportMasterPage from './pages/admin/TransportMasterPage';
import StudentManagementPage from './pages/admin/StudentManagementPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import CameraManagementPage from './pages/admin/CameraManagementPage';
import DriverVerificationDashboard from './pages/admin/DriverVerificationDashboard';
import BiometricEnrollmentPage from './pages/admin/BiometricEnrollmentPage';
import BoardingVerificationDashboard from './pages/admin/BoardingVerificationDashboard';
import AlertsDashboard from './pages/admin/AlertsDashboard';
import StopAssignmentPage from './pages/admin/StopAssignmentPage';
import WrongStopDetectionDashboard from './pages/admin/WrongStopDetectionDashboard';
import LiveMapDashboard from './pages/admin/LiveMapDashboard';
import RouteProgressDashboard from './pages/admin/RouteProgressDashboard';
import LiveAnalyticsDashboard from './pages/admin/LiveAnalyticsDashboard';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('opening');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  const showSidebar = Boolean(user && !['opening', 'loading', 'login'].includes(currentPage));

  // Hash-based direct view access for testing (e.g. #404, #network-demo, #camera-demo)
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) {
        setCurrentPage(hash);
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigateToRole = (role) => {
    // Default institutional landing page is the Unified Dashboard for all authenticated roles
    setCurrentPage('dashboard');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      // Core Entry & Diagnostic
      case 'opening':
        return <OpeningPage onProceed={() => setCurrentPage('loading')} onEnter={() => setCurrentPage('loading')} />;
      case 'loading':
        return (
          <LoadingPage 
            onComplete={() => {
              if (user) {
                setCurrentPage('dashboard');
              } else {
                setCurrentPage('login');
              }
            }} 
          />
        );

      // System Diagnostics & Subsystem Views
      case 'camera-demo':
        return <CameraStateDemoPage />;
      case 'network-demo':
        return <NetworkErrorDemoPage />;

      // HTTP & Authorization Error Pages
      case '401':
        return <Error401Page onNavigate={setCurrentPage} />;
      case '403':
        return <Error403Page onNavigate={setCurrentPage} currentRole={user?.role || 'UNAUTHENTICATED'} />;
      case '404':
        return <Error404Page onNavigate={setCurrentPage} />;
      case '500':
        return <Error500Page onNavigate={setCurrentPage} />;
      case '503':
        return <Error503Page onNavigate={setCurrentPage} />;

      // Authentication
      case 'login':
        return (
          <LoginPage 
            onLoginSuccess={(authedUser) => {
              setCurrentPage('dashboard');
            }} 
          />
        );

      // Unified Operations Center Dashboard (Universal Default for all authenticated users)
      case 'dashboard':
      case 'unified-dashboard':
      case '/dashboard':
      case 'admin/dashboard':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER', 'STUDENT']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <UnifiedDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      // Institutional Role-Protected Portals
      case 'transport-master':
      case 'admin/transport':
      case 'admin/transport-master':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <TransportMasterPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'student-management':
      case 'admin/students':
      case 'admin/student-management':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <StudentManagementPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'staff-management':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <StaffManagementPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'camera-management':
      case 'admin/cameras':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <CameraManagementPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'driver-verification':
      case 'admin/driver-verification':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <DriverVerificationDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'biometric-enrollment':
      case 'admin/biometric-enrollment':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <BiometricEnrollmentPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'boarding':
      case 'boarding-verification':
      case 'admin/boarding':
      case 'admin/boarding-verification':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <BoardingVerificationDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'alerts':
      case 'alerts-dashboard':
      case 'admin/alerts':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <AlertsDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'stop-assignment':
      case 'admin/stop-assignment':
      case 'admin/stop-allocations':
        return (
          <ProtectedRoute
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']}
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <StopAssignmentPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'wrong-stop-detection':
      case 'admin/wrong-stop-detection':
      case 'admin/stop-alerts':
        return (
          <ProtectedRoute
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE']}
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <WrongStopDetectionDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'live-map':
      case 'admin/live-map':
      case 'tracking':
      case 'live-tracking':
        return (
          <ProtectedRoute
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'STUDENT']}
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <LiveMapDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'route-progress':
      case 'admin/route-progress':
      case 'progress':
        return (
          <ProtectedRoute
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE']}
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <RouteProgressDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'live-analytics':
      case 'admin/live-analytics':
      case 'transit-analytics':
        return (
          <ProtectedRoute
            allowedRoles={['ADMIN', 'TRANSPORT_STAFF']}
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <LiveAnalyticsDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'admin':
        return (
          <ProtectedRoute 
            allowedRoles={['ADMIN']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <UnifiedDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'transport-staff':
        return (
          <ProtectedRoute 
            allowedRoles={['TRANSPORT_STAFF']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <UnifiedDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'bus-in-charge':
        return (
          <ProtectedRoute 
            allowedRoles={['BUS_IN_CHARGE']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <UnifiedDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'driver':
        return (
          <ProtectedRoute 
            allowedRoles={['DRIVER']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <UnifiedDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      case 'student':
        return (
          <ProtectedRoute 
            allowedRoles={['STUDENT']} 
            onNavigateToLogin={() => setCurrentPage('login')}
            onNavigate={setCurrentPage}
          >
            <UnifiedDashboard onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );

      default:
        return <OpeningPage onProceed={() => setCurrentPage('loading')} onEnter={() => setCurrentPage('loading')} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      {/* Top Institutional Header */}
      <CommandCenterHeader 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        showSidebarToggle={showSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Workspace Area: Sidebar + Main Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {showSidebar && (
          <AppSidebar 
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(prev => !prev)}
          />
        )}

        {/* Main Page Content Area */}
        <main style={{ flex: 1, minWidth: 0, position: 'relative', overflowY: 'auto' }}>
          {renderCurrentPage()}
        </main>
      </div>

      {/* Persistent Institutional Footer */}
      <footer
        style={{
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>V.S.B. ENGINEERING COLLEGE</strong> • Department of AI & DS
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Institutional Transport Telemetry Architecture</span>
          <span style={{ color: 'var(--border-default)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>BUILD: 2026.1.0-ENTERPRISE</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
