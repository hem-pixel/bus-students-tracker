// FILE: src/pages/LoginPage.jsx
// PURPOSE: Institutional login and registration interface with client-side credential verification, role-based session generation, validation alerts, and 1-click testing credentials.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/App.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  User, 
  Building, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  KeyRound
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const { login, register } = useAuth();

  // Mode: 'login' | 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('STUDENT');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regDepartment, setRegDepartment] = useState('AI & DS');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const demoCredentials = authService.getDemoCredentials();

  // Autofill demo account
  const handleAutofill = (demo) => {
    setActiveTab('login');
    setLoginEmail(demo.email);
    setLoginPassword(demo.password);
    setErrorMsg('');
    setSuccessMsg(`Autofilled ${demo.role} credentials (${demo.email})`);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both institutional email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await login(loginEmail, loginPassword);
      setSuccessMsg(`Welcome, ${session.user.name}. Clearance: ${session.user.role}`);
      if (onLoginSuccess) {
        onLoginSuccess(session.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regIdentifier.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (!regEmail.trim().toLowerCase().endsWith('@vsb.ac.in')) {
      setErrorMsg('Institutional registration requires an official @vsb.ac.in email address.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        department: regDepartment,
        identifier: regIdentifier
      });
      setSuccessMsg(`Account created successfully! Welcome, ${session.user.name}.`);
      if (onLoginSuccess) {
        onLoginSuccess(session.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="error-view-wrapper" style={{ padding: '40px 16px', minHeight: 'calc(100vh - 120px)' }}>
      <div className="error-view-card" style={{ maxWidth: '580px', width: '100%', textAlign: 'left' }}>
        
        {/* Institutional Crest & Lockup Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div 
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--border-strong)',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
            }}
          >
            <img 
              src="/college-logo.jpg" 
              alt="V.S.B. Crest" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            V.S.B. ENGINEERING COLLEGE
          </div>

          <h1 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-pure)',
            margin: '0 0 6px'
          }}>
            BUS STUDENTS TRACKER
          </h1>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-void)',
            border: '1px solid var(--border-default)',
            padding: '4px 12px',
            borderRadius: '2px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            <ShieldCheck size={14} color="var(--text-pure)" />
            <span>IDENTITY & ACCESS GATEWAY</span>
          </div>
        </div>

        {/* Tab Switcher (Sign In vs Register) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            style={{
              background: activeTab === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'login' ? 'var(--text-pure)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid #ffffff' : '2px solid transparent',
              padding: '12px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <KeyRound size={16} />
            [ SIGN IN ]
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            style={{
              background: activeTab === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'register' ? 'var(--text-pure)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid #ffffff' : '2px solid transparent',
              padding: '12px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={16} />
            [ REGISTER ACCOUNT ]
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div 
            style={{
              background: 'var(--bg-void)',
              border: '1px solid #ffffff',
              padding: '12px 16px',
              borderRadius: '3px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
            role="alert"
          >
            <AlertCircle size={18} color="#ffffff" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                ACCESS GATEWAY ALERT
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                {errorMsg}
              </div>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMsg && (
          <div 
            style={{
              background: 'var(--bg-void)',
              border: '1px solid var(--border-strong)',
              padding: '12px 16px',
              borderRadius: '3px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <ShieldCheck size={18} color="#ffffff" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                SYSTEM STATUS
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                {successMsg}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label 
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}
              >
                INSTITUTIONAL EMAIL:
              </label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={16} 
                  color="var(--text-muted)" 
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
                />
                <input
                  id="login-email"
                  type="email"
                  placeholder="e.g. admin@vsb.ac.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  style={{
                    width: '100%',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '12px 12px 12px 38px',
                    color: 'var(--text-pure)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label 
                  htmlFor="login-password"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                    color: 'var(--text-secondary)'
                  }}
                >
                  PASSWORD:
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Default seeded format: Role@123
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={16} 
                  color="var(--text-muted)" 
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
                />
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Enter authorized credential"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '12px 42px 12px 38px',
                    color: 'var(--text-pure)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mono-btn mono-btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.9rem',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {isLoading ? (
                <>
                  <div className="mono-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  <span>AUTHENTICATING IDENTITY...</span>
                </>
              ) : (
                <>
                  <span>[ SECURE LOGIN ]</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label 
                  htmlFor="reg-name"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  FULL LEGAL NAME:
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="e.g. S. Priyanka"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      padding: '10px 10px 10px 32px',
                      color: 'var(--text-pure)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="reg-role"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  AFFILIATION ROLE:
                </label>
                <select
                  id="reg-role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '10px',
                    color: 'var(--text-pure)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="STUDENT" style={{ background: '#121212', color: '#ffffff' }}>Student Commuter</option>
                  <option value="TRANSPORT_STAFF" style={{ background: '#121212', color: '#ffffff' }}>Transport Staff</option>
                  <option value="BUS_IN_CHARGE" style={{ background: '#121212', color: '#ffffff' }}>Bus In-Charge (Faculty)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label 
                htmlFor="reg-email"
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px'
                }}
              >
                INSTITUTIONAL EMAIL (@vsb.ac.in):
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. 922521104050@vsb.ac.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '10px 10px 10px 32px',
                    color: 'var(--text-pure)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label 
                  htmlFor="reg-identifier"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  {regRole === 'STUDENT' ? 'ROLL NUMBER / REG NO:' : 'STAFF ID / BADGE NO:'}
                </label>
                <div style={{ position: 'relative' }}>
                  <CreditCard size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="reg-identifier"
                    type="text"
                    placeholder={regRole === 'STUDENT' ? '922521104050' : 'EMP-TRP-08'}
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      padding: '10px 10px 10px 32px',
                      color: 'var(--text-pure)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="reg-dept"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  DEPARTMENT:
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="reg-dept"
                    type="text"
                    placeholder="AI & DS"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      padding: '10px 10px 10px 32px',
                      color: 'var(--text-pure)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
              <div>
                <label 
                  htmlFor="reg-password"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  PASSWORD:
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      padding: '10px 32px 10px 32px',
                      color: 'var(--text-pure)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="reg-confirm"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  CONFIRM PASSWORD:
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="reg-confirm"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      padding: '10px 10px 10px 32px',
                      color: 'var(--text-pure)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mono-btn mono-btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.9rem',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {isLoading ? (
                <>
                  <div className="mono-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  <span>REGISTERING USER PROFILE...</span>
                </>
              ) : (
                <>
                  <span>[ CREATE ACCOUNT & SIGN IN ]</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Credentials Panel (For testing & grading) */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginBottom: '10px'
          }}>
            <Sparkles size={14} color="#ffffff" />
            <span>1-CLICK DEMO CREDENTIAL AUTOFILL (TESTBED):</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px'
          }}>
            {demoCredentials.map((c) => (
              <button
                key={c.role}
                type="button"
                onClick={() => handleAutofill(c)}
                className="mono-btn"
                style={{
                  fontSize: '0.72rem',
                  padding: '7px 8px',
                  background: 'var(--bg-void)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
                title={`Click to fill ${c.email}`}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-pure)' }}>
                  {c.role.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {c.email.split('@')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Security Assurance Tagline */}
        <div style={{
          marginTop: '24px',
          padding: '10px 14px',
          background: 'var(--bg-void)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '3px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>SESSION POLICY: 60-MIN EXPIRY</span>
          <span>ROLE-BASED CLIENT ENFORCEMENT</span>
        </div>

      </div>
    </div>
  );
}
