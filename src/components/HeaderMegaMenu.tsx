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
      { label: 'Indicadores', path: '/app/relatorios', icon: BarChart3, description: 'KPIs e métricas' },
      { label: 'Alertas', path: '/app', icon: AlertTriangle, description: 'Alertas operacionais' },
      { label: 'SLA e Performance', path: '/app', icon: Gauge, description: 'Metas e resultados' },
      { label: 'Saúde da Operação', path: '/app', icon: Activity, description: 'Status em tempo real' },
      { label: 'Mapa Executivo', path: '/app/mapa', icon: Map, description: 'Visão geográfica' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { label: 'Solicitações', path: '/app/solicitacoes', icon: ClipboardList, description: 'Novas chamadas' },
      { label: 'Despacho', path: '/app/despacho', icon: Send, description: 'Acionamento de prestadores' },
      { label: 'Atendimentos', path: '/app/atendimentos', icon: Headphones, description: 'OS em andamento' },
      { label: 'Mapa Operacional', path: '/app/mapa', icon: MapPin, description: 'Mapa ao vivo' },
      { label: 'Teste de Acionamento', path: '/app/sandbox', icon: Zap, description: 'Simular despacho' },
      { label: 'Acompanhamento', path: '/app', icon: UsersIcon, description: 'Portal do cliente' },
      { label: 'Checklists', path: '/app', icon: CheckSquare, description: 'Checklists executados' },
    ],
  },
  {
    label: 'Rede',
    items: [
      { label: 'Prestadores', path: '/app/prestadores', icon: Users, description: 'Base de parceiros' },
      { label: 'Cobertura', path: '/app/prestadores', icon: Globe, description: 'Áreas atendidas' },
      { label: 'Disponibilidade', path: '/app/prestadores', icon: Radio, description: 'Status online' },
      { label: 'Homologação', path: '/app/prestadores', icon: Shield, description: 'Aprovação de novos' },
      { label: 'Performance', path: '/app/prestadores', icon: TrendingUp, description: 'Ranking de parceiros' },
      { label: 'Comunicação', path: '/app/whatsapp', icon: MessageCircle, description: 'Mensagens diretas' },
      { label: 'Disparo em Massa', path: '/app/automacao-whatsapp', icon: Megaphone, description: 'Campanhas' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Faturamento', path: '/app/faturamento', icon: DollarSign, description: 'Ciclos de cobrança' },
      { label: 'Conferência', path: '/app/faturamento', icon: FileSearch, description: 'Revisão de valores' },
      { label: 'Divergências', path: '/app/faturamento', icon: AlertCircle, description: 'Itens em conflito' },
      { label: 'Glosas', path: '/app/faturamento', icon: XCircle, description: 'Contestações' },
      { label: 'Tarifas', path: '/app/tarifas', icon: Tag, description: 'Valores vigentes' },
      { label: 'Tabelas Comerciais', path: '/app/tabela-precos', icon: TableProperties, description: 'Preços por região' },
      { label: 'Relatórios', path: '/app/relatorios', icon: FileText, description: 'Exportações financeiras' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Templates', path: '/app/automacao-whatsapp', icon: Mail, description: 'Modelos de mensagem' },
      { label: 'Automações', path: '/app/automacao-whatsapp', icon: Zap, description: 'Fluxos automáticos' },
      { label: 'Checklists Digitais', path: '/app', icon: ListChecks, description: 'Formulários operacionais' },
      { label: 'Auditoria', path: '/app/auditoria', icon: History, description: 'Logs e rastreamento' },
      { label: 'Permissões', path: '/app/configuracoes', icon: Lock, description: 'Controle de acesso' },
      { label: 'Configurações', path: '/app/configuracoes', icon: Settings, description: 'Preferências do sistema' },
      { label: 'Suporte', path: '/app/configuracoes', icon: HelpCircle, description: 'Ajuda e contato' },
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
