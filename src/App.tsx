import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, PrestadorRoute, PublicOnlyRoute } from "@/components/RouteGuards";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import PainelDashboard from "@/pages/PainelDashboard";
import PainelIndicadores from "@/pages/PainelIndicadores";
import PainelAlertas from "@/pages/PainelAlertas";
import PainelSLA from "@/pages/PainelSLA";
import PainelSaudeOperacao from "@/pages/PainelSaudeOperacao";
import PainelMapaExecutivo from "@/pages/PainelMapaExecutivo";
import PainelSatisfacao from "@/pages/PainelSatisfacao";
import OperacaoSolicitacoes from "@/pages/OperacaoSolicitacoes";
import OperacaoAtendimentos from "@/pages/OperacaoAtendimentos";
import Despacho from "@/pages/Despacho";
import MapaOperacional from "@/pages/MapaOperacional";
import OperacaoTesteAcionamento from "@/pages/OperacaoTesteAcionamento";
import OperacaoChecklists from "@/pages/OperacaoChecklists";
import RedePrestadores from "@/pages/RedePrestadores";
import RedeCobertura from "@/pages/RedeCobertura";
import RedeDisponibilidade from "@/pages/RedeDisponibilidade";
import RedeHomologacao from "@/pages/RedeHomologacao";
import RedePerformance from "@/pages/RedePerformance";
import RedeComunicacao from "@/pages/RedeComunicacao";
import RedeDisparoMassa from "@/pages/RedeDisparoMassa";
import Faturamento from "@/pages/Faturamento";
import FinanceiroConferencia from "@/pages/FinanceiroConferencia";
import FinanceiroDivergencias from "@/pages/FinanceiroDivergencias";
import FinanceiroGlosas from "@/pages/FinanceiroGlosas";
import FinanceiroTarifas from "@/pages/FinanceiroTarifas";
import FinanceiroTabelas from "@/pages/FinanceiroTabelas";
import FinanceiroRelatorios from "@/pages/FinanceiroRelatorios";
import AdminUsuarios from "@/pages/AdminUsuarios";
import AdminTemplates from "@/pages/AdminTemplates";
import AdminAutomacoes from "@/pages/AdminAutomacoes";
import AdminFilaMensagens from "@/pages/AdminFilaMensagens";
import AdminLogsMensagens from "@/pages/AdminLogsMensagens";
import AdminChecklists from "@/pages/AdminChecklists";
import ChecklistHistorico from "@/pages/ChecklistHistorico";
import AdminAuditoria from "@/pages/AdminAuditoria";
import AdminPermissoes from "@/pages/AdminPermissoes";
import Configuracoes from "@/pages/Configuracoes";
import AdminSuporte from "@/pages/AdminSuporte";
import PrestadorInicio from "@/pages/PrestadorInicio";
import PrestadorAtendimentos from "@/pages/PrestadorAtendimentos";
import PrestadorPerfil from "@/pages/PrestadorPerfil";
import AcompanhamentoCliente from "@/pages/AcompanhamentoCliente";
import PortalPrestador from "@/pages/PortalPrestador";
import WhatsAppSimulador from "@/pages/WhatsAppSimulador";
import SandboxWhatsApp from "@/pages/SandboxWhatsApp";
import AutomacaoWhatsApp from "@/pages/AutomacaoWhatsApp";
import AdminConversas from "@/pages/AdminConversas";
import QueroSerPrestador from "@/pages/QueroSerPrestador";
import AdminLeadsPrestadores from "@/pages/AdminLeadsPrestadores";
import Clientes from "@/pages/Clientes";
import Contratos from "@/pages/Contratos";
import ConfigMercadoPago from "@/pages/ConfigMercadoPago";
import ConfigPositron from "@/pages/ConfigPositron";
import Assinatura from "@/pages/Assinatura";
import FinanceiroNfse from "@/pages/FinanceiroNfse";
import BoasVindasPrestador from "@/pages/BoasVindasPrestador";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/conecte-se" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/login" element={<Navigate to="/conecte-se" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/prestador/boas-vindas" element={<BoasVindasPrestador />} />

      {/* Backoffice — /app/* */}
      <Route path="/app" element={<ProtectedRoute><PainelDashboard /></ProtectedRoute>} />
      <Route path="/app/painel" element={<ProtectedRoute><PainelDashboard /></ProtectedRoute>} />
      <Route path="/app/painel/indicadores" element={<ProtectedRoute><PainelIndicadores /></ProtectedRoute>} />
      <Route path="/app/painel/alertas" element={<ProtectedRoute><PainelAlertas /></ProtectedRoute>} />
      <Route path="/app/painel/sla" element={<ProtectedRoute><PainelSLA /></ProtectedRoute>} />
      <Route path="/app/painel/saude" element={<ProtectedRoute><PainelSaudeOperacao /></ProtectedRoute>} />
      <Route path="/app/painel/mapa-executivo" element={<ProtectedRoute><PainelMapaExecutivo /></ProtectedRoute>} />
      <Route path="/app/painel/satisfacao" element={<ProtectedRoute><PainelSatisfacao /></ProtectedRoute>} />

      {/* Operação */}
      <Route path="/app/operacao/solicitacoes" element={<ProtectedRoute requiredModules={['operacao', 'solicitacoes']}><OperacaoSolicitacoes /></ProtectedRoute>} />
      <Route path="/app/operacao/atendimentos" element={<ProtectedRoute requiredModules={['operacao', 'atendimentos']}><OperacaoAtendimentos /></ProtectedRoute>} />
      <Route path="/app/operacao/despacho" element={<ProtectedRoute requiredModules={['operacao', 'despacho']}><Despacho /></ProtectedRoute>} />
      <Route path="/app/operacao/mapa" element={<ProtectedRoute requiredModules={['operacao', 'mapa']}><MapaOperacional /></ProtectedRoute>} />
      <Route path="/app/operacao/teste-acionamento" element={<ProtectedRoute requiredModules={['operacao']}><OperacaoTesteAcionamento /></ProtectedRoute>} />
      <Route path="/app/operacao/acompanhamento" element={<ProtectedRoute requiredModules={['operacao']}><AcompanhamentoCliente /></ProtectedRoute>} />
      <Route path="/app/operacao/checklists" element={<ProtectedRoute requiredModules={['operacao']}><OperacaoChecklists /></ProtectedRoute>} />
      <Route path="/app/operacao/checklists/historico" element={<ProtectedRoute requiredModules={['operacao']}><ChecklistHistorico /></ProtectedRoute>} />

      {/* Rede */}
      <Route path="/app/rede/prestadores" element={<ProtectedRoute requiredModules={['rede', 'prestadores']}><RedePrestadores /></ProtectedRoute>} />
      <Route path="/app/rede/cobertura" element={<ProtectedRoute requiredModules={['rede']}><RedeCobertura /></ProtectedRoute>} />
      <Route path="/app/rede/disponibilidade" element={<ProtectedRoute requiredModules={['rede']}><RedeDisponibilidade /></ProtectedRoute>} />
      <Route path="/app/rede/homologacao" element={<ProtectedRoute requiredModules={['rede']}><RedeHomologacao /></ProtectedRoute>} />
      <Route path="/app/rede/performance" element={<ProtectedRoute requiredModules={['rede']}><RedePerformance /></ProtectedRoute>} />
      <Route path="/app/rede/comunicacao" element={<ProtectedRoute requiredModules={['rede']}><RedeComunicacao /></ProtectedRoute>} />
      <Route path="/app/rede/disparo-massa" element={<ProtectedRoute requiredModules={['rede']}><RedeDisparoMassa /></ProtectedRoute>} />

      {/* Financeiro */}
      <Route path="/app/financeiro/faturamento" element={<ProtectedRoute requiredModules={['financeiro', 'faturamento']}><Faturamento /></ProtectedRoute>} />
      <Route path="/app/financeiro/conferencia" element={<ProtectedRoute requiredModules={['financeiro']}><FinanceiroConferencia /></ProtectedRoute>} />
      <Route path="/app/financeiro/divergencias" element={<ProtectedRoute requiredModules={['financeiro']}><FinanceiroDivergencias /></ProtectedRoute>} />
      <Route path="/app/financeiro/glosas" element={<ProtectedRoute requiredModules={['financeiro']}><FinanceiroGlosas /></ProtectedRoute>} />
      <Route path="/app/financeiro/tarifas" element={<ProtectedRoute requiredModules={['financeiro', 'tarifas']}><FinanceiroTarifas /></ProtectedRoute>} />
      <Route path="/app/financeiro/tabelas" element={<ProtectedRoute requiredModules={['financeiro', 'tabela-precos']}><FinanceiroTabelas /></ProtectedRoute>} />
      <Route path="/app/financeiro/relatorios" element={<ProtectedRoute requiredModules={['financeiro']}><FinanceiroRelatorios /></ProtectedRoute>} />
      <Route path="/app/financeiro/nfse" element={<ProtectedRoute requiredModules={['financeiro']}><FinanceiroNfse /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/app/admin/usuarios" element={<ProtectedRoute requiredModules={['admin', 'usuarios']}><AdminUsuarios /></ProtectedRoute>} />
      <Route path="/app/admin/templates" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminTemplates /></ProtectedRoute>} />
      <Route path="/app/admin/automacoes" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminAutomacoes /></ProtectedRoute>} />
      <Route path="/app/admin/fila-mensagens" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminFilaMensagens /></ProtectedRoute>} />
      <Route path="/app/admin/logs-mensagens" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminLogsMensagens /></ProtectedRoute>} />
      <Route path="/app/admin/checklists" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminChecklists /></ProtectedRoute>} />
      <Route path="/app/admin/checklists/historico" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><ChecklistHistorico /></ProtectedRoute>} />
      <Route path="/app/admin/auditoria" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminAuditoria /></ProtectedRoute>} />
      <Route path="/app/admin/permissoes" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminPermissoes /></ProtectedRoute>} />
      <Route path="/app/admin/configuracoes" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><Configuracoes /></ProtectedRoute>} />
      <Route path="/app/admin/suporte" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><AdminSuporte /></ProtectedRoute>} />
      <Route path="/app/clientes" element={<ProtectedRoute requiredModules={['operacao']}><Clientes /></ProtectedRoute>} />
      <Route path="/app/admin/mercadopago" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><ConfigMercadoPago /></ProtectedRoute>} />
      <Route path="/app/admin/positron" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><ConfigPositron /></ProtectedRoute>} />
      <Route path="/app/admin/assinatura" element={<ProtectedRoute requiredModules={['admin', 'configuracoes']}><Assinatura /></ProtectedRoute>} />

      {/* WhatsApp & Simulação */}
      <Route path="/app/operacao/whatsapp-simulador" element={<ProtectedRoute requiredModules={['operacao']}><WhatsAppSimulador /></ProtectedRoute>} />
      <Route path="/app/operacao/sandbox-whatsapp" element={<ProtectedRoute requiredModules={['operacao']}><SandboxWhatsApp /></ProtectedRoute>} />
      <Route path="/app/operacao/automacao-whatsapp" element={<ProtectedRoute requiredModules={['operacao']}><AutomacaoWhatsApp /></ProtectedRoute>} />
      <Route path="/app/operacao/conversas" element={<ProtectedRoute requiredModules={['operacao']}><AdminConversas /></ProtectedRoute>} />

      {/* Legacy redirects */}
      <Route path="/app/faturamento" element={<Navigate to="/app/financeiro/faturamento" replace />} />
      <Route path="/app/configuracoes" element={<Navigate to="/app/admin/configuracoes" replace />} />
      <Route path="/app/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/app/operacao" element={<Navigate to="/app/operacao/solicitacoes" replace />} />
      <Route path="/app/financeiro" element={<Navigate to="/app/financeiro/faturamento" replace />} />
      <Route path="/app/admin" element={<Navigate to="/app/admin/usuarios" replace />} />
      <Route path="/app/solicitacoes" element={<Navigate to="/app/operacao/solicitacoes" replace />} />
      <Route path="/app/despacho" element={<Navigate to="/app/operacao/despacho" replace />} />
      <Route path="/app/atendimentos" element={<Navigate to="/app/operacao/atendimentos" replace />} />
      <Route path="/app/prestadores" element={<Navigate to="/app/rede/prestadores" replace />} />
      <Route path="/app/tarifas" element={<Navigate to="/app/financeiro/tarifas" replace />} />
      <Route path="/app/tabelas-de-precos" element={<Navigate to="/app/financeiro/tabelas" replace />} />
      <Route path="/app/relatorios" element={<Navigate to="/app/financeiro/relatorios" replace />} />
      <Route path="/app/auditoria" element={<Navigate to="/app/admin/auditoria" replace />} />
      <Route path="/app/mapa" element={<Navigate to="/app/operacao/mapa" replace />} />
      <Route path="/app/usuarios" element={<Navigate to="/app/admin/usuarios" replace />} />
      <Route path="/app/contratos" element={<ProtectedRoute requiredModules={['financeiro']}><Contratos /></ProtectedRoute>} />

      {/* Portal do Prestador — autenticado */}
      <Route path="/prestador" element={<PrestadorRoute><PrestadorInicio /></PrestadorRoute>} />
      <Route path="/prestador/inicio" element={<PrestadorRoute><PrestadorInicio /></PrestadorRoute>} />
      <Route path="/prestador/atendimentos" element={<PrestadorRoute><PrestadorAtendimentos /></PrestadorRoute>} />
      <Route path="/prestador/perfil" element={<PrestadorRoute><PrestadorPerfil /></PrestadorRoute>} />

      {/* Portal do Prestador — público (oferta e OS por link) */}
      <Route path="/prestador/oferta/:id" element={<PortalPrestador />} />
      <Route path="/prestador/os/:id" element={<PortalPrestador />} />
      <Route path="/prestador/:tipo/:id" element={<PortalPrestador />} />

      {/* Portal do Cliente */}
      <Route path="/acompanhar/:id" element={<AcompanhamentoCliente />} />

      {/* Página pública de pré-cadastro */}
      <Route path="/quero-ser-prestador" element={<QueroSerPrestador />} />

      {/* Admin — Leads de prestadores */}
      <Route path="/app/rede/leads" element={<ProtectedRoute requiredModules={['rede']}><AdminLeadsPrestadores /></ProtectedRoute>} />

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
