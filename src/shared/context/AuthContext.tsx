import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../../types';

import { useData } from './DataContext';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<User>;
  register: (customerData: {
    fullName: string;
    username: string;
    password?: string;
    phone?: string;
    email?: string;
  }) => Promise<User>;
  switchDemoRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users, registerCustomer } = useData();

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('carship_user');
    const token = localStorage.getItem('carship_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('carship_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('carship_user');
      localStorage.removeItem('carship_token');
    }
  }, [user]);

  const login = async (username: string, password?: string): Promise<User> => {
    setIsLoading(true);
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setIsLoading(false);
      throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
    }

    try {
      // Direct live API authentication with Fastify Backend
      const res = await authApi.login({ username: cleanUsername, password });
      const token = res?.accessToken || res?.token;
      if (res && token && res.user) {
        localStorage.setItem('carship_token', token);
        const mappedUser: User = {
          id: res.user.id,
          fullName: res.user.fullName,
          username: res.user.username,
          role: res.user.role,
          phone: res.user.phone || '',
          email: res.user.email || '',
          isActive: res.user.isActive,
          createdAt: res.user.createdAt,
        };
        setUser(mappedUser);
        setIsLoading(false);
        window.dispatchEvent(new Event('carship_auth_change'));
        return mappedUser;
      }
      throw new Error('فشل تسجيل الدخول، تأكد من صحة البيانات');
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || err?.details?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      throw new Error(msg);
    }
  };

  const register = async (customerData: {
    fullName: string;
    username: string;
    password?: string;
    phone?: string;
    email?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      try {
        const res = await authApi.register({
          ...customerData,
          password: customerData.password || 'Customer@2026!',
        });
        const token = res?.accessToken || res?.token;
        if (token) {
          localStorage.setItem('carship_token', token);
        }
        if (res?.user) {
          const registeredUser: User = {
            id: res.user.id,
            fullName: res.user.fullName,
            username: res.user.username,
            role: res.user.role,
            phone: res.user.phone || customerData.phone || '',
            email: res.user.email || customerData.email || '',
            isActive: res.user.isActive,
            createdAt: res.user.createdAt,
          };
          setUser(registeredUser);
          setIsLoading(false);
          window.dispatchEvent(new Event('carship_auth_change'));
          return registeredUser;
        }
      } catch (e) {
        console.warn('Backend registration failed, using local registration fallback:', e);
      }
      const newUser = await registerCustomer(customerData);
      setUser(newUser);
      setIsLoading(false);
      window.dispatchEvent(new Event('carship_auth_change'));
      return newUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    const usernameMap: Record<UserRole, { username: string; pass: string }> = {
      super_admin: { username: 'super.admin', pass: 'Admin@2026!' },
      admin: { username: 'ali.admin', pass: 'Admin@2026!' },
      staff: { username: 'hussein.staff', pass: 'Staff@2026!' },
      exchange_agent: { username: 'amana.exchange', pass: 'Agent@2026!' },
      customer: { username: 'omar.customer', pass: 'Customer@2026!' },
    };
    const target = usernameMap[role];
    if (target) {
      try {
        await login(target.username, target.pass);
        return;
      } catch {
        // Continue to fallback
      }
    }
    const targetUser = users.find((u) => u.role === role) || users[0];
    setUser(targetUser);
    window.dispatchEvent(new Event('carship_auth_change'));
  };

  const logout = () => {
    localStorage.removeItem('carship_token');
    localStorage.removeItem('carship_user');
    setUser(null);
    window.dispatchEvent(new Event('carship_auth_change'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        switchDemoRole,
        logout,
      }}
    >
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
