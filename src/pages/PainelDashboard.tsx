import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ClipboardList, Headphones, Activity, Loader2 } from 'lucide-react';

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

  const kpis = [
    { label: 'Total de Prestadores', value: stats?.totalPrestadores ?? 0, icon: Users, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Total de Solicitações', value: stats?.totalSolicitacoes ?? 0, icon: ClipboardList, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Total de Atendimentos', value: stats?.totalAtendimentos ?? 0, icon: Headphones, bg: 'bg-success/10', color: 'text-success' },
    { label: 'Em Andamento', value: stats?.atendimentosEmAndamento ?? 0, icon: Activity, bg: 'bg-info/10', color: 'text-info' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1>Painel</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Olá, {user?.nome}. Visão geral da operação com dados reais.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{k.label}</p>
                <p className="text-2xl font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
