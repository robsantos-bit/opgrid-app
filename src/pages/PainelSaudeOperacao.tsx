import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { Loader2, Activity, Heart, Shield, Wifi, WifiOff, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function PainelSaudeOperacao() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const s = stats!;
  const taxaAtivos = s.totalPrestadores > 0 ? Math.round((s.prestadoresAtivos / s.totalPrestadores) * 100) : 0;
  const taxaConclusao = s.totalAtendimentos > 0 ? Math.round((s.atdFinalizados / s.totalAtendimentos) * 100) : 0;

  const dimensoes = [
    { label: 'Rede de Prestadores', score: taxaAtivos, icon: Users, detail: `${s.prestadoresAtivos} de ${s.totalPrestadores} ativos` },
    { label: 'Capacidade Operacional', score: s.atendimentosEmAndamento > 20 ? 60 : 85, icon: Activity, detail: `${s.atendimentosEmAndamento} atendimentos em curso` },
    { label: 'Taxa de Conclusão', score: taxaConclusao, icon: CheckCircle2, detail: `${s.atdFinalizados} finalizados de ${s.totalAtendimentos}` },
    { label: 'Fila de Pendências', score: s.solPendentes > 10 ? 50 : 90, icon: AlertTriangle, detail: `${s.solPendentes} solicitações pendentes` },
  ];

  const scoreGeral = dimensoes.length > 0 ? Math.round(dimensoes.reduce((sum, d) => sum + d.score, 0) / dimensoes.length) : 0;
  const statusGeral = scoreGeral >= 80 ? 'Saudável' : scoreGeral >= 60 ? 'Atenção' : 'Crítico';
  const statusVariant = scoreGeral >= 80 ? 'success' : scoreGeral >= 60 ? 'warning' : 'destructive';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Saúde da Operação</h1><p>Visão consolidada do estado operacional</p></div>
      </div>

      <Card className="border-2" style={{ borderColor: scoreGeral >= 80 ? 'hsl(var(--success))' : scoreGeral >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }}>
        <CardContent className="p-6 flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-${statusVariant}/10`}>
            <Heart className={`h-10 w-10 text-${statusVariant}`} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-4xl font-bold tabular-nums">{scoreGeral}%</p>
              <Badge variant={statusVariant as any} className="text-sm px-3 py-1">{statusGeral}</Badge>
            </div>
            <p className="text-[13px] text-muted-foreground">Score geral de saúde operacional baseado em {dimensoes.length} dimensões</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {dimensoes.map(dim => {
          const variant = dim.score >= 80 ? 'success' : dim.score >= 60 ? 'warning' : 'destructive';
          return (
            <Card key={dim.label}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <dim.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[13px] font-semibold">{dim.label}</span>
                  </div>
                  <Badge variant={variant as any} className="font-semibold">{dim.score}%</Badge>
                </div>
                <Progress value={dim.score} className="h-2.5" />
                <p className="text-[12px] text-muted-foreground">{dim.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
