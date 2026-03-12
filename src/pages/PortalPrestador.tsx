import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { playProviderSiren } from '@/lib/sirenSound';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { getDespachos, getAtendimentos, getSolicitacoes, getPrestadores, updateDespacho, updateSolicitacao, updateAtendimento } from '@/data/store';
import { addNotification } from '@/lib/notifications';
import { OfertaPrestador, Atendimento, Solicitacao, Prestador, StatusOsPrestador, ChecklistItem, CHECKLIST_PADRAO } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import ChecklistExecucao from '@/components/ChecklistExecucao';
import {
  Truck, MapPin, Clock, Phone, MessageCircle, CheckCircle2, XCircle, AlertTriangle,
  Navigation, Camera, FileText, Timer, Shield, Zap, ArrowRight, User, Car, DollarSign,
  Send, ChevronRight, Radio, Eye, LocateFixed, Upload, Lock, KeyRound, Trash2
} from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ====== COUNTDOWN TIMER CIRCLE ======
function CountdownCircle({ expiresAt, totalMinutes }: { expiresAt: number; totalMinutes: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, expiresAt - now);
  const totalMs = totalMinutes * 60000;
  const progress = remaining / totalMs;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-[180px] h-[180px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="80" cy="80" r={radius} fill="none"
            stroke={progress > 0.3 ? 'hsl(24, 85%, 55%)' : 'hsl(var(--destructive))'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tracking-tight text-foreground">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">Tempo para aceitar o chamado</p>
    </div>
  );
}

// ====== INFO ROW CARD ======
function InfoRow({ icon: Icon, label, value, iconColor }: { icon: typeof Truck; label: string; value: string; iconColor?: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <div className={`mt-0.5 ${iconColor || 'text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// ====== OFFER PAGE ======
function OfertaView({ oferta, solicitacao, prestador }: { oferta: OfertaPrestador; solicitacao: Solicitacao | undefined; prestador: Prestador | undefined }) {
  const [status, setStatus] = useState(oferta.status);
  const [showRecusa, setShowRecusa] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [sirenPlayed, setSirenPlayed] = useState(false);

  const expiresAt = new Date(oferta.enviadaEm).getTime() + oferta.tempoLimiteMinutos * 60000;
  const expired = status === 'Pendente' && expiresAt < Date.now();

  useEffect(() => {
    if (status === 'Pendente' && !expired && !sirenPlayed) {
      const playOnInteraction = () => {
        playProviderSiren(3);
        setSirenPlayed(true);
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('touchstart', playOnInteraction);
      };
      try {
        playProviderSiren(3);
        setSirenPlayed(true);
      } catch {
        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });
      }
      return () => {
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('touchstart', playOnInteraction);
      };
    }
  }, [status, expired, sirenPlayed]);

  const handleAceitar = () => {
    setStatus('Aceita');
    const despachos = getDespachos();
    const desp = despachos.find(d => d.id === oferta.despachoId);
    if (desp) {
      const now = new Date().toISOString();
      desp.ofertas = desp.ofertas.map(o => o.id === oferta.id ? { ...o, status: 'Aceita' as const, respondidaEm: now } : o);
      desp.ofertas = desp.ofertas.map(o => o.id !== oferta.id && o.status === 'Pendente' ? { ...o, status: 'Encerrada' as const, respondidaEm: now } : o);
      desp.status = 'Aceito';
      desp.prestadorAceitoId = oferta.prestadorId;
      desp.atualizadoEm = now;
      updateDespacho(desp);
      if (desp.atendimentoId) {
        const atendimentos = getAtendimentos();
        const atd = atendimentos.find(a => a.id === desp.atendimentoId);
        if (atd) {
          atd.prestadorId = oferta.prestadorId;
          atd.status = 'Em andamento';
          atd.statusPrestador = 'Aceito';
          atd.linkPrestador = `/prestador/os/${atd.id}`;
          atd.timeline = [...atd.timeline, { data: now, descricao: `Prestador ${prestador?.nomeFantasia || ''} aceitou a OS` }];
          updateAtendimento(atd);
        }
      }
      const sols = getSolicitacoes();
      const sol = sols.find(s => s.id === desp.solicitacaoId);
      if (sol) {
        sol.status = 'Em atendimento';
        sol.statusProposta = 'Aceita';
        sol.propostaRespondidaEm = now;
        sol.timeline.push({ data: now, descricao: `Prestador ${prestador?.nomeFantasia || ''} aceitou a oferta`, tipo: 'sistema' });
        updateSolicitacao(sol);
      }
      addNotification({
        type: 'oferta_aceita',
        title: '✅ Oferta aceita!',
        message: `${prestador?.nomeFantasia || 'Prestador'} aceitou a oferta para ${solicitacao?.protocolo || 'solicitação'}`,
        solicitacaoId: desp.solicitacaoId,
        prestadorNome: prestador?.nomeFantasia,
      });
    }
  };

  const handleRecusar = () => { setShowRecusa(true); };

  const confirmRecusa = () => {
    setStatus('Recusada');
    setShowRecusa(false);
    const despachos = getDespachos();
    const desp = despachos.find(d => d.id === oferta.despachoId);
    if (desp) {
      const now = new Date().toISOString();
      desp.ofertas = desp.ofertas.map(o => o.id === oferta.id ? { ...o, status: 'Recusada' as const, respondidaEm: now, motivoRecusa: (motivoRecusa || 'Outro') as any } : o);
      const allResolved = desp.ofertas.every(o => o.status !== 'Pendente');
      if (allResolved && !desp.ofertas.some(o => o.status === 'Aceita')) {
        desp.status = 'Sem prestador';
      }
      desp.atualizadoEm = now;
      updateDespacho(desp);
      addNotification({
        type: 'oferta_recusada',
        title: '❌ Oferta recusada',
        message: `${prestador?.nomeFantasia || 'Prestador'} recusou a oferta para ${solicitacao?.protocolo || 'solicitação'}. Motivo: ${motivoRecusa || 'Não informado'}`,
        solicitacaoId: desp.solicitacaoId,
        prestadorNome: prestador?.nomeFantasia,
      });
    }
  };

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
    const desp = getDespachos().find(d => d.id === oferta.despachoId);
    const osId = desp?.atendimentoId;
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-lg font-bold text-success mb-1">Oferta aceita!</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">A OS foi reservada para você. Acesse o portal operacional para iniciar o atendimento.</p>
          {osId && (
            <Button className="mt-6 w-full max-w-[280px]" size="lg"
              onClick={() => window.location.href = `/prestador/os/${osId}`}>
              <Navigation className="h-4 w-4 mr-2" />Abrir Portal da OS
            </Button>
          )}
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
      {/* Header — green bar like reference */}
      <div className="bg-[hsl(160,60%,38%)] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Truck className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-base font-bold uppercase tracking-wide">Novo Chamado</span>
        </div>
        <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Radio className="h-4 w-4 text-white/80" />
        </button>
      </div>

      {/* Countdown timer circle */}
      <CountdownCircle expiresAt={expiresAt} totalMinutes={oferta.tempoLimiteMinutos} />

      {/* Info cards */}
      <div className="px-4 pb-4">
        <Card className="overflow-hidden">
          <InfoRow icon={Car} label="Veículo" value={solicitacao ? `${solicitacao.veiculoModelo} • ${solicitacao.veiculoPlaca}` : 'N/D'} iconColor="text-muted-foreground" />
          <InfoRow icon={User} label="Cliente" value={solicitacao?.clienteNome || 'Cliente não encontrado'} iconColor="text-muted-foreground" />
          <InfoRow icon={MapPin} label="Origem" value={solicitacao?.origemEndereco || 'N/D'} iconColor="text-warning" />
          <InfoRow icon={MapPin} label="Destino" value={solicitacao?.destinoEndereco || 'N/D'} iconColor="text-destructive" />
        </Card>
      </div>

      {/* Value + distance */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        <Card className="border-2 border-success/30 bg-success/5">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Valor</p>
            <p className="text-xl font-bold text-success">R$ {oferta.valorServico.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Distância</p>
            <p className="text-xl font-bold text-foreground">{oferta.distanciaEstimadaKm} km</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="px-4 pb-6 space-y-2.5">
        {!showRecusa ? (
          <>
            <Button className="w-full h-14 text-base font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)]" onClick={handleAceitar}>
              <CheckCircle2 className="h-5 w-5 mr-2" />Aceitar chamado
            </Button>
            <Button variant="outline" className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleRecusar}>
              <XCircle className="h-4 w-4 mr-2" />Recusar
            </Button>
          </>
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

        <p className="text-[10px] text-center text-muted-foreground px-4">
          Ao aceitar, você confirma estar disponível para este serviço.
        </p>
      </div>
    </MobileShell>
  );
}

// ====== ELAPSED TIMER ======
function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('0m 0s');
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => {
      const diff = Math.max(0, Date.now() - start);
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return <span className="text-lg font-bold text-[hsl(160,60%,38%)]">{elapsed}</span>;
}

// ====== SECTION HEADER ======
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b-2 border-[hsl(160,60%,38%)]/20 pb-1.5 mb-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{title}</h2>
    </div>
  );
}

// ====== NUMBERED ROW ======
function NumberedRow({ num, color, label, value }: { num: number; color: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center shrink-0`}>
        <span className="text-white text-xs font-bold">{num}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ====== ICON ROW ======
function IconRow({ icon: Icon, label, value, iconBg }: { icon: typeof Truck; label: string; value: string | React.ReactNode; iconBg?: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className={`w-9 h-9 rounded-xl ${iconBg || 'bg-muted'} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
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
  const [plateInput, setPlateInput] = useState('');
  const [plateConfirmed, setPlateConfirmed] = useState(false);
  const [plateError, setPlateError] = useState('');
  const [etaInput, setEtaInput] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptedAt = useRef(new Date().toISOString());

  const statusFlow: StatusOsPrestador[] = ['Aceito', 'A caminho', 'Cheguei ao local', 'Em remoção', 'Concluído'];
  const currentIndex = statusFlow.indexOf(currentStatus);

  const persistStatus = useCallback((newStatus: StatusOsPrestador) => {
    const now = new Date().toISOString();
    const atd = getAtendimentos().find(a => a.id === atendimento.id);
    if (!atd) return;
    atd.statusPrestador = newStatus;
    atd.checklist = checklist;
    const statusLabels: Record<StatusOsPrestador, string> = {
      'Aceito': 'Prestador aceitou a OS',
      'A caminho': 'Prestador a caminho do local',
      'Cheguei ao local': 'Prestador chegou ao local',
      'Em remoção': 'Serviço de remoção iniciado',
      'Concluído': 'Atendimento concluído pelo prestador',
      'Cancelado': 'Atendimento cancelado pelo prestador',
    };
    atd.timeline = [...atd.timeline, { data: now, descricao: statusLabels[newStatus] || newStatus }];
    if (newStatus === 'Cheguei ao local') atd.horaChegada = now;
    if (newStatus === 'Concluído') { atd.horaConclusao = now; atd.status = 'Concluído'; }
    updateAtendimento(atd);
    if (atd.solicitacaoId) {
      const sol = getSolicitacoes().find(s => s.id === atd.solicitacaoId);
      if (sol) {
        if (newStatus === 'Concluído') sol.status = 'Finalizada';
        sol.timeline.push({ data: now, descricao: statusLabels[newStatus], tipo: 'sistema' });
        updateSolicitacao(sol);
      }
    }
    addNotification({
      type: newStatus === 'Concluído' ? 'status_concluido' as any : 'status_atualizado' as any,
      title: newStatus === 'Concluído' ? '✅ OS Concluída' : `📍 ${statusLabels[newStatus]}`,
      message: `${prestador?.nomeFantasia || 'Prestador'} — ${atendimento.protocolo}`,
      solicitacaoId: atd.solicitacaoId,
      prestadorNome: prestador?.nomeFantasia,
    });
  }, [atendimento, checklist, prestador]);

  const advanceTo = (newSt: StatusOsPrestador) => {
    setCurrentStatus(newSt);
    persistStatus(newSt);
  };

  const handleAcaminho = () => advanceTo('A caminho');

  const handlePlateConfirm = () => {
    const expected = atendimento.placa.substring(0, 3).toUpperCase();
    const entered = plateInput.trim().toUpperCase();
    if (entered.length < 3) { setPlateError('Digite as 3 primeiras letras da placa.'); return; }
    if (entered !== expected) { setPlateError(`Placa não confere. Esperado: ${expected[0]}** — tente novamente.`); return; }
    setPlateConfirmed(true);
    setPlateError('');
    advanceTo('Cheguei ao local');
    toast.success('Placa confirmada! Chegada registrada.');
  };

  const handleIniciarRemocao = () => advanceTo('Em remoção');
  const handleConcluir = () => advanceTo('Concluído');

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: [-23.55, -46.65], zoom: 13, zoomControl: true, attributionControl: true });
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

  const needsPlateConfirmation = currentStatus === 'A caminho' && !plateConfirmed;

  const openGoogleMaps = () => {
    const dest = atendimento.origemCoord || atendimento.destinoCoord;
    if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`, '_blank');
  };
  const openWaze = () => {
    const dest = atendimento.origemCoord || atendimento.destinoCoord;
    if (dest) window.open(`https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`, '_blank');
  };

  return (
    <MobileShell>
      {/* ===== GREEN HEADER ===== */}
      <div className="bg-[hsl(160,60%,38%)] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Truck className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-base font-bold uppercase tracking-wide">Acompanhamento</span>
        </div>
        <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Radio className="h-4 w-4 text-white/80" />
        </button>
      </div>

      {/* ===== PROGRESS STEPPER ===== */}
      <div className="flex items-center gap-0.5 px-1 bg-muted/50 py-1">
        {statusFlow.map((s, i) => (
          <div key={s} className={`flex-1 h-2 rounded-full transition-all ${i <= currentIndex ? 'bg-[hsl(200,80%,50%)]' : 'bg-border'}`} />
        ))}
      </div>

      {/* ===== MAP ===== */}
      <div className="h-[200px] relative border-b border-border">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        <button
          onClick={() => setLocationActive(!locationActive)}
          className={`absolute top-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border shadow-sm ${
            locationActive ? 'bg-success text-success-foreground border-success' : 'bg-card text-foreground'
          }`}
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {locationActive ? 'Ativa' : 'GPS'}
        </button>
      </div>

      {/* ===== BRANDING BAR ===== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[hsl(24,85%,55%)] flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-black uppercase tracking-wide text-foreground">{prestador?.nomeFantasia || 'OpGrid'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-[hsl(160,60%,38%)]/10 flex items-center justify-center">
            <Phone className="h-4 w-4 text-[hsl(160,60%,38%)]" />
          </button>
          <button className="w-8 h-8 rounded-full bg-[hsl(160,60%,38%)]/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-[hsl(160,60%,38%)]" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* ===== ENDEREÇOS ===== */}
        <div>
          <SectionHeader title="Endereços" />
          <Card className="overflow-hidden">
            <NumberedRow num={1} color="bg-[hsl(160,60%,38%)]" label="Partida do Prestador" value={prestador?.cidade ? `${prestador.cidade}, ${prestador.uf}` : 'Localização atual'} />
            <NumberedRow num={2} color="bg-[hsl(24,85%,55%)]" label="Origem do Atendimento" value={atendimento.origem || 'N/D'} />
            <NumberedRow num={3} color="bg-destructive" label="Destino do Atendimento" value={atendimento.destino || 'N/D'} />
            <NumberedRow num={4} color="bg-muted-foreground" label="Retorno do Prestador" value="A definir" />
            <div className="flex items-start gap-3 py-3 px-4 bg-[hsl(160,60%,38%)]/5">
              <div className="w-7 h-7 rounded-full bg-[hsl(160,60%,38%)] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">5</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Distância Total</p>
                <p className="text-sm font-bold text-foreground">{atendimento.kmPrevisto} km</p>
              </div>
            </div>
          </Card>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 text-xs h-10" onClick={openGoogleMaps}>
              <Navigation className="h-3.5 w-3.5 mr-1.5" />Google Maps
            </Button>
            <Button variant="outline" className="flex-1 text-xs h-10" onClick={openWaze}>
              <Navigation className="h-3.5 w-3.5 mr-1.5" />Waze
            </Button>
          </div>
        </div>

        {/* ===== VEÍCULO ===== */}
        <div>
          <SectionHeader title="Veículo" />
          <p className="text-sm font-semibold">{atendimento.veiculo} • {atendimento.placa}</p>
        </div>

        {/* ===== ATENDIMENTO ===== */}
        <div>
          <SectionHeader title="Atendimento" />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Status:</span>
            <Badge className="font-semibold text-xs bg-[hsl(24,85%,55%)] text-white hover:bg-[hsl(24,85%,50%)]">{currentStatus}</Badge>
          </div>
          <Card className="overflow-hidden">
            <IconRow icon={FileText} label="Protocolo" value={atendimento.protocolo} iconBg="bg-muted" />
            <IconRow icon={Truck} label="Serviço" value={<span className="font-black">{atendimento.tipoAtendimento}</span>} iconBg="bg-[hsl(160,60%,38%)]/10" />
            <IconRow icon={User} label="Solicitante" value={atendimento.clienteNome} iconBg="bg-muted" />
            <IconRow icon={Clock} label="Previsão de Chegada" value={
              <div className="flex items-center gap-2">
                <Input
                  value={etaInput}
                  onChange={e => setEtaInput(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-20 h-7 text-sm text-center"
                  type="number"
                />
                <span className="text-xs text-muted-foreground">minutos</span>
              </div>
            } iconBg="bg-muted" />
            <div className="flex items-start gap-3 py-3 px-4 bg-[hsl(160,60%,38%)]/5">
              <div className="w-9 h-9 rounded-xl bg-[hsl(160,60%,38%)]/10 flex items-center justify-center shrink-0">
                <Timer className="h-4 w-4 text-[hsl(160,60%,38%)]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Tempo de Atendimento</p>
                <ElapsedTimer startTime={acceptedAt.current} />
              </div>
            </div>
          </Card>
        </div>

        {/* ===== CHECKLIST VEICULAR ===== */}
        <div>
          <SectionHeader title="Checklist Veicular" />
          {(currentStatus === 'Cheguei ao local' || currentStatus === 'Em remoção' || currentStatus === 'Concluído') ? (
            showChecklist ? (
              <ChecklistExecucao
                tipo="coleta"
                protocolo={atendimento.protocolo}
                placa={atendimento.placa}
                prestador={prestador?.nomeFantasia || 'Prestador'}
                onVoltar={() => setShowChecklist(false)}
              />
            ) : (
              <div className="space-y-2">
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Itens verificados</span>
                      <Badge variant="outline" className="text-[10px]">
                        {checklist.filter(c => c.checked).length}/{checklist.length}
                      </Badge>
                    </div>
                    {checklist.map((item, i) => (
                      <label key={item.id} className="flex items-center gap-3 py-1.5 cursor-pointer">
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
                <Button
                  className="w-full h-12 text-sm font-bold bg-[hsl(24,85%,55%)] hover:bg-[hsl(24,85%,48%)] text-white"
                  onClick={() => setShowChecklist(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />Abrir Vistoria Completa (Avarias + Assinatura)
                </Button>
              </div>
            )
          ) : (
            <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-center">
              <p className="text-sm font-medium text-warning flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Disponível ao chegar no local
              </p>
            </div>
          )}
        </div>

        {/* ===== CHECKLIST ENTREGA ===== */}
        {(currentStatus === 'Em remoção' || currentStatus === 'Concluído') && (
          <div>
            <SectionHeader title="Checklist de Entrega" />
            {showChecklistEntrega ? (
              <ChecklistExecucao
                tipo="entrega"
                protocolo={atendimento.protocolo}
                placa={atendimento.placa}
                prestador={prestador?.nomeFantasia || 'Prestador'}
                onVoltar={() => setShowChecklistEntrega(false)}
              />
            ) : (
              <div className="space-y-2">
                <div className="bg-[hsl(200,80%,50%)]/5 border border-[hsl(200,80%,50%)]/20 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(200,80%,50%)]" />
                    Registre o estado do veículo na entrega ao destino
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Inclui vistoria, avarias na entrega e assinatura do recebedor.</p>
                </div>
                <Button
                  className="w-full h-12 text-sm font-bold bg-[hsl(200,80%,50%)] hover:bg-[hsl(200,80%,45%)] text-white"
                  onClick={() => setShowChecklistEntrega(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />Abrir Checklist de Entrega
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ===== ANEXOS DO ATENDIMENTO ===== */}
        <div>
          <SectionHeader title="Anexos do Atendimento" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return;
              Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') setFotos(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
              });
              e.target.value = '';
            }}
          />
          <div className="flex gap-2 mb-2">
            <Button
              className="flex-1 h-11 text-sm font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-1.5" />Tirar Foto
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 text-sm font-bold border-[hsl(160,60%,38%)] text-[hsl(160,60%,38%)]"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf';
                input.multiple = true;
                input.onchange = (ev) => {
                  const files = (ev.target as HTMLInputElement).files;
                  if (!files) return;
                  Array.from(files).forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') setFotos(prev => [...prev, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                  });
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-1.5" />Anexar Arquivo
            </Button>
          </div>
          {fotos.length === 0 ? (
            <div className="bg-muted/30 border border-dashed border-border rounded-lg px-4 py-6 text-center">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum anexo adicionado</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, idx) => (
                  <div key={idx} className="relative group">
                    <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-border" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setFotos(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">{fotos.length} anexo(s) adicionado(s)</p>
            </div>
          )}
        </div>

        {/* ===== COMPLEMENTO ===== */}
        <div>
          <SectionHeader title="Complemento" />
          <Textarea
            placeholder="Adicione observações sobre o atendimento..."
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            className="text-sm min-h-[80px] border-[hsl(160,60%,38%)]/30 focus:border-[hsl(160,60%,38%)]"
          />
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox />
              <span className="text-xs text-muted-foreground">Compartilhar com a assistência?</span>
            </label>
            <Button size="sm" className="text-xs bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)]">
              + Adicionar
            </Button>
          </div>
        </div>

        {/* ===== PROTOCOLO BAR ===== */}
        <div className="bg-[hsl(24,85%,55%)] rounded-lg px-4 py-3">
          <p className="text-white text-sm">
            <span className="font-bold">PROTOCOLO:</span> {atendimento.protocolo} — Gerado em: {formatDate(atendimento.dataHora)}
          </p>
        </div>

        {/* ===== AÇÕES ===== */}
        <div>
          <SectionHeader title="Ações" />
          <div className="space-y-2.5">
            {/* Plate confirmation gate */}
            {needsPlateConfirmation && (
              <Card className="border-2 border-warning/40 bg-warning/5 mb-3">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Confirme a placa do veículo</p>
                      <p className="text-xs text-muted-foreground">Digite as 3 primeiras letras da placa.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={plateInput}
                      onChange={e => { setPlateInput(e.target.value.toUpperCase().slice(0, 3)); setPlateError(''); }}
                      placeholder="Ex: ABC"
                      maxLength={3}
                      className="flex-1 text-center text-lg font-bold uppercase tracking-[0.3em] h-12"
                    />
                    <Button onClick={handlePlateConfirm} className="h-12 px-6" disabled={plateInput.length < 3}>
                      <Lock className="h-4 w-4 mr-1.5" />OK
                    </Button>
                  </div>
                  {plateError && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />{plateError}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Main action button */}
            {currentStatus === 'Aceito' && (
              <Button className="w-full h-14 text-base font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)]" onClick={handleAcaminho}>
                <CheckCircle2 className="h-5 w-5 mr-2" />Estou a caminho
              </Button>
            )}
            {currentStatus === 'A caminho' && !needsPlateConfirmation && (
              <Button className="w-full h-14 text-base font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)]" onClick={() => advanceTo('Cheguei ao local')}>
                <MapPin className="h-5 w-5 mr-2" />Cheguei ao local
              </Button>
            )}
            {currentStatus === 'Cheguei ao local' && (
              <Button className="w-full h-14 text-base font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)]" onClick={handleIniciarRemocao}>
                <Truck className="h-5 w-5 mr-2" />Iniciar remoção
              </Button>
            )}
            {currentStatus === 'Em remoção' && (
              <Button className="w-full h-14 text-base font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)]" onClick={handleConcluir}>
                <CheckCircle2 className="h-5 w-5 mr-2" />Concluir atendimento
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
              <>
                <Button variant="outline" className="w-full h-12 text-sm font-bold border-[hsl(200,80%,50%)] text-[hsl(200,80%,50%)]">
                  <Phone className="h-4 w-4 mr-2" />Solicitar Contato da Assistência
                </Button>
                <Button className="w-full h-12 text-sm font-bold bg-[hsl(340,75%,55%)] hover:bg-[hsl(340,75%,48%)] text-white">
                  <XCircle className="h-4 w-4 mr-2" />Cancelar Atendimento
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-2">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">Acesso via link • Sem app necessário</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50">Powered by OpGrid</p>
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
  const { tipo: paramTipo, id } = useParams<{ tipo: string; id: string }>();
  const location = useLocation();
  // Derive tipo from URL path if not in params (e.g. /prestador/oferta/:id)
  const tipo = paramTipo || (location.pathname.includes('/oferta/') ? 'oferta' : location.pathname.includes('/os/') ? 'os' : undefined);

  const despachos = useMemo(() => getDespachos(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const solicitacoes = useMemo(() => getSolicitacoes(), []);
  const prestadores = useMemo(() => getPrestadores(), []);

  if (tipo === 'oferta' && id) {
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
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
          <Shield className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary">100% via link • Sem app necessário</span>
        </div>
      </div>
    </MobileShell>
  );
}
