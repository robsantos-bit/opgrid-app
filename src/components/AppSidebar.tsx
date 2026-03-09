import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Users, Tag, TableProperties, ClipboardList, DollarSign, Settings, LogOut, Truck, BarChart3
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Prestadores', url: '/prestadores', icon: Users },
  { title: 'Tabelas de Preço', url: '/tabela-precos', icon: TableProperties },
  { title: 'Tarifas', url: '/tarifas', icon: Tag },
  { title: 'Atendimentos', url: '/atendimentos', icon: ClipboardList },
  { title: 'Faturamento', url: '/faturamento', icon: DollarSign },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <Sidebar collapsible="icon" className="sidebar-gradient border-r-0">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 px-3 py-4">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <Truck className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-sidebar-foreground leading-tight">GTP</p>
                  <p className="text-[10px] text-sidebar-muted leading-tight">Gestão de Prestadores</p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center mx-auto">
                <Truck className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end={item.url === '/'}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && user && (
          <div className="px-2 py-2 text-xs text-sidebar-foreground/60 truncate">
            <p className="font-medium text-sidebar-foreground text-sm truncate">{user.nome}</p>
            <p className="truncate">{user.email}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
