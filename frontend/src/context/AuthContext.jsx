import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // initial auth check
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('lms_token');
      if (token) {
        try {
          const { data } = await userAPI.getProfile();
          if (data.success) setUser(data.user);
        } catch {
          localStorage.removeItem('lms_token');
          localStorage.removeItem('lms_user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const saveAuth = (token, userData) => {
    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = useCallback(async (name, email, password, role = 'student') => {
    const { data } = await authAPI.register({ name, email, password, role });
    // register không auto-login, chuyển sang trang login
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    if (data.success) saveAuth(data.accessToken, data.user);
    return data;
  }, []);

  const googleLogin = useCallback(async (googleToken) => {
    const { data } = await authAPI.googleLogin(googleToken);
    if (data.success) saveAuth(data.accessToken, data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('lms_user', JSON.stringify(updatedUser));
  }, []);

  const acceptTerms = useCallback(async () => {
    try {
      const { data } = await userAPI.acceptTerms();
      if (data.success) {
        updateUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('Accept terms error:', error);
      throw error;
    }
  }, [updateUser]);

  // Helper role checks
  const isAdmin = user?.role === 'admin';
  const isLibrarian = user?.role === 'librarian';
  const isLecturer = user?.role === 'lecturer';
  const isStudent = user?.role === 'student';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isLibrarian,
        isLecturer,
        isStudent,
        register,
        login,
        googleLogin,
        logout,
        updateUser,
        acceptTerms,
        showTermsModal,
        setShowTermsModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
