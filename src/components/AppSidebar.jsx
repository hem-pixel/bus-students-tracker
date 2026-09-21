// FILE: src/components/AppSidebar.jsx
// PURPOSE: Institutional Command Center Navigation Sidebar replacing congested top buttons.
// Provides structured, role-filtered vertical navigation for V.S.B. Engineering College Bus Students Tracker.
// PALETTE: Strict Monochrome with status indicators.

import React from 'react';
import {
  LayoutDashboard,
  Bus,
  Users,
  UserCheck,
  Camera,
  ShieldCheck,
  Fingerprint,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AppSidebar({
  currentPage,
  onNavigate,
  isCollapsed = false,
  onToggle
}) {
  const { user } = useAuth();

  if (!user) return null;

  const navGroups = [
    {
      groupTitle: 'OPS CORE',
      items: [
        {
          id: 'dashboard',
          aliases: ['unified-dashboard', '/dashboard', 'admin/dashboard'],
          label: 'Dashboard',
          shortLabel: 'DASHBOARD',
          icon: LayoutDashboard,
          roles: ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER', 'STUDENT'],
          badge: 'LIVE'
        },
        {
          id: 'alerts',
          aliases: ['alerts-dashboard', 'admin/alerts'],
          label: 'Alerts & Incidents',
          shortLabel: 'ALERTS',
          icon: AlertTriangle,
          roles: ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE']
        }
      ]
    },
    {
      groupTitle: 'FLEET & DIRECTORY',
      items: [
        {
          id: 'transport-master',
          aliases: ['admin/transport', 'admin/transport-master'],
          label: 'Transport Master',
          shortLabel: 'TRANSPORT',
          icon: Bus,
          roles: ['ADMIN', 'TRANSPORT_STAFF']
        },
        {
          id: 'student-management',
          aliases: ['admin/students', 'admin/student-management'],
          label: 'Student Directory',
          shortLabel: 'STUDENTS',
          icon: Users,
          roles: ['ADMIN', 'TRANSPORT_STAFF']
        },
        {
          id: 'staff-management',
          aliases: ['admin/staff'],
          label: 'Staff & Drivers',
          shortLabel: 'STAFF & DRV',
          icon: UserCheck,
          roles: ['ADMIN', 'TRANSPORT_STAFF']
        },
        {
          id: 'camera-management',
          aliases: ['admin/cameras'],
          label: 'Cameras & Vision',
          shortLabel: 'CAMERAS',
          icon: Camera,
          roles: ['ADMIN', 'TRANSPORT_STAFF']
        }
      ]
    },
    {
      groupTitle: 'SECURITY & CLEARANCE',
      items: [
        {
          id: 'driver-verification',
          aliases: ['admin/driver-verification'],
          label: 'Driver Clearance',
          shortLabel: 'CLEARANCE',
          icon: ShieldCheck,
          roles: ['ADMIN', 'TRANSPORT_STAFF']
        },
        {
          id: 'biometric-enrollment',
          aliases: ['admin/biometric-enrollment'],
          label: 'Biometrics AI',
          shortLabel: 'BIOMETRICS',
          icon: Fingerprint,
          roles: ['ADMIN', 'TRANSPORT_STAFF']
        },
        {
          id: 'boarding',
          aliases: ['boarding-verification', 'admin/boarding', 'admin/boarding-verification'],
          label: 'Boarding Gate',
          shortLabel: 'BOARDING',
          icon: Shield,
          roles: ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE']
        }
      ]
    }
  ];

  // Helper to test if item matches current page
  const isItemActive = (item) => {
    if (currentPage === item.id) return true;
    if (item.aliases && item.aliases.includes(currentPage)) return true;
    return false;
  };

  return (
    <aside
      id="app-command-sidebar"
      style={{
        width: isCollapsed ? '68px' : '240px',
        minWidth: isCollapsed ? '68px' : '240px',
        height: 'calc(100vh - var(--header-height))',
        position: 'sticky',
        top: 'var(--header-height)',
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.22s cubic-bezier(0.2, 0, 0, 1), min-width 0.22s cubic-bezier(0.2, 0, 0, 1)',
        zIndex: 90,
        userSelect: 'none',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}
    >
      {/* Top Header / Collapsible Action */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '14px 0' : '12px 14px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase'
                }}
              >
                NAVIGATION CONSOLE
              </span>
            </div>
          )}
          {onToggle && (
            <button
              onClick={onToggle}
              className="mono-btn"
              style={{
                padding: '5px 8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)'
              }}
              title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              id="sidebar-toggle-btn"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav style={{ padding: isCollapsed ? '10px 6px' : '12px 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {navGroups.map((group) => {
            // Filter items user has permission to see
            const allowedItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(user.role)
            );

            if (allowedItems.length === 0) return null;

            return (
              <div key={group.groupTitle} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {!isCollapsed && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: 'var(--text-dim)',
                      padding: '4px 10px',
                      textTransform: 'uppercase'
                    }}
                  >
                    // {group.groupTitle}
                  </div>
                )}

                {allowedItems.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate && onNavigate(item.id)}
                      title={item.label}
                      id={`sidebar-nav-${item.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: '10px',
                        padding: isCollapsed ? '10px 0' : '8px 12px',
                        width: '100%',
                        borderRadius: 'var(--radius-sm)',
                        background: active ? 'var(--bg-surface-elevated)' : 'transparent',
                        border: '1px solid',
                        borderColor: active ? 'var(--border-strong)' : 'transparent',
                        borderLeft: active ? '3px solid var(--text-pure)' : '3px solid transparent',
                        color: active ? 'var(--text-pure)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'var(--bg-surface)';
                          e.currentTarget.style.color = 'var(--text-pure)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <Icon
                        size={16}
                        style={{
                          flexShrink: 0,
                          color: active ? 'var(--text-pure)' : 'var(--text-secondary)'
                        }}
                      />

                      {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem',
                              fontWeight: active ? 700 : 500,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.shortLabel}
                          </span>

                          {item.badge && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.55rem',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                padding: '1px 5px',
                                borderRadius: '2px',
                                background: active ? 'var(--text-pure)' : 'var(--bg-surface)',
                                color: active ? 'var(--bg-void)' : 'var(--text-secondary)',
                                border: '1px solid var(--border-default)'
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: isCollapsed ? '12px 6px' : '12px 14px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {!isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)'
                }}
              >
                ROLE CLEARANCE
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#00AA00',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00AA00' }} />
                ACTIVE
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--text-dim)'
              }}
            >
              LEVEL: {user.role}
            </div>
          </div>
        ) : (
          <div
            title={`Active User: ${user.name} (${user.role})`}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px 0'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00AA00' }} />
          </div>
        )}
      </div>
    </aside>
  );
}
