import React, { useState, useEffect, useRef } from 'react';
import { Radio, User, LogOut, KeyRound, PanelLeft, Bell, CheckCheck, ExternalLink, ShieldAlert, AlertTriangle, Info, Clock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { notificationAPI } from '../services/apiService';

export default function CommandCenterHeader({
  currentPage,
  onNavigate,
  isSidebarCollapsed = false,
  onToggleSidebar,
  showSidebarToggle = false
}) {
  const { user, isAuthenticated, logout } = useAuth();

  // Notification Bell State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const popoverRef = useRef(null);

  // Load initial notifications & count
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingNotifications(true);
      const res = await notificationAPI.getAll({ limit: 10 });
      if (res && res.success && res.data) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        const unread = notifs.filter(n => n.status !== 'ACKNOWLEDGED').length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('[HEADER] Could not load notifications:', err.message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated, user?.id]);

  // Real-time socket listener
  useEffect(() => {
    if (!isAuthenticated) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    let socket = null;
    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      socket.on('notification:new', (payload) => {
        setNotifications(prev => [payload, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      });

      socket.on('notification:broadcast', (payload) => {
        setNotifications(prev => [payload, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      });

      socket.on('notification:ack', (ackData) => {
        setNotifications(prev => prev.map(n => n.id === ackData.id ? { ...n, status: 'ACKNOWLEDGED', acknowledged_at: new Date().toISOString() } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      });
    } catch (err) {
      console.warn('[HEADER] Socket.io error for notifications:', err.message);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated]);

  // Click outside listener for popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Quick Acknowledge single notification
  const handleAcknowledge = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationAPI.acknowledge(id, { user_id: user?.id || 'admin' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'ACKNOWLEDGED' } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[HEADER] Failed to acknowledge notification:', err);
    }
  };

  // Mark all read in view
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => n.status !== 'ACKNOWLEDGED');
    for (const n of unread) {
      try {
        await notificationAPI.acknowledge(n.id, { user_id: user?.id || 'admin' });
      } catch (err) {
        // silent fail for batch
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, status: 'ACKNOWLEDGED' })));
    setUnreadCount(0);
  };

  const getPriorityColor = (p) => {
    switch (p?.toUpperCase()) {
      case 'CRITICAL': return '#EF4444';
      case 'HIGH': return '#F59E0B';
      case 'MEDIUM': return '#3B82F6';
      default: return '#10B981';
    }
  };

  return (
    <header
      id="command-center-header"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-default)',
        padding: '0 20px',
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '20px',
        userSelect: 'none'
      }}
    >
      {/* Left Section: Sidebar Toggle + Brand & Institution Lockup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="mono-btn"
            style={{
              padding: '7px 9px',
              background: isSidebarCollapsed ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-pure)',
              cursor: 'pointer'
            }}
            title={isSidebarCollapsed ? "Expand Sidebar Navigation" : "Collapse Sidebar Navigation"}
            id="header-sidebar-toggle-btn"
          >
            <PanelLeft size={16} />
          </button>
        )}

        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          onClick={() => {
            if (onNavigate) {
              if (isAuthenticated && user) {
                onNavigate('dashboard');
              } else {
                onNavigate('opening');
              }
            }
          }}
          title={isAuthenticated ? "Go to Unified Dashboard" : "Return to Opening Gateway"}
        >
          {/* Logo — strictly sized, stable, circular with crisp border */}
          <div 
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1.5px solid var(--border-strong)',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
            }}
          >
            <img 
              src="/college-logo.jpg" 
              alt="V.S.B. Crest" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Institutional Title & Department Badge — rock-solid, nowrap */}
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span 
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                lineHeight: 1.2
              }}
            >
              V.S.B. ENGINEERING COLLEGE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-pure)'
                }}
              >
                BUS STUDENTS TRACKER
              </span>
              <span 
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '2px 7px',
                  borderRadius: '3px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-pure)'
                }}
              >
                AI & DS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Telemetry & Pulse — Clean and Stable */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0
        }}
        className="header-telemetry-group"
      >
        <div className="mono-pill">
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#00AA00',
              display: 'inline-block',
              boxShadow: '0 0 6px rgba(0, 170, 0, 0.6)'
            }}
          />
          <span>SYSTEM ONLINE</span>
        </div>
        <div className="mono-pill">
          <Radio size={12} color="var(--text-pure)" />
          <span>FLEET LINK SECURE</span>
        </div>
      </div>

      {/* Right Side: Notification Bell + Authentication Status & Session Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, position: 'relative' }}>
        {isAuthenticated && user && (
          <div ref={popoverRef} style={{ position: 'relative' }}>
            {/* Notification Bell Trigger Button */}
            <button
              id="header-notification-bell-btn"
              onClick={() => setIsPopoverOpen(prev => !prev)}
              className="mono-btn"
              style={{
                position: 'relative',
                padding: '7px 10px',
                background: isPopoverOpen ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                border: isPopoverOpen ? '1px solid var(--text-pure)' : '1px solid var(--border-strong)',
                color: unreadCount > 0 ? 'var(--text-pure)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Notifications & Alerts"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  id="header-notification-badge"
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    minWidth: '17px',
                    height: '17px',
                    padding: '0 4px',
                    borderRadius: '9px',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                    lineHeight: 1
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {isPopoverOpen && (
              <div
                id="header-notification-popover"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '380px',
                  maxHeight: '500px',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '4px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75)',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 200,
                  overflow: 'hidden'
                }}
              >
                {/* Popover Header */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={14} color="var(--text-pure)" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--text-pure)', textTransform: 'uppercase' }}>
                      ALERTS & NOTICES
                    </span>
                    {unreadCount > 0 && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                      }}>
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'underline'
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={12} />
                      <span>ACK ALL</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div
                  style={{
                    overflowY: 'auto',
                    maxHeight: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    divideY: '1px solid var(--border-subtle)'
                  }}
                >
                  {loadingNotifications && notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Querying notification stream...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCheck size={28} style={{ opacity: 0.3, margin: '0 auto 8px auto' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>All Systems Nominal</div>
                      <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>No pending alerts or unread notifications</div>
                    </div>
                  ) : (
                    notifications.map(item => {
                      const isUnread = item.status !== 'ACKNOWLEDGED';
                      const pColor = getPriorityColor(item.priority);
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '12px 14px',
                            background: isUnread ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            borderLeft: isUnread ? `3px solid ${pColor}` : '3px solid transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  padding: '1px 5px',
                                  borderRadius: '2px',
                                  background: `${pColor}20`,
                                  color: pColor,
                                  border: `1px solid ${pColor}40`
                                }}
                              >
                                {item.priority || 'INFO'}
                              </span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                                {item.title}
                              </span>
                            </div>
                            {isUnread && (
                              <button
                                onClick={(e) => handleAcknowledge(item.id, e)}
                                className="mono-btn"
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 6px',
                                  background: 'var(--bg-surface)',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-secondary)',
                                  flexShrink: 0
                                }}
                                title="Acknowledge alert"
                              >
                                ACK
                              </button>
                            )}
                          </div>
                          <p style={{
                            fontSize: '0.73rem',
                            color: 'var(--text-secondary)',
                            margin: 0,
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {item.message}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            <span>{item.category || 'SYSTEM'}</span>
                            <span>{item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'Recent'}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer */}
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-surface)',
                    borderTop: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <button
                    onClick={() => {
                      setIsPopoverOpen(false);
                      if (onNavigate) onNavigate('notification-center');
                    }}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-pure)',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      padding: '4px 0'
                    }}
                    id="header-notification-view-all-btn"
                  >
                    <span>VIEW NOTIFICATION CENTER</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* User Profile Badge */}
            <div 
              className="mono-pill" 
              style={{ 
                background: 'var(--bg-void)', 
                border: '1px solid var(--border-strong)',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <User size={14} color="var(--text-pure)" />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                if (onNavigate) onNavigate('login');
              }}
              className="mono-btn"
              style={{
                fontSize: '0.75rem',
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-void)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-pure)'
              }}
              title="End secure session"
              id="header-logout-btn"
            >
              <LogOut size={13} />
              <span>LOGOUT</span>
            </button>
          </div>
        ) : !['opening', 'loading', 'login'].includes(currentPage) ? (
          <button
            onClick={() => onNavigate && onNavigate('login')}
            className="mono-btn mono-btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            id="header-login-btn"
          >
            <KeyRound size={13} />
            <span>[ SIGN IN ]</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
