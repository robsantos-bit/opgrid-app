import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePrestadores } from '@/hooks/useSupabaseData';
import { Radio, Wifi, WifiOff, Clock, Moon, Loader2 } from 'lucide-react';

export default function RedeDisponibilidade() {
  const { data: rawPrestadores = [], isLoading } = usePrestadores();
  const prestadores = useMemo(() => rawPrestadores.filter((p: any) => p.status === 'ativo' || p.status === 'Ativo'), [rawPrestadores]);

  const total = prestadores.length;
  // Without real-time tracking data, show all as "available" for now
  const online = total;
  const emAtendimento = 0;
  const offline = 0;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Disponibilidade</h1>
          <p>Monitore a disponibilidade em tempo real dos prestadores da rede</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Wifi className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Ativos</p><p className="kpi-value">{online}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Em atendimento</p><p className="kpi-value">{emAtendimento}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-muted text-muted-foreground"><WifiOff className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Offline</p><p className="kpi-value">{offline}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Moon className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total na rede</p><p className="kpi-value">{rawPrestadores.length}</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cidade/UF</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tipo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {prestadores.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><Radio className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum prestador ativo</p><p className="empty-state-description">Prestadores ativos aparecerão aqui com seu status de disponibilidade</p></div>
              </TableCell></TableRow>
            ) : prestadores.map((p: any) => (
              <TableRow key={p.id} className="table-row-hover">
                <TableCell className="font-semibold text-[13px]">{p.nome}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{p.cidade || '—'}/{p.uf || '—'}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground capitalize">{p.tipo || '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <Badge variant="success" className="font-semibold text-[11px]">Ativo</Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}