// FILE: src/context/AuthContext.jsx
// PURPOSE: Global React Authentication Context providing reactive auth state, user identity, role, and login/logout methods.
// PHASE: Phase 2 — Authentication, Login & Role-Based Access Control
// USED BY: src/App.jsx, src/components/ProtectedRoute.jsx, src/pages/LoginPage.jsx, src/pages/protected/RoleLandingPage.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from storage on app load
  useEffect(() => {
    const session = authService.getCurrentSession();
    if (session) {
      setUser(session.user);
      setSessionToken(session.token);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setSessionToken(result.token);
    return result;
  };

  const loginStep1 = async (email, password) => {
    return await authService.loginStep1(email, password);
  };

  const loginStep2 = async (email, otp) => {
    const result = await authService.loginStep2(email, otp);
    setUser(result.user);
    setSessionToken(result.token);
    return result;
  };

  const googleLogin = async (googleData) => {
    const result = await authService.googleSignIn(googleData);
    setUser(result.user);
    setSessionToken(result.token);
    return result;
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (data) => {
    return await authService.resetPassword(data);
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    setUser(result.user);
    setSessionToken(result.token);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setSessionToken(null);
  };

  const value = {
    user,
    role: user ? user.role : null,
    sessionToken,
    isAuthenticated: !!user && !!sessionToken,
    isLoading,
    login,
    loginStep1,
    loginStep2,
    googleLogin,
    loginWithGoogle: googleLogin,
    forgotPassword,
    resetPassword,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
