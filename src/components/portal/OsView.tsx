import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Truck, MapPin, Clock, Phone, MessageCircle, CheckCircle2, Loader2,
  Navigation, Camera, FileText, Upload, Car, User, AlertTriangle, XCircle
} from 'lucide-react';
import ChecklistExecucao from '@/components/ChecklistExecucao';

// Maps portal status → DB status
const STATUS_DB_MAP: Record<string, string> = {
  aceito: 'aceito_prestador',
  em_deslocamento: 'em_deslocamento',
  no_local: 'no_local',
  em_transito: 'em_transito',
  finalizado: 'Concluído',
  cancelado: 'Cancelado',
};

// ====== Types ======
type OsStatus = 'aceito' | 'em_deslocamento' | 'no_local' | 'em_transito' | 'finalizado' | 'cancelado';
type FormaPagamento = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Para faturar';
const FORMAS_PAGAMENTO: FormaPagamento[] = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Para faturar'];

const STATUS_STEPS: { key: OsStatus; label: string }[] = [
  { key: 'aceito', label: 'Aceito' },
  { key: 'em_deslocamento', label: 'A caminho' },
  { key: 'no_local', label: 'No local' },
  { key: 'em_transito', label: 'Em trânsito' },
  { key: 'finalizado', label: 'Finalizado' },
];

function stepIndex(status: OsStatus) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

// ====== Helpers ======
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ====== Elapsed Timer ======
function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState('0m 00s');
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => {
      const diff = Math.max(0, Date.now() - start);
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [startTime]);
  return <span className="text-lg font-bold text-[hsl(160,60%,38%)]">{elapsed}</span>;
}

// ====== Section Header ======
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b-2 border-[hsl(160,60%,38%)]/20 pb-1.5 mb-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{title}</h2>
    </div>
  );
}

// ====== Numbered Row ======
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

// ====== Icon Row ======
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

// ====== Stepper Bar ======
function StepperBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex gap-1 px-4 py-3">
      {STATUS_STEPS.map((step, i) => (
        <div
          key={step.key}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= currentStep ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

// ====== Map Component ======
function OsMap({ originLat, originLng, destLat, destLng }: { originLat?: number; originLng?: number; destLat?: number; destLng?: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView([-23.5, -46.5], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
    }).addTo(map);
    mapInstance.current = map;

    const bounds: L.LatLngExpression[] = [];
    if (originLat && originLng) {
      L.marker([originLat, originLng]).addTo(map).bindPopup('Origem');
      bounds.push([originLat, originLng]);
    }
    if (destLat && destLng) {
      L.marker([destLat, destLng]).addTo(map).bindPopup('Destino');
      bounds.push([destLat, destLng]);
    }
    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30], maxZoom: 13 });
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [originLat, originLng, destLat, destLng]);

  const hasCoords = (originLat && originLng) || (destLat && destLng);

  return (
    <div className="relative h-[200px] bg-muted rounded-lg overflow-hidden mx-4">
      {hasCoords ? (
        <div ref={mapRef} className="w-full h-full" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
          <MapPin className="h-6 w-6 mb-2" />
          <p>Preencha origem e/ou destino</p>
          <p className="text-xs">para visualizar no mapa</p>
        </div>
      )}
    </div>
  );
}

// ====== Main OsView ======
interface OsViewProps {
  atendimentoId: string;
}

