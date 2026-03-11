import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores, getAtendimentos } from '@/data/store';
import { TrendingUp, Star, Clock, Target, Award } from 'lucide-react';

export default function RedePerformance() {
  const prestadores = useMemo(() => getPrestadores().filter(p => p.status === 'Ativo'), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);

  const ranking = useMemo(() => prestadores.map(p => {
    const atds = atendimentos.filter(a => a.prestadorId === p.id);
    const concluidos = atds.filter(a => a.status === 'Concluído' || a.status === 'Faturado');
    const avgRating = concluidos.length > 0 ? Math.round((3.5 + Math.random() * 1.5) * 10) / 10 : 0;
    return {
      ...p,
      totalAtendimentos: atds.length,
      concluidos: concluidos.length,
      avaliacaoMedia: avgRating,
      score: p.scoreOperacional,
    };
  }).sort((a, b) => b.score - a.score), [prestadores, atendimentos]);

  const avgScore = ranking.length > 0 ? Math.round(ranking.reduce((s, r) => s + r.score, 0) / ranking.length) : 0;
  const avgAvaliacao = ranking.length > 0 ? (ranking.reduce((s, r) => s + r.avaliacaoMedia, 0) / ranking.length).toFixed(1) : '0';
  const top3 = ranking.slice(0, 3);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Performance</h1>
          <p>Indicadores de desempenho, avaliação e ranking da rede de prestadores</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><Target className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Score médio</p><p className="kpi-value">{avgScore}/100</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Star className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Avaliação média</p><p className="kpi-value">{avgAvaliacao}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Award className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Top performer</p><p className="kpi-value text-[14px]">{top3[0]?.nomeFantasia || '—'}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><TrendingUp className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Prestadores avaliados</p><p className="kpi-value">{ranking.length}</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold w-[50px]">#</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Cidade/UF</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Score</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Avaliação</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Atendimentos</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Concluídos</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {ranking.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><TrendingUp className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum prestador para avaliar</p><p className="empty-state-description">Dados de performance serão exibidos quando houver atendimentos</p></div>
              </TableCell></TableRow>
            ) : ranking.map((r, i) => (
              <TableRow key={r.id} className="table-row-hover">
                <TableCell className="font-bold text-[13px]">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</TableCell>
                <TableCell className="font-semibold text-[13px]">{r.nomeFantasia}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{r.cidade}/{r.uf}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold text-[13px] ${r.score >= 80 ? 'text-success' : r.score >= 60 ? 'text-warning' : 'text-destructive'}`}>{r.score}</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1"><Star className="h-3 w-3 text-warning fill-warning" /><span className="font-semibold text-[13px]">{r.avaliacaoMedia.toFixed(1)}</span></div>
                </TableCell>
                <TableCell className="text-center text-[13px] font-medium tabular-nums">{r.totalAtendimentos}</TableCell>
                <TableCell className="text-center text-[13px] font-medium tabular-nums">{r.concluidos}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
