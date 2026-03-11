import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import PainelDashboard from "@/pages/PainelDashboard";
import OperacaoSolicitacoes from "@/pages/OperacaoSolicitacoes";
import OperacaoAtendimentos from "@/pages/OperacaoAtendimentos";
import Despacho from "@/pages/Despacho";
import MapaOperacional from "@/pages/MapaOperacional";
import RedePrestadores from "@/pages/RedePrestadores";
import Faturamento from "@/pages/Faturamento";
import FinanceiroTarifas from "@/pages/FinanceiroTarifas";
import FinanceiroTabelas from "@/pages/FinanceiroTabelas";
import AdminUsuarios from "@/pages/AdminUsuarios";
import AdminTemplates from "@/pages/AdminTemplates";
import AdminAutomacoes from "@/pages/AdminAutomacoes";
import Configuracoes from "@/pages/Configuracoes";
import PrestadorInicio from "@/pages/PrestadorInicio";
import PrestadorAtendimentos from "@/pages/PrestadorAtendimentos";
import PrestadorPerfil from "@/pages/PrestadorPerfil";
import AcompanhamentoCliente from "@/pages/AcompanhamentoCliente";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredModules }: { children: React.ReactNode; requiredModules?: string[] }) {
  const { user, loading, hasAccess } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'prestador') return <Navigate to="/prestador/inicio" replace />;
  if (requiredModules && !hasAccess(requiredModules)) return <Navigate to="/app" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PrestadorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'prestador') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={user ? (user.role === 'prestador' ? <Navigate to="/prestador/inicio" replace /> : <Navigate to="/app" replace />) : <Login />} />

      {/* Backoffice — /app/* */}
      <Route path="/app" element={<ProtectedRoute><PainelDashboard /></ProtectedRoute>} />
      <Route path="/app/painel" element={<ProtectedRoute><PainelDashboard /></ProtectedRoute>} />

      {/* Operação */}
      <Route path="/app/operacao/solicitacoes" element={<ProtectedRoute requiredModules={['operacao', 'solicitacoes']}><OperacaoSolicitacoes /></ProtectedRoute>} />
      <Route path="/app/operacao/atendimentos" element={<ProtectedRoute requiredModules={['operacao', 'atendimentos']}><OperacaoAtendimentos /></ProtectedRoute>} />
      <Route path="/app/operacao/despacho" element={<ProtectedRoute requiredModules={['operacao', 'despacho']}><Despacho /></ProtectedRoute>} />
      <Route path="/app/operacao/mapa" element={<ProtectedRoute requiredModules={['operacao', 'mapa']}><MapaOperacional /></ProtectedRoute>} />

      {/* Rede */}
      <Route path="/app/rede/prestadores" element={<ProtectedRoute requiredModules={['rede', 'prestadores']}><RedePrestadores /></ProtectedRoute>} />

      {/* Financeiro */}
      <Route path="/app/financeiro/faturamento" element={<ProtectedRoute requiredModules={['financeiro', 'faturamento']}><Faturamento /></ProtectedRoute>} />
      <Route path="/app/financeiro/tarifas" element={<ProtectedRoute requiredModules={['financeiro', 'tarifas']}><FinanceiroTarifas /></ProtectedRoute>} />
      <Route path="/app/financeiro/tabelas" element={<ProtectedRoute requiredModules={['financeiro', 'tabela-precos']}><FinanceiroTabelas /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/app/admin/usuarios" element={<ProtectedRoute requiredModules={['admin', 'usuarios']}><AdminUsuarios /></ProtectedRoute>} />
      <Route path="/app/admin/templates" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminTemplates /></ProtectedRoute>} />
      <Route path="/app/admin/automacoes" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminAutomacoes /></ProtectedRoute>} />
      <Route path="/app/admin/configuracoes" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><Configuracoes /></ProtectedRoute>} />

      {/* Portal do Prestador */}
      <Route path="/prestador" element={<PrestadorRoute><PrestadorInicio /></PrestadorRoute>} />
      <Route path="/prestador/inicio" element={<PrestadorRoute><PrestadorInicio /></PrestadorRoute>} />
      <Route path="/prestador/atendimentos" element={<PrestadorRoute><PrestadorAtendimentos /></PrestadorRoute>} />
      <Route path="/prestador/perfil" element={<PrestadorRoute><PrestadorPerfil /></PrestadorRoute>} />

      {/* Portal do Cliente */}
      <Route path="/acompanhar/:id" element={<AcompanhamentoCliente />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
