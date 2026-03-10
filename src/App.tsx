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
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/solicitacoes" element={<ProtectedRoute><Solicitacoes /></ProtectedRoute>} />
      <Route path="/whatsapp" element={<ProtectedRoute><WhatsAppSimulador /></ProtectedRoute>} />
      <Route path="/despacho" element={<ProtectedRoute><Despacho /></ProtectedRoute>} />
      <Route path="/prestadores" element={<ProtectedRoute><Prestadores /></ProtectedRoute>} />
      <Route path="/tarifas" element={<ProtectedRoute><Tarifas /></ProtectedRoute>} />
      <Route path="/tabela-precos" element={<ProtectedRoute><TabelaPrecos /></ProtectedRoute>} />
      <Route path="/atendimentos" element={<ProtectedRoute><Atendimentos /></ProtectedRoute>} />
      <Route path="/faturamento" element={<ProtectedRoute><Faturamento /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
      <Route path="/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
      <Route path="/mapa" element={<ProtectedRoute><MapaOperacional /></ProtectedRoute>} />
      {/* Public portals — no auth required */}
      <Route path="/prestador/:tipo/:id" element={<PortalPrestador />} />
      <Route path="/acompanhar/:id" element={<AcompanhamentoCliente />} />
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
