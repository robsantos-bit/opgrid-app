import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole =
  | 'admin'
  | 'operador'
  | 'financeiro'
  | 'prestador'
  | 'comercial';

export interface AuthProfile {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  avatar_url: string | null;
  provider_id: string | null;
  created_at: string;
}

export interface AuthUserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface AuthContextData {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  profile: AuthProfile | null;
  roles: AppRole[];
  primaryRole: AppRole | null;
  providerId: string | null;
  isAdmin: boolean;
  isOperador: boolean;
  isFinanceiro: boolean;
  isPrestador: boolean;
  isComercial: boolean;
  canAccessApp: boolean;
  canAccessPrestador: boolean;
}

async function getCurrentAuthData(): Promise<AuthContextData> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    return {
      userId: null,
      email: null,
      isAuthenticated: false,
      profile: null,
      roles: [],
      primaryRole: null,
      providerId: null,
      isAdmin: false,
      isOperador: false,
      isFinanceiro: false,
      isPrestador: false,
      isComercial: false,
      canAccessApp: false,
      canAccessPrestador: false,
    };
  }

  const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id),
    ]);

  if (profileError) throw profileError;
  if (rolesError) throw rolesError;

  const roles = ((roleRows || []).map((row) => row.role) as AppRole[]) || [];

  const priorityOrder: AppRole[] = [
    'admin',
    'operador',
    'financeiro',
    'comercial',
    'prestador',
  ];

  const primaryRole =
    priorityOrder.find((role) => roles.includes(role)) ?? null;

  const isAdmin = roles.includes('admin');
  const isOperador = roles.includes('operador');
  const isFinanceiro = roles.includes('financeiro');
  const isPrestador = roles.includes('prestador');
  const isComercial = roles.includes('comercial');

  return {
    userId: user.id,
    email: user.email ?? null,
    isAuthenticated: true,
    profile: (profile as AuthProfile | null) ?? null,
    roles,
    primaryRole,
    providerId: profile?.provider_id ?? null,
    isAdmin,
    isOperador,
    isFinanceiro,
    isPrestador,
    isComercial,
    canAccessApp: isAdmin || isOperador || isFinanceiro || isComercial,
    canAccessPrestador: isPrestador,
  };
}

export function useAuthProfile() {
  return useQuery({
    queryKey: ['auth-profile'],
    queryFn: getCurrentAuthData,
    staleTime: 30_000,
  });
}

export function useRoleGuards() {
  const query = useAuthProfile();

  const guards = useMemo(() => {
    const data = query.data;

    return {
      isLoading: query.isLoading,
      isAuthenticated: data?.isAuthenticated ?? false,
      canAccessApp: data?.canAccessApp ?? false,
      canAccessPrestador: data?.canAccessPrestador ?? false,
      isAdmin: data?.isAdmin ?? false,
      isOperador: data?.isOperador ?? false,
      isFinanceiro: data?.isFinanceiro ?? false,
      isPrestador: data?.isPrestador ?? false,
      isComercial: data?.isComercial ?? false,
      primaryRole: data?.primaryRole ?? null,
      providerId: data?.providerId ?? null,
    };
  }, [query.data, query.isLoading]);

  return {
    ...query,
    ...guards,
  };
}
