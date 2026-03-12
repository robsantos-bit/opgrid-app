import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { Loader2, TrendingUp, TrendingDown, Users, ClipboardList, Headphones, Clock, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PainelIndicadores() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const s = stats!;
  const taxaFinalizacao = s.totalAtendimentos > 0 ? Math.round((s.atdFinalizados / s.totalAtendimentos) * 100) : 0;
  const taxaAtivos = s.totalPrestadores > 0 ? Math.round((s.prestadoresAtivos / s.totalPrestadores) * 100) : 0;
  const taxaCancelamento = s.totalSolicitacoes > 0 ? Math.round((s.solCanceladas / s.totalSolicitacoes) * 100) : 0;

  const indicadores = [
    { label: 'Taxa de Finalização', value: `${taxaFinalizacao}%`, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', trend: taxaFinalizacao > 70 ? 'up' : 'down' },
    { label: 'Taxa de Cancelamento', value: `${taxaCancelamento}%`, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', trend: taxaCancelamento < 10 ? 'up' : 'down' },
    { label: 'Prestadores Ativos', value: `${taxaAtivos}%`, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: taxaAtivos > 60 ? 'up' : 'down' },
    { label: 'Solicitações Pendentes', value: s.solPendentes, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', trend: s.solPendentes < 5 ? 'up' : 'down' },
    { label: 'Em Andamento', value: s.solEmAndamento + s.atendimentosEmAndamento, icon: Headphones, color: 'text-info', bg: 'bg-info/10', trend: 'up' },
    { label: 'Total Solicitações', value: s.totalSolicitacoes, icon: ClipboardList, color: 'text-muted-foreground', bg: 'bg-muted', trend: 'up' },
  ];

  const breakdown = [
    { label: 'Guincho', value: s.prestGuincho },
    { label: 'Plataforma', value: s.prestPlataforma },
    { label: 'Apoio', value: s.prestApoio },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Indicadores</h1><p>Métricas-chave da operação em tempo real</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {indicadores.map(ind => (
          <Card key={ind.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${ind.bg} flex items-center justify-center shrink-0`}>
                <ind.icon className={`h-5 w-5 ${ind.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{ind.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold tabular-nums">{ind.value}</p>
                  {ind.trend === 'up' ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Distribuição por Tipo de Prestador</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {breakdown.map(b => (
              <div key={b.label} className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">{b.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${s.totalPrestadores > 0 ? (b.value / s.totalPrestadores) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums w-8 text-right">{b.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Funil de Solicitações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Pendentes', value: s.solPendentes, color: 'bg-warning' },
              { label: 'Em Andamento', value: s.solEmAndamento, color: 'bg-info' },
              { label: 'Concluídas', value: s.solConcluidas, color: 'bg-success' },
              { label: 'Canceladas', value: s.solCanceladas, color: 'bg-destructive' },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${f.color}`} />
                  <span className="text-[13px] text-muted-foreground">{f.label}</span>
                </div>
                <Badge variant="secondary" className="font-semibold">{f.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
