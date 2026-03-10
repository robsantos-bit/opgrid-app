import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { getDespachos, getAtendimentos, getSolicitacoes, getPrestadores } from '@/data/store';
import { OfertaPrestador, Atendimento, Solicitacao, Prestador, StatusOsPrestador, ChecklistItem, CHECKLIST_PADRAO } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck, MapPin, Clock, Phone, MessageCircle, CheckCircle2, XCircle, AlertTriangle,
  Navigation, Camera, FileText, Timer, Shield, Zap, ArrowRight, User, Car, DollarSign,
  Send, ChevronRight, Radio, Eye, LocateFixed, Upload
} from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ====== OFFER PAGE ======
function OfertaView({ oferta, solicitacao, prestador }: { oferta: OfertaPrestador; solicitacao: Solicitacao | undefined; prestador: Prestador | undefined }) {
  const [status, setStatus] = useState(oferta.status);
  const [showRecusa, setShowRecusa] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');

  const expired = status === 'Pendente' && new Date(oferta.enviadaEm).getTime() + oferta.tempoLimiteMinutos * 60000 < Date.now();

  const handleAceitar = () => setStatus('Aceita');
  const handleRecusar = () => { setShowRecusa(true); };
  const confirmRecusa = () => { setStatus('Recusada'); setShowRecusa(false); };

  if (expired && status === 'Pendente') {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Timer className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold mb-1">Oferta expirada</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">O tempo limite para aceitar esta oferta já passou. Entre em contato com a central se necessário.</p>
        </div>
      </MobileShell>
    );
  }

  if (status === 'Aceita') {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-lg font-bold text-success mb-1">Oferta aceita!</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">A OS foi reservada para você. Acesse o link da OS para iniciar o atendimento.</p>
          <Button className="mt-6 w-full max-w-[280px]" size="lg">
            <Navigation className="h-4 w-4 mr-2" />Abrir OS do atendimento
          </Button>
        </div>
      </MobileShell>
    );
  }

  if (status === 'Recusada') {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-bold mb-1">Oferta recusada</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">Você recusou esta oferta. A OS será redirecionada para outro prestador.</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 py-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Nova oferta de serviço</span>
        </div>
        <h1 className="text-xl font-bold">Você recebeu uma OS!</h1>
        <p className="text-sm opacity-80 mt-1">Primeiro que aceitar, ganha a OS. Sem app necessário.</p>
      </div>

      {/* Timer */}
      <div className="mx-4 -mt-3">
        <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <Timer className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-bold text-warning">Oferta expira em {oferta.tempoLimiteMinutos} min</p>
            <p className="text-xs text-muted-foreground">Ao aceitar, a OS fica reservada para você</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Value highlight */}
        <Card className="border-2 border-success/30 bg-success/5">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor do serviço</p>
            <p className="text-3xl font-bold text-success">R$ {oferta.valorServico.toFixed(2)}</p>
          </CardContent>
        </Card>

        {/* Service details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detalhes do serviço</p>
            {solicitacao && (
              <>
                <Row icon={Car} label="Veículo" value={`${solicitacao.veiculoModelo} • ${solicitacao.veiculoPlaca}`} />
                <Row icon={AlertTriangle} label="Problema" value={solicitacao.motivo} />
                <Separator />
                <Row icon={MapPin} label="Origem" value={solicitacao.origemEndereco} />
                <Row icon={MapPin} label="Destino" value={solicitacao.destinoEndereco} />
                <Separator />
              </>
            )}
            <Row icon={Navigation} label="Distância estimada" value={`${oferta.distanciaEstimadaKm} km`} />
            <Row icon={Clock} label="Tempo estimado" value={`${oferta.tempoEstimadoMinutos} min`} />
            {solicitacao?.observacoes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm italic text-foreground">"{solicitacao.observacoes}"</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {!showRecusa ? (
          <div className="space-y-2.5">
            <Button className="w-full h-14 text-base font-bold" onClick={handleAceitar}>
              <CheckCircle2 className="h-5 w-5 mr-2" />Aceitar oferta
            </Button>
            <Button variant="outline" className="w-full h-12" onClick={handleRecusar}>
              <XCircle className="h-4 w-4 mr-2" />Recusar
            </Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-bold">Motivo da recusa</p>
              {['Muito longe', 'Indisponível', 'Valor insuficiente', 'Sem equipamento adequado', 'Fora da área', 'Outro'].map(m => (
                <button
                  key={m}
                  onClick={() => setMotivoRecusa(m)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    motivoRecusa === m ? 'border-primary bg-primary/5 text-primary font-medium' : 'hover:bg-muted/30'
                  }`}
                >
                  {m}
                </button>
              ))}
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowRecusa(false)}>Voltar</Button>
                <Button variant="destructive" className="flex-1" onClick={confirmRecusa} disabled={!motivoRecusa}>Confirmar recusa</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-center text-muted-foreground px-4">
          Aceite sujeito à sua disponibilidade e localização. Ao aceitar, você confirma estar apto para este serviço.
        </p>
      </div>
    </MobileShell>
  );
}

// ====== OS EXECUTION PAGE ======
function OsView({ atendimento, solicitacao, prestador }: { atendimento: Atendimento; solicitacao: Solicitacao | undefined; prestador: Prestador | undefined }) {
  const [currentStatus, setCurrentStatus] = useState<StatusOsPrestador>(atendimento.statusPrestador || 'Aceito');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    atendimento.checklist || CHECKLIST_PADRAO.map((c, i) => ({ ...c, id: `ck-${i}` }))
  );
  const [observacoes, setObservacoes] = useState('');
  const [locationActive, setLocationActive] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const statusFlow: StatusOsPrestador[] = ['Aceito', 'A caminho', 'Cheguei ao local', 'Em remoção', 'Concluído'];
  const currentIndex = statusFlow.indexOf(currentStatus);

  const nextStatus = () => {
    if (currentIndex < statusFlow.length - 1) {
      setCurrentStatus(statusFlow[currentIndex + 1]);
    }
  };

  const statusConfig: Record<StatusOsPrestador, { color: string; bg: string; icon: typeof Truck }> = {
    'Aceito': { color: 'text-primary', bg: 'bg-primary/10', icon: CheckCircle2 },
    'A caminho': { color: 'text-info', bg: 'bg-info/10', icon: Navigation },
    'Cheguei ao local': { color: 'text-warning', bg: 'bg-warning/10', icon: MapPin },
    'Em remoção': { color: 'text-warning', bg: 'bg-warning/10', icon: Truck },
    'Concluído': { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
    'Cancelado': { color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle },
  };

  const cfg = statusConfig[currentStatus];
  const StatusIcon = cfg.icon;

  const nextLabel: Record<string, string> = {
    'Aceito': 'Estou a caminho',
    'A caminho': 'Cheguei ao local',
    'Cheguei ao local': 'Iniciar remoção',
    'Em remoção': 'Concluir atendimento',
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [-23.55, -46.65], zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    if (atendimento.origemCoord) {
      L.marker([atendimento.origemCoord.lat, atendimento.origemCoord.lng], {
        icon: L.divIcon({ className: 'custom-marker', html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
      }).addTo(map);
    }
    if (atendimento.destinoCoord) {
      L.marker([atendimento.destinoCoord.lat, atendimento.destinoCoord.lng], {
        icon: L.divIcon({ className: 'custom-marker', html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
      }).addTo(map);
    }

    const bounds: [number, number][] = [];
    if (atendimento.origemCoord) bounds.push([atendimento.origemCoord.lat, atendimento.origemCoord.lng]);
    if (atendimento.destinoCoord) bounds.push([atendimento.destinoCoord.lat, atendimento.destinoCoord.lng]);
    if (bounds.length >= 2) map.fitBounds(bounds, { padding: [40, 40] });
    else if (bounds.length === 1) map.setView(bounds[0], 14);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const toggleLocation = () => setLocationActive(!locationActive);

  return (
    <MobileShell>
      {/* Status header */}
      <div className={`${cfg.bg} px-5 py-5`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center`}>
            <StatusIcon className={`h-6 w-6 ${cfg.color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{atendimento.protocolo}</p>
            <h1 className="text-lg font-bold">{currentStatus}</h1>
          </div>
        </div>

        {/* Status stepper */}
        <div className="flex items-center gap-1 mt-4">
          {statusFlow.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${i <= currentIndex ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="h-[180px] relative">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        <button
          onClick={toggleLocation}
          className={`absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border shadow-sm ${
            locationActive ? 'bg-success text-success-foreground border-success' : 'bg-card text-foreground'
          }`}
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {locationActive ? 'Localização ativa' : 'Compartilhar localização'}
        </button>
        {locationActive && (
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success/90 text-success-foreground text-[10px] font-medium">
            <Radio className="h-3 w-3 animate-pulse" />Compartilhando localização
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Route */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-3 h-3 rounded-full bg-success border-2 border-success/30" />
                <div className="w-px h-6 bg-border" />
                <div className="w-3 h-3 rounded-full bg-destructive border-2 border-destructive/30" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Origem</p>
                  <p className="text-sm font-medium">{atendimento.origem}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Destino</p>
                  <p className="text-sm font-medium">{atendimento.destino}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client + Vehicle */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cliente & Veículo</p>
            <Row icon={User} label="Cliente" value={atendimento.clienteNome} />
            <Row icon={Car} label="Veículo" value={`${atendimento.veiculo} • ${atendimento.placa}`} />
            <Row icon={AlertTriangle} label="Problema" value={atendimento.tipoAtendimento} />
            <Row icon={DollarSign} label="Valor aprovado" value={`R$ ${atendimento.valorTotal.toFixed(2)}`} />
            <Separator />
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

        {/* Checklist */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Checklist do atendimento</p>
            {checklist.map((item, i) => (
              <label key={item.id} className="flex items-center gap-3 py-1 cursor-pointer">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) => {
                    const updated = [...checklist];
                    updated[i] = { ...updated[i], checked: !!checked };
                    setChecklist(updated);
                  }}
                />
                <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Observations + Attachments */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Observações e Anexos</p>
            <Textarea
              placeholder="Adicionar observações do atendimento..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="text-sm min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Camera className="h-3 w-3 mr-1" />Adicionar fotos
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Upload className="h-3 w-3 mr-1" />Anexar NF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main action */}
        {currentStatus !== 'Concluído' && currentStatus !== 'Cancelado' && (
          <Button className="w-full h-14 text-base font-bold" onClick={nextStatus}>
            <ChevronRight className="h-5 w-5 mr-2" />
            {nextLabel[currentStatus] || 'Avançar'}
          </Button>
        )}

        {currentStatus === 'Concluído' && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-lg font-bold text-success">Atendimento concluído!</h2>
            <p className="text-sm text-muted-foreground mt-1">Os dados foram registrados com sucesso.</p>
          </div>
        )}

        {/* Secondary actions */}
        {currentStatus !== 'Concluído' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Phone className="h-3 w-3 mr-1" />Contato central
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs text-destructive hover:text-destructive">
              <XCircle className="h-3 w-3 mr-1" />Cancelar
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] text-muted-foreground">Acesso via link • Sem app necessário</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">Powered by OpGrid</p>
        </div>
      </div>
    </MobileShell>
  );
}

// ====== SHELL & HELPERS ======
function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto bg-card min-h-screen shadow-xl">
        {children}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ====== MAIN PORTAL PAGE ======
export default function PortalPrestador() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>();

  const despachos = useMemo(() => getDespachos(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const solicitacoes = useMemo(() => getSolicitacoes(), []);
  const prestadores = useMemo(() => getPrestadores(), []);

  if (tipo === 'oferta' && id) {
    // Find the offer across all dispatches
    let oferta: OfertaPrestador | undefined;
    for (const d of despachos) {
      const found = d.ofertas.find(o => o.id === id);
      if (found) { oferta = found; break; }
    }

    if (!oferta) {
      return (
        <MobileShell>
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold mb-1">Oferta não encontrada</h2>
            <p className="text-sm text-muted-foreground">Este link pode ter expirado ou a oferta não existe.</p>
          </div>
        </MobileShell>
      );
    }

    const despacho = despachos.find(d => d.id === oferta!.despachoId);
    const sol = despacho ? solicitacoes.find(s => s.id === despacho.solicitacaoId) : undefined;
    const prest = prestadores.find(p => p.id === oferta.prestadorId);

    return <OfertaView oferta={oferta} solicitacao={sol} prestador={prest} />;
  }

  if (tipo === 'os' && id) {
    const atendimento = atendimentos.find(a => a.id === id);
    if (!atendimento) {
      return (
        <MobileShell>
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold mb-1">OS não encontrada</h2>
            <p className="text-sm text-muted-foreground">Este link pode estar incorreto ou a OS não existe.</p>
          </div>
        </MobileShell>
      );
    }

    const sol = atendimento.solicitacaoId ? solicitacoes.find(s => s.id === atendimento.solicitacaoId) : undefined;
    const prest = prestadores.find(p => p.id === atendimento.prestadorId);

    return <OsView atendimento={atendimento} solicitacao={sol} prestador={prest} />;
  }

  return (
    <MobileShell>
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-1">Portal do Prestador</h2>
        <p className="text-sm text-muted-foreground max-w-[280px]">Acesse este portal através do link enviado pela central de operações.</p>
      </div>
    </MobileShell>
  );
}
