import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyOtp, adminLogin as apiAdminLogin, updateProfile, verifyAdminTokenApi } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Customer Session
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bepviet_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin Session Token (Persisted in localStorage)
  const [adminToken, setAdminToken] = useState(() => {
    return localStorage.getItem('bepviet_admin_token') || null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Validate admin token on startup to prevent forged credentials
  useEffect(() => {
    if (adminToken) {
      verifyAdminTokenApi()
        .then((res) => {
          if (!res || !res.success) {
            setAdminToken(null);
            localStorage.removeItem('bepviet_admin_token');
          }
        })
        .catch(() => {
          setAdminToken(null);
          localStorage.removeItem('bepviet_admin_token');
        });
    }
  }, [adminToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bepviet_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bepviet_user');
    }
  }, [user]);

  // Customer Login with Phone + OTP
  const loginWithPhone = async (phone, otp, name) => {
    const res = await verifyOtp(phone, otp, name);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthModalOpen(false);
      return res.user;
    }
  };

  // Admin Login with password 14092006
  const loginAsAdmin = async (passcode) => {
    const res = await apiAdminLogin(passcode);
    if (res.success && res.token) {
      setAdminToken(res.token);
      localStorage.setItem('bepviet_admin_token', res.token);
      return res.user;
    }
  };

  // Admin Logout
  const adminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('bepviet_admin_token');
  };

  // Customer Logout
  const logout = () => {
    setUser(null);
  };

  const updateUserData = async (data) => {
    if (!user) return;
    const res = await updateProfile({ ...data, phone: user.phone });
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const isAdmin = Boolean(adminToken);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        adminToken,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithPhone,
        loginAsAdmin,
        adminLogout,
        logout,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
