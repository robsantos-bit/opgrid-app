import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePrestadores } from '@/hooks/useSupabaseData';
import { Shield, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export default function RedeHomologacao() {
  const { data: prestadores = [], isLoading } = usePrestadores();

  const ativos = prestadores.filter((p: any) => p.status === 'ativo' || p.status === 'Ativo');
  const inativos = prestadores.filter((p: any) => p.status !== 'ativo' && p.status !== 'Ativo');

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Homologação</h1>
          <p>Gerencie o processo de homologação e qualificação de prestadores</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Homologados</p><p className="kpi-value">{ativos.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pendentes</p><p className="kpi-value">{inativos.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><Shield className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total</p><p className="kpi-value">{prestadores.length}</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">CNPJ</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cidade/UF</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tipo</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {prestadores.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><Shield className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum prestador cadastrado</p><p className="empty-state-description">Cadastre prestadores para iniciar o processo de homologação</p></div>
              </TableCell></TableRow>
            ) : prestadores.map((p: any) => (
              <TableRow key={p.id} className="table-row-hover">
                <TableCell className="font-semibold text-[13px]">{p.nome}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground font-mono">{p.cnpj || '—'}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{p.cidade || '—'}/{p.uf || '—'}</TableCell>
                <TableCell><Badge variant={(p.status === 'ativo' || p.status === 'Ativo') ? 'success' : 'secondary'} className="font-semibold text-[11px] capitalize">{p.status}</Badge></TableCell>
                <TableCell className="text-[13px] text-muted-foreground capitalize">{p.tipo || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}