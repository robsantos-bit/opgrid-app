import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, Tag, TableProperties, ClipboardList, DollarSign, Settings, LogOut, Shield, BarChart3, FileText, History
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard, module: 'dashboard' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { title: 'Prestadores', url: '/prestadores', icon: Users, module: 'prestadores' },
      { title: 'Atendimentos', url: '/atendimentos', icon: ClipboardList, module: 'atendimentos' },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { title: 'Tarifas', url: '/tarifas', icon: Tag, module: 'tarifas' },
      { title: 'Tabelas de Preço', url: '/tabela-precos', icon: TableProperties, module: 'tabela-precos' },
      { title: 'Contratos', url: '/contratos', icon: FileText, module: 'contratos' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { title: 'Faturamento', url: '/faturamento', icon: DollarSign, module: 'faturamento' },
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3, module: 'relatorios' },
    ],
  },
  {
    label: 'Governança',
    items: [
      { title: 'Auditoria', url: '/auditoria', icon: History, module: 'auditoria' },
      { title: 'Configurações', url: '/configuracoes', icon: Settings, module: 'configuracoes' },
    ],
  },
];

const roleLabels: Record<string, string> = { admin: 'Administrador', operador: 'Operador', financeiro: 'Financeiro', prestador: 'Prestador' };
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
      <SidebarContent className="py-4">
        {/* Logo */}
        <div className="px-4 pb-4">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                <Shield className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-sidebar-foreground leading-none tracking-tight">RedeControl</p>
                <p className="text-[9px] text-sidebar-muted leading-none mt-1 font-medium tracking-wide">GESTÃO DA REDE CREDENCIADA</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Shield className="h-4.5 w-4.5 text-sidebar-primary-foreground" />
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border/50 mb-2" />

        {menuGroups.map(group => {
          const visibleItems = group.items.filter(item => hasAccess([item.module]));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label} className="py-0.5">
              {!collapsed && <SidebarGroupLabel className="text-[9px] text-sidebar-muted/70 uppercase tracking-[0.15em] font-semibold px-4 pb-1 pt-2">{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5 px-2.5">
                  {visibleItems.map((item) => {
                    const active = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end={item.url === '/'}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                              active
                                ? 'bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold shadow-sm'
                                : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
                            }`}
                            activeClassName="bg-sidebar-primary/15 text-sidebar-primary-foreground font-semibold">
                            <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? 'text-sidebar-primary' : ''}`} />
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

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        {!collapsed && user && (
          <div className="px-1.5 py-2 mb-1.5">
            <p className="font-semibold text-sidebar-foreground text-[13px] truncate">{user.nome}</p>
            <p className="text-[11px] text-sidebar-muted truncate mt-0.5">{user.email}</p>
            <span className={`inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${roleColors[user.role] || 'bg-sidebar-accent text-sidebar-accent-foreground'}`}>
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 h-8 text-xs font-medium">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          {!collapsed && 'Sair do sistema'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
