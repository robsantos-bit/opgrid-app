import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, Tag, TableProperties, ClipboardList, DollarSign, Settings, LogOut, BarChart3, FileText, History, Hexagon, MessageCircle, Radio, Zap
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const menuGroups = [
  {
    label: 'Visão Geral',
    items: [
      { title: 'Dashboard', url: '/app', icon: LayoutDashboard, module: 'dashboard' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { title: 'Operações', url: '/app/atendimentos', icon: ClipboardList, module: 'atendimentos' },
      { title: 'Simulador WhatsApp', url: '/app/whatsapp', icon: MessageCircle, module: 'solicitacoes' },
      { title: 'Sandbox WhatsApp', url: '/app/sandbox', icon: Radio, module: 'solicitacoes' },
      { title: 'Automação WhatsApp', url: '/app/automacao-whatsapp', icon: Zap, module: 'solicitacoes' },
      { title: 'Prestadores', url: '/app/prestadores', icon: Users, module: 'prestadores' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { title: 'Tarifas', url: '/app/tarifas', icon: Tag, module: 'tarifas' },
      { title: 'Tabelas Comerciais', url: '/app/tabela-precos', icon: TableProperties, module: 'tabela-precos' },
      { title: 'Contratos', url: '/app/contratos', icon: FileText, module: 'contratos' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { title: 'Faturamento', url: '/app/faturamento', icon: DollarSign, module: 'faturamento' },
      { title: 'Relatórios', url: '/app/relatorios', icon: BarChart3, module: 'relatorios' },
    ],
  },
  {
    label: 'Governança',
    items: [
      { title: 'Auditoria', url: '/app/auditoria', icon: History, module: 'auditoria' },
      { title: 'Configurações', url: '/app/configuracoes', icon: Settings, module: 'configuracoes' },
    ],
  },
];

const roleLabels: Record<string, string> = { admin: 'Admin Master', operador: 'Operações', financeiro: 'Financeiro', prestador: 'Prestador' };
const roleColors: Record<string, string> = { admin: 'bg-primary/20 text-primary', operador: 'bg-accent/20 text-accent', financeiro: 'bg-warning/20 text-warning', prestador: 'bg-info/20 text-info' };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasAccess } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <Sidebar collapsible="icon" className="sidebar-gradient border-r-0">
      <SidebarContent className="py-3">
        {/* Logo */}
        <div className="px-4 pb-3">
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

        <Separator className="bg-sidebar-border/40 mb-1.5" />

        {menuGroups.map(group => {
          const visibleItems = group.items.filter(item => hasAccess([item.module]));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label} className="py-0.5">
              {!collapsed && <SidebarGroupLabel className="text-[9px] text-sidebar-muted/60 uppercase tracking-[0.15em] font-semibold px-4 pb-0.5 pt-2">{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className="gap-px px-2">
                  {visibleItems.map((item) => {
                    const active = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end={item.url === '/'}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100 ${
                              active
                                ? 'bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold'
                                : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30'
                            }`}
                            activeClassName="bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold">
                            <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-sidebar-primary' : ''}`} />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-2.5 border-t border-sidebar-border/40">
        {!collapsed && user && (
          <div className="px-1.5 py-1.5 mb-1">
            <p className="font-semibold text-sidebar-foreground text-[13px] truncate">{user.nome}</p>
            <p className="text-[11px] text-sidebar-muted truncate mt-0.5">{user.email}</p>
            <Badge className={`mt-1.5 text-[9px] font-bold px-1.5 py-0 border-0 ${roleColors[user.role] || 'bg-sidebar-accent text-sidebar-accent-foreground'}`}>
              {roleLabels[user.role] || user.role}
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
