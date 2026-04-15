import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import { useSignOut } from '@/hooks/useSignOut';
import { hasModuleAccess, type AppRole } from '@/components/RouteGuards';
import {
  Sidebar, SidebarContent, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  LayoutDashboard, Users, Tag, TableProperties, ClipboardList, DollarSign, Settings, LogOut, BarChart3, FileText, History, Hexagon, MessageCircle, Radio, Zap, Map, Send,
  Globe, Shield, TrendingUp, Megaphone, FileSearch, AlertCircle, XCircle, ListChecks, Lock, HelpCircle, CheckSquare, Activity, Headphones, Smartphone, UserPlus, Star,
  Building2, CreditCard, Satellite, BadgeDollarSign,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';

const menuGroups = [
  {
    label: 'Visão Geral',
    icon: LayoutDashboard,
    requiredModules: ['painel', 'dashboard'],
    items: [
      { title: 'Dashboard', url: '/app/painel', icon: LayoutDashboard, modules: ['dashboard', 'painel'] },
      { title: 'Satisfação', url: '/app/painel/satisfacao', icon: Star, modules: ['dashboard', 'painel'] },
    ],
  },
  {
    label: 'Operação',
    icon: Headphones,
    requiredModules: ['operacao'],
    items: [
      { title: 'Solicitações', url: '/app/operacao/solicitacoes', icon: ClipboardList, modules: ['operacao', 'solicitacoes'] },
      { title: 'Clientes', url: '/app/clientes', icon: Building2, modules: ['operacao'] },
      { title: 'Despacho', url: '/app/operacao/despacho', icon: Send, modules: ['operacao', 'despacho'] },
      { title: 'Atendimentos', url: '/app/operacao/atendimentos', icon: Headphones, modules: ['operacao', 'atendimentos'] },
      { title: 'Mapa Operacional', url: '/app/operacao/mapa', icon: Map, modules: ['operacao', 'mapa'] },
      { title: 'Teste de Acionamento', url: '/app/operacao/teste-acionamento', icon: Radio, modules: ['operacao'] },
      { title: 'Acompanhamento', url: '/app/operacao/acompanhamento', icon: Activity, modules: ['operacao'] },
      { title: 'Checklists', url: '/app/operacao/checklists', icon: CheckSquare, modules: ['operacao'] },
      { title: 'Histórico Checklists', url: '/app/operacao/checklists/historico', icon: History, modules: ['operacao'] },
      { title: 'Simulador WhatsApp', url: '/app/operacao/whatsapp-simulador', icon: Smartphone, modules: ['operacao'] },
      { title: 'Conversas WhatsApp', url: '/app/operacao/conversas', icon: MessageCircle, modules: ['operacao'] },
    ],
  },
  {
    label: 'Rede',
    icon: Globe,
    requiredModules: ['rede'],
    items: [
      { title: 'Prestadores', url: '/app/rede/prestadores', icon: Users, modules: ['rede', 'prestadores'] },
      { title: 'Leads Prestadores', url: '/app/rede/leads', icon: UserPlus, modules: ['rede'] },
      { title: 'Cobertura', url: '/app/rede/cobertura', icon: Globe, modules: ['rede'] },
      { title: 'Disponibilidade', url: '/app/rede/disponibilidade', icon: Radio, modules: ['rede'] },
      { title: 'Homologação', url: '/app/rede/homologacao', icon: Shield, modules: ['rede'] },
      { title: 'Performance', url: '/app/rede/performance', icon: TrendingUp, modules: ['rede'] },
      { title: 'Comunicação', url: '/app/rede/comunicacao', icon: MessageCircle, modules: ['rede'] },
      { title: 'Disparo em Massa', url: '/app/rede/disparo-massa', icon: Megaphone, modules: ['rede'] },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    requiredModules: ['financeiro'],
    items: [
      { title: 'Faturamento', url: '/app/financeiro/faturamento', icon: DollarSign, modules: ['financeiro', 'faturamento'] },
      { title: 'Conferência', url: '/app/financeiro/conferencia', icon: FileSearch, modules: ['financeiro'] },
      { title: 'Divergências', url: '/app/financeiro/divergencias', icon: AlertCircle, modules: ['financeiro'] },
      { title: 'Glosas', url: '/app/financeiro/glosas', icon: XCircle, modules: ['financeiro'] },
      { title: 'Tarifas', url: '/app/financeiro/tarifas', icon: Tag, modules: ['financeiro', 'tarifas'] },
      { title: 'Tabelas Comerciais', url: '/app/financeiro/tabelas', icon: TableProperties, modules: ['financeiro', 'tabela-precos'] },
      { title: 'Relatórios', url: '/app/financeiro/relatorios', icon: BarChart3, modules: ['financeiro'] },
      { title: 'Notas Fiscais (NFS-e)', url: '/app/financeiro/nfse', icon: FileText, modules: ['financeiro'] },
    ],
  },
  {
    label: 'Admin',
    icon: Settings,
    requiredModules: ['admin'],
    items: [
      { title: 'Usuários', url: '/app/admin/usuarios', icon: Users, modules: ['admin', 'usuarios'] },
      { title: 'Templates', url: '/app/admin/templates', icon: FileText, modules: ['admin', 'configuracoes'] },
      { title: 'Automações', url: '/app/admin/automacoes', icon: Zap, modules: ['admin', 'configuracoes'] },
      { title: 'Checklists Digitais', url: '/app/admin/checklists', icon: ListChecks, modules: ['admin', 'configuracoes'] },
      { title: 'Histórico Checklists', url: '/app/admin/checklists/historico', icon: History, modules: ['admin', 'configuracoes'] },
      { title: 'Auditoria', url: '/app/admin/auditoria', icon: History, modules: ['admin', 'configuracoes'] },
      { title: 'Permissões', url: '/app/admin/permissoes', icon: Lock, modules: ['admin', 'configuracoes'] },
      { title: 'Configurações', url: '/app/admin/configuracoes', icon: Settings, modules: ['admin', 'configuracoes'] },
      { title: 'Mercado Pago', url: '/app/admin/mercadopago', icon: CreditCard, modules: ['admin', 'configuracoes'] },
      { title: 'Positron GPS', url: '/app/admin/positron', icon: Satellite, modules: ['admin', 'configuracoes'] },
      { title: 'Assinatura', url: '/app/admin/assinatura', icon: BadgeDollarSign, modules: ['admin', 'configuracoes'] },
      { title: 'Suporte', url: '/app/admin/suporte', icon: HelpCircle, modules: ['admin', 'configuracoes'] },
    ],
  },
];

const roleLabels: Record<string, string> = { admin: 'Admin Master', operador: 'Operações', financeiro: 'Financeiro', comercial: 'Comercial', prestador: 'Prestador' };
const roleColors: Record<string, string> = { admin: 'bg-primary/20 text-primary', operador: 'bg-accent/20 text-accent', financeiro: 'bg-warning/20 text-warning', comercial: 'bg-info/20 text-info', prestador: 'bg-info/20 text-info' };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: authData } = useAuthProfile();
  const signOut = useSignOut();

  const roles: AppRole[] = authData?.roles?.length ? authData.roles : user ? [user.role as AppRole] : [];
  const displayRole = authData?.primaryRole || user?.role || '';
  const displayName = authData?.profile?.nome || user?.nome || '';
  const displayEmail = authData?.profile?.email || user?.email || '';

  // Determine which groups have active routes to auto-expand them
  const defaultOpenGroups = useMemo(() => {
    return menuGroups
      .filter(group => group.items.some(item =>
        location.pathname === item.url || (item.url !== '/app/painel' && location.pathname.startsWith(item.url))
      ))
      .map(group => group.label);
  }, [location.pathname]);

  const handleLogout = () => {
    signOut.mutate(undefined, {
      onSettled: () => navigate('/login'),
    });
  };

  return (
    <Sidebar collapsible="icon" className="sidebar-gradient border-r-0">
      <SidebarContent className="p-0">
        {/* Logo */}
        <div className="px-4 py-3">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 rounded-lg flex items-center justify-center shrink-0">
                <Hexagon className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-sidebar-foreground leading-none tracking-tight">OpGrid</p>
                <p className="text-[9px] text-sidebar-muted leading-none mt-1 font-medium tracking-wide uppercase">Inteligência Operacional</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 rounded-lg flex items-center justify-center mx-auto">
              <Hexagon className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border/40" />

        <ScrollArea className="flex-1">
          {collapsed ? (
            /* Collapsed: show only icons flat */
            <div className="flex flex-col items-center gap-0.5 py-2">
              {menuGroups.map(group => {
                const visibleItems = group.items.filter(item => hasModuleAccess(roles, item.modules));
                if (visibleItems.length === 0) return null;
                return visibleItems.map(item => {
                  const active = location.pathname === item.url || (item.url !== '/app/painel' && location.pathname.startsWith(item.url));
                  return (
                    <NavLink key={item.url} to={item.url} end={item.url === '/app/painel'}
                      className={`flex items-center justify-center w-9 h-9 rounded-md transition-all ${
                        active ? 'bg-sidebar-primary/15 text-sidebar-primary' : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                      }`}
                      title={item.title}>
                      <item.icon className="h-4 w-4 shrink-0" />
                    </NavLink>
                  );
                });
              })}
            </div>
          ) : (
            /* Expanded: accordion groups */
            <Accordion type="multiple" defaultValue={defaultOpenGroups} className="px-2 py-1">
              {menuGroups.map(group => {
                const visibleItems = group.items.filter(item => hasModuleAccess(roles, item.modules));
                if (visibleItems.length === 0) return null;
                const GroupIcon = group.icon;
                return (
                  <AccordionItem key={group.label} value={group.label} className="border-b-0 border-sidebar-border/20">
                    <AccordionTrigger className="py-2 px-2.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-sidebar-muted/70 hover:text-sidebar-foreground hover:no-underline [&[data-state=open]>svg]:text-sidebar-primary">
                      <span className="flex items-center gap-2">
                        <GroupIcon className="h-3.5 w-3.5" />
                        {group.label}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pt-0">
                      <div className="flex flex-col gap-px">
                        {visibleItems.map(item => {
                          const active = location.pathname === item.url || (item.url !== '/app/painel' && location.pathname.startsWith(item.url));
                          return (
                            <NavLink key={item.url} to={item.url} end={item.url === '/app/painel'}
                              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100 ${
                                active
                                  ? 'bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold'
                                  : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                              }`}
                              activeClassName="bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold">
                              <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-sidebar-primary' : ''}`} />
                              <span>{item.title}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2.5 border-t border-sidebar-border/40">
        {!collapsed && user && (
          <div className="px-1.5 py-1.5 mb-1">
            <p className="font-semibold text-sidebar-foreground text-[13px] truncate">{displayName}</p>
            <p className="text-[11px] text-sidebar-muted truncate mt-0.5">{displayEmail}</p>
            <Badge className={`mt-1.5 text-[9px] font-bold px-1.5 py-0 border-0 ${roleColors[displayRole] || 'bg-sidebar-accent text-sidebar-accent-foreground'}`}>
              {roleLabels[displayRole] || displayRole}
            </Badge>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground/35 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 h-7 text-xs">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
