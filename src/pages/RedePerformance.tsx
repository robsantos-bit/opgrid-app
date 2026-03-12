import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePrestadores, useAtendimentos } from '@/hooks/useSupabaseData';
import { TrendingUp, Star, Target, Award, Loader2 } from 'lucide-react';

export default function RedePerformance() {
  const { data: rawPrestadores = [], isLoading: loadP } = usePrestadores();
  const { data: rawAtendimentos = [], isLoading: loadA } = useAtendimentos();

  const prestadores = useMemo(() => rawPrestadores.filter((p: any) => p.status === 'ativo' || p.status === 'Ativo'), [rawPrestadores]);

  const ranking = useMemo(() => prestadores.map((p: any) => {
    const atds = rawAtendimentos.filter((a: any) => a.prestador_id === p.id);
    const concluidos = atds.filter((a: any) => a.status === 'finalizado' || a.status === 'Finalizado' || a.status === 'concluido');
    return {
      id: p.id,
      nome: p.nome,
      cidade: p.cidade,
      uf: p.uf,
      tipo: p.tipo,
      totalAtendimentos: atds.length,
      concluidos: concluidos.length,
      taxa: atds.length > 0 ? Math.round((concluidos.length / atds.length) * 100) : 0,
    };
  }).sort((a, b) => b.totalAtendimentos - a.totalAtendimentos), [prestadores, rawAtendimentos]);

  const isLoading = loadP || loadA;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const totalAtds = ranking.reduce((s, r) => s + r.totalAtendimentos, 0);
  const avgTaxa = ranking.length > 0 ? Math.round(ranking.reduce((s, r) => s + r.taxa, 0) / ranking.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Performance</h1>
          <p>Indicadores de desempenho e ranking da rede de prestadores</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><Target className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Taxa conclusão média</p><p className="kpi-value">{avgTaxa}%</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Star className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total atendimentos</p><p className="kpi-value">{totalAtds}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Award className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Top performer</p><p className="kpi-value text-[14px]">{ranking[0]?.nome || '—'}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><TrendingUp className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Prestadores avaliados</p><p className="kpi-value">{ranking.length}</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold w-[50px]">#</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Cidade/UF</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Atendimentos</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Concluídos</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Taxa</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {ranking.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><TrendingUp className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum prestador para avaliar</p><p className="empty-state-description">Dados de performance serão exibidos quando houver atendimentos</p></div>
              </TableCell></TableRow>
            ) : ranking.map((r, i) => (
              <TableRow key={r.id} className="table-row-hover">
                <TableCell className="font-bold text-[13px]">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</TableCell>
                <TableCell className="font-semibold text-[13px]">{r.nome}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{r.cidade || '—'}/{r.uf || '—'}</TableCell>
                <TableCell className="text-center text-[13px] font-medium tabular-nums">{r.totalAtendimentos}</TableCell>
                <TableCell className="text-center text-[13px] font-medium tabular-nums">{r.concluidos}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold text-[13px] ${r.taxa >= 80 ? 'text-success' : r.taxa >= 50 ? 'text-warning' : 'text-destructive'}`}>{r.taxa}%</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}