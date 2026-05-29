// src/contexts/AuthContext.tsx
// Sri Ruchi Pachallu — Authentication Context
// Handles email/password login, Google OAuth, signup, logout, and profile refresh.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      localStorage.setItem('sriruchiUser', JSON.stringify(profile));
    } catch {
      logout();
    }
  };

  // On mount: validate stored token
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isLoggedIn()) {
        try {
          await refreshUser();
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
  };

  const googleLogin = async (accessToken: string) => {
    const data = await authService.googleLogin(accessToken);
    setUser(data.user);
  };

  const signup = async (data: Parameters<typeof authService.signup>[0]) => {
    const res = await authService.signup(data);
    setUser(res.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      loading,
      login,
      googleLogin,
      signup,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}