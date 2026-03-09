import { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Bell, Search, Building2, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
          <header className="h-[52px] flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8" />
              <Separator orientation="vertical" className="h-5 hidden sm:block" />
              {searchOpen ? (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar no sistema..."
                    className="h-8 w-[220px] md:w-[280px] pl-8 text-xs bg-muted/50 border-0 focus-visible:ring-1"
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                  />
                </div>
              ) : (
                <button
                  className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Buscar...</span>
                  <kbd className="hidden lg:inline text-[10px] bg-background px-1.5 py-0.5 rounded border ml-4">⌘K</kbd>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground border rounded-lg px-2.5 py-1.5 bg-muted/30">
                <Building2 className="h-3 w-3" />
                <span>Matriz</span>
              </div>

              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>

              <Separator orientation="vertical" className="h-5 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                      {user?.nome?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-xs font-medium leading-none">{user?.nome}</span>
                      <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{user?.role === 'admin' ? 'Administrador' : 'Prestador'}</span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                    <User className="h-4 w-4 mr-2" />Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                    <Settings className="h-4 w-4 mr-2" />Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
