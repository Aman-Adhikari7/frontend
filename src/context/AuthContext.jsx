import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: check for existing token on mount ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      // Re-fetch fresh user data in background
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.data.user);
          localStorage.setItem('user', JSON.stringify(data.data.user));
        })
        .catch(() => {
          // Token invalid — clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user',  JSON.stringify(data.data.user));
    setUser(data.data.user);
    if (data.data.welcomeBonus) {
      toast.success(`🎉 Welcome! You got ${data.data.welcomeBonus} welcome coins!`);
    }
    return data;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (formData) => {
    const { data } = await authAPI.login(formData);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user',  JSON.stringify(data.data.user));
    setUser(data.data.user);
    // Show streak reward toast if earned
    if (data.data.streakReward) {
      toast.success(data.data.streakReward.message, { duration: 4000 });
    }
    return data;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  // ── Update local user state (after profile changes, coin changes, etc.) ──
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Refresh user from server ──────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data.user);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data.user;
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  }, []);

  const isAdmin   = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isStudent,
      register,
      login,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
