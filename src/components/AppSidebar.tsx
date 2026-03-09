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
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-sidebar-foreground leading-none">RedeControl</p>
                <p className="text-[9px] text-sidebar-muted leading-none mt-1">Gestão da Rede Credenciada</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border mb-1" />

        {menuGroups.map(group => {
          const visibleItems = group.items.filter(item => hasAccess([item.module]));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              {!collapsed && <SidebarGroupLabel className="text-[9px] text-sidebar-muted uppercase tracking-widest px-4 pb-1">{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5 px-2">
                  {visibleItems.map((item) => {
                    const active = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end={item.url === '/'}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                              active ? 'bg-sidebar-primary/15 text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                            activeClassName="bg-sidebar-primary/15 text-sidebar-primary-foreground font-medium">
                            <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-sidebar-primary' : ''}`} />
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

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-1 py-1.5 text-xs text-sidebar-foreground/50 truncate mb-1">
            <p className="font-medium text-sidebar-foreground text-[13px] truncate">{user.nome}</p>
            <p className="truncate text-[11px] mt-0.5">{user.email}</p>
            <Badge role={user.role} />
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-8 text-xs">
          <LogOut className="h-3.5 w-3.5 mr-2" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function Badge({ role }: { role: string }) {
  const labels: Record<string, string> = { admin: 'Administrador', operador: 'Operador', financeiro: 'Financeiro', prestador: 'Prestador' };
  return <span className="inline-block mt-1 text-[9px] bg-sidebar-accent px-1.5 py-0.5 rounded text-sidebar-accent-foreground">{labels[role] || role}</span>;
}
