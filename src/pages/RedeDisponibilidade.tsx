import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores } from '@/data/store';
import { Radio, Wifi, WifiOff, Clock, Sun, Moon } from 'lucide-react';

export default function RedeDisponibilidade() {
  const prestadores = useMemo(() => getPrestadores().filter(p => p.status === 'Ativo'), []);

  const online = prestadores.filter(p => p.localizacao?.statusRastreamento === 'Online').length;
  const emAtendimento = prestadores.filter(p => p.localizacao?.statusRastreamento === 'Em atendimento').length;
  const offline = prestadores.filter(p => !p.localizacao || p.localizacao.statusRastreamento === 'Offline' || p.localizacao.statusRastreamento === 'Indisponível').length;
  const h24 = prestadores.filter(p => p.disponibilidade24h).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Disponibilidade</h1>
          <p>Monitore a disponibilidade em tempo real dos prestadores da rede</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Wifi className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Online</p><p className="kpi-value">{online}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Em atendimento</p><p className="kpi-value">{emAtendimento}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-muted text-muted-foreground"><WifiOff className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Offline</p><p className="kpi-value">{offline}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Moon className="h-4.5 w-4.5" /></div><div><p className="kpi-label">24h disponível</p><p className="kpi-value">{h24}</p></div></div>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cidade/UF</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Disponibilidade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Última atualização</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {prestadores.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><Radio className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum prestador ativo</p><p className="empty-state-description">Prestadores ativos aparecerão aqui com seu status de disponibilidade</p></div>
              </TableCell></TableRow>
            ) : prestadores.map(p => {
              const status = p.localizacao?.statusRastreamento || 'Offline';
              return (
                <TableRow key={p.id} className="table-row-hover">
                  <TableCell className="font-semibold text-[13px]">{p.nomeFantasia}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{p.cidade}/{p.uf}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: status === 'Online' ? '#22c55e' : status === 'Em atendimento' ? '#f59e0b' : status === 'A caminho' ? '#3b82f6' : '#6b7280' }} />
                      <Badge variant={status === 'Online' ? 'success' : status === 'Em atendimento' ? 'warning' : 'secondary'} className="font-semibold text-[11px]">{status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {p.disponibilidade24h ? <><Sun className="h-3 w-3 text-warning" /><Moon className="h-3 w-3 text-info" /><span className="text-[11px] font-medium">24h</span></> : <><Sun className="h-3 w-3 text-warning" /><span className="text-[11px] text-muted-foreground">Comercial</span></>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{p.localizacao ? new Date(p.localizacao.ultimaAtualizacao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
