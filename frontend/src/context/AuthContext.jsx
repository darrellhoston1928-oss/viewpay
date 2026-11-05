import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('viewpay_token') || null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingDepositsCount, setPendingDepositsCount] = useState(0);

  const refreshMe = async () => {
    try {
      if (!localStorage.getItem('viewpay_token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.auth.getMe();
      setUser(data.user);
      setUnreadCount(data.unreadCount || 0);
      setPendingDepositsCount(data.pendingDepositsCount || 0);
    } catch (err) {
      console.warn('Session refresh failed:', err.message);
      if (err.status === 401 || err.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('viewpay_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    localStorage.setItem('viewpay_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const googleLogin = async (googleData) => {
    const data = await api.auth.google(googleData);
    localStorage.setItem('viewpay_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('viewpay_token');
    setToken(null);
    setUser(null);
    setUnreadCount(0);
    setPendingDepositsCount(0);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : null);
  };

  const switchDemoAccount = async (target) => {
    const accounts = {
      admin: { email: 'admin@viewpay.com', pass: 'Password123!' },
      reviewer: { email: 'reviewer@viewpay.com', pass: 'Password123!' },
      elena: { email: 'elena@viewpay.com', pass: 'Password123!' },
      marcus: { email: 'marcus@viewpay.com', pass: 'Password123!' },
      chloe: { email: 'chloe@viewpay.com', pass: 'Password123!' },
      viewer: { email: 'viewer@viewpay.com', pass: 'Password123!' },
      newbie: { email: 'newbie@viewpay.com', pass: 'Password123!' }
    };

    const targetAccount = accounts[target] || accounts.viewer;
    return await login(targetAccount.email, targetAccount.pass);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      walletBalance: user ? user.wallet_balance : 0,
      unreadCount,
      pendingDepositsCount,
      login,
      register,
      googleLogin,
      logout,
      refreshMe,
      updateUser,
      switchDemoAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
