import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Solicitacoes from "@/pages/Solicitacoes";
import Despacho from "@/pages/Despacho";
import Prestadores from "@/pages/Prestadores";
import Tarifas from "@/pages/Tarifas";
import TabelaPrecos from "@/pages/TabelaPrecos";
import Atendimentos from "@/pages/Atendimentos";
import Faturamento from "@/pages/Faturamento";
import Relatorios from "@/pages/Relatorios";
import Contratos from "@/pages/Contratos";
import Auditoria from "@/pages/Auditoria";
import Configuracoes from "@/pages/Configuracoes";
import MapaOperacional from "@/pages/MapaOperacional";
import PortalPrestador from "@/pages/PortalPrestador";
import AcompanhamentoCliente from "@/pages/AcompanhamentoCliente";
import WhatsAppSimulador from "@/pages/WhatsAppSimulador";
import SandboxWhatsApp from "@/pages/SandboxWhatsApp";
import AutomacaoWhatsApp from "@/pages/AutomacaoWhatsApp";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />

      {/* Backoffice — /app/* (protected) */}
      <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/app/solicitacoes" element={<ProtectedRoute><Solicitacoes /></ProtectedRoute>} />
      <Route path="/app/whatsapp" element={<ProtectedRoute><WhatsAppSimulador /></ProtectedRoute>} />
      <Route path="/app/sandbox" element={<ProtectedRoute><SandboxWhatsApp /></ProtectedRoute>} />
      <Route path="/app/automacao-whatsapp" element={<ProtectedRoute><AutomacaoWhatsApp /></ProtectedRoute>} />
      <Route path="/app/despacho" element={<ProtectedRoute><Despacho /></ProtectedRoute>} />
      <Route path="/app/prestadores" element={<ProtectedRoute><Prestadores /></ProtectedRoute>} />
      <Route path="/app/tarifas" element={<ProtectedRoute><Tarifas /></ProtectedRoute>} />
      <Route path="/app/tabela-precos" element={<ProtectedRoute><TabelaPrecos /></ProtectedRoute>} />
      <Route path="/app/atendimentos" element={<ProtectedRoute><Atendimentos /></ProtectedRoute>} />
      <Route path="/app/faturamento" element={<ProtectedRoute><Faturamento /></ProtectedRoute>} />
      <Route path="/app/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/app/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
      <Route path="/app/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
      <Route path="/app/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      <Route path="/app/mapa" element={<ProtectedRoute><MapaOperacional /></ProtectedRoute>} />

      {/* Portal do Prestador — /prestador/* (public) */}
      <Route path="/prestador/:tipo/:id" element={<PortalPrestador />} />

      {/* Portal do Cliente — /acompanhar/* (public) */}
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
