import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { waPrestadorOfertaLink, waPrestadorOsLink, waClienteAcompanhamentoLink } from '@/lib/whatsappLinks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { getDespachos, getSolicitacoes, getPrestadores, getAtendimentos, addDespacho, updateDespacho } from '@/data/store';
import { Despacho as DespachoType, StatusDespacho, OfertaPrestador, ModoDespacho, Prestador, Solicitacao } from '@/types';
import { calcularScorePrestadores, getTopPrestadores, PrestadorScored, SCORE_WEIGHTS } from '@/lib/prestadorScoring';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import {
  Radar, Clock, CheckCircle2, XCircle, AlertTriangle, Send, Timer, Target,
  MapPin, Phone, Truck, Radio, Eye, ChevronRight, RotateCcw, Ban, Zap, Bell,
  MessageCircle, Link2, Hand, Bot, Sparkles, UserCheck, Users, ArrowRight,
  Info, ShieldCheck, TrendingUp, BarChart3
} from 'lucide-react';

const statusVariant: Record<StatusDespacho, 'default' | 'warning' | 'info' | 'success' | 'destructive' | 'secondary'> = {
  'Aguardando': 'warning', 'Ofertas enviadas': 'info', 'Aceito': 'success',
  'Sem prestador': 'destructive', 'Expirado': 'secondary', 'Cancelado': 'destructive',
};

const modoIcon: Record<ModoDespacho, typeof Hand> = {
  manual: Hand, automatico: Bot, assistido: Sparkles,
};
const modoLabel: Record<ModoDespacho, string> = {
  manual: 'Manual', automatico: 'Automático', assistido: 'Assistido',
};
const modoVariant: Record<ModoDespacho, 'default' | 'warning' | 'info' | 'success' | 'secondary'> = {
  manual: 'warning', automatico: 'info', assistido: 'success',
};

