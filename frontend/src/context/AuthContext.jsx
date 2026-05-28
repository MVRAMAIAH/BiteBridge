import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on load and fetch profile
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.auth.getProfile();
          if (res.success) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Bootstrap auth failed', err);
          logout();
        }
      }
      setLoading(false);
    };

    bootstrap();
  }, []);

  // Login handler
  const login = async (googleProfile) => {
    setLoading(true);
    try {
      const res = await api.auth.googleLogin(googleProfile);
      if (res.success) {
        localStorage.setItem('token', res.token);
        setUser(res.user);
        return { success: true };
      }
    } catch (err) {
      console.error('Login error', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Profile update / geolocation update handler
  const updateProfile = async (profileData) => {
    try {
      const res = await api.auth.updateProfile(profileData);
      if (res.success) {
        setUser(res.user);
        return { success: true };
      }
    } catch (err) {
      console.error('Update profile error', err);
      return { success: false, message: err.message };
    }
  };

  // Re-fetch profile values
  const refreshProfile = async () => {
    try {
      const res = await api.auth.getProfile();
      if (res.success) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Error refreshing profile', err);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
