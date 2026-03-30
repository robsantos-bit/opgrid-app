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

const UNAUTHENTICATED: AuthContextData = {
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

async function getCurrentAuthData(): Promise<AuthContextData> {
  // Try getSession first (uses local token, works in preview proxy)
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    console.log('[AuthProfile] No session found');
    return UNAUTHENTICATED;
  }

  console.log('[AuthProfile] Session user:', user.id);

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

  if (profileError) {
    console.error('[AuthProfile] Profile error:', profileError.message);
  }
  if (rolesError) {
    console.error('[AuthProfile] Roles error:', rolesError.message);
  }

  // Even if profile/roles fail, user IS authenticated
  const roles = ((roleRows || []).map((row) => row.role) as AppRole[]) || [];

  console.log('[AuthProfile] Loaded:', { roles, profile: !!profile });

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
    retry: 1,
  });
}

export function useRoleGuards() {
  const query = useAuthProfile();

  const guards = useMemo(() => {
    const data = query.data;
    // Treat error state as "done loading" to avoid infinite spinner
    const isDone = !query.isLoading && !query.isFetching;
    const isStillLoading = query.isLoading && !query.isError;

    return {
      isLoading: isStillLoading,
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
  }, [query.data, query.isLoading, query.isError, query.isFetching]);

  return {
    ...query,
    ...guards,
  };
}