const ofertaStatusColors: Record<string, string> = {
  'Aceita': '#22c55e', 'Recusada': '#ef4444', 'Pendente': '#f59e0b', 'Expirada': '#6b7280', 'Encerrada': '#9ca3af',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function estimateDistance(p: Prestador, sol: Solicitacao | undefined): number {
  if (!p.localizacao || !sol?.origemCoord) return 999;
  const R = 6371;
  const dLat = (sol.origemCoord.lat - p.localizacao.lat) * Math.PI / 180;
  const dLng = (sol.origemCoord.lng - p.localizacao.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p.localizacao.lat * Math.PI / 180) * Math.cos(sol.origemCoord.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const confiancaVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  alta: 'success', media: 'warning', baixa: 'destructive',
};
const confiancaLabel: Record<string, string> = {
  alta: 'Alta confiança', media: 'Média confiança', baixa: 'Baixa confiança',
};

export default function CentralDespacho() {
  const despachos = useMemo(() => getDespachos(), []);
  const solicitacoes = useMemo(() => getSolicitacoes(), []);
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const [selectedDespacho, setSelectedDespacho] = useState<DespachoType | null>(null);
  const [activeTab, setActiveTab] = useState('fila');
  const [filterModo, setFilterModo] = useState<string>('all');
  const [selectedPrestadorIds, setSelectedPrestadorIds] = useState<string[]>([]);
  const [showSugeridos, setShowSugeridos] = useState<string | null>(null); // despachoId for which to show panel
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const getPrestadorNome = (id: string) => prestadores.find(p => p.id === id)?.nomeFantasia || '—';
  const getSolicitacao = (id: string) => solicitacoes.find(s => s.id === id);
  const getPrestador = (id: string) => prestadores.find(p => p.id === id);

  const totalOfertas = despachos.reduce((s, d) => s + d.ofertas.length, 0);
  const ofertasAceitas = despachos.reduce((s, d) => s + d.ofertas.filter(o => o.status === 'Aceita').length, 0);
  const taxaConversao = totalOfertas > 0 ? Math.round((ofertasAceitas / totalOfertas) * 100) : 0;
  const tempoMedioAceite = despachos.filter(d => d.tempoMedioAceiteMinutos).length > 0
    ? (despachos.filter(d => d.tempoMedioAceiteMinutos).reduce((s, d) => s + (d.tempoMedioAceiteMinutos || 0), 0) / despachos.filter(d => d.tempoMedioAceiteMinutos).length)
    : 0;

  const filteredDespachos = useMemo(() => {
    if (filterModo === 'all') return despachos;
    return despachos.filter(d => d.modoDespacho === filterModo);
  }, [despachos, filterModo]);

  const filaAguardando = filteredDespachos.filter(d => d.status === 'Aguardando' || d.status === 'Ofertas enviadas');
  const despachosAceitos = filteredDespachos.filter(d => d.status === 'Aceito');
  const despachosCriticos = filteredDespachos.filter(d => d.status === 'Sem prestador' || d.status === 'Expirado');

  const prestadoresOnline = prestadores.filter(p => p.localizacao && (p.localizacao.statusRastreamento === 'Online') && p.status === 'Ativo' && p.homologacao === 'Homologado');

  const countByMode = useMemo(() => ({
    manual: despachos.filter(d => d.modoDespacho === 'manual').length,
    automatico: despachos.filter(d => d.modoDespacho === 'automatico').length,
    assistido: despachos.filter(d => d.modoDespacho === 'assistido').length,
  }), [despachos]);

  const kpis = [
    { label: 'Fila Ativa', value: filaAguardando.length, icon: Clock, bg: 'bg-warning/10', color: 'text-warning', sub: 'aguardando aceite' },
    { label: 'Aceitos', value: despachosAceitos.length, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success', sub: 'OS em execução' },
    { label: 'Críticos', value: despachosCriticos.length, icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive', sub: 'sem prestador' },
    { label: 'Disponíveis', value: prestadoresOnline.length, icon: Radio, bg: 'bg-info/10', color: 'text-info', sub: 'online e aptos' },
  ];

  const handleEnvioManual = useCallback((despachoId: string) => {
    if (selectedPrestadorIds.length === 0) {
      toast.error('Selecione pelo menos um prestador');
      return;
    }
    const d = despachos.find(x => x.id === despachoId);
    const sol = d ? getSolicitacao(d.solicitacaoId) : undefined;
    if (!d || !sol) return;

    const now = new Date().toISOString();
    const newOfertas: OfertaPrestador[] = selectedPrestadorIds.map((pid, i) => {
      const p = getPrestador(pid);
      const dist = p ? estimateDistance(p, sol) : 10;
      return {
        id: `of-manual-${Date.now()}-${i}`,
        despachoId: d.id,
        prestadorId: pid,
        rodada: d.rodadaAtual + 1,
        status: 'Pendente' as const,
        enviadaEm: now,
        tempoLimiteMinutos: 10,
        distanciaEstimadaKm: Math.round(dist * 10) / 10,
        tempoEstimadoMinutos: Math.round(dist * 2.5),
        valorServico: sol.valorEstimado,
        linkOferta: `/prestador/oferta/of-manual-${Date.now()}-${i}`,
      };
    });

    const updated: DespachoType = {
      ...d,
      modoDespacho: 'manual',
      rodadaAtual: d.rodadaAtual + 1,
      status: 'Ofertas enviadas',
      atualizadoEm: now,
      ofertas: [...d.ofertas, ...newOfertas],
    };
    updateDespacho(updated);
    setSelectedPrestadorIds([]);
    setShowSugeridos(null);
    toast.success(`Oferta enviada manualmente para ${selectedPrestadorIds.length} prestador(es)`);
  }, [selectedPrestadorIds, despachos, prestadores, solicitacoes]);

  const handleDisparoAutomatico = useCallback((despachoId: string) => {
    const d = despachos.find(x => x.id === despachoId);
    const sol = d ? getSolicitacao(d.solicitacaoId) : undefined;
    if (!d || !sol) return;

    const sugeridos = getSuggestedPrestadores(prestadores, sol).slice(0, 2);
    if (sugeridos.length === 0) {
      toast.error('Nenhum prestador elegível encontrado');
      return;
    }

    const now = new Date().toISOString();
    const newOfertas: OfertaPrestador[] = sugeridos.map((p, i) => ({
      id: `of-auto-${Date.now()}-${i}`,
      despachoId: d.id,
      prestadorId: p.id,
      rodada: d.rodadaAtual + 1,
      status: 'Pendente' as const,
      enviadaEm: now,
      tempoLimiteMinutos: 5,
      distanciaEstimadaKm: Math.round(p.distKm * 10) / 10,
      tempoEstimadoMinutos: p.tempoMin,
      valorServico: sol.valorEstimado,
      linkOferta: `/prestador/oferta/of-auto-${Date.now()}-${i}`,
    }));

    const updated: DespachoType = {
      ...d,
      modoDespacho: 'automatico',
      rodadaAtual: d.rodadaAtual + 1,
      status: 'Ofertas enviadas',
      atualizadoEm: now,
      ofertas: [...d.ofertas, ...newOfertas],
    };
    updateDespacho(updated);
    toast.success(`Disparo automático: ${sugeridos.length} prestadores notificados`);
  }, [despachos, prestadores, solicitacoes]);

  const handleUsarSugestao = useCallback((despachoId: string) => {
    setShowSugeridos(despachoId);
    const d = despachos.find(x => x.id === despachoId);
    const sol = d ? getSolicitacao(d.solicitacaoId) : undefined;
    const sugeridos = getSuggestedPrestadores(prestadores, sol).slice(0, 3);
    setSelectedPrestadorIds(sugeridos.map(p => p.id));
  }, [despachos, prestadores, solicitacoes]);

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [-23.55, -46.63], zoom: 5, zoomControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeTab === 'mapa') {
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 400);
    }
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    prestadores.filter(p => p.localizacao && p.status === 'Ativo').forEach(p => {
      const loc = p.localizacao!;
      const color = loc.statusRastreamento === 'Online' ? '#22c55e' : loc.statusRastreamento === 'A caminho' ? '#3b82f6' : loc.statusRastreamento === 'Em atendimento' ? '#f59e0b' : '#6b7280';
      const marker = L.marker([loc.lat, loc.lng], {
        icon: L.divIcon({ className: 'custom-marker', html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] }),
      }).addTo(map).bindPopup(`<div style="font-size:12px;"><b>${p.nomeFantasia}</b><br/>${p.cidade}/${p.uf}<br/><span style="color:${color}">${loc.statusRastreamento}</span></div>`);
      markersRef.current.push(marker);
    });
    solicitacoes.filter(s => s.origemCoord && !['Finalizada', 'Cancelada'].includes(s.status)).forEach(s => {
      const marker = L.marker([s.origemCoord!.lat, s.origemCoord!.lng], {
        icon: L.divIcon({ className: 'custom-marker', html: `<div style="width:20px;height:20px;border-radius:4px;background:#ef4444;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">!</div>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
      }).addTo(map).bindPopup(`<div style="font-size:12px;"><b>${s.protocolo}</b><br/>${s.clienteNome}<br/>${s.motivo}</div>`);
      markersRef.current.push(marker);
    });
  }, [activeTab, prestadores, solicitacoes]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Central de Despacho</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Torre de controle — modos <span className="text-warning font-medium">manual</span>, <span className="text-info font-medium">automático</span> e <span className="text-success font-medium">assistido</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={filterModo} onValueChange={setFilterModo}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Filtrar modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os modos</SelectItem>
              <SelectItem value="manual">Manual ({countByMode.manual})</SelectItem>
              <SelectItem value="automatico">Automático ({countByMode.automatico})</SelectItem>
              <SelectItem value="assistido">Assistido ({countByMode.assistido})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {(['manual', 'automatico', 'assistido'] as ModoDespacho[]).map(modo => {
          const Icon = modoIcon[modo];
          const desc = modo === 'manual' ? 'Operador seleciona os prestadores' : modo === 'automatico' ? 'Sistema envia automaticamente' : 'Sistema sugere, operador confirma';
          const count = countByMode[modo];
          return (
            <Card key={modo} className={`cursor-pointer transition-all ${filterModo === modo ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'}`} onClick={() => setFilterModo(filterModo === modo ? 'all' : modo)}>
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modo === 'manual' ? 'bg-warning/10' : modo === 'automatico' ? 'bg-info/10' : 'bg-success/10'}`}>
                  <Icon className={`h-5 w-5 ${modo === 'manual' ? 'text-warning' : modo === 'automatico' ? 'text-info' : 'text-success'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold">{modoLabel[modo]}</p>
                    {modo === 'assistido' && <Badge variant="success" className="text-[8px] px-1.5">MVP</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
                <span className="text-lg font-bold tabular-nums text-muted-foreground">{count}</span>
              </CardContent>
            </Card>
          );
        })}
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

      {/* Metrics bar */}
      <div className="flex flex-wrap gap-4 px-4 py-3 bg-card border rounded-xl text-[12px]">
        <div className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">Conversão:</span><span className="font-bold">{taxaConversao}%</span></div>
        <div className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5 text-info" /><span className="text-muted-foreground">Tempo aceite:</span><span className="font-bold">{tempoMedioAceite.toFixed(0)} min</span></div>
        <div className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5 text-warning" /><span className="text-muted-foreground">Ofertas:</span><span className="font-bold">{totalOfertas}</span></div>
        <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-success" /><span className="text-muted-foreground">Prestadores online:</span><span className="font-bold">{prestadoresOnline.length}</span></div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fila" className="text-xs gap-1.5"><Radar className="h-3.5 w-3.5" />Fila de Despacho</TabsTrigger>
          <TabsTrigger value="mapa" className="text-xs gap-1.5"><MapPin className="h-3.5 w-3.5" />Mapa</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><Clock className="h-3.5 w-3.5" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="mt-4 space-y-3">
          {despachosCriticos.length > 0 && (
            <div className="alert-banner alert-banner-critical">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{despachosCriticos.length} despacho(s) sem prestador — requerem atenção imediata</span>
            </div>
          )}

          {/* Queue table */}
          {filaAguardando.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-[11px] font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Aguardando Envio / Aceite ({filaAguardando.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase">Protocolo</TableHead>
                    <TableHead className="text-[10px] uppercase">Cliente</TableHead>
                    <TableHead className="text-[10px] uppercase hidden md:table-cell">Rota</TableHead>
                    <TableHead className="text-[10px] uppercase">Status</TableHead>
                    <TableHead className="text-[10px] uppercase">Modo</TableHead>
                    <TableHead className="text-[10px] uppercase hidden lg:table-cell">Rodada</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filaAguardando.map(d => {
                      const sol = getSolicitacao(d.solicitacaoId);
                      const MIcon = modoIcon[d.modoDespacho];
                      return (
                        <TableRow key={d.id} className="table-row-hover">
                          <TableCell className="font-mono text-[11px] text-muted-foreground">{sol?.protocolo || d.id}</TableCell>
                          <TableCell className="text-[13px] font-medium">{sol?.clienteNome || '—'}</TableCell>
                          <TableCell className="hidden md:table-cell text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1 max-w-[180px]">
                              <span className="truncate">{sol?.origemEndereco || '—'}</span>
                              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                              <span className="truncate">{sol?.destinoEndereco || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={statusVariant[d.status]} className="text-[10px]">{d.status}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={modoVariant[d.modoDespacho]} className="text-[10px] gap-1">
                              <MIcon className="h-2.5 w-2.5" />{modoLabel[d.modoDespacho]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-[11px] text-muted-foreground">R{d.rodadaAtual}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-warning/30 hover:bg-warning/5" onClick={() => { setShowSugeridos(d.id); setSelectedPrestadorIds([]); }}>
                                <Hand className="h-3 w-3" />Manual
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-info/30 hover:bg-info/5" onClick={() => handleDisparoAutomatico(d.id)}>
                                <Bot className="h-3 w-3" />Auto
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-success/30 hover:bg-success/5" onClick={() => handleUsarSugestao(d.id)}>
                                <Sparkles className="h-3 w-3" />Sugestão
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDespacho(d)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Suggested providers panel */}
          {showSugeridos && (() => {
            const d = despachos.find(x => x.id === showSugeridos);
            const sol = d ? getSolicitacao(d.solicitacaoId) : undefined;
            const sugeridos = getSuggestedPrestadores(prestadores, sol);
            return (
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[12px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Prestadores Sugeridos
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{selectedPrestadorIds.length} selecionado(s)</Badge>
                      <Button variant="default" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleEnvioManual(showSugeridos)} disabled={selectedPrestadorIds.length === 0}>
                        <Send className="h-3 w-3" />Enviar para selecionados
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => { setShowSugeridos(null); setSelectedPrestadorIds([]); }}>
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="hover:bg-transparent">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="text-[10px] uppercase">Prestador</TableHead>
                      <TableHead className="text-[10px] uppercase">Cidade</TableHead>
                      <TableHead className="text-[10px] uppercase">Status</TableHead>
                      <TableHead className="text-[10px] uppercase hidden md:table-cell">Serviços</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Distância</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Tempo est.</TableHead>
                      <TableHead className="text-[10px] uppercase text-right hidden lg:table-cell">Score</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {sugeridos.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                          Nenhum prestador elegível encontrado. Você pode operar no modo manual.
                        </TableCell></TableRow>
                      ) : sugeridos.map(p => {
                        const isSelected = selectedPrestadorIds.includes(p.id);
                        const statusColor = p.localizacao?.statusRastreamento === 'Online' ? 'text-success' : p.localizacao?.statusRastreamento === 'A caminho' ? 'text-info' : 'text-muted-foreground';
                        return (
                          <TableRow key={p.id} className={`table-row-hover cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`} onClick={() => setSelectedPrestadorIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}>
                            <TableCell>
                              <Checkbox checked={isSelected} onCheckedChange={() => setSelectedPrestadorIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-[13px] font-medium">{p.nomeFantasia}</p>
                                <p className="text-[10px] text-muted-foreground">{p.tipoParceiro}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-[12px]">{p.cidade}/{p.uf}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${p.localizacao?.statusRastreamento === 'Online' ? 'bg-success animate-pulse' : 'bg-muted-foreground/30'}`} />
                                <span className={`text-[11px] ${statusColor}`}>{p.localizacao?.statusRastreamento || 'Offline'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-[10px] text-muted-foreground">{p.tiposServico.slice(0, 2).join(', ')}</TableCell>
                            <TableCell className="text-right font-mono text-[12px] font-medium">{p.distKm < 900 ? `${p.distKm.toFixed(1)} km` : '—'}</TableCell>
                            <TableCell className="text-right font-mono text-[12px]">{p.tempoMin < 2000 ? `~${p.tempoMin} min` : '—'}</TableCell>
                            <TableCell className="text-right hidden lg:table-cell">
                              <Badge variant={p.scoreOperacional >= 80 ? 'success' : p.scoreOperacional >= 60 ? 'warning' : 'destructive'} className="text-[10px]">{p.scoreOperacional}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })()}

          {/* Aceitos */}
          {despachosAceitos.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-success uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" /> Aceitos ({despachosAceitos.length})
              </p>
              {despachosAceitos.map(d => <DespachoCard key={d.id} despacho={d} getSolicitacao={getSolicitacao} getPrestadorNome={getPrestadorNome} onSelect={setSelectedDespacho} />)}
            </div>
          )}

          {despachosCriticos.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Críticos ({despachosCriticos.length})
              </p>
              {despachosCriticos.map(d => <DespachoCard key={d.id} despacho={d} getSolicitacao={getSolicitacao} getPrestadorNome={getPrestadorNome} onSelect={setSelectedDespacho} />)}
            </div>
          )}

          {filteredDespachos.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Radar className="h-5 w-5 text-muted-foreground" /></div>
              <p className="empty-state-title">Nenhum despacho na fila</p>
              <p className="empty-state-description">Crie uma solicitação para iniciar o fluxo de despacho</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mapa" forceMount className={`mt-4 ${activeTab !== 'mapa' ? 'hidden' : ''}`}>
          <Card className="overflow-hidden">
            <div className="h-[calc(100vh-420px)] min-h-[400px] relative">
              <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
              <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border rounded-lg px-3 py-2 z-[1000] text-[10px] space-y-1">
                <p className="font-semibold text-[11px] mb-1.5">Legenda</p>
                {[
                  { color: '#22c55e', label: 'Prestador online' },
                  { color: '#3b82f6', label: 'A caminho' },
                  { color: '#f59e0b', label: 'Em atendimento' },
                  { color: '#ef4444', label: 'Solicitação ativa' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border rounded-lg px-3.5 py-2.5 z-[1000]">
                <div className="flex items-center gap-2 text-[12px]">
                  <Radio className="h-3.5 w-3.5 text-success animate-pulse" />
                  <span className="font-bold">{prestadoresOnline.length}</span>
                  <span className="text-muted-foreground">disponíveis</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4 space-y-2">
          {filteredDespachos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()).map(d => (
            <DespachoCard key={d.id} despacho={d} getSolicitacao={getSolicitacao} getPrestadorNome={getPrestadorNome} onSelect={setSelectedDespacho} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Detail sheet */}
      <Sheet open={!!selectedDespacho} onOpenChange={() => setSelectedDespacho(null)}>
        <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto">
          {selectedDespacho && <DespachoDetail despacho={selectedDespacho} getSolicitacao={getSolicitacao} getPrestadorNome={getPrestadorNome} getPrestador={getPrestador} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DespachoCard({ despacho: d, getSolicitacao, getPrestadorNome, onSelect }: {
  despacho: DespachoType; getSolicitacao: (id: string) => any; getPrestadorNome: (id: string) => string; onSelect: (d: DespachoType) => void;
}) {
  const sol = getSolicitacao(d.solicitacaoId);
  const MIcon = modoIcon[d.modoDespacho];
  return (
    <Card className="card-hover cursor-pointer" onClick={() => onSelect(d)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-[11px] text-muted-foreground">{sol?.protocolo || d.id}</span>
              <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
              <Badge variant={modoVariant[d.modoDespacho]} className="text-[10px] gap-1">
                <MIcon className="h-2.5 w-2.5" />{modoLabel[d.modoDespacho]}
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <RotateCcw className="h-2.5 w-2.5" />R{d.rodadaAtual}
              </Badge>
            </div>
            <p className="text-[14px] font-semibold">{sol?.clienteNome || '—'}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sol?.origemEndereco} → {sol?.destinoEndereco}</p>
          </div>
          <div className="text-right shrink-0">
            {d.prestadorAceitoId ? (
              <>
                <p className="text-[10px] text-muted-foreground mb-0.5">Aceito por</p>
                <p className="text-[13px] font-bold text-success">{getPrestadorNome(d.prestadorAceitoId)}</p>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground">{timeSince(d.criadoEm)} atrás</p>
            )}
            <div className="flex items-center gap-1 mt-1.5 justify-end">
              {d.ofertas.map(o => (
                <div key={o.id} className="w-2.5 h-2.5 rounded-full" style={{ background: ofertaStatusColors[o.status] || '#ccc' }} title={`${getPrestadorNome(o.prestadorId)}: ${o.status}`} />
              ))}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-auto mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DespachoDetail({ despacho: d, getSolicitacao, getPrestadorNome, getPrestador }: {
  despacho: DespachoType; getSolicitacao: (id: string) => any; getPrestadorNome: (id: string) => string; getPrestador: (id: string) => any;
}) {
  const sol = getSolicitacao(d.solicitacaoId);
  const MIcon = modoIcon[d.modoDespacho];

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <SheetTitle className="text-base">Despacho {sol?.protocolo || d.id}</SheetTitle>
          <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
          <Badge variant={modoVariant[d.modoDespacho]} className="text-[10px] gap-1">
            <MIcon className="h-2.5 w-2.5" />{modoLabel[d.modoDespacho]}
          </Badge>
        </div>
        <p className="text-[12px] text-muted-foreground">Criado em {formatDate(d.criadoEm)} • Rodada {d.rodadaAtual}</p>
      </SheetHeader>

      <div className="mt-5 space-y-5">
        {/* Mode indicator */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${d.modoDespacho === 'manual' ? 'bg-warning/5 border-warning/20' : d.modoDespacho === 'automatico' ? 'bg-info/5 border-info/20' : 'bg-success/5 border-success/20'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${d.modoDespacho === 'manual' ? 'bg-warning/10' : d.modoDespacho === 'automatico' ? 'bg-info/10' : 'bg-success/10'}`}>
            <MIcon className={`h-5 w-5 ${d.modoDespacho === 'manual' ? 'text-warning' : d.modoDespacho === 'automatico' ? 'text-info' : 'text-success'}`} />
          </div>
          <div>
            <p className={`text-[13px] font-bold ${d.modoDespacho === 'manual' ? 'text-warning' : d.modoDespacho === 'automatico' ? 'text-info' : 'text-success'}`}>Modo {modoLabel[d.modoDespacho]}</p>
            <p className="text-[11px] text-muted-foreground">
              {d.modoDespacho === 'manual' ? 'Prestadores selecionados pelo operador' : d.modoDespacho === 'automatico' ? 'Sistema selecionou automaticamente' : 'Sistema sugeriu, operador confirmou'}
            </p>
          </div>
        </div>

        {/* Sol details */}
        {sol && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Solicitação</p>
            <div className="space-y-0">
              {[
                ['Cliente', sol.clienteNome],
                ['Veículo', `${sol.veiculoModelo} • ${sol.veiculoPlaca}`],
                ['Problema', sol.motivo],
                ['Valor', `R$ ${sol.valorEstimado.toFixed(2)}`],
                ['Distância', `${sol.distanciaEstimadaKm} km`],
              ].map(([l, v]) => (
                <div key={String(l)} className="detail-row"><span className="detail-row-label">{l}</span><span className="detail-row-value">{v}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* Prestador aceito */}
        {d.prestadorAceitoId && (() => {
          const p = getPrestador(d.prestadorAceitoId);
          return (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-success mb-2">Prestador Confirmado</p>
                <div className="space-y-1 text-[13px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-bold">{p?.nomeFantasia}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cidade</span><span>{p?.cidade}/{p?.uf}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Telefone</span><span>{p?.telefone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Score</span><Badge variant="success" className="text-[10px]">{p?.scoreOperacional}/100</Badge></div>
                  {d.tempoMedioAceiteMinutos && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Aceite em</span><span className="font-bold text-success">{d.tempoMedioAceiteMinutos} min</span></div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Ofertas */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Rodadas de Ofertas</p>
          {[...new Set(d.ofertas.map(o => o.rodada))].sort().map(rodada => (
            <div key={rodada} className="mb-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <RotateCcw className="h-3 w-3" /> Rodada {rodada}
              </p>
              <div className="space-y-1.5">
                {d.ofertas.filter(o => o.rodada === rodada).map(o => {
                  const p = getPrestador(o.prestadorId);
                  return (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ofertaStatusColors[o.status] }} />
                        <div>
                          <p className="text-[13px] font-medium">{getPrestadorNome(o.prestadorId)}</p>
                          <p className="text-[11px] text-muted-foreground">{p?.cidade}/{p?.uf}</p>
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <div className="flex items-center gap-2 text-muted-foreground mb-0.5">
                          <span>{o.distanciaEstimadaKm.toFixed(1)} km</span>
                          <span>~{o.tempoEstimadoMinutos} min</span>
                        </div>
                        <Badge variant={o.status === 'Aceita' ? 'success' : o.status === 'Recusada' ? 'destructive' : o.status === 'Pendente' ? 'warning' : 'secondary'} className="text-[9px]">
                          {o.status}
                        </Badge>
                        {o.motivoRecusa && <p className="text-[10px] text-destructive mt-0.5">{o.motivoRecusa}</p>}
                        {o.respondidaEm && <p className="text-[9px] text-muted-foreground mt-0.5">Resposta: {formatDate(o.respondidaEm)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Click to Chat */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Clique para conversar</p>
          <div className="space-y-1.5">
            {d.ofertas.map(o => {
              const p = getPrestador(o.prestadorId);
              if (!p || !sol) return null;
              return (
                <Button key={o.id} variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-9 border-success/30 hover:bg-success/5"
                  onClick={() => window.open(waPrestadorOfertaLink(p, sol, o.linkOferta, o.valorServico, window.location.origin), '_blank')}>
                  <MessageCircle className="h-3.5 w-3.5 text-success" />
                  <span className="flex-1 text-left truncate">Enviar oferta → {p.nomeFantasia}</span>
                  <Badge variant="outline" className="text-[8px] shrink-0">wa.me</Badge>
                </Button>
              );
            })}
            {sol && sol.clienteWhatsApp && d.prestadorAceitoId && (
              <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-9 border-info/30 hover:bg-info/5"
                onClick={() => window.open(waClienteAcompanhamentoLink(sol, window.location.origin), '_blank')}>
                <Link2 className="h-3.5 w-3.5 text-info" />
                <span className="flex-1 text-left">Enviar link de acompanhamento ao cliente</span>
                <Badge variant="outline" className="text-[8px] shrink-0">wa.me</Badge>
              </Button>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground italic mt-1.5">O WhatsApp abrirá com a mensagem pré-preenchida.</p>
        </div>

        {d.observacoes && (
          <div className="p-3 rounded-lg bg-muted/20 border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Observações</p>
            <p className="text-[12px] text-muted-foreground">{d.observacoes}</p>
          </div>
        )}
      </div>
    </>
  );
}
