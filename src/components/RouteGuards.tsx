import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRoleGuards, useAuthProfile, type AppRole } from '@/hooks/useAuthProfile';
import AppLayout from '@/components/AppLayout';
import { Loader2 } from 'lucide-react';

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

/**
 * Módulos acessíveis por cada role.
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
 * AppRouteGuard — protege /app/*
 * Permite: admin, operador, financeiro, comercial
 * Bloqueia: prestador → /prestador/inicio
 * Não autenticado → /conecte-se
 */
export function AppRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isLoading, isAuthenticated, canAccessApp, isPrestador } = useRoleGuards();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/conecte-se" replace state={{ from: location }} />;
  if (isPrestador || !canAccessApp) return <Navigate to="/prestador/inicio" replace />;

  return <>{children}</>;
}

/**
 * PrestadorRouteGuard — protege /prestador/*
 * Permite: role prestador com providerId válido
 * Corporativo → /app/painel
 * Não autenticado → /conecte-se
 */
export function PrestadorRouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isLoading, isAuthenticated, canAccessPrestador, canAccessApp, providerId } = useRoleGuards();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/conecte-se" replace state={{ from: location }} />;
  if (canAccessApp && !canAccessPrestador) return <Navigate to="/app/painel" replace />;
  if (!canAccessPrestador) return <Navigate to="/conecte-se" replace />;

  return <>{children}</>;
}

/**
 * PublicOnlyRoute — para /conecte-se
 * Se já autenticado: redireciona conforme perfil
 */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, canAccessApp, isPrestador } = useRoleGuards();

  if (isLoading) return <Loading />;
  if (isAuthenticated && canAccessApp) return <Navigate to="/app/painel" replace />;
  if (isAuthenticated && isPrestador) return <Navigate to="/prestador/inicio" replace />;

  return <>{children}</>;
}

/**
 * ProtectedRoute — protege rotas individuais do backoffice com checagem de módulos.
 * Usa AppRouteGuard internamente + filtro por módulo.
 */
export function ProtectedRoute({
  children,
  requiredModules,
}: {
  children: ReactNode;
  requiredModules?: string[];
}) {
  const { data: authData, isLoading } = useAuthProfile();
  const { isAuthenticated, isPrestador, canAccessApp } = useRoleGuards();
  const roles = authData?.roles ?? [];
  const location = useLocation();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/conecte-se" replace state={{ from: location }} />;
  if (isPrestador || !canAccessApp) return <Navigate to="/prestador/inicio" replace />;
  if (requiredModules && roles.length > 0 && !hasModuleAccess(roles, requiredModules)) {
    return <Navigate to="/app/painel" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

/**
 * PrestadorRoute — protege rotas do portal do prestador com AppLayout opcional.
 */
export function PrestadorRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isLoading, isAuthenticated, canAccessPrestador, canAccessApp, providerId } = useRoleGuards();

  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/conecte-se" replace state={{ from: location }} />;
  if (canAccessApp && !canAccessPrestador) return <Navigate to="/app/painel" replace />;
  if (!canAccessPrestador) return <Navigate to="/conecte-se" replace />;

  return <>{children}</>;
}

export { hasModuleAccess, roleModuleAccess };
export type { AppRole };