export default function OsView({ atendimentoId }: OsViewProps) {
  const [atendimento, setAtendimento] = useState<any>(null);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [prestador, setPrestador] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [etaMinutos, setEtaMinutos] = useState('');
  const [complemento, setComplemento] = useState('');
  const [compartilhar, setCompartilhar] = useState(false);
  const [placaInput, setPlacaInput] = useState('');
  const [placaValidada, setPlacaValidada] = useState(false);
  const [placaError, setPlacaError] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | ''>('');
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [prestadorPartida, setPrestadorPartida] = useState<string>('Obtendo localização...');
  const [prestadorGeoLat, setPrestadorGeoLat] = useState<number | undefined>(undefined);
  const [prestadorGeoLng, setPrestadorGeoLng] = useState<number | undefined>(undefined);
  const retryTimeoutRef = useRef<number | null>(null);
  const offerIdRef = useRef<string | null>(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('offer_id') : null
  );

  const fetchData = useCallback(async (attempt = 0) => {
    let shouldRetry = false;

    try {
      const normalizeDetail = (payload: any) => {
        const offer = payload?.offer || null;
        const atendimentoPayload = payload?.atendimento || null;

        return {
          atendimento: atendimentoPayload || (offer?.atendimento_id ? { id: offer.atendimento_id, status: 'aceito' } : null),
          solicitacao:
            payload?.solicitacao ||
            atendimentoPayload?.solicitacoes ||
            offer?.solicitacoes ||
            null,
          prestador:
            payload?.prestador ||
            atendimentoPayload?.prestadores ||
            offer?.prestadores ||
            null,
        };
      };

      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      let resolvedAtendimento: any = null;
      let resolvedSolicitacao: any = null;
      let resolvedPrestador: any = null;

      const { data, error } = await supabase.functions.invoke('dispatch-offer-detail', {
        body: { atendimento_id: atendimentoId },
      });

      if (!error && data) {
        const normalized = normalizeDetail(data);
        resolvedAtendimento = normalized.atendimento;
        resolvedSolicitacao = normalized.solicitacao;
        resolvedPrestador = normalized.prestador;
      } else {
        console.warn('dispatch-offer-detail failed, trying fallbacks:', error);
      }

      if ((!resolvedSolicitacao || !resolvedPrestador) && offerIdRef.current) {
        try {
          const { data: offerDetail, error: offerError } = await supabase.functions.invoke('dispatch-offer-detail', {
            body: { offer_id: offerIdRef.current },
          });

          if (!offerError && offerDetail) {
            const normalizedOffer = normalizeDetail(offerDetail);
            resolvedAtendimento = resolvedAtendimento || normalizedOffer.atendimento || { id: atendimentoId, status: 'aceito' };
            resolvedSolicitacao = resolvedSolicitacao || normalizedOffer.solicitacao;
            resolvedPrestador = resolvedPrestador || normalizedOffer.prestador;
          }
        } catch (offerFallbackErr) {
          console.warn('Offer detail fallback failed:', offerFallbackErr);
        }
      }

      if (!resolvedAtendimento || !resolvedSolicitacao || !resolvedPrestador) {
        const { data: atData } = await supabase
          .from('atendimentos')
          .select('*, solicitacoes(*), prestadores(*)')
          .eq('id', atendimentoId)
          .maybeSingle();

        if (atData) {
          resolvedAtendimento = resolvedAtendimento || atData;
          resolvedSolicitacao = resolvedSolicitacao || atData.solicitacoes || null;
          resolvedPrestador = resolvedPrestador || atData.prestadores || null;
        }
      }

      if (!resolvedSolicitacao || !resolvedPrestador) {
        console.warn('OS still incomplete, trying dispatch_offers fallback');
        try {
          const offerFallback = offerIdRef.current
            ? await supabase
                .from('dispatch_offers')
                .select('id, atendimento_id, solicitacao_id, prestador_id, status, solicitacoes(id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, observacoes, created_at), prestadores(id, nome, telefone, latitude, longitude, cidade, uf, endereco)')
                .eq('id', offerIdRef.current)
                .maybeSingle()
            : await supabase
                .from('dispatch_offers')
                .select('id, atendimento_id, solicitacao_id, prestador_id, status, solicitacoes(id, cliente_nome, cliente_telefone, placa, tipo_veiculo, marca_veiculo, modelo_veiculo, origem_endereco, destino_endereco, origem_latitude, origem_longitude, destino_latitude, destino_longitude, valor, status, prioridade, protocolo, motivo, observacoes, created_at), prestadores(id, nome, telefone, latitude, longitude, cidade, uf, endereco)')
                .eq('atendimento_id', atendimentoId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

          const offerData = offerFallback.data;

          if (offerData) {
            resolvedAtendimento = resolvedAtendimento || {
              id: offerData.atendimento_id || atendimentoId,
              status: offerData.status || 'aceito',
              solicitacao_id: offerData.solicitacao_id,
              prestador_id: offerData.prestador_id,
            };
            resolvedSolicitacao = resolvedSolicitacao || offerData.solicitacoes || null;
            resolvedPrestador = resolvedPrestador || offerData.prestadores || null;
          }
        } catch (fallbackErr) {
          console.warn('Dispatch offers fallback failed:', fallbackErr);
        }
      }

      if (resolvedAtendimento) setAtendimento(resolvedAtendimento);
      if (resolvedSolicitacao) setSolicitacao(resolvedSolicitacao);
      if (resolvedPrestador) setPrestador(resolvedPrestador);

      shouldRetry = !!resolvedAtendimento && (!resolvedSolicitacao || !resolvedPrestador) && attempt < 4;

      if (shouldRetry) {
        retryTimeoutRef.current = window.setTimeout(() => {
          void fetchData(attempt + 1);
        }, 1200);
      }
    } catch (err) {
      console.error('Error fetching OS data:', err);
    } finally {
      if (!shouldRetry) {
        setLoading(false);
      }
    }
  }, [atendimentoId]);

  useEffect(() => {
    void fetchData();

    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchData]);

  // Reverse-map DB status to portal status
  const rawStatus = (atendimento?.status || 'aceito');
  const DB_TO_PORTAL: Record<string, OsStatus> = {
    aceito: 'aceito',
    aceito_prestador: 'aceito',
    aberto: 'aceito',
    solicitado: 'aceito',
    em_deslocamento: 'em_deslocamento',
    'Em andamento': 'em_deslocamento',
    no_local: 'no_local',
    em_transito: 'em_transito',
    finalizado: 'finalizado',
    'Concluído': 'finalizado',
    cancelado: 'cancelado',
    'Cancelado': 'cancelado',
  };
  const currentStatus: OsStatus = DB_TO_PORTAL[rawStatus] || rawStatus.toLowerCase().replace(/ /g, '_') as OsStatus;
  const step = stepIndex(currentStatus);


  const updateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const dbStatus = STATUS_DB_MAP[newStatus] || newStatus;
      const { error } = await supabase
        .from('atendimentos')
        .update({ status: dbStatus })
        .eq('id', atendimentoId);

      if (error) {
        toast.error('Erro ao atualizar status');
        return;
      }

      // Keep portal-side status in lowercase for UI stepper
      setAtendimento((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(`Status atualizado: ${newStatus}`);
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setActionLoading(false);
    }
  };

  // Parse coordinates from solicitacao
  const originLat = solicitacao?.origem_latitude;
  const originLng = solicitacao?.origem_longitude;
  const destLat = solicitacao?.destino_latitude;
  const destLng = solicitacao?.destino_longitude;
  const prestadorLat = prestador?.latitude;
  const prestadorLng = prestador?.longitude;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPrestadorGeoLat(pos.coords.latitude);
          setPrestadorGeoLng(pos.coords.longitude);
          setPrestadorPartida(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
          // Reverse geocode for readable address
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`, { headers: { 'User-Agent': 'OpGrid/1.0' } })
            .then(r => r.json())
            .then(d => { if (d.display_name) setPrestadorPartida(d.display_name); })
            .catch(() => {});
        },
        () => {
          // Fallback to registered address
          const addr = [prestador?.endereco, prestador?.cidade, prestador?.uf].filter(Boolean).join(', ');
          setPrestadorPartida(addr || (prestadorLat ? `${prestadorLat}, ${prestadorLng}` : 'N/D'));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const addr = [prestador?.endereco, prestador?.cidade, prestador?.uf].filter(Boolean).join(', ');
      setPrestadorPartida(addr || 'N/D');
    }
  }, [prestador, prestadorLat, prestadorLng]);

  // Retorno do prestador — endereço cadastrado
  const retornoPrestador = [prestador?.endereco, prestador?.cidade, prestador?.uf].filter(Boolean).join(', ') || 'Endereço não cadastrado';

  // Calculate total distance: prestador → origem → destino
  let distanciaTotal = '—';
  if (originLat && originLng && destLat && destLng) {
    const distOrigDest = haversineKm(originLat, originLng, destLat, destLng);
    const geoLat = prestadorGeoLat || prestadorLat;
    const geoLng = prestadorGeoLng || prestadorLng;
    if (geoLat && geoLng) {
      const distPrestOrigem = haversineKm(geoLat, geoLng, originLat, originLng);
      distanciaTotal = `${(distPrestOrigem + distOrigDest).toFixed(1)} km`;
    } else {
      distanciaTotal = `${distOrigDest.toFixed(1)} km`;
    }
  }

  const openMaps = (app: 'google' | 'waze') => {
    const lat = originLat || destLat;
    const lng = originLng || destLng;
    if (!lat || !lng) {
      toast.error('Coordenadas não disponíveis');
      return;
    }
    if (app === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!atendimento) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <FileText className="h-8 w-8 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold mb-1">Atendimento não encontrado</h2>
        <p className="text-sm text-muted-foreground">Este link pode estar inválido ou o atendimento não existe.</p>
      </div>
    );
  }

  const isChecklistAvailable = ['no_local', 'em_transito', 'finalizado'].includes(currentStatus);

  return (
    <div className="pb-8">
      {/* Header — teal bar */}
      <div className="bg-[hsl(24,85%,55%)] text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Truck className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-base font-bold uppercase tracking-wide">Acompanhamento</span>
        </div>
        <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Navigation className="h-4 w-4 text-white/80" />
        </button>
      </div>

      {/* Progress stepper */}
      <StepperBar currentStep={step} />

      {/* Map */}
      <OsMap originLat={originLat} originLng={originLng} destLat={destLat} destLng={destLng} />

      {/* Provider branding */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Truck className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-primary uppercase">{prestador?.nome || 'GUINCHO'}</p>
          <div className="flex gap-3 mt-1">
            {prestador?.telefone && (
              <>
                <a href={`tel:${prestador.telefone}`} className="text-muted-foreground"><Phone className="h-4 w-4" /></a>
                <a href={`https://wa.me/${prestador.telefone}`} target="_blank" rel="noopener" className="text-muted-foreground"><MessageCircle className="h-4 w-4" /></a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Addresses section */}
      <div className="px-4 pt-4">
        <SectionHeader title="Endereços" />
        <Card className="overflow-hidden">
          <NumberedRow num={1} color="bg-green-500" label="Partida do Prestador" value={prestadorPartida} />
          <NumberedRow num={2} color="bg-orange-500" label="Origem do Atendimento" value={solicitacao?.origem_endereco || (originLat ? `${originLat}, ${originLng}` : 'N/D')} />
          <NumberedRow num={3} color="bg-red-500" label="Destino do Atendimento" value={solicitacao?.destino_endereco || 'N/D'} />
          <NumberedRow num={4} color="bg-blue-500" label="Retorno do Prestador" value={retornoPrestador} />
          <NumberedRow num={5} color="bg-teal-500" label="Distância Total" value={distanciaTotal} />
        </Card>

        {/* Nav buttons */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button variant="outline" className="h-11 border-green-500/30 text-green-600 hover:bg-green-50" onClick={() => openMaps('google')}>
            <Navigation className="h-4 w-4 mr-1.5" />Google Maps
          </Button>
          <Button variant="outline" className="h-11 border-blue-500/30 text-blue-600 hover:bg-blue-50" onClick={() => openMaps('waze')}>
            <Navigation className="h-4 w-4 mr-1.5" />Waze
          </Button>
        </div>
      </div>

      {/* Vehicle */}
      <div className="px-4 pt-5">
        <SectionHeader title="Veículo" />
        <Card className="overflow-hidden">
          <IconRow icon={Car} label="Tipo de Veículo" value={solicitacao?.tipo_veiculo || 'N/D'} />
          <IconRow icon={Car} label="Marca" value={solicitacao?.marca_veiculo || 'N/D'} />
          <IconRow icon={Car} label="Modelo" value={solicitacao?.modelo_veiculo || 'N/D'} />
          <IconRow icon={FileText} label="Placa" value={solicitacao?.placa || 'N/D'} />
        </Card>
      </div>

      {/* Atendimento details */}
      <div className="px-4 pt-5">
        <SectionHeader title="Atendimento" />
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-muted-foreground">STATUS:</span>
          <Badge variant="success" className="text-xs capitalize">{currentStatus.replace(/_/g, ' ')}</Badge>
        </div>
        <Card className="overflow-hidden">
          <IconRow icon={FileText} label="Protocolo" value={solicitacao?.protocolo || atendimento?.protocolo || '—'} iconBg="bg-muted" />
          <IconRow icon={Truck} label="Serviço" value={solicitacao?.motivo || 'GUINCHO'} iconBg="bg-muted" />
          <IconRow icon={User} label="Solicitante" value={solicitacao?.cliente_nome || 'Cliente não encontrado'} iconBg="bg-muted" />
          <IconRow
            icon={Clock}
            label="Previsão de Chegada"
            value={
              <Input
                type="number"
                placeholder="Ex: 30"
                value={etaMinutos}
                onChange={(e) => setEtaMinutos(e.target.value)}
                className="w-20 h-8 text-sm inline-block"
              />
            }
            iconBg="bg-muted"
          />
          <div className="flex items-start gap-3 py-3 px-4 bg-[hsl(160,60%,38%)]/5">
            <div className="w-9 h-9 rounded-xl bg-[hsl(160,60%,38%)]/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-[hsl(160,60%,38%)]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Tempo de Atendimento</p>
              <ElapsedTimer startTime={atendimento?.created_at || new Date().toISOString()} />
            </div>
          </div>
        </Card>
      </div>

      {/* Checklist veicular */}
      <div className="px-4 pt-5">
        <SectionHeader title="Checklist Veicular" />
        {!isChecklistAvailable ? (
          <div className="rounded-lg border border-dashed border-warning bg-warning/5 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Disponível ao chegar no local</span>
            </div>
          </div>
        ) : !placaValidada ? (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Car className="h-4 w-4 text-primary" />
              <span>Confirme a placa do veículo para liberar o checklist</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Digite os <strong>3 primeiros caracteres</strong> da placa do veículo no local para confirmar sua chegada.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: ABC"
                maxLength={3}
                value={placaInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setPlacaInput(val);
                  setPlacaError('');
                }}
                className="w-28 h-10 text-center font-mono text-lg uppercase tracking-widest"
              />
              <Button
                onClick={() => {
                  const placaReal = (solicitacao?.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                  const input = placaInput.toUpperCase();
                  if (input.length < 3) {
                    setPlacaError('Digite 3 caracteres');
                    return;
                  }
                  if (placaReal.substring(0, 3) === input) {
                    setPlacaValidada(true);
                    setPlacaError('');
                    toast.success('Placa confirmada! Checklist liberado.');
                  } else {
                    setPlacaError('Placa não confere. Verifique o veículo.');
                  }
                }}
                className="h-10"
                disabled={placaInput.length < 3}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />Confirmar
              </Button>
            </div>
            {placaError && (
              <p className="text-xs text-destructive font-medium">{placaError}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Placa cadastrada: <span className="font-mono">{(solicitacao?.placa || 'N/D').substring(0, 3)}***</span>
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[hsl(160,60%,38%)] px-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Placa confirmada — Checklist liberado</span>
            </div>
            <ChecklistExecucao
              tipo={currentStatus === 'em_transito' || currentStatus === 'finalizado' ? 'entrega' : 'coleta'}
              protocolo={solicitacao?.protocolo || atendimento?.protocolo || '—'}
              placa={solicitacao?.placa || 'N/D'}
              prestador={prestador?.nome || 'Prestador'}
            />
          </div>
        )}
      </div>

      {/* Anexos */}
      <div className="px-4 pt-5">
        <SectionHeader title="Anexos do Atendimento" />
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-11 bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)] text-white">
            <Camera className="h-4 w-4 mr-1.5" />Tirar Foto
          </Button>
          <Button variant="outline" className="h-11 border-[hsl(160,60%,38%)]/30 text-[hsl(160,60%,38%)]">
            <Upload className="h-4 w-4 mr-1.5" />Anexar Arquivo
          </Button>
        </div>
        <div className="mt-3 rounded-lg bg-warning/5 border border-warning/20 p-3 text-center text-sm text-warning">
          Nenhum anexo adicionado
        </div>
      </div>

      {/* Complemento */}
      <div className="px-4 pt-5">
        <SectionHeader title="Complemento" />
        <Textarea
          placeholder="Adicione observações sobre o atendimento..."
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
          className="min-h-[80px]"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={compartilhar}
              onCheckedChange={(v) => setCompartilhar(!!v)}
              id="compartilhar"
            />
            <label htmlFor="compartilhar" className="text-xs text-muted-foreground cursor-pointer">
              Compartilhar com a assistência?
            </label>
          </div>
          <Button size="sm" className="bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)] text-white">
            + Adicionar
          </Button>
        </div>
      </div>

      {/* Protocol + Ações */}
      <div className="px-4 pt-5">
        <div className="rounded-lg bg-[hsl(24,85%,55%)]/10 border border-[hsl(24,85%,55%)]/30 p-4 mb-4">
          <p className="text-sm font-bold">
            <span className="text-[hsl(24,85%,55%)]">PROTOCOLO:</span> {solicitacao?.protocolo || '—'} - Gerado em:
          </p>
          <p className="text-xs text-muted-foreground">{atendimento?.created_at ? new Date(atendimento.created_at).toLocaleString('pt-BR') : '—'}</p>
        </div>

        <SectionHeader title="Ações" />
        <div className="space-y-2.5">
          {currentStatus === 'aceito' && (
            <Button
              className="w-full h-14 text-base font-bold bg-[hsl(24,85%,55%)] hover:bg-[hsl(24,85%,48%)] text-white"
              onClick={() => updateStatus('em_deslocamento')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              <CheckCircle2 className="h-5 w-5 mr-2" />Estou a caminho
            </Button>
          )}
          {currentStatus === 'em_deslocamento' && (
            <Button
              className="w-full h-14 text-base font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)] text-white"
              onClick={() => updateStatus('no_local')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              <MapPin className="h-5 w-5 mr-2" />Cheguei ao local
            </Button>
          )}
          {currentStatus === 'no_local' && (
            <Button
              className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => updateStatus('em_transito')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              <Truck className="h-5 w-5 mr-2" />Iniciar remoção
            </Button>
          )}
          {currentStatus === 'em_transito' && (
            <Button
              className="w-full h-14 text-base font-bold bg-[hsl(160,60%,38%)] hover:bg-[hsl(160,60%,32%)] text-white"
              onClick={() => updateStatus('finalizado')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              <CheckCircle2 className="h-5 w-5 mr-2" />Finalizar atendimento
            </Button>
          )}

          <Button variant="outline" className="w-full h-12 border-[hsl(24,85%,55%)]/30 text-[hsl(24,85%,55%)]">
            <Phone className="h-4 w-4 mr-2" />Solicitar Contato da Assistência
          </Button>

          {!['finalizado', 'cancelado'].includes(currentStatus) && (
            <Button
              variant="outline"
              className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={() => updateStatus('cancelado')}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />Cancelar Atendimento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
