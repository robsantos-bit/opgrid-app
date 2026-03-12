import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAtendimentos, usePrestadores } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { BarChart3, FileDown, DollarSign, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

export default function FinanceiroRelatorios() {
  const { data: rawAtendimentos = [], isLoading: loadA } = useAtendimentos();
  const { data: rawPrestadores = [], isLoading: loadP } = usePrestadores();

  const totalReceita = rawAtendimentos.reduce((s: number, a: any) => s + (a.valor_total || 0), 0);
  const ticketMedio = rawAtendimentos.length > 0 ? totalReceita / rawAtendimentos.length : 0;
  const faturados = rawAtendimentos.filter((a: any) => a.status === 'faturado' || a.status === 'Faturado');
  const prestadoresAtivos = rawPrestadores.filter((p: any) => p.status === 'ativo' || p.status === 'Ativo').length;

  const relatorios = [
    { nome: 'Faturamento Mensal', desc: 'Resumo de faturamento por período com detalhamento por prestador', icon: DollarSign, tipo: 'Financeiro' },
    { nome: 'Performance da Rede', desc: 'Indicadores de SLA, tempo médio e avaliação por prestador', icon: TrendingUp, tipo: 'Operacional' },
    { nome: 'Prestadores Ativos', desc: 'Listagem de prestadores com volume de atendimentos e receita gerada', icon: Users, tipo: 'Rede' },
    { nome: 'Relatório Diário', desc: 'Resumo das operações do dia: solicitações, despachos e conclusões', icon: Calendar, tipo: 'Operacional' },
    { nome: 'Divergências e Glosas', desc: 'Análise de divergências de KM, tempo e valores com impacto financeiro', icon: BarChart3, tipo: 'Financeiro' },
  ];

  const isLoading = loadA || loadP;
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Relatórios Financeiros</h1>
          <p>Análises, extratos e relatórios financeiros detalhados da operação</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><DollarSign className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Receita total</p><p className="kpi-value tabular-nums">{fmt(totalReceita)}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><TrendingUp className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Ticket médio</p><p className="kpi-value tabular-nums">{fmt(ticketMedio)}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><BarChart3 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Faturados</p><p className="kpi-value">{faturados.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Users className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Prestadores ativos</p><p className="kpi-value">{prestadoresAtivos}</p></div></div>
      </div>

      <div className="grid gap-3">
        {relatorios.map(r => (
          <Card key={r.nome} className="card-hover">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-[14px]">{r.nome}</p>
                  <Badge variant="outline" className="text-[10px]">{r.tipo}</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground">{r.desc}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.success(`Relatório "${r.nome}" exportado (simulado).`)}>
                <FileDown className="h-3.5 w-3.5 mr-1.5" />Exportar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}