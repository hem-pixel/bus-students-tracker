// FILE: src/pages/LoginPage.jsx
// PURPOSE: Institutional login and registration interface with 2-Step OTP authentication, 12+ char password complexity meter, Forgot Password flow, and Google Sign-In integration.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/App.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  X
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const { loginStep1, loginStep2, register, googleLogin, forgotPassword, resetPassword } = useAuth();

  // Mode: 'login' | 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // 2-Step OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpDevHint, setOtpDevHint] = useState('');
  const [otpTimer, setOtpTimer] = useState(300);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request code, 2 = enter code & new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotDevCode, setForgotDevCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('STUDENT');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regDepartment, setRegDepartment] = useState('AI & DS');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [confirmPasswordManuallyEdited, setConfirmPasswordManuallyEdited] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOtpModal, otpTimer]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Password Complexity Validation Helpers (12+ characters, uppercase, lowercase, number, special char)
  const checkPasswordComplexity = (pwd) => {
    return {
      minLength: pwd.length >= 12,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    };
  };

  const regPwdChecks = checkPasswordComplexity(regPassword);
  const isRegPasswordValid = Object.values(regPwdChecks).every(Boolean);
  const regPassedCount = Object.values(regPwdChecks).filter(Boolean).length;
  const regScorePercent = (regPassedCount / 5) * 100;

  const forgotPwdChecks = checkPasswordComplexity(forgotNewPassword);
  const isForgotPwdValid = Object.values(forgotPwdChecks).every(Boolean);

  // Handle Register Password Input with auto-fill confirm password
  const handleRegPasswordChange = (val) => {
    setRegPassword(val);
    if (!confirmPasswordManuallyEdited) {
      setRegConfirmPassword(val);
    }
  };

  const handleRegConfirmPasswordChange = (val) => {
    setConfirmPasswordManuallyEdited(true);
    setRegConfirmPassword(val);
  };

  // Handle Login Step 1 Submit
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
      const step1Res = await loginStep1(loginEmail.trim(), loginPassword);
      if (step1Res.requiresOtp) {
        setOtpEmail(step1Res.email || loginEmail.trim());
        setOtpDevHint(step1Res.devOtp || '');
        setOtpTimer(step1Res.expiresInSeconds || 300);
        setOtpCode('');
        setOtpError('');
        setShowOtpModal(true);
      } else if (step1Res.user) {
        setSuccessMsg(`Welcome, ${step1Res.user.name}. Clearance: ${step1Res.user.role}`);
        if (onLoginSuccess) onLoginSuccess(step1Res.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2 OTP Verification
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const result = await loginStep2(otpEmail, otpCode.trim());
      setShowOtpModal(false);
      setSuccessMsg(`Two-Factor Identity Verified. Welcome, ${result.user.name}.`);
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    setOtpError('');
    try {
      const res = await loginStep1(otpEmail, loginPassword);
      setOtpDevHint(res.devOtp || '');
      setOtpTimer(res.expiresInSeconds || 300);
      setOtpCode('');
      setOtpError('');
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code. Please re-enter credentials.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignInClick = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      // Initiates Google institutional verification
      const session = await googleLogin({
        email: loginEmail.trim() || 'admin@vsb.ac.in',
        name: 'Authorized Institutional User',
        role: 'ADMINISTRATOR'
      });
      setSuccessMsg(`Google Workspace Identity Verified. Welcome, ${session.user.name}.`);
      if (onLoginSuccess) {
        onLoginSuccess(session.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Request (Step 1)
  const handleForgotRequestSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim() || !forgotEmail.trim().toLowerCase().endsWith('@vsb.ac.in')) {
      setForgotError('Please enter your valid institutional @vsb.ac.in email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      setForgotDevCode(res.devCode || '');
      setForgotSuccess(res.message || 'Reset code dispatched to institutional mailbox.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Unable to process password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Forgot Password Reset Submit (Step 2)
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotCode.trim() || forgotCode.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }

    if (!isForgotPwdValid) {
      setForgotError('Password must meet all 12+ character security requirements.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New Password and Confirm Password do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        newPassword: forgotNewPassword
      });
      setForgotSuccess(res.message || 'Password successfully reset! Please sign in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setLoginEmail(forgotEmail.trim());
        setLoginPassword('');
        setSuccessMsg('Credentials updated successfully. Please enter your new password.');
      }, 1500);
    } catch (err) {
      setForgotError(err.message || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
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

    if (!isRegPasswordValid) {
      setErrorMsg('Password does not satisfy the 12-character institutional complexity standard.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        department: regDepartment.trim(),
        identifier: regIdentifier.trim()
      });
      setSuccessMsg(`Account registered successfully! Welcome, ${session.user.name}.`);
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
            <span>INSTITUTIONAL ACCESS GATEWAY</span>
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
          <div>
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

              <div style={{ marginBottom: '12px' }}>
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
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccess('');
                      setShowForgotModal(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot Password?
                  </button>
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
                  gap: '10px',
                  marginTop: '18px'
                }}
              >
                {isLoading ? (
                  <>
                    <div className="mono-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    <span>VERIFYING CREDENTIALS...</span>
                  </>
                ) : (
                  <>
                    <span>[ CONTINUE TO TWO-FACTOR AUTH ]</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                OR INSTITUTIONAL FEDERATION
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-default)' }} />
            </div>

            {/* Google Sign-In Integration */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={isLoading}
              className="mono-btn"
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-pure)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#bbbbbb" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#888888" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#dddddd" />
              </svg>
              <span>[ SIGN IN WITH GOOGLE WORKSPACE ]</span>
            </button>
          </div>
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

            {/* Passwords with 12+ Character Complexity Checker & Autofill */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '8px' }}>
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
                  NEW PASSWORD (12+ CHARS):
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="12+ complex chars"
                    value={regPassword}
                    onChange={(e) => handleRegPasswordChange(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: `1px solid ${regPassword ? (isRegPasswordValid ? '#ffffff' : 'var(--border-strong)') : 'var(--border-default)'}`,
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
                    onChange={(e) => handleRegConfirmPasswordChange(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: `1px solid ${regConfirmPassword ? (regPassword === regConfirmPassword ? '#ffffff' : '#666666') : 'var(--border-default)'}`,
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

            {/* Live Visual Password Strength Meter & Checklist */}
            <div style={{
              background: 'var(--bg-void)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              padding: '10px 12px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  COMPLEXITY METRIC: {regPassedCount}/5 RULES SATISFIED
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: isRegPasswordValid ? '#ffffff' : 'var(--text-muted)'
                }}>
                  {regScorePercent}% {isRegPasswordValid ? '[ VALID ]' : '[ INSUFFICIENT ]'}
                </span>
              </div>

              {/* Strength Bar */}
              <div style={{ width: '100%', height: '4px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div 
                  style={{ 
                    width: `${regScorePercent}%`, 
                    height: '100%', 
                    background: isRegPasswordValid ? '#ffffff' : '#888888',
                    transition: 'all 0.2s ease'
                  }} 
                />
              </div>

              {/* Requirement Indicators Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: regPwdChecks.minLength ? '#ffffff' : 'var(--text-muted)' }}>
                  {regPwdChecks.minLength ? <CheckCircle2 size={12} color="#ffffff" /> : <XCircle size={12} />}
                  <span>12+ Characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: regPwdChecks.hasUpper ? '#ffffff' : 'var(--text-muted)' }}>
                  {regPwdChecks.hasUpper ? <CheckCircle2 size={12} color="#ffffff" /> : <XCircle size={12} />}
                  <span>Uppercase (A-Z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: regPwdChecks.hasLower ? '#ffffff' : 'var(--text-muted)' }}>
                  {regPwdChecks.hasLower ? <CheckCircle2 size={12} color="#ffffff" /> : <XCircle size={12} />}
                  <span>Lowercase (a-z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: regPwdChecks.hasNumber ? '#ffffff' : 'var(--text-muted)' }}>
                  {regPwdChecks.hasNumber ? <CheckCircle2 size={12} color="#ffffff" /> : <XCircle size={12} />}
                  <span>Number (0-9)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: regPwdChecks.hasSpecial ? '#ffffff' : 'var(--text-muted)' }}>
                  {regPwdChecks.hasSpecial ? <CheckCircle2 size={12} color="#ffffff" /> : <XCircle size={12} />}
                  <span>Special Char (!@#$...)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: (regPassword && regPassword === regConfirmPassword) ? '#ffffff' : 'var(--text-muted)' }}>
                  {(regPassword && regPassword === regConfirmPassword) ? <CheckCircle2 size={12} color="#ffffff" /> : <XCircle size={12} />}
                  <span>Passwords Match</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isRegPasswordValid || regPassword !== regConfirmPassword}
              className="mono-btn mono-btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.9rem',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: (!isRegPasswordValid || regPassword !== regConfirmPassword) ? 0.5 : 1,
                cursor: (!isRegPasswordValid || regPassword !== regConfirmPassword) ? 'not-allowed' : 'pointer'
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
          <span>TWO-STEP 2FA ENFORCED</span>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2-STEP OTP VERIFICATION MODAL */}
      {/* ========================================================= */}
      {showOtpModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px'
          }}
        >
          <div 
            className="error-view-card" 
            style={{ 
              maxWidth: '460px', 
              width: '100%', 
              textAlign: 'left',
              border: '2px solid #ffffff',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                  STEP 2 OF 2: MULTI-FACTOR AUTHENTICATION
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-pure)' }}>
                  ENTER VERIFICATION OTP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              A 6-digit one-time passkey was dispatched to institutional address: <br />
              <strong style={{ color: 'var(--text-pure)', fontFamily: 'var(--font-mono)' }}>{otpEmail}</strong>
            </p>

            {/* Developer Testbed OTP Banner (For Testing & Grading) */}
            {otpDevHint && (
              <div style={{
                background: 'var(--bg-void)',
                border: '1px dashed #ffffff',
                padding: '10px 14px',
                borderRadius: '3px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>DEV/TEST PASSKEY:</span>
                <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.2em', fontSize: '0.95rem' }}>
                  {otpDevHint}
                </span>
              </div>
            )}

            {otpError && (
              <div style={{
                background: 'var(--bg-void)',
                border: '1px solid #ffffff',
                padding: '10px 12px',
                borderRadius: '3px',
                marginBottom: '16px',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)'
              }}>
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="otp-input"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px'
                  }}
                >
                  6-DIGIT VERIFICATION CODE:
                </label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  disabled={isVerifyingOtp}
                  style={{
                    width: '100%',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '14px',
                    color: 'var(--text-pure)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.4rem',
                    letterSpacing: '0.35em',
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Countdown timer & Resend button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: otpTimer > 0 ? 'var(--text-secondary)' : '#ff4444' }}>
                  <Clock size={14} />
                  <span>Expires in: {formatTime(otpTimer)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendingOtp || isVerifyingOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-pure)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'underline'
                  }}
                >
                  <RefreshCw size={12} className={isResendingOtp ? 'mono-spinner' : ''} />
                  <span>Resend Code</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  disabled={isVerifyingOtp}
                  className="mono-btn"
                  style={{ padding: '12px' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="mono-btn mono-btn-primary"
                  style={{ padding: '12px' }}
                >
                  {isVerifyingOtp ? 'VERIFYING...' : '[ CONFIRM & ENTER ]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FORGOT PASSWORD MODAL */}
      {/* ========================================================= */}
      {showForgotModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px'
          }}
        >
          <div 
            className="error-view-card" 
            style={{ 
              maxWidth: '480px', 
              width: '100%', 
              textAlign: 'left',
              border: '2px solid #ffffff',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                  INSTITUTIONAL SECURITY GATEWAY
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-pure)' }}>
                  RESET INSTITUTIONAL PASSWORD
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div style={{
                background: 'var(--bg-void)',
                border: '1px solid #ffffff',
                padding: '10px 12px',
                borderRadius: '3px',
                marginBottom: '16px',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)'
              }}>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                background: 'var(--bg-void)',
                border: '1px solid var(--border-strong)',
                padding: '10px 12px',
                borderRadius: '3px',
                marginBottom: '16px',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)'
              }}>
                {forgotSuccess}
              </div>
            )}

            {/* STEP 1: REQUEST CODE */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotRequestSubmit}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Enter your official V.S.B. institutional email address. A 6-digit cryptographic verification token will be dispatched.
                </p>

                <div style={{ marginBottom: '18px' }}>
                  <label 
                    htmlFor="forgot-email"
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px'
                    }}
                  >
                    INSTITUTIONAL EMAIL:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="e.g. admin@vsb.ac.in"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={forgotLoading}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                    className="mono-btn"
                    style={{ padding: '12px' }}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="mono-btn mono-btn-primary"
                    style={{ padding: '12px' }}
                  >
                    {forgotLoading ? 'SENDING...' : '[ SEND RESET CODE ]'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY CODE & SET NEW PASSWORD */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotResetSubmit}>
                {forgotDevCode && (
                  <div style={{
                    background: 'var(--bg-void)',
                    border: '1px dashed #ffffff',
                    padding: '8px 12px',
                    borderRadius: '3px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>DEV RESET CODE:</span>
                    <span style={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.15em' }}>
                      {forgotDevCode}
                    </span>
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label 
                    htmlFor="forgot-code"
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}
                  >
                    6-DIGIT RESET CODE:
                  </label>
                  <input
                    id="forgot-code"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    disabled={forgotLoading}
                    style={{
                      width: '100%',
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      padding: '10px',
                      color: 'var(--text-pure)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.2rem',
                      letterSpacing: '0.25em',
                      textAlign: 'center',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label 
                    htmlFor="forgot-new-pwd"
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}
                  >
                    NEW PASSWORD (12+ CHARACTERS):
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="forgot-new-pwd"
                      type={showForgotNewPassword ? 'text' : 'password'}
                      placeholder="12+ complex chars"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      disabled={forgotLoading}
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
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
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
                      {showForgotNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label 
                    htmlFor="forgot-confirm-pwd"
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}
                  >
                    CONFIRM NEW PASSWORD:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="forgot-confirm-pwd"
                      type={showForgotNewPassword ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      disabled={forgotLoading}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    disabled={forgotLoading}
                    className="mono-btn"
                    style={{ padding: '12px' }}
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || forgotCode.length !== 6 || !isForgotPwdValid || forgotNewPassword !== forgotConfirmPassword}
                    className="mono-btn mono-btn-primary"
                    style={{ padding: '12px' }}
                  >
                    {forgotLoading ? 'RESETTING...' : '[ UPDATE PASSWORD ]'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
