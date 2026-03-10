import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSolicitacoes, getDespachos, getPrestadores } from '@/data/store';
import { MessageSquare, Clock, CheckCircle2, Send, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusSolicitacao } from '@/types';

const statusConfig: Record<StatusSolicitacao, { label: string; color: string; variant: 'default' | 'warning' | 'info' | 'success' | 'destructive' | 'secondary' }> = {
  'Recebida': { label: 'Recebida', color: 'bg-info', variant: 'info' },
  'Em cotação': { label: 'Em cotação', color: 'bg-warning', variant: 'warning' },
  'Aguardando aceite': { label: 'Aguardando aceite', color: 'bg-warning', variant: 'warning' },
  'Convertida em OS': { label: 'Convertida em OS', color: 'bg-primary', variant: 'default' },
  'Despachada': { label: 'Despachada', color: 'bg-info', variant: 'info' },
  'Em atendimento': { label: 'Em atendimento', color: 'bg-info', variant: 'info' },
  'Finalizada': { label: 'Finalizada', color: 'bg-success', variant: 'success' },
  'Cancelada': { label: 'Cancelada', color: 'bg-destructive', variant: 'destructive' },
};

const pipelineStages: StatusSolicitacao[] = ['Recebida', 'Em cotação', 'Aguardando aceite', 'Convertida em OS', 'Despachada', 'Em atendimento', 'Finalizada', 'Cancelada'];

export default function Solicitacoes() {
  const solicitacoes = useMemo(() => getSolicitacoes(), []);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelineStages.forEach(s => counts[s] = 0);
    solicitacoes.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return counts;
  }, [solicitacoes]);

  const kpis = [
    { label: 'Total', value: solicitacoes.length, icon: MessageSquare, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Aguardando', value: stageCounts['Aguardando aceite'] + stageCounts['Recebida'] + stageCounts['Em cotação'], icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Convertidas', value: solicitacoes.filter(s => s.atendimentoId).length, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success' },
    { label: 'Canceladas', value: stageCounts['Cancelada'], icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1>Solicitações</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Jornada do cliente via WhatsApp — da solicitação ao aceite do orçamento. Sem app, sem fricção.
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

      {/* Pipeline */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
        {pipelineStages.map(stage => (
          <div key={stage} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium shrink-0 ${
            stageCounts[stage] > 0 ? 'bg-card border-border' : 'bg-muted/20 border-transparent text-muted-foreground/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig[stage].color}`} />
            <span>{stage}</span>
            <span className="font-bold ml-1">{stageCounts[stage]}</span>
          </div>
        ))}
      </div>

      {/* Solicitações list */}
      <div className="space-y-2">
        {solicitacoes.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()).map(s => (
          <Card key={s.id} className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] text-muted-foreground">{s.protocolo}</span>
                    <Badge variant={statusConfig[s.status].variant}>{s.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{s.canal}</Badge>
                  </div>
                  <p className="text-[14px] font-semibold">{s.clienteNome}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{s.veiculoModelo} • {s.veiculoPlaca} • {s.motivo}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {s.origemEndereco} → {s.destinoEndereco}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Estimado</p>
                  <p className="text-[16px] font-bold">R$ {s.valorEstimado.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.distanciaEstimadaKm} km</p>
                  {s.statusProposta && (
                    <Badge variant={s.statusProposta === 'Aceita' ? 'success' : s.statusProposta === 'Recusada' ? 'destructive' : 'warning'} className="mt-1.5 text-[9px]">
                      {s.statusProposta}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Mini timeline */}
              <div className="mt-3 pt-3 border-t flex items-center gap-4 overflow-x-auto scrollbar-thin">
                {s.timeline.slice(-3).map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.tipo === 'cliente' ? 'bg-success' : t.tipo === 'operador' ? 'bg-info' : 'bg-muted-foreground/40'}`} />
                    <span>{t.descricao}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
