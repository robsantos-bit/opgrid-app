import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDespachos, getSolicitacoes, getPrestadores, getAtendimentos } from '@/data/store';
import { Despacho, StatusDespacho, OfertaPrestador } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radar, Clock, CheckCircle2, XCircle, AlertTriangle, Send, Timer, Target,
  MapPin, Phone, Truck, Radio, Eye, ChevronRight, RotateCcw, Ban, Zap, Bell
} from 'lucide-react';

const statusVariant: Record<StatusDespacho, 'default' | 'warning' | 'info' | 'success' | 'destructive' | 'secondary'> = {
  'Aguardando': 'warning',
  'Ofertas enviadas': 'info',
  'Aceito': 'success',
  'Sem prestador': 'destructive',
  'Expirado': 'secondary',
  'Cancelado': 'destructive',
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

export default function CentralDespacho() {
  const despachos = useMemo(() => getDespachos(), []);
  const solicitacoes = useMemo(() => getSolicitacoes(), []);
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const [selectedDespacho, setSelectedDespacho] = useState<Despacho | null>(null);
  const [activeTab, setActiveTab] = useState('fila');
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

  const filaAguardando = despachos.filter(d => d.status === 'Aguardando' || d.status === 'Ofertas enviadas');
  const despachosAceitos = despachos.filter(d => d.status === 'Aceito');
  const despachosCriticos = despachos.filter(d => d.status === 'Sem prestador' || d.status === 'Expirado');

  const prestadoresOnline = prestadores.filter(p => p.localizacao && (p.localizacao.statusRastreamento === 'Online') && p.status === 'Ativo' && p.homologacao === 'Homologado');

  const kpis = [
    { label: 'Fila Ativa', value: filaAguardando.length, icon: Clock, bg: 'bg-warning/10', color: 'text-warning', sub: 'aguardando aceite' },
    { label: 'Aceitos', value: despachosAceitos.length, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success', sub: 'OS em execução' },
    { label: 'Críticos', value: despachosCriticos.length, icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive', sub: 'sem prestador' },
    { label: 'Disponíveis', value: prestadoresOnline.length, icon: Radio, bg: 'bg-info/10', color: 'text-info', sub: 'online e aptos' },
  ];

  // Initialize map once (container is always mounted via forceMount)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, { center: [-23.55, -46.63], zoom: 5, zoomControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers and invalidate size when tab becomes active
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
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        }),
      }).addTo(map).bindPopup(`<div style="font-size:12px;"><b>${p.nomeFantasia}</b><br/>${p.cidade}/${p.uf}<br/><span style="color:${color}">${loc.statusRastreamento}</span></div>`);
      markersRef.current.push(marker);
    });

    solicitacoes.filter(s => s.origemCoord && !['Finalizada', 'Cancelada'].includes(s.status)).forEach(s => {
      const marker = L.marker([s.origemCoord!.lat, s.origemCoord!.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:20px;height:20px;border-radius:4px;background:#ef4444;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">!</div>`,
          iconSize: [20, 20], iconAnchor: [10, 10],
        }),
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
            Torre de controle — despacho inteligente automático. <span className="text-primary font-medium">Primeiro que aceita, ganha a OS.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-destructive border border-destructive/20 bg-destructive/5 rounded-md px-2.5 py-1 font-medium">
            <div className="relative">
              <Bell className="h-3 w-3 animate-siren-glow" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full animate-siren-pulse" />
            </div>
            <span>Sirene prestador</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-primary border border-primary/20 bg-primary/5 rounded-md px-2.5 py-1 font-medium">
            <Zap className="h-3 w-3" /><span>Despacho automático</span>
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

      {/* Metrics bar */}
      <div className="flex flex-wrap gap-4 px-4 py-3 bg-card border rounded-xl text-[12px]">
        <div className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">Conversão:</span><span className="font-bold">{taxaConversao}%</span></div>
        <div className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5 text-info" /><span className="text-muted-foreground">Tempo aceite:</span><span className="font-bold">{tempoMedioAceite.toFixed(0)} min</span></div>
        <div className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5 text-warning" /><span className="text-muted-foreground">Ofertas:</span><span className="font-bold">{totalOfertas}</span></div>
        <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-success" /><span className="text-muted-foreground">Prestadores online:</span><span className="font-bold">{prestadoresOnline.length}</span></div>
      </div>

      {/* Tabs: Fila / Mapa / Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fila" className="text-xs gap-1.5"><Radar className="h-3.5 w-3.5" />Fila de Despacho</TabsTrigger>
          <TabsTrigger value="mapa" className="text-xs gap-1.5"><MapPin className="h-3.5 w-3.5" />Mapa da Operação</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1.5"><Clock className="h-3.5 w-3.5" />Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="mt-4 space-y-3">
          {/* Critical alert */}
          {despachosCriticos.length > 0 && (
            <div className="alert-banner alert-banner-critical">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{despachosCriticos.length} despacho(s) sem prestador — requerem atenção imediata</span>
            </div>
          )}

          {/* Queue */}
          {filaAguardando.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-warning uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Aguardando Aceite ({filaAguardando.length})
              </p>
              {filaAguardando.map(d => <DespachoCard key={d.id} despacho={d} getSolicitacao={getSolicitacao} getPrestadorNome={getPrestadorNome} onSelect={setSelectedDespacho} />)}
            </div>
          )}

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

          {despachos.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Radar className="h-5 w-5 text-muted-foreground" /></div>
              <p className="empty-state-title">Nenhum despacho na fila</p>
              <p className="empty-state-description">Quando um cliente aceitar um orçamento, o despacho automático será iniciado</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mapa" forceMount className={`mt-4 ${activeTab !== 'mapa' ? 'hidden' : ''}`}>
          <Card className="overflow-hidden">
            <div className="h-[calc(100vh-420px)] min-h-[400px] relative">
              <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

              {/* Legend */}
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

              {/* Disponíveis overlay */}
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
          {despachos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()).map(d => (
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
  despacho: Despacho; getSolicitacao: (id: string) => any; getPrestadorNome: (id: string) => string; onSelect: (d: Despacho) => void;
}) {
  const sol = getSolicitacao(d.solicitacaoId);
  return (
    <Card className="card-hover cursor-pointer" onClick={() => onSelect(d)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-[11px] text-muted-foreground">{sol?.protocolo || d.id}</span>
              <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <RotateCcw className="h-2.5 w-2.5" />Rodada {d.rodadaAtual}
              </Badge>
            </div>
            <p className="text-[14px] font-semibold">{sol?.clienteNome || '—'}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {sol?.origemEndereco} → {sol?.destinoEndereco}
            </p>
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
  despacho: Despacho; getSolicitacao: (id: string) => any; getPrestadorNome: (id: string) => string; getPrestador: (id: string) => any;
}) {
  const sol = getSolicitacao(d.solicitacaoId);

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <SheetTitle className="text-base">Despacho {sol?.protocolo || d.id}</SheetTitle>
          <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
        </div>
        <p className="text-[12px] text-muted-foreground">Criado em {formatDate(d.criadoEm)} • Rodada {d.rodadaAtual}</p>
      </SheetHeader>

      <div className="mt-5 space-y-5">
        {/* Auto dispatch indicator */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Radar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-primary">Despacho inteligente</p>
            <p className="text-[11px] text-muted-foreground">Sistema selecionou os {d.ofertas.length} prestadores mais próximos automaticamente.</p>
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
                        {o.motivoRecusa && (
                          <p className="text-[10px] text-destructive mt-0.5">{o.motivoRecusa}</p>
                        )}
                        {o.respondidaEm && (
                          <p className="text-[9px] text-muted-foreground mt-0.5">Resposta: {formatDate(o.respondidaEm)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Observations */}
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
