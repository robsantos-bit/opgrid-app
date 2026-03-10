import { useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getAtendimentos, getSolicitacoes, getPrestadores } from '@/data/store';
import { Atendimento, Solicitacao, Prestador, StatusAcompanhamentoCliente } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck, MapPin, Clock, Phone, MessageCircle, CheckCircle2, XCircle,
  Navigation, Shield, Timer, Car, User, Radio, FileText
} from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const statusConfig: Record<StatusAcompanhamentoCliente, { color: string; bg: string; icon: typeof Truck; label: string; message: string }> = {
  'Solicitação recebida': { color: 'text-info', bg: 'bg-info/10', icon: FileText, label: 'Solicitação recebida', message: 'Sua solicitação foi registrada e está sendo processada.' },
  'Aguardando prestador': { color: 'text-warning', bg: 'bg-warning/10', icon: Timer, label: 'Aguardando prestador', message: 'Estamos localizando o prestador mais próximo para você.' },
  'Prestador confirmado': { color: 'text-primary', bg: 'bg-primary/10', icon: CheckCircle2, label: 'Prestador confirmado', message: 'Um prestador aceitou seu chamado e se prepara para ir até você.' },
  'Prestador a caminho': { color: 'text-info', bg: 'bg-info/10', icon: Navigation, label: 'A caminho', message: 'O prestador está se deslocando até sua localização.' },
  'Prestador chegou ao local': { color: 'text-warning', bg: 'bg-warning/10', icon: MapPin, label: 'No local', message: 'O prestador chegou ao local do atendimento.' },
  'Atendimento em andamento': { color: 'text-warning', bg: 'bg-warning/10', icon: Truck, label: 'Em andamento', message: 'O serviço está sendo realizado neste momento.' },
  'Atendimento concluído': { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2, label: 'Concluído', message: 'Seu atendimento foi finalizado com sucesso!' },
  'Atendimento cancelado': { color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle, label: 'Cancelado', message: 'Este atendimento foi cancelado.' },
};

function deriveClientStatus(atendimento: Atendimento): StatusAcompanhamentoCliente {
  if (atendimento.status === 'Cancelado') return 'Atendimento cancelado';
  if (atendimento.status === 'Concluído' || atendimento.status === 'Faturado') return 'Atendimento concluído';
  if (atendimento.statusPrestador === 'Em remoção') return 'Atendimento em andamento';
  if (atendimento.statusPrestador === 'Cheguei ao local') return 'Prestador chegou ao local';
  if (atendimento.statusPrestador === 'A caminho') return 'Prestador a caminho';
  if (atendimento.statusPrestador === 'Aceito') return 'Prestador confirmado';
  if (atendimento.status === 'Aberto') return 'Aguardando prestador';
  return 'Solicitação recebida';
}

function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto bg-card min-h-screen shadow-xl">
        {children}
      </div>
    </div>
  );
}

