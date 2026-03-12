import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, BarChart3, AlertTriangle, Gauge, Activity, Map,
  ClipboardList, Send, Headphones, MapPin, Zap, Users as UsersIcon, CheckSquare, Smartphone,
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
      { label: 'Indicadores', path: '/app/painel/indicadores', icon: BarChart3, description: 'Métricas-chave' },
      { label: 'Alertas', path: '/app/painel/alertas', icon: AlertTriangle, description: 'Central de alertas' },
      { label: 'SLA e Performance', path: '/app/painel/sla', icon: Gauge, description: 'Acordos de nível de serviço' },
      { label: 'Saúde da Operação', path: '/app/painel/saude', icon: Activity, description: 'Estado operacional' },
      { label: 'Mapa Executivo', path: '/app/painel/mapa-executivo', icon: Map, description: 'Visão estratégica por região' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { label: 'Solicitações', path: '/app/operacao/solicitacoes', icon: ClipboardList, description: 'Novas chamadas' },
      { label: 'Despacho', path: '/app/operacao/despacho', icon: Send, description: 'Central de despacho' },
      { label: 'Atendimentos', path: '/app/operacao/atendimentos', icon: Headphones, description: 'OS em andamento' },
      { label: 'Mapa Operacional', path: '/app/operacao/mapa', icon: Map, description: 'Visão geográfica' },
      { label: 'Teste de Acionamento', path: '/app/operacao/teste-acionamento', icon: Radio, description: 'Simular acionamentos' },
      { label: 'Acompanhamento do Cliente', path: '/app/operacao/acompanhamento', icon: Activity, description: 'Links de tracking' },
      { label: 'Checklists Executados', path: '/app/operacao/checklists', icon: CheckSquare, description: 'Checklists em campo' },
      { label: 'Simulador WhatsApp', path: '/app/operacao/whatsapp-simulador', icon: Smartphone, description: 'Jornada do cliente via WhatsApp' },
    ],
  },
  {
    label: 'Rede',
    items: [
      { label: 'Prestadores', path: '/app/rede/prestadores', icon: Users, description: 'Base de parceiros' },
      { label: 'Cobertura', path: '/app/rede/cobertura', icon: Globe, description: 'Mapa de cobertura' },
      { label: 'Disponibilidade', path: '/app/rede/disponibilidade', icon: Radio, description: 'Status em tempo real' },
      { label: 'Homologação', path: '/app/rede/homologacao', icon: Shield, description: 'Processo de aprovação' },
      { label: 'Performance', path: '/app/rede/performance', icon: TrendingUp, description: 'Indicadores de desempenho' },
      { label: 'Comunicação', path: '/app/rede/comunicacao', icon: MessageCircle, description: 'Mensagens para prestadores' },
      { label: 'Disparo em Massa', path: '/app/rede/disparo-massa', icon: Megaphone, description: 'Comunicação em larga escala' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Faturamento', path: '/app/financeiro/faturamento', icon: DollarSign, description: 'Ciclos de cobrança' },
      { label: 'Conferência', path: '/app/financeiro/conferencia', icon: FileSearch, description: 'Conferência de valores' },
      { label: 'Divergências', path: '/app/financeiro/divergencias', icon: AlertCircle, description: 'Inconsistências financeiras' },
      { label: 'Glosas', path: '/app/financeiro/glosas', icon: XCircle, description: 'Contestações e glosas' },
      { label: 'Tarifas', path: '/app/financeiro/tarifas', icon: Tag, description: 'Gestão de tarifas' },
      { label: 'Tabelas Comerciais', path: '/app/financeiro/tabelas', icon: TableProperties, description: 'Preços e condições' },
      { label: 'Relatórios', path: '/app/financeiro/relatorios', icon: BarChart3, description: 'Análises financeiras' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Templates', path: '/app/admin/templates', icon: FileText, description: 'Templates de mensagem' },
      { label: 'Automações', path: '/app/admin/automacoes', icon: Zap, description: 'Fluxos automáticos' },
      { label: 'Checklists Digitais', path: '/app/admin/checklists', icon: ListChecks, description: 'Modelos de checklist' },
      { label: 'Auditoria', path: '/app/admin/auditoria', icon: History, description: 'Logs do sistema' },
      { label: 'Permissões', path: '/app/admin/permissoes', icon: Lock, description: 'Perfis de acesso' },
      { label: 'Configurações', path: '/app/admin/configuracoes', icon: Settings, description: 'Preferências do sistema' },
      { label: 'Suporte', path: '/app/admin/suporte', icon: HelpCircle, description: 'Central de ajuda' },
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
