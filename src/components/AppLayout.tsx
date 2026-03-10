import { ReactNode, useState, useEffect, useRef } from 'react';
import { playCentralSiren } from '@/lib/sirenSound';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Search, ChevronDown, User, Settings, LogOut, Hexagon, MessageCircle, Radar, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const roleLabels: Record<string, string> = { admin: 'Admin Master', operador: 'Operações', financeiro: 'Financeiro', prestador: 'Prestador' };

const navItems = [
  { label: 'Visão Geral', path: '/', module: 'dashboard' },
  { label: 'Solicitações', path: '/solicitacoes', module: 'solicitacoes' },
  { label: 'Despacho', path: '/despacho', module: 'despacho' },
  { label: 'Operações', path: '/atendimentos', module: 'atendimentos' },
  { label: 'Mapa', path: '/mapa', module: 'atendimentos' },
  { label: 'Prestadores', path: '/prestadores', module: 'prestadores' },
  { label: 'Tarifas', path: '/tarifas', module: 'tarifas' },
  { label: 'Tabelas', path: '/tabela-precos', module: 'tabela-precos' },
  { label: 'Faturamento', path: '/faturamento', module: 'faturamento' },
  { label: 'Auditoria', path: '/auditoria', module: 'auditoria' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout, hasAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sirenActive, setSirenActive] = useState(true);
  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleNav = navItems.filter(item => hasAccess([item.module]));

  const sirenPlayedRef = useRef(false);

  // Simulate siren toggling for demo — plays real audio alert
  useEffect(() => {
    const interval = setInterval(() => {
      setSirenActive(prev => {
        const next = !prev;
        if (next && !sirenPlayedRef.current) {
          playCentralSiren(2.5);
          sirenPlayedRef.current = true;
          setTimeout(() => { sirenPlayedRef.current = false; }, 10000);
        }
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 border-b bg-card shrink-0 sticky top-0 z-30">
        <div className="h-full flex items-center justify-between px-5 max-w-[1600px] mx-auto">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <Hexagon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[14px] font-bold tracking-tight leading-none">OpGrid</p>
                <p className="text-[9px] text-muted-foreground leading-none mt-0.5 font-medium tracking-wide uppercase">Guincho & Assistência 24h</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {visibleNav.map(item => {
                const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar..." className="h-8 w-[220px] pl-8 text-xs bg-muted/50 border-0 focus-visible:ring-1" autoFocus onBlur={() => setSearchOpen(false)} />
              </div>
            ) : (
              <button className="hidden md:flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors" onClick={() => setSearchOpen(true)}>
                <Search className="h-3.5 w-3.5" /><span>Buscar</span><kbd className="hidden xl:inline text-[10px] bg-background px-1.5 py-0.5 rounded border ml-3 font-mono">⌘K</kbd>
              </button>
            )}

            {/* Differential badges */}
            <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-success border border-success/20 bg-success/5 rounded-md px-2 py-1 font-medium">
              <MessageCircle className="h-3 w-3" /><span>WhatsApp ativo</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-primary border border-primary/20 bg-primary/5 rounded-md px-2 py-1 font-medium">
              <Radar className="h-3 w-3" /><span>Despacho auto</span>
            </div>

            <div className="hidden 2xl:flex items-center gap-1.5 text-[10px] text-info border border-info/20 bg-info/5 rounded-md px-2 py-1 font-medium">
              <Smartphone className="h-3 w-3" /><span>Sem app</span>
            </div>

            {/* Siren bell */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className={`h-3.5 w-3.5 ${sirenActive ? 'text-destructive animate-siren-glow' : 'text-muted-foreground'}`} />
              {sirenActive && (
                <>
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full animate-siren-pulse" />
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full" />
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 hover:bg-muted/40">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-[11px] font-bold">{user?.nome?.charAt(0) || 'U'}</div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-semibold leading-none">{user?.nome}</span>
                    <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{roleLabels[user?.role || '']}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="gap-2 text-xs"><User className="h-3.5 w-3.5" />Meu Perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="gap-2 text-xs"><Settings className="h-3.5 w-3.5" />Configurações</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive gap-2 text-xs"><LogOut className="h-3.5 w-3.5" />Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="lg:hidden border-b bg-card overflow-x-auto scrollbar-thin">
        <nav className="flex items-center gap-0.5 px-3 py-1.5 min-w-max">
          {visibleNav.map(item => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
