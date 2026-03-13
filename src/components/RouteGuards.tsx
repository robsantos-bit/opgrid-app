import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleGuards, type AppRole } from '@/hooks/useAuthProfile';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Loader2 } from 'lucide-react';

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

/**
 * Módulos acessíveis por cada role.
 * Usa `some()` — basta ter acesso a UM dos módulos listados na rota.
 */
const roleModuleAccess: Record<AppRole, string[]> = {
  admin: [
    'painel', 'operacao', 'rede', 'financeiro', 'admin',
    'dashboard', 'solicitacoes', 'despacho', 'prestadores',
    'tarifas', 'tabela-precos', 'atendimentos', 'faturamento',
    'relatorios', 'contratos', 'auditoria', 'configuracoes',
    'mapa', 'usuarios',
  ],
  operador: [
    'painel', 'operacao', 'rede', 'dashboard', 'solicitacoes',
    'despacho', 'prestadores', 'atendimentos', 'tarifas',
    'tabela-precos', 'mapa',
  ],
  financeiro: [
    'painel', 'financeiro', 'dashboard', 'faturamento',
    'relatorios', 'atendimentos', 'contratos',
  ],
  comercial: [
    'painel', 'financeiro', 'rede', 'dashboard',
    'relatorios', 'contratos', 'prestadores',
  ],
  prestador: ['portal-prestador'],
};

function hasModuleAccess(roles: AppRole[], modules: string[]): boolean {
  if (roles.length === 0) return false;
  for (const role of roles) {
    const allowed = roleModuleAccess[role] || [];
    if (modules.some(m => allowed.includes(m))) return true;
  }
  return false;
}

/**
 * Protege rotas do backoffice /app/*.
 * Usa useRoleGuards (React Query) como camada complementar ao AuthContext.
 */
export function ProtectedRoute({
  children,
  requiredModules,
}: {
  children: ReactNode;
  requiredModules?: string[];
}) {
  const { user, loading } = useAuth();
  const { data: authData, isLoading: roleLoading } = useAuthProfile();
  const isPrestador = authData?.isPrestador ?? false;
  const roles = authData?.roles ?? [];

  if (loading || roleLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (isPrestador && roles.length === 1) return <Navigate to="/prestador/inicio" replace />;
  if (requiredModules && !hasModuleAccess(roles.length > 0 ? roles : [user.role as AppRole], requiredModules)) {
    return <Navigate to="/app" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

/**
 * Protege rotas do portal do prestador /prestador/*.
 */
export function PrestadorRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { canAccessPrestador, isLoading: roleLoading } = useRoleGuards();

  if (loading || roleLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessPrestador) return <Navigate to="/app" replace />;

  return <>{children}</>;
}

export { hasModuleAccess, roleModuleAccess };
