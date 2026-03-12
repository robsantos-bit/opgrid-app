import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupaUser, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'operador' | 'financeiro' | 'comercial' | 'prestador';

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  provider_id?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasAccess: (modules: string[]) => boolean;
}

const roleAccess: Record<UserRole, string[]> = {
  admin: ['painel', 'operacao', 'rede', 'financeiro', 'admin', 'dashboard', 'solicitacoes', 'despacho', 'prestadores', 'tarifas', 'tabela-precos', 'atendimentos', 'faturamento', 'relatorios', 'contratos', 'auditoria', 'configuracoes', 'mapa', 'usuarios'],
  operador: ['painel', 'operacao', 'rede', 'dashboard', 'solicitacoes', 'despacho', 'prestadores', 'atendimentos', 'tarifas', 'tabela-precos', 'mapa'],
  financeiro: ['painel', 'financeiro', 'dashboard', 'faturamento', 'relatorios', 'atendimentos', 'contratos'],
  comercial: ['painel', 'financeiro', 'rede', 'dashboard', 'relatorios', 'contratos', 'prestadores'],
  prestador: ['portal-prestador'],
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (supaUser: SupaUser): Promise<AppUser | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nome, email, provider_id')
        .eq('id', supaUser.id)
        .maybeSingle();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supaUser.id)
        .single();

      if (profile) {
        return {
          id: profile.id,
          nome: profile.nome || supaUser.email?.split('@')[0] || 'Usuário',
          email: profile.email || supaUser.email || '',
          role: (roleData?.role as UserRole) || 'operador',
          provider_id: profile.provider_id,
        };
      }
      // Fallback if no profile yet
      return {
        id: supaUser.id,
        nome: supaUser.email?.split('@')[0] || 'Usuário',
        email: supaUser.email || '',
        role: (roleData?.role as UserRole) || 'operador',
        provider_id: null,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase RLS
        setTimeout(async () => {
          const appUser = await fetchProfile(session.user);
          setUser(appUser);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const appUser = await fetchProfile(session.user);
        setUser(appUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const hasAccess = (modules: string[]) => {
    if (!user) return false;
    const access = roleAccess[user.role] || [];
    return modules.some(m => access.includes(m));
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      hasAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
