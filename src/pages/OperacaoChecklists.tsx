import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAtendimentos, getPrestadores } from '@/data/store';
import { CheckSquare, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function OperacaoChecklists() {
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const prestadores = useMemo(() => getPrestadores(), []);

  // Simulate checklist data from attended services
  const checklistsExecutados = useMemo(() =>
    atendimentos.filter(a => a.status === 'Concluído' || a.status === 'Faturado').map(a => ({
      id: a.id,
      protocolo: a.protocolo,
      prestador: prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '—',
      tipo: a.tipoAtendimento,
      data: new Date(a.dataHora).toLocaleDateString('pt-BR'),
      itensTotal: Math.floor(Math.random() * 8) + 6,
      itensOk: Math.floor(Math.random() * 6) + 5,
      status: Math.random() > 0.3 ? 'Completo' as const : 'Incompleto' as const,
    })),
  [atendimentos, prestadores]);

  const completos = checklistsExecutados.filter(c => c.status === 'Completo').length;
  const incompletos = checklistsExecutados.filter(c => c.status === 'Incompleto').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Checklists Executados</h1>
          <p>Visualize checklists preenchidos em campo pelos prestadores</p>
        </div>
        <Badge variant="outline" className="font-semibold">{checklistsExecutados.length} registros</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Completos</p><p className="kpi-value">{completos}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><AlertTriangle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Incompletos</p><p className="kpi-value">{incompletos}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Taxa de conclusão</p><p className="kpi-value">{checklistsExecutados.length > 0 ? Math.round((completos / checklistsExecutados.length) * 100) : 0}%</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Tipo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Itens</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Data</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {checklistsExecutados.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><CheckSquare className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum checklist executado</p><p className="empty-state-description">Checklists preenchidos em campo aparecerão aqui</p></div>
              </TableCell></TableRow>
            ) : checklistsExecutados.map(c => (
              <TableRow key={c.id} className="table-row-hover">
                <TableCell className="font-mono text-[11px] font-semibold">{c.protocolo}</TableCell>
                <TableCell className="text-[13px] font-semibold">{c.prestador}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{c.tipo}</TableCell>
                <TableCell className="text-[13px]"><span className="font-semibold">{c.itensOk}</span><span className="text-muted-foreground">/{c.itensTotal}</span></TableCell>
                <TableCell><Badge variant={c.status === 'Completo' ? 'success' : 'warning'} className="font-semibold">{c.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{c.data}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
