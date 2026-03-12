import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAtendimentos, usePrestadores } from '@/hooks/useSupabaseData';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function FinanceiroDivergencias() {
  const { data: rawAtendimentos = [], isLoading: loadA } = useAtendimentos();
  const { data: rawPrestadores = [], isLoading: loadP } = usePrestadores();

  const atendimentos = useMemo(() => rawAtendimentos.map((a: any) => ({
    id: a.id,
    protocolo: a.protocolo || a.id?.slice(0, 8),
    clienteNome: a.solicitacoes?.cliente_nome || '—',
    prestadorNome: a.prestadores?.nome || '—',
    status: a.status,
    valorTotal: a.valor_total || 0,
    km: a.km || 0,
    kmPrevisto: a.km_previsto || 0,
  })), [rawAtendimentos]);

  const divergencias = useMemo(() => atendimentos.filter((a: any) => a.km > 0 && a.kmPrevisto > 0 && a.km > a.kmPrevisto + 5).map((a: any) => ({
    ...a,
    excedente: a.km - a.kmPrevisto,
    percentual: a.kmPrevisto > 0 ? Math.round(((a.km - a.kmPrevisto) / a.kmPrevisto) * 100) : 0,
  })), [atendimentos]);

  const isLoading = loadA || loadP;
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

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
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><XCircle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">KM excedente total</p><p className="kpi-value">{divergencias.reduce((s: number, d: any) => s + d.excedente, 0)} km</p></div></div>
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
            ) : divergencias.map((d: any) => (
              <TableRow key={d.id} className="table-row-hover bg-destructive/[0.02]">
                <TableCell className="font-mono text-[11px] font-semibold">{d.protocolo}</TableCell>
                <TableCell className="text-[13px] font-semibold">{d.clienteNome}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{d.prestadorNome}</TableCell>
                <TableCell className="text-[13px] font-semibold text-destructive">{d.km} km</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{d.kmPrevisto} km</TableCell>
                <TableCell><Badge variant="destructive" className="font-semibold">+{d.excedente} km ({d.percentual}%)</Badge></TableCell>
                <TableCell className="text-right font-medium tabular-nums text-[13px]">{fmt(d.valorTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}