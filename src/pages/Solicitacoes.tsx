import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getSolicitacoes, getPrestadores } from '@/data/store';
import { Solicitacao, StatusSolicitacao } from '@/types';
import {
  MessageSquare, Clock, CheckCircle2, AlertTriangle, Search, X, Phone, MapPin,
  Car, FileText, ArrowRight, DollarSign, Send, Ban, Timer, Smartphone, Link2,
  ChevronRight, MessageCircle, Zap, Eye, Bell, Plus
} from 'lucide-react';
import NovaSolicitacaoDialog from '@/components/NovaSolicitacaoDialog';
import { getNotifications, markAllRead, getUnreadCount, AppNotification } from '@/lib/notifications';
import { toast } from 'sonner';

const statusConfig: Record<StatusSolicitacao, { label: string; variant: 'default' | 'warning' | 'info' | 'success' | 'destructive' | 'secondary'; dotColor: string }> = {
  'Recebida': { label: 'Recebida', variant: 'info', dotColor: 'bg-info' },
  'Em cotação': { label: 'Em cotação', variant: 'warning', dotColor: 'bg-warning' },
  'Aguardando aceite': { label: 'Aguardando aceite', variant: 'warning', dotColor: 'bg-warning' },
  'Convertida em OS': { label: 'Convertida em OS', variant: 'default', dotColor: 'bg-primary' },
  'Despachada': { label: 'Despachada', variant: 'info', dotColor: 'bg-info' },
  'Em atendimento': { label: 'Em atendimento', variant: 'info', dotColor: 'bg-info' },
  'Finalizada': { label: 'Finalizada', variant: 'success', dotColor: 'bg-success' },
  'Cancelada': { label: 'Cancelada', variant: 'destructive', dotColor: 'bg-destructive' },
};

const pipelineStages: StatusSolicitacao[] = ['Recebida', 'Em cotação', 'Aguardando aceite', 'Convertida em OS', 'Despachada', 'Em atendimento', 'Finalizada', 'Cancelada'];

const propostaVariant = (s: string) => {
  switch (s) {
    case 'Aceita': return 'success' as const;
    case 'Recusada': return 'destructive' as const;
    case 'Expirada': return 'secondary' as const;
    default: return 'warning' as const;
  }
};

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Solicitacoes() {
  const [refreshKey, setRefreshKey] = useState(0);
  const solicitacoes = useMemo(() => getSolicitacoes(), [refreshKey]);
  const [selectedSol, setSelectedSol] = useState<Solicitacao | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCanal, setFilterCanal] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [novaOpen, setNovaOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications());
  const handleCreated = useCallback(() => setRefreshKey(k => k + 1), []);

  // Listen for push notifications from prestador portal
  useEffect(() => {
    const handler = (e: Event) => {
      const notif = (e as CustomEvent<AppNotification>).detail;
      setNotifications(getNotifications());
      setUnreadCount(getUnreadCount());
      setRefreshKey(k => k + 1); // refresh list
      if (notif.type === 'oferta_aceita') {
        toast.success(notif.title, { description: notif.message, duration: 8000 });
      } else if (notif.type === 'oferta_recusada') {
        toast.error(notif.title, { description: notif.message, duration: 8000 });
      }
    };
    window.addEventListener('opgrid-notification', handler);
    // Also poll every 3s for cross-tab changes
    const poll = setInterval(() => {
      const count = getUnreadCount();
      if (count !== unreadCount) {
        setUnreadCount(count);
        setNotifications(getNotifications());
        setRefreshKey(k => k + 1);
      }
    }, 3000);
    return () => { window.removeEventListener('opgrid-notification', handler); clearInterval(poll); };
  }, [unreadCount]);

  const handleMarkRead = () => {
    markAllRead();
    setUnreadCount(0);
    setNotifications(getNotifications());
  };

  const filtered = useMemo(() => {
    return solicitacoes
      .filter(s => filterStatus === 'all' || s.status === filterStatus)
      .filter(s => filterCanal === 'all' || s.canal === filterCanal)
      .filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.clienteNome.toLowerCase().includes(q) || s.protocolo.toLowerCase().includes(q) || s.veiculoPlaca.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [solicitacoes, filterStatus, filterCanal, search]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelineStages.forEach(s => counts[s] = 0);
    solicitacoes.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return counts;
  }, [solicitacoes]);

  const totalValor = solicitacoes.filter(s => s.statusProposta === 'Aceita').reduce((s, x) => s + x.valorEstimado, 0);
  const taxaConversao = solicitacoes.length > 0
    ? Math.round((solicitacoes.filter(s => s.atendimentoId).length / solicitacoes.length) * 100) : 0;

  const kpis = [
    { label: 'Solicitações', value: solicitacoes.length, icon: MessageSquare, bg: 'bg-primary/10', color: 'text-primary', sub: `${solicitacoes.filter(s => s.canal === 'WhatsApp').length} via WhatsApp` },
    { label: 'Aguardando', value: stageCounts['Aguardando aceite'] + stageCounts['Recebida'] + stageCounts['Em cotação'], icon: Clock, bg: 'bg-warning/10', color: 'text-warning', sub: 'pendentes de ação' },
    { label: 'Conversão', value: `${taxaConversao}%`, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success', sub: `${solicitacoes.filter(s => s.atendimentoId).length} convertidas` },
    { label: 'Valor Aceito', value: `R$ ${(totalValor / 1000).toFixed(1)}k`, icon: DollarSign, bg: 'bg-info/10', color: 'text-info', sub: 'orçamentos aceitos' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Solicitações</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Jornada do cliente via WhatsApp — da solicitação ao aceite. <span className="text-primary font-medium">Sem app, sem fricção.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setNovaOpen(true)} size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />Nova solicitação
          </Button>
          {/* Notification bell */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative h-8 w-8 p-0">
                <Bell className="h-3.5 w-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center animate-siren-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="end">
              <div className="flex items-center justify-between px-3 py-2.5 border-b">
                <p className="text-xs font-bold">Notificações</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkRead} className="text-[10px] text-primary font-medium hover:underline">
                    Marcar como lidas
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">Nenhuma notificação</div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} className={`px-3 py-2.5 border-b last:border-b-0 text-xs ${!n.read ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          n.type === 'oferta_aceita' ? 'bg-success' : n.type === 'oferta_recusada' ? 'bg-destructive' : 'bg-info'
                        }`} />
                        <div className="min-w-0">
                          <p className="font-semibold text-[11px]">{n.title}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">{n.message}</p>
                          <p className="text-muted-foreground/50 text-[9px] mt-1">
                            {new Date(n.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          {/* Siren indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-destructive border border-destructive/20 bg-destructive/5 rounded-md px-2.5 py-1 font-medium">
            <div className="relative">
              <Bell className="h-3 w-3 animate-siren-glow" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-siren-pulse" />
            </div>
            <span>Sirene ativa</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-success border border-success/20 bg-success/5 rounded-md px-2.5 py-1 font-medium">
            <Zap className="h-3 w-3" /><span>WhatsApp conectado</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-4.5 w-4.5" /></div>
            <div className="min-w-0 flex-1">
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-value">{k.value}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
        <button
          onClick={() => setFilterStatus('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium shrink-0 transition-all ${
            filterStatus === 'all' ? 'border-primary bg-primary/5 text-primary' : 'bg-card hover:bg-muted/30'
          }`}
        >
          <span>Todas</span>
          <span className="font-bold">{solicitacoes.length}</span>
        </button>
        {pipelineStages.map(stage => (
          <button
            key={stage}
            onClick={() => setFilterStatus(filterStatus === stage ? 'all' : stage)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium shrink-0 transition-all ${
              filterStatus === stage ? 'border-primary bg-primary/5 text-primary' : stageCounts[stage] > 0 ? 'bg-card hover:bg-muted/30' : 'bg-muted/20 border-transparent text-muted-foreground/50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${statusConfig[stage].dotColor}`} />
            <span>{stage}</span>
            <span className="font-bold ml-0.5">{stageCounts[stage]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por nome, protocolo ou placa..." className="h-8 pl-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
        </div>
        <Select value={filterCanal} onValueChange={setFilterCanal}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
            <SelectItem value="Telefone">Telefone</SelectItem>
            <SelectItem value="Web">Web</SelectItem>
          </SelectContent>
        </Select>
        {(filterStatus !== 'all' || filterCanal !== 'all' || search) && (
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => { setFilterStatus('all'); setFilterCanal('all'); setSearch(''); }}>
            <X className="h-3 w-3 mr-1" />Limpar
          </Button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><MessageSquare className="h-5 w-5 text-muted-foreground" /></div>
            <p className="empty-state-title">Nenhuma solicitação encontrada</p>
            <p className="empty-state-description">Ajuste os filtros ou aguarde novas solicitações via WhatsApp</p>
          </div>
        )}
        {filtered.map(s => (
          <Card key={s.id} className="card-hover cursor-pointer" onClick={() => setSelectedSol(s)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-[11px] text-muted-foreground">{s.protocolo}</span>
                    <Badge variant={statusConfig[s.status].variant}>{s.status}</Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {s.canal === 'WhatsApp' ? <MessageCircle className="h-2.5 w-2.5" /> : <Phone className="h-2.5 w-2.5" />}
                      {s.canal}
                    </Badge>
                    {s.statusProposta && (
                      <Badge variant={propostaVariant(s.statusProposta)} className="text-[9px]">{s.statusProposta}</Badge>
                    )}
                  </div>
                  <p className="text-[14px] font-semibold">{s.clienteNome}</p>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Car className="h-3 w-3" />{s.veiculoModelo}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{s.veiculoPlaca}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{s.origemEndereco}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 mx-0.5" />
                    <span className="truncate">{s.destinoEndereco}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{timeSince(s.dataHora)} atrás</p>
                  <p className="text-[18px] font-bold tabular-nums">R$ {s.valorEstimado.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">{s.distanciaEstimadaKm} km • {s.motivo}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-auto mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selectedSol} onOpenChange={() => setSelectedSol(null)}>
        <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto">
          {selectedSol && <SolicitacaoDetail sol={selectedSol} />}
        </SheetContent>
      </Sheet>

      {/* New solicitation dialog */}
      <NovaSolicitacaoDialog open={novaOpen} onOpenChange={setNovaOpen} onCreated={handleCreated} />
    </div>
  );
}

function SolicitacaoDetail({ sol }: { sol: Solicitacao }) {
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <SheetTitle className="text-base">{sol.protocolo}</SheetTitle>
          <Badge variant={statusConfig[sol.status].variant}>{sol.status}</Badge>
        </div>
        <p className="text-[12px] text-muted-foreground">{formatDate(sol.dataHora)} • via {sol.canal}</p>
      </SheetHeader>

      <div className="mt-5 space-y-5">
        {/* WhatsApp journey indicator */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-success">Jornada sem app</p>
            <p className="text-[11px] text-muted-foreground">Cliente interagiu 100% via WhatsApp. Sem download necessário.</p>
          </div>
        </div>

        {/* Client data */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dados do Cliente</p>
          <div className="space-y-0">
            {[
              ['Nome', sol.clienteNome],
              ['Telefone', sol.clienteTelefone],
              ['WhatsApp', sol.clienteWhatsApp],
            ].map(([l, v]) => (
              <div key={String(l)} className="detail-row"><span className="detail-row-label">{l}</span><span className="detail-row-value">{v}</span></div>
            ))}
          </div>
        </div>

        {/* Vehicle */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Veículo</p>
          <div className="space-y-0">
            {[
              ['Modelo', sol.veiculoModelo],
              ['Placa', sol.veiculoPlaca],
              ['Problema', sol.motivo],
            ].map(([l, v]) => (
              <div key={String(l)} className="detail-row"><span className="detail-row-label">{l}</span><span className="detail-row-value">{v}</span></div>
            ))}
          </div>
          {sol.observacoes && <p className="text-[12px] text-muted-foreground mt-2 italic">"{sol.observacoes}"</p>}
        </div>

        {/* Route */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Trajeto</p>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-success border-2 border-success/30" />
              <div className="w-px h-8 bg-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-destructive border-2 border-destructive/30" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Origem</p>
                <p className="text-[13px] font-medium">{sol.origemEndereco}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Destino</p>
                <p className="text-[13px] font-medium">{sol.destinoEndereco}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[16px] font-bold">{sol.distanciaEstimadaKm} km</p>
              <p className="text-[10px] text-muted-foreground">estimado</p>
            </div>
          </div>
        </div>

        {/* Cost composition */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Composição do Valor</p>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {sol.composicaoCusto.map((item, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2.5 text-[13px] ${i > 0 ? 'border-t' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      item.tipo === 'base' ? 'bg-primary' : item.tipo === 'km' ? 'bg-info' : item.tipo === 'desconto' ? 'bg-destructive' : 'bg-warning'
                    }`} />
                    <span className="text-muted-foreground">{item.descricao}</span>
                  </div>
                  <span className={`font-bold tabular-nums ${item.tipo === 'desconto' ? 'text-destructive' : ''}`}>
                    {item.tipo === 'desconto' ? '-' : ''}R$ {item.valor.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-3 bg-primary/5 border-t">
                <span className="text-[13px] font-bold">Valor estimado</span>
                <span className="text-[16px] font-bold text-primary tabular-nums">R$ {sol.valorEstimado.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <p className="text-[10px] text-muted-foreground mt-1.5 italic">Valor sujeito a confirmação operacional</p>
        </div>

        {/* Proposal status */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Status da Proposta</p>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border">
            <Badge variant={propostaVariant(sol.statusProposta)} className="text-[11px] px-2.5 py-1">{sol.statusProposta}</Badge>
            <div className="text-[12px] text-muted-foreground">
              {sol.propostaEnviadaEm && <span>Enviada em {formatDate(sol.propostaEnviadaEm)}</span>}
              {sol.propostaRespondidaEm && <span> • Resposta em {formatDate(sol.propostaRespondidaEm)}</span>}
            </div>
          </div>
        </div>

        {/* Links */}
        {(sol.atendimentoId || sol.linkAcompanhamento) && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Links</p>
            <div className="space-y-1.5">
              {sol.atendimentoId && (
                <div className="flex items-center gap-2 text-[12px] p-2.5 rounded-md bg-muted/20 border">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">OS vinculada:</span>
                  <span className="font-mono font-bold text-[11px]">{sol.atendimentoId}</span>
                </div>
              )}
              {sol.linkAcompanhamento && (
                <div className="flex items-center gap-2 text-[12px] p-2.5 rounded-md bg-muted/20 border">
                  <Link2 className="h-3.5 w-3.5 text-info" />
                  <span className="text-muted-foreground">Link do cliente:</span>
                  <span className="font-mono text-[11px] text-info">{sol.linkAcompanhamento}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Timeline */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Linha do Tempo</p>
          <div className="space-y-0">
            {sol.timeline.map((t, i) => (
              <div key={i} className="flex gap-3 pb-4 relative">
                {i < sol.timeline.length - 1 && <div className="absolute left-[7px] top-5 w-px h-[calc(100%-8px)] bg-border" />}
                <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border-2 ${
                  t.tipo === 'cliente' ? 'bg-success border-success/30' : t.tipo === 'operador' ? 'bg-info border-info/30' : 'bg-muted-foreground/30 border-muted-foreground/10'
                }`} />
                <div>
                  <p className="text-[12px] font-medium">{t.descricao}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(t.data)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline" size="sm" className="flex-1 text-xs gap-1.5"
            onClick={() => {
              const phone = sol.clienteWhatsApp?.replace(/\D/g, '') || sol.clienteTelefone?.replace(/\D/g, '') || '';
              if (phone) {
                window.open(`https://wa.me/${phone}`, '_blank');
              } else {
                toast.error('Número de WhatsApp não disponível');
              }
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />WhatsApp
          </Button>
          <Button
            variant="outline" size="sm" className="flex-1 text-xs gap-1.5"
            onClick={() => {
              const phone = sol.clienteTelefone?.replace(/\D/g, '') || '';
              if (phone) {
                window.open(`tel:${phone}`);
              } else {
                toast.error('Telefone não disponível');
              }
            }}
          >
            <Phone className="h-3.5 w-3.5" />Ligar
          </Button>
          <Button
            variant="outline" size="sm" className="flex-1 text-xs gap-1.5"
            onClick={() => {
              if (sol.atendimentoId) {
                toast.info(`OS ${sol.atendimentoId} — redirecionando para Atendimentos`);
                window.location.href = '/atendimentos';
              } else {
                toast.warning('Nenhuma OS vinculada a esta solicitação');
              }
            }}
          >
            <Eye className="h-3.5 w-3.5" />Ver OS
          </Button>
        </div>
      </div>
    </>
  );
}
