import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { getUsers, updateUserInStore } from '@/data/store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  updateAnyUser: (userId: string, data: Partial<User>) => void;
  getAllUsers: () => User[];
  isAdmin: boolean;
  hasAccess: (modules: string[]) => boolean;
}

const roleAccess: Record<UserRole, string[]> = {
  admin: ['dashboard', 'solicitacoes', 'despacho', 'prestadores', 'tarifas', 'tabela-precos', 'atendimentos', 'faturamento', 'relatorios', 'contratos', 'auditoria', 'configuracoes', 'mapa'],
  operador: ['dashboard', 'solicitacoes', 'despacho', 'prestadores', 'atendimentos', 'tarifas', 'tabela-precos', 'mapa'],
  financeiro: ['dashboard', 'faturamento', 'relatorios', 'atendimentos', 'contratos'],
  prestador: ['dashboard', 'atendimentos', 'faturamento', 'tarifas'],
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { const raw = localStorage.getItem('rc_user'); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem('rc_user', JSON.stringify(user));
    else localStorage.removeItem('rc_user');
  }, [user]);

  const login = (email: string, _password: string): boolean => {
    const allUsers = getUsers();
    const found = allUsers.find(u => u.email === email);
    if (found) { setUser(found); return true; }
    return false;
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      updateUserInStore(updated);
    }
  };

  const updateAnyUser = (userId: string, data: Partial<User>) => {
    const allUsers = getUsers();
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      const updated = { ...target, ...data };
      updateUserInStore(updated);
      // If editing self, update state too
      if (user && user.id === userId) setUser(updated);
    }
  };

  const getAllUsers = () => getUsers();

  const logout = () => setUser(null);
  const hasAccess = (modules: string[]) => {
    if (!user) return false;
    const access = roleAccess[user.role];
    return modules.some(m => access.includes(m));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, updateAnyUser, getAllUsers, isAdmin: user?.role === 'admin', hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
