import { useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { playProviderSiren } from '@/lib/sirenSound';
import { useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StatusOsPrestador, ChecklistItem, CHECKLIST_PADRAO } from '@/types';
import { usePublicDispatchOfferById } from '@/hooks/useWhatsAppData';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import ChecklistExecucao from '@/components/ChecklistExecucao';
import OsView from '@/components/portal/OsView';
import {
  Truck, MapPin, Clock, Phone, MessageCircle, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Navigation, Camera, FileText, Timer, Shield, Zap, ArrowRight, User, Car, DollarSign,
  Send, ChevronRight, Radio, Eye, LocateFixed, Upload, Lock, KeyRound, Trash2
} from 'lucide-react';

const getSolicitacaoPlaca = (solicitacao: any) => solicitacao?.placa || 'N/D';
const getSolicitacaoVeiculo = (solicitacao: any) => solicitacao?.tipo_veiculo || solicitacao?.placa || 'N/D';
const getSolicitacaoValor = (solicitacao: any, oferta: any) => Number(oferta?.service_value ?? solicitacao?.valor ?? 0);

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
function OfertaView({ oferta }: { oferta: any }) {
  const [status, setStatus] = useState(oferta.status);
  const [showRecusa, setShowRecusa] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [sirenPlayed, setSirenPlayed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [atendimentoId, setAtendimentoId] = useState<string | null>(oferta.atendimento_id);

  const solicitacao = oferta.solicitacoes;
  const prestador = oferta.prestadores;

  const expiresAt = oferta.expires_at ? new Date(oferta.expires_at).getTime() : (new Date(oferta.sent_at).getTime() + 2 * 60 * 1000);
  const expired = status === 'pending' && expiresAt < Date.now();
  const totalMinutes = oferta.expires_at ? Math.max(1, Math.round((new Date(oferta.expires_at).getTime() - new Date(oferta.sent_at).getTime()) / 60000)) : 2;

  useEffect(() => {
    if (status === 'pending' && !expired && !sirenPlayed) {
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

  const handleAceitar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-respond', {
        body: { offer_id: oferta.id, action: 'accept' },
      });

      if (!error) {
        setStatus('accepted');
        setAtendimentoId(data.atendimento_id || oferta.atendimento_id);
        toast.success('Oferta aceita com sucesso!');
      } else {
        const message = (error as any)?.context?.error || (error as any)?.message || 'Erro ao aceitar oferta';
        toast.error(message);
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecusar = () => { setShowRecusa(true); };

  const confirmRecusa = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('dispatch-respond', {
        body: { offer_id: oferta.id, action: 'reject', rejection_reason: motivoRecusa || 'Outro' },
      });

      if (error) {
        const message = (error as any)?.context?.error || (error as any)?.message || 'Erro ao recusar oferta';
        toast.error(message);
        return;
      }

      setStatus('rejected');
      setShowRecusa(false);
      toast.success('Oferta recusada.');
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (expired && status === 'pending') {
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

  if (status === 'accepted') {
    const osId = atendimentoId;
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

  if (status === 'rejected') {
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
      <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Truck className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold uppercase tracking-wide">Novo Chamado</span>
        </div>
        <button className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
          <Radio className="h-4 w-4 text-primary-foreground/80" />
        </button>
      </div>

      {/* Countdown timer circle */}
      <CountdownCircle expiresAt={expiresAt} totalMinutes={totalMinutes} />

      {/* Info cards */}
      <div className="px-4 pb-4">
        <Card className="overflow-hidden">
          <InfoRow icon={Car} label="Veículo" value={getSolicitacaoVeiculo(solicitacao)} iconColor="text-muted-foreground" />
          <InfoRow icon={User} label="Cliente" value={solicitacao?.cliente_nome || 'Cliente'} iconColor="text-muted-foreground" />
          <InfoRow icon={MapPin} label="Origem" value={solicitacao?.origem_endereco || 'N/D'} iconColor="text-warning" />
          <InfoRow icon={MapPin} label="Destino" value={solicitacao?.destino_endereco || 'N/D'} iconColor="text-destructive" />
        </Card>
      </div>

      {/* Value + distance */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-3">
        <Card className="border-2 border-success/30 bg-success/5">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Valor</p>
            <p className="text-xl font-bold text-success">R$ {getSolicitacaoValor(solicitacao, oferta).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Distância</p>
            <p className="text-xl font-bold text-foreground">{oferta.estimated_distance_km || '—'} km</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="px-4 pb-6 space-y-2.5">
        {!showRecusa ? (
          <>
            <Button className="w-full h-14 text-base font-bold" onClick={handleAceitar} disabled={loading}>
              {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              <CheckCircle2 className="h-5 w-5 mr-2" />Aceitar chamado
            </Button>
            <Button variant="outline" className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleRecusar} disabled={loading}>
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
                <Button variant="destructive" className="flex-1" onClick={confirmRecusa} disabled={!motivoRecusa || loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Confirmar recusa
                </Button>
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


// OsView removed — will be rebuilt with Supabase data

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
  const tipo = paramTipo || (location.pathname.includes('/oferta/') ? 'oferta' : location.pathname.includes('/os/') ? 'os' : undefined);

  // Fetch offer from Supabase for /prestador/oferta/:id
  const { data: dbOffer, isLoading: loadingOffer } = usePublicDispatchOfferById(tipo === 'oferta' ? id : undefined);

  if (tipo === 'oferta' && id) {
    if (loadingOffer) {
      return (
        <MobileShell>
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        </MobileShell>
      );
    }

    if (!dbOffer) {
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

    return <OfertaView oferta={dbOffer} />;
  }

  if (tipo === 'os' && id) {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-lg font-bold mb-1">OS em andamento</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">O atendimento está em acompanhamento pela central. Para atualizações, entre em contato com a operação.</p>
        </div>
      </MobileShell>
    );
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
