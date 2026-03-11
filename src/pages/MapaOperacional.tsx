import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getPrestadores, getAtendimentos } from '@/data/store';
import { Prestador, StatusRastreamento } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, X, Radio, Wifi, WifiOff, Eye, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<StatusRastreamento, string> = {
  'Online': '#22c55e',
  'A caminho': '#3b82f6',
  'Em atendimento': '#f59e0b',
  'Offline': '#6b7280',
  'Indisponível': '#9ca3af',
  'Sem sinal': '#ef4444',
};

const statusLabels: Record<StatusRastreamento, string> = {
  'Online': 'Disponível',
  'A caminho': 'Em deslocamento',
  'Em atendimento': 'Em atendimento',
  'Offline': 'Offline',
  'Indisponível': 'Indisponível',
  'Sem sinal': 'Sem sinal',
};

function createMarkerIcon(color: string, pulse = false) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative;">
      ${pulse ? `<div style="position:absolute;width:24px;height:24px;border-radius:50%;background:${color};opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;top:-4px;left:-4px;"></div>` : ''}
      <div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapaOperacional() {
  const navigate = useNavigate();
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const [selectedPrestador, setSelectedPrestador] = useState<Prestador | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUf, setFilterUf] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const withLocation = useMemo(() => {
    return prestadores.filter(p => {
      if (!p.localizacao) return false;
      if (filterStatus !== 'all' && p.localizacao.statusRastreamento !== filterStatus) return false;
      if (filterUf !== 'all' && p.uf !== filterUf) return false;
      return true;
    });
  }, [prestadores, filterStatus, filterUf]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    prestadores.forEach(p => {
      if (p.localizacao) {
        counts[p.localizacao.statusRastreamento] = (counts[p.localizacao.statusRastreamento] || 0) + 1;
      }
    });
    return counts;
  }, [prestadores]);

  const ufs = useMemo(() => [...new Set(prestadores.filter(p => p.localizacao).map(p => p.uf))].sort(), [prestadores]);

  const getPrestadorAtendimento = (prestadorId: string) => {
    return atendimentos.find(a => a.prestadorId === prestadorId && (a.status === 'Em andamento' || a.status === 'Aberto'));
  };

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    const map = L.map(mapContainerRef.current, {
      center: [-14.235, -51.9253],
      zoom: 4,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    withLocation.forEach(p => {
      if (!p.localizacao) return;
      const status = p.localizacao.statusRastreamento;
      const isActive = status === 'Online' || status === 'A caminho' || status === 'Em atendimento';
      
      const marker = L.marker([p.localizacao.lat, p.localizacao.lng], {
        icon: createMarkerIcon(statusColors[status], isActive),
      })
        .addTo(map)
        .bindPopup(`<div style="font-size:13px;"><p style="font-weight:bold;margin:0;">${p.nomeFantasia}</p><p style="color:#666;font-size:11px;margin:2px 0 0;">${p.cidade}/${p.uf}</p></div>`)
        .on('click', () => setSelectedPrestador(p));
      
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (withLocation.length > 0) {
      const bounds = L.latLngBounds(withLocation.map(p => [p.localizacao!.lat, p.localizacao!.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [withLocation]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1>Mapa Operacional</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Visibilidade geográfica da rede — monitore posição, status e disponibilidade em tempo real</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-3.5 w-3.5 mr-1.5" />{showFilters ? 'Ocultar' : 'Filtros'}
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {(['Online', 'A caminho', 'Em atendimento', 'Offline', 'Indisponível', 'Sem sinal'] as StatusRastreamento[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${
              filterStatus === s ? 'border-primary bg-primary/5 text-primary' : 'bg-card hover:bg-muted/30'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColors[s] }} />
            <span className="truncate">{s}</span>
            <span className="font-bold ml-auto">{statusCounts[s] || 0}</span>
          </button>
        ))}
      </div>

      {showFilters && (
        <Card><CardContent className="p-3 flex flex-wrap gap-3">
          <Select value={filterUf} onValueChange={setFilterUf}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas UFs</SelectItem>{ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
          </Select>
          {(filterStatus !== 'all' || filterUf !== 'all') && (
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => { setFilterStatus('all'); setFilterUf('all'); }}>
              <X className="h-3 w-3 mr-1" />Limpar filtros
            </Button>
          )}
        </CardContent></Card>
      )}

      {/* Map */}
      <Card className="overflow-hidden">
        <div className="h-[calc(100vh-320px)] min-h-[400px] relative">
          <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border rounded-lg px-3 py-2 z-[1000] text-[10px] space-y-1">
            <p className="font-semibold text-[11px] mb-1.5">Legenda</p>
            {(['Online', 'A caminho', 'Em atendimento', 'Offline'] as StatusRastreamento[]).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: statusColors[s] }} />
                <span>{statusLabels[s]}</span>
              </div>
            ))}
          </div>

          {/* Count overlay */}
          <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border rounded-lg px-3.5 py-2.5 z-[1000]">
            <div className="flex items-center gap-2 text-[12px]">
              <Radio className="h-3.5 w-3.5 text-green-500 animate-pulse" />
              <span className="font-bold">{withLocation.length}</span>
              <span className="text-muted-foreground">prestadores visíveis</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!selectedPrestador} onOpenChange={() => setSelectedPrestador(null)}>
        <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
          {selectedPrestador && (() => {
            const loc = selectedPrestador.localizacao;
            const atd = getPrestadorAtendimento(selectedPrestador.id);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-base">{selectedPrestador.nomeFantasia}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {/* Status card */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${statusColors[loc?.statusRastreamento || 'Offline']}20` }}>
                      <div className="w-4 h-4 rounded-full" style={{ background: statusColors[loc?.statusRastreamento || 'Offline'] }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold">{statusLabels[loc?.statusRastreamento || 'Offline']}</p>
                      <p className="text-[11px] text-muted-foreground">{loc ? timeSince(loc.ultimaAtualizacao) : 'Sem dados'}</p>
                    </div>
                    <Badge variant={loc?.compartilhamentoAtivo ? 'default' : 'secondary'} className="ml-auto text-[10px]">
                      {loc?.compartilhamentoAtivo ? <><Wifi className="h-3 w-3 mr-1" />Ativo</> : <><WifiOff className="h-3 w-3 mr-1" />Inativo</>}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-0">
                    {[
                      ['Cidade / UF', `${selectedPrestador.cidade}/${selectedPrestador.uf}`],
                      ['Telefone', selectedPrestador.telefone],
                      ['Serviços', selectedPrestador.tiposServico.join(', ')],
                      ['Disponibilidade', selectedPrestador.disponibilidade24h ? '24h' : 'Horário comercial'],
                      ['Score', `${selectedPrestador.scoreOperacional}/100`],
                      ['Precisão GPS', loc?.precisao || '—'],
                      ['Velocidade', loc?.velocidade !== undefined ? `${loc.velocidade} km/h` : '—'],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="detail-row">
                        <span className="detail-row-label">{label}</span>
                        <span className="detail-row-value">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Current attendance */}
                  {atd && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-700 mb-2">Atendimento Atual</p>
                        <div className="space-y-1 text-[13px]">
                          <div className="flex justify-between"><span className="text-muted-foreground">Protocolo</span><span className="font-mono font-bold text-[11px]">{atd.protocolo}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="font-medium">{atd.clienteNome}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{atd.tipoAtendimento}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{atd.status}</Badge></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1 text-xs" variant="outline" onClick={() => { setSelectedPrestador(null); navigate('/app/prestadores'); }}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />Ver Perfil Completo
                    </Button>
                    <Button className="flex-1 text-xs" variant="outline">
                      <Phone className="h-3.5 w-3.5 mr-1.5" />Ligar
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
