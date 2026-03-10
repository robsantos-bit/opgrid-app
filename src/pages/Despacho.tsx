import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDespachos, getSolicitacoes, getPrestadores } from '@/data/store';
import { Radar, Clock, CheckCircle2, XCircle, AlertTriangle, Send, Timer, Target } from 'lucide-react';
import { StatusDespacho } from '@/types';

const statusVariant: Record<StatusDespacho, 'default' | 'warning' | 'info' | 'success' | 'destructive' | 'secondary'> = {
  'Aguardando': 'warning',
  'Ofertas enviadas': 'info',
  'Aceito': 'success',
  'Sem prestador': 'destructive',
  'Expirado': 'secondary',
  'Cancelado': 'destructive',
};

export default function CentralDespacho() {
  const despachos = useMemo(() => getDespachos(), []);
  const solicitacoes = useMemo(() => getSolicitacoes(), []);
  const prestadores = useMemo(() => getPrestadores(), []);

  const getPrestadorNome = (id: string) => prestadores.find(p => p.id === id)?.nomeFantasia || '—';
  const getSolicitacao = (id: string) => solicitacoes.find(s => s.id === id);

  const kpis = [
    { label: 'Total Despachos', value: despachos.length, icon: Radar, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Aguardando', value: despachos.filter(d => d.status === 'Aguardando' || d.status === 'Ofertas enviadas').length, icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Aceitos', value: despachos.filter(d => d.status === 'Aceito').length, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success' },
    { label: 'Sem prestador', value: despachos.filter(d => d.status === 'Sem prestador' || d.status === 'Expirado').length, icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive' },
  ];

  const totalOfertas = despachos.reduce((s, d) => s + d.ofertas.length, 0);
  const ofertasAceitas = despachos.reduce((s, d) => s + d.ofertas.filter(o => o.status === 'Aceita').length, 0);
  const taxaConversao = totalOfertas > 0 ? Math.round((ofertasAceitas / totalOfertas) * 100) : 0;
  const tempoMedioAceite = despachos.filter(d => d.tempoMedioAceiteMinutos).reduce((s, d) => s + (d.tempoMedioAceiteMinutos || 0), 0) / Math.max(despachos.filter(d => d.tempoMedioAceiteMinutos).length, 1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1>Central de Despacho</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Torre de controle — despacho inteligente para os 2 prestadores mais próximos. Primeiro que aceita, ganha a OS.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-4.5 w-4.5" /></div>
            <div><p className="kpi-label">{k.label}</p><p className="kpi-value">{k.value}</p></div>
          </div>
        ))}
      </div>

      {/* Metrics bar */}
      <div className="flex flex-wrap gap-4 px-4 py-3 bg-card border rounded-xl text-[12px]">
        <div className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">Taxa de conversão:</span><span className="font-bold">{taxaConversao}%</span></div>
        <div className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5 text-info" /><span className="text-muted-foreground">Tempo médio aceite:</span><span className="font-bold">{tempoMedioAceite.toFixed(0)} min</span></div>
        <div className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5 text-warning" /><span className="text-muted-foreground">Ofertas enviadas:</span><span className="font-bold">{totalOfertas}</span></div>
      </div>

      {/* Despachos list */}
      <div className="space-y-3">
        {despachos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()).map(d => {
          const sol = getSolicitacao(d.solicitacaoId);
          return (
            <Card key={d.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-muted-foreground">{sol?.protocolo || d.id}</span>
                      <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">Rodada {d.rodadaAtual}</Badge>
                    </div>
                    <p className="text-[14px] font-semibold">{sol?.clienteNome || '—'}</p>
                    <p className="text-[12px] text-muted-foreground">{sol?.origemEndereco} → {sol?.destinoEndereco}</p>
                  </div>
                  {d.prestadorAceitoId && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Prestador aceito</p>
                      <p className="text-[13px] font-bold text-success">{getPrestadorNome(d.prestadorAceitoId)}</p>
                    </div>
                  )}
                </div>

                {/* Ofertas */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ofertas ({d.ofertas.length})</p>
                  {d.ofertas.map(o => (
                    <div key={o.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/20 text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          o.status === 'Aceita' ? 'bg-success' : o.status === 'Recusada' ? 'bg-destructive' : o.status === 'Pendente' ? 'bg-warning' : 'bg-muted-foreground/40'
                        }`} />
                        <span className="font-medium">{getPrestadorNome(o.prestadorId)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{o.distanciaEstimadaKm.toFixed(1)} km</span>
                        <span>{o.tempoEstimadoMinutos} min</span>
                        <Badge variant={o.status === 'Aceita' ? 'success' : o.status === 'Recusada' ? 'destructive' : o.status === 'Pendente' ? 'warning' : 'secondary'} className="text-[9px]">{o.status}</Badge>
                        {o.motivoRecusa && <span className="text-destructive text-[10px]">({o.motivoRecusa})</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {d.observacoes && (
                  <p className="text-[11px] text-muted-foreground mt-2 italic">{d.observacoes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
