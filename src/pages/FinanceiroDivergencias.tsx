import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAtendimentos, getPrestadores } from '@/data/store';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function FinanceiroDivergencias() {
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const prestadores = useMemo(() => getPrestadores(), []);

  const divergencias = useMemo(() => atendimentos.filter(a => a.km > a.kmPrevisto + 5).map(a => ({
    ...a,
    prestadorNome: prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '—',
    excedente: a.km - a.kmPrevisto,
    percentual: Math.round(((a.km - a.kmPrevisto) / a.kmPrevisto) * 100),
  })), [atendimentos, prestadores]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Divergências</h1>
          <p>Identifique e resolva divergências de KM, valores e tempo nos atendimentos</p>
        </div>
        <Badge variant={divergencias.length > 0 ? 'destructive' : 'success'} className="font-semibold">{divergencias.length} divergência(s)</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-destructive/10 text-destructive"><AlertCircle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Divergências ativas</p><p className="kpi-value">{divergencias.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><XCircle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">KM excedente total</p><p className="kpi-value">{divergencias.reduce((s, d) => s + d.excedente, 0)} km</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Sem divergência</p><p className="kpi-value">{atendimentos.length - divergencias.length}</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">KM Real</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">KM Previsto</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Excedente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Valor</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {divergencias.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><CheckCircle2 className="h-5 w-5 text-success" /></div><p className="empty-state-title">Nenhuma divergência encontrada</p><p className="empty-state-description">Todos os atendimentos estão dentro dos parâmetros esperados</p></div>
              </TableCell></TableRow>
            ) : divergencias.map(d => (
              <TableRow key={d.id} className="table-row-hover bg-destructive/[0.02]">
                <TableCell className="font-mono text-[11px] font-semibold">{d.protocolo}</TableCell>
                <TableCell className="text-[13px] font-semibold">{d.clienteNome}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{d.prestadorNome}</TableCell>
                <TableCell className="text-[13px] font-semibold text-destructive">{d.km} km</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{d.kmPrevisto} km</TableCell>
                <TableCell><Badge variant="destructive" className="font-semibold">+{d.excedente} km ({d.percentual}%)</Badge></TableCell>
                <TableCell className="text-right font-medium tabular-nums text-[13px]">R$ {d.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
