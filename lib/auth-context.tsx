'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextType {
  user: AuthUser;
  role: UserRole;
  switchRole: (newRole: UserRole) => void;
  setUser: (u: AuthUser) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  availableUsers: AuthUser[];
}

const PRESET_USERS: Record<UserRole, AuthUser> = {
  SUPER_ADMIN: {
    id: 'usr_super',
    name: 'Arjit Sharma',
    email: 'superadmin@zenithtech.site',
    role: 'SUPER_ADMIN',
    avatar: 'AS',
  },
  ADMIN: {
    id: 'usr_admin',
    name: 'Operations Admin',
    email: 'admin@zenithtech.site',
    role: 'ADMIN',
    avatar: 'OA',
  },
  MEMBER: {
    id: 'usr_member',
    name: 'Campaign Manager',
    email: 'user@zenithtech.site',
    role: 'MEMBER',
    avatar: 'CM',
  },
};

const AuthContext = createContext<AuthContextType>({
  user: PRESET_USERS.SUPER_ADMIN,
  role: 'SUPER_ADMIN',
  switchRole: () => {},
  setUser: () => {},
  isAdmin: true,
  isSuperAdmin: true,
  availableUsers: Object.values(PRESET_USERS),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('SUPER_ADMIN');
  const [user, setUser] = useState<AuthUser>(PRESET_USERS.SUPER_ADMIN);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('zs_active_role') as UserRole;
      if (savedRole && PRESET_USERS[savedRole]) {
        setRole(savedRole);
        setUser(PRESET_USERS[savedRole]);
      }
    } catch {}
  }, []);

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
