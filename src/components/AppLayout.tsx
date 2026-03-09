import { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Bell, Search, Building2, ChevronDown, User, Settings, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const roleLabels: Record<string, string> = { admin: 'Administrador', operador: 'Operador', financeiro: 'Financeiro', prestador: 'Prestador' };

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/90 backdrop-blur-md px-5 shrink-0 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="h-8 w-8" />
              <Separator orientation="vertical" className="h-5 hidden sm:block" />
              {searchOpen ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar no sistema..." className="h-9 w-[240px] md:w-[320px] pl-10 text-sm bg-muted/50 border-0 focus-visible:ring-1" autoFocus onBlur={() => setSearchOpen(false)} />
                </div>
              ) : (
                <button className="hidden sm:flex items-center gap-2.5 text-[13px] text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted transition-colors" onClick={() => setSearchOpen(true)}>
                  <Search className="h-4 w-4" /><span>Buscar...</span><kbd className="hidden lg:inline text-[10px] bg-background px-1.5 py-0.5 rounded border ml-6 font-mono">⌘K</kbd>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 text-[12px] text-muted-foreground border rounded-lg px-3 py-1.5 bg-muted/20 font-medium">
                <Building2 className="h-3.5 w-3.5" /><span>Matriz Principal</span>
              </div>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
              </Button>
              <Separator orientation="vertical" className="h-5 mx-0.5" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2.5 h-9 px-2.5 hover:bg-muted/50">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-sm">{user?.nome?.charAt(0) || 'U'}</div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-[13px] font-semibold leading-none">{user?.nome}</span>
                      <span className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium">{roleLabels[user?.role || ''] || ''}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="gap-2"><User className="h-4 w-4" />Meu Perfil</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="gap-2"><Settings className="h-4 w-4" />Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2"><LogOut className="h-4 w-4" />Sair do sistema</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-5 md:p-7 lg:p-8 scrollbar-thin">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
