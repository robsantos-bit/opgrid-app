import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores } from '@/data/store';
import { Shield, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function RedeHomologacao() {
  const prestadores = useMemo(() => getPrestadores(), []);

  const homologados = prestadores.filter(p => p.homologacao === 'Homologado');
  const pendentes = prestadores.filter(p => p.homologacao === 'Pendente');
  const criticos = prestadores.filter(p => p.homologacao === 'Crítico');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Homologação</h1>
          <p>Gerencie o processo de homologação e qualificação de prestadores</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Homologados</p><p className="kpi-value">{homologados.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pendentes</p><p className="kpi-value">{pendentes.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-destructive/10 text-destructive"><AlertTriangle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Críticos</p><p className="kpi-value">{criticos.length}</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cidade/UF</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Homologação</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Score</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Serviços</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {prestadores.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><Shield className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum prestador cadastrado</p><p className="empty-state-description">Cadastre prestadores para iniciar o processo de homologação</p></div>
              </TableCell></TableRow>
            ) : prestadores.map(p => (
              <TableRow key={p.id} className="table-row-hover">
                <TableCell className="font-semibold text-[13px]">{p.nomeFantasia}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{p.cidade}/{p.uf}</TableCell>
                <TableCell><Badge variant={p.status === 'Ativo' ? 'success' : p.status === 'Inativo' ? 'secondary' : 'destructive'} className="font-semibold text-[11px]">{p.status}</Badge></TableCell>
                <TableCell><Badge variant={p.homologacao === 'Homologado' ? 'success' : p.homologacao === 'Pendente' ? 'warning' : 'destructive'} className="font-semibold">{p.homologacao}</Badge></TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className={`font-bold text-[13px] ${p.scoreOperacional >= 80 ? 'text-success' : p.scoreOperacional >= 60 ? 'text-warning' : 'text-destructive'}`}>{p.scoreOperacional}</span>
                  <span className="text-[11px] text-muted-foreground">/100</span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground max-w-[200px] truncate">{p.tiposServico.join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
