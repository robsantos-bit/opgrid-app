import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, BarChart3, AlertTriangle, Gauge, Activity, Map,
  ClipboardList, Send, Headphones, MapPin, Zap, Users as UsersIcon, CheckSquare,
  Users, Globe, Radio, Shield, TrendingUp, MessageCircle, Megaphone,
  DollarSign, FileSearch, AlertCircle, XCircle, Tag, TableProperties, FileText,
  Mail, Settings, ListChecks, History, Lock, HelpCircle,
  ChevronDown, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubItem {
  label: string;
  path: string;
  icon: LucideIcon;
  description?: string;
}

interface MenuGroup {
  label: string;
  items: SubItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Painel',
    items: [
      { label: 'Visão Geral', path: '/app', icon: LayoutDashboard, description: 'Dashboard principal' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { label: 'Solicitações', path: '/app/operacao/solicitacoes', icon: ClipboardList, description: 'Novas chamadas' },
      { label: 'Atendimentos', path: '/app/operacao/atendimentos', icon: Headphones, description: 'OS em andamento' },
    ],
  },
  {
    label: 'Rede',
    items: [
      { label: 'Prestadores', path: '/app/rede/prestadores', icon: Users, description: 'Base de parceiros' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Faturamento', path: '/app/financeiro/faturamento', icon: DollarSign, description: 'Ciclos de cobrança' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Usuários', path: '/app/admin/usuarios', icon: Lock, description: 'Gerenciar usuários' },
      { label: 'Configurações', path: '/app/admin/configuracoes', icon: Settings, description: 'Preferências do sistema' },
    ],
  },
];

function MegaMenuDropdown({ group, isActive }: { group: MenuGroup; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
        onClick={() => setOpen(v => !v)}
      >
        {group.label}
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
          <div className="bg-popover border border-border rounded-xl shadow-xl p-2 min-w-[280px] animate-in fade-in-0 zoom-in-95 duration-150">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 pt-1 pb-2">
              {group.label}
            </p>
            <div className="grid gap-0.5">
              {group.items.map(item => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted/60 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground leading-tight">{item.label}</p>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeaderMegaMenu() {
  const location = useLocation();
  const { hasAccess } = useAuth();

  const isGroupActive = (group: MenuGroup) =>
    group.items.some(
      item =>
        location.pathname === item.path ||
        (item.path !== '/app' && location.pathname.startsWith(item.path))
    );

  return (
    <nav className="hidden lg:flex items-center gap-0.5">
      {menuGroups.map(group => (
        <MegaMenuDropdown
          key={group.label}
          group={group}
          isActive={isGroupActive(group)}
        />
      ))}
    </nav>
  );
}

export { menuGroups };
