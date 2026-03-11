import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ClipboardList, Headphones, Activity, Loader2, TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';

export default function PainelDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const s = stats!;

  const kpis = [
    { label: 'Total de Prestadores', value: s.totalPrestadores, icon: Users, bg: 'bg-primary/10', color: 'text-primary', sub: `${s.prestadoresAtivos} ativos` },
    { label: 'Total de Solicitações', value: s.totalSolicitacoes, icon: ClipboardList, bg: 'bg-warning/10', color: 'text-warning', sub: `${s.solPendentes} pendentes` },
    { label: 'Total de Atendimentos', value: s.totalAtendimentos, icon: Headphones, bg: 'bg-success/10', color: 'text-success', sub: `${s.atdFinalizados} finalizados` },
    { label: 'Em Andamento', value: s.atendimentosEmAndamento, icon: Activity, bg: 'bg-info/10', color: 'text-info', sub: 'agora' },
  ];

  const taxaAtivos = s.totalPrestadores > 0 ? Math.round((s.prestadoresAtivos / s.totalPrestadores) * 100) : 0;
  const taxaFinalizacao = s.totalAtendimentos > 0 ? Math.round((s.atdFinalizados / s.totalAtendimentos) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1>Painel</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Olá, {user?.nome}. Visão geral da operação com dados reais.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{k.label}</p>
                <p className="text-2xl font-bold tabular-nums">{k.value}</p>
                <p className="text-[10px] text-muted-foreground">{k.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Health bars + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Saúde da Operação */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <CardTitle className="text-[13px] font-bold">Saúde da Operação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {[
              { label: 'Rede Ativa', value: taxaAtivos, detail: `${s.prestadoresAtivos} de ${s.totalPrestadores}` },
              { label: 'Taxa de Finalização', value: taxaFinalizacao, detail: `${s.atdFinalizados} de ${s.totalAtendimentos}` },
            ].map(h => (
              <div key={h.label} className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">{h.label}</span>
                  <span className="font-bold">{h.value}% <span className="font-normal text-muted-foreground text-[10px]">({h.detail})</span></span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${h.value >= 70 ? 'bg-success' : h.value >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${h.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Breakdown Solicitações */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-warning/10 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-warning" />
              </div>
              <CardTitle className="text-[13px] font-bold">Solicitações por Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            {[
              { label: 'Pendentes', value: s.solPendentes, icon: Clock, color: 'text-warning', bg: 'bg-warning' },
              { label: 'Em Andamento', value: s.solEmAndamento, icon: Activity, color: 'text-info', bg: 'bg-info' },
              { label: 'Concluídas', value: s.solConcluidas, icon: CheckCircle2, color: 'text-success', bg: 'bg-success' },
              { label: 'Canceladas', value: s.solCanceladas, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.bg}`} />
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  <span className="text-[12px] text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-[14px] font-bold tabular-nums">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Prestadores breakdown */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-success" />
            </div>
            <div>
              <CardTitle className="text-[13px] font-bold">Rede de Prestadores</CardTitle>
              <p className="text-[11px] text-muted-foreground">{s.totalPrestadores} cadastrados · {s.prestadoresAtivos} ativos · {s.prestadoresInativos} inativos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Guincho', value: s.prestGuincho, color: 'bg-primary' },
              { label: 'Plataforma', value: s.prestPlataforma, color: 'bg-info' },
              { label: 'Apoio', value: s.prestApoio, color: 'bg-accent' },
            ].map(t => (
              <div key={t.label} className="text-center p-3 rounded-lg bg-muted/30 border">
                <p className="text-[20px] font-bold tabular-nums">{t.value}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${t.color}`} />
                  <p className="text-[11px] text-muted-foreground font-medium">{t.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
