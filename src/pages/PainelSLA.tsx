import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { Loader2, Gauge, Clock, CheckCircle2, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const slaTargets = [
  { label: 'Tempo Médio de Aceite', target: '5 min', atual: '4.2 min', percentual: 84, status: 'ok' },
  { label: 'Tempo Médio de Chegada', target: '45 min', atual: '38 min', percentual: 84, status: 'ok' },
  { label: 'Taxa de Primeiro Acionamento', target: '90%', atual: '87%', percentual: 87, status: 'warning' },
  { label: 'NPS Prestador', target: '8.0', atual: '7.6', percentual: 76, status: 'warning' },
  { label: 'Taxa de Conclusão', target: '95%', atual: '92%', percentual: 92, status: 'ok' },
  { label: 'Disponibilidade Rede', target: '98%', atual: '96.5%', percentual: 96, status: 'ok' },
];

export default function PainelSLA() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const s = stats!;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>SLA e Performance</h1><p>Acompanhamento de acordos de nível de serviço</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'SLA Geral', value: '91%', icon: Gauge, bg: 'bg-success/10', color: 'text-success' },
          { label: 'Dentro do SLA', value: s.atdFinalizados, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success' },
          { label: 'Fora do SLA', value: Math.max(0, s.totalAtendimentos - s.atdFinalizados - s.atendimentosEmAndamento), icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive' },
          { label: 'Em Risco', value: s.atendimentosEmAndamento, icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div><p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{k.label}</p><p className="text-2xl font-bold tabular-nums">{k.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4" /> Metas de SLA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {slaTargets.map(sla => (
            <div key={sla.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{sla.label}</span>
                <div className="flex items-center gap-3 text-[12px]">
                  <span className="text-muted-foreground">Meta: {sla.target}</span>
                  <span className="font-semibold">Atual: {sla.atual}</span>
                  <Badge variant={sla.status === 'ok' ? 'success' : 'warning'} className="text-[10px]">{sla.percentual}%</Badge>
                </div>
              </div>
              <Progress value={sla.percentual} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
