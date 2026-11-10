'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  organization?: string;
}

interface AuthContextType {
  user: AuthUser;
  role: UserRole;
  isLoggedIn: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  setUser: (u: AuthUser) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  availableUsers: AuthUser[];
}

export const PRESET_USERS: Record<UserRole, AuthUser> = {
  SUPER_ADMIN: {
    id: 'usr_super',
    name: 'Arjit Sharma',
    email: 'arjit@zenithtech.site',
    role: 'SUPER_ADMIN',
    avatar: 'AS',
    organization: 'Zenith Global Enterprise',
  },
  ADMIN: {
    id: 'usr_admin',
    name: 'Operations Admin',
    email: 'admin@zenithtech.site',
    role: 'ADMIN',
    avatar: 'OA',
    organization: 'Zenith Operations Desk',
  },
  MEMBER: {
    id: 'usr_member',
    name: 'Campaign Manager',
    email: 'user@zenithtech.site',
    role: 'MEMBER',
    avatar: 'CM',
    organization: 'Marketing & Dispatch',
  },
};

const AuthContext = createContext<AuthContextType>({
  user: PRESET_USERS.SUPER_ADMIN,
  role: 'SUPER_ADMIN',
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
  setUser: () => {},
  isAdmin: true,
  isSuperAdmin: true,
  availableUsers: Object.values(PRESET_USERS),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('SUPER_ADMIN');
  const [user, setUser] = useState<AuthUser>(PRESET_USERS.SUPER_ADMIN);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    try {
      const loggedInFlag = localStorage.getItem('zs_logged_in');
      const savedRole = localStorage.getItem('zs_active_role') as UserRole;
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('zs_session=');

      if (loggedInFlag === 'true' || hasCookie) {
        setIsLoggedIn(true);
        if (savedRole && PRESET_USERS[savedRole]) {
          setRole(savedRole);
          setUser(PRESET_USERS[savedRole]);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  const login = (newUser: AuthUser) => {
    setUser(newUser);
    setRole(newUser.role);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('zs_logged_in', 'true');
      localStorage.setItem('zs_active_role', newUser.role);
      // Set session cookie for Next.js proxy/middleware
      document.cookie = 'zs_session=active; path=/; max-age=604800; SameSite=Lax';
    } catch {}
  };

  const logout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem('zs_logged_in');
      localStorage.removeItem('zs_active_role');
      document.cookie = 'zs_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    } catch {}
    router.push('/login');
  };

  const switchRole = (newRole: UserRole) => {
    if (PRESET_USERS[newRole]) {
      setRole(newRole);
      setUser(PRESET_USERS[newRole]);
      try {
        localStorage.setItem('zs_active_role', newRole);
      } catch {}
    }
  };

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn,
        login,
        logout,
        switchRole,
        setUser,
        isAdmin,
        isSuperAdmin,
        availableUsers: Object.values(PRESET_USERS),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
