import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAtendimentos, getPrestadores } from '@/data/store';
import { toast } from 'sonner';
import { BarChart3, FileDown, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';

export default function FinanceiroRelatorios() {
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const prestadores = useMemo(() => getPrestadores(), []);

  const totalReceita = atendimentos.reduce((s, a) => s + a.valorTotal, 0);
  const ticketMedio = atendimentos.length > 0 ? totalReceita / atendimentos.length : 0;
  const faturados = atendimentos.filter(a => a.status === 'Faturado');
  const prestadoresAtivos = prestadores.filter(p => p.status === 'Ativo').length;

  const relatorios = [
    { nome: 'Faturamento Mensal', desc: 'Resumo de faturamento por período com detalhamento por prestador', icon: DollarSign, tipo: 'Financeiro' },
    { nome: 'Performance da Rede', desc: 'Indicadores de SLA, tempo médio e avaliação por prestador', icon: TrendingUp, tipo: 'Operacional' },
    { nome: 'Prestadores Ativos', desc: 'Listagem de prestadores com volume de atendimentos e receita gerada', icon: Users, tipo: 'Rede' },
    { nome: 'Relatório Diário', desc: 'Resumo das operações do dia: solicitações, despachos e conclusões', icon: Calendar, tipo: 'Operacional' },
    { nome: 'Divergências e Glosas', desc: 'Análise de divergências de KM, tempo e valores com impacto financeiro', icon: BarChart3, tipo: 'Financeiro' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Relatórios Financeiros</h1>
          <p>Análises, extratos e relatórios financeiros detalhados da operação</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><DollarSign className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Receita total</p><p className="kpi-value tabular-nums">R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><TrendingUp className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Ticket médio</p><p className="kpi-value tabular-nums">R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p></div></div>
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