export default function AcompanhamentoCliente() {
  const { id } = useParams<{ id: string }>();
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const solicitacoes = useMemo(() => getSolicitacoes(), []);
  const prestadores = useMemo(() => getPrestadores(), []);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const atendimento = atendimentos.find(a => a.id === id);
  const solicitacao = solicitacoes.find(s => s.id === id || s.atendimentoId === id);

  const clientStatus: StatusAcompanhamentoCliente = atendimento
    ? deriveClientStatus(atendimento)
    : solicitacao
      ? (solicitacao.status === 'Cancelada' ? 'Atendimento cancelado' : 'Solicitação recebida')
      : 'Solicitação recebida';

  const cfg = statusConfig[clientStatus];
  const StatusIcon = cfg.icon;
  const prestador = atendimento ? prestadores.find(p => p.id === atendimento.prestadorId) : undefined;

  const timeline = atendimento?.timeline || solicitacao?.timeline?.map(t => ({ data: t.data, descricao: t.descricao })) || [];

  const statusSteps: StatusAcompanhamentoCliente[] = [
    'Solicitação recebida', 'Aguardando prestador', 'Prestador confirmado',
    'Prestador a caminho', 'Prestador chegou ao local', 'Atendimento em andamento', 'Atendimento concluído'
  ];
  const currentStepIndex = statusSteps.indexOf(clientStatus);

  // Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [-23.55, -46.65], zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    const origemCoord = atendimento?.origemCoord || solicitacao?.origemCoord;
    const destinoCoord = atendimento?.destinoCoord || solicitacao?.destinoCoord;

    if (origemCoord) {
      L.marker([origemCoord.lat, origemCoord.lng], {
        icon: L.divIcon({ className: 'custom-marker', html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
      }).addTo(map);
    }
    if (destinoCoord) {
      L.marker([destinoCoord.lat, destinoCoord.lng], {
        icon: L.divIcon({ className: 'custom-marker', html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
      }).addTo(map);
    }

    // Simulated prestador location
    if (prestador?.localizacao && ['Prestador a caminho', 'Prestador confirmado'].includes(clientStatus)) {
      L.marker([prestador.localizacao.lat, prestador.localizacao.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:24px;height:24px;border-radius:6px;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 2L19 21L12 17L5 21Z"/></svg></div>`,
          iconSize: [24, 24], iconAnchor: [12, 12]
        })
      }).addTo(map).bindPopup(`<b>${prestador.nomeFantasia}</b><br/>A caminho`);
    }

    const bounds: [number, number][] = [];
    if (origemCoord) bounds.push([origemCoord.lat, origemCoord.lng]);
    if (destinoCoord) bounds.push([destinoCoord.lat, destinoCoord.lng]);
    if (prestador?.localizacao) bounds.push([prestador.localizacao.lat, prestador.localizacao.lng]);
    if (bounds.length >= 2) map.fitBounds(bounds, { padding: [40, 40] });
    else if (bounds.length === 1) map.setView(bounds[0], 14);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  if (!atendimento && !solicitacao) {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold mb-1">Solicitação não encontrada</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">Este link pode ter expirado ou a solicitação não existe mais.</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* Status header */}
      <div className={`${cfg.bg} px-5 py-6`}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Acompanhamento em tempo real</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl ${cfg.bg} border-2 border-background flex items-center justify-center`}>
            <StatusIcon className={`h-7 w-7 ${cfg.color}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{cfg.label}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cfg.message}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mt-5">
          {statusSteps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= currentStepIndex ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="h-[200px] relative">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        {prestador?.localizacao && (
          <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/95 backdrop-blur-sm border text-xs shadow-sm">
            <Radio className="h-3 w-3 text-success animate-pulse" />
            <span className="text-muted-foreground">Atualizado {timeSince(prestador.localizacao.ultimaAtualizacao)} atrás</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* ETA card */}
        {['Prestador a caminho', 'Prestador confirmado', 'Aguardando prestador'].includes(clientStatus) && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Previsão de chegada</p>
              <p className="text-3xl font-bold text-primary">~25 min</p>
              <p className="text-xs text-muted-foreground mt-1">Estimativa baseada na localização atual</p>
            </CardContent>
          </Card>
        )}

        {/* Provider info */}
        {prestador && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Prestador designado</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{prestador.nomeFantasia}</p>
                  <p className="text-xs text-muted-foreground">{prestador.cidade}/{prestador.uf}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Score {prestador.scoreOperacional}
                </Badge>
              </div>
              <Separator className="my-3" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Phone className="h-3 w-3 mr-1" />Ligar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle + Service */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resumo do serviço</p>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-3.5 w-3.5" /><span className="text-xs">Veículo</span>
              </div>
              <span className="text-sm font-medium">{atendimento?.veiculo || solicitacao?.veiculoModelo} • {atendimento?.placa || solicitacao?.veiculoPlaca}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /><span className="text-xs">Origem</span>
              </div>
              <span className="text-sm font-medium text-right max-w-[60%] truncate">{atendimento?.origem || solicitacao?.origemEndereco}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /><span className="text-xs">Destino</span>
              </div>
              <span className="text-sm font-medium text-right max-w-[60%] truncate">{atendimento?.destino || solicitacao?.destinoEndereco}</span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Linha do tempo</p>
            <div className="relative">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      i === 0 ? 'bg-primary border-primary/30' : 'bg-muted border-border'
                    }`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p className="text-sm font-medium">{event.descricao}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(event.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Button variant="outline" className="w-full">
          <Phone className="h-4 w-4 mr-2" />Falar com a central
        </Button>

        {/* Footer message */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground font-medium mb-1">
            Acompanhamento em tempo real
          </p>
          <p className="text-xs text-muted-foreground/60">
            Sem app necessário • Tudo pelo link
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-2">Powered by OpGrid</p>
        </div>
      </div>
    </MobileShell>
  );
}
