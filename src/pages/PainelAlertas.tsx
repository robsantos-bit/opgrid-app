import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, CheckCircle2, Clock, XCircle, Eye, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Alerta {
  id: string;
  tipo: 'SLA' | 'Operacional' | 'Financeiro' | 'Sistema';
  severidade: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  mensagem: string;
  modulo: string;
  criadoEm: string;
  resolvido: boolean;
}

const MOCK_ALERTAS: Alerta[] = [
  { id: '1', tipo: 'SLA', severidade: 'Crítico', mensagem: 'SLA de atendimento ultrapassado em 3 solicitações', modulo: 'Operação', criadoEm: '2025-03-10T14:30:00', resolvido: false },
  { id: '2', tipo: 'Operacional', severidade: 'Alto', mensagem: '5 prestadores ficaram offline nos últimos 30 minutos', modulo: 'Rede', criadoEm: '2025-03-10T13:15:00', resolvido: false },
  { id: '3', tipo: 'Financeiro', severidade: 'Médio', mensagem: '12 atendimentos com divergência de valor pendentes', modulo: 'Financeiro', criadoEm: '2025-03-10T11:00:00', resolvido: false },
  { id: '4', tipo: 'Sistema', severidade: 'Baixo', mensagem: 'Atualização de templates disponível', modulo: 'Admin', criadoEm: '2025-03-10T09:00:00', resolvido: true },
  { id: '5', tipo: 'SLA', severidade: 'Alto', mensagem: 'Tempo médio de aceite acima de 8 minutos', modulo: 'Operação', criadoEm: '2025-03-09T16:45:00', resolvido: true },
  { id: '6', tipo: 'Operacional', severidade: 'Crítico', mensagem: 'Região Sul sem cobertura nas últimas 2 horas', modulo: 'Rede', criadoEm: '2025-03-09T14:00:00', resolvido: false },
];

const sevVariant = (s: string) => {
  switch (s) { case 'Crítico': return 'destructive' as const; case 'Alto': return 'warning' as const; case 'Médio': return 'info' as const; default: return 'secondary' as const; }
};

const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function PainelAlertas() {
  const [alertas, setAlertas] = useState(MOCK_ALERTAS);
  const [filterSev, setFilterSev] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewItem, setViewItem] = useState<Alerta | null>(null);

  const filtered = useMemo(() => alertas.filter(a =>
    (filterSev === 'all' || a.severidade === filterSev) &&
    (filterStatus === 'all' || (filterStatus === 'pendente' ? !a.resolvido : a.resolvido))
  ), [alertas, filterSev, filterStatus]);

  const criticos = alertas.filter(a => !a.resolvido && a.severidade === 'Crítico').length;
  const pendentes = alertas.filter(a => !a.resolvido).length;

  const handleResolver = (id: string) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, resolvido: true } : a));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Alertas</h1><p>Central de alertas e notificações da operação</p></div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-destructive/10 text-destructive"><AlertTriangle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Críticos</p><p className="kpi-value">{criticos}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Bell className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pendentes</p><p className="kpi-value">{pendentes}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Resolvidos</p><p className="kpi-value">{alertas.length - pendentes}</p></div></div>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <Select value={filterSev} onValueChange={setFilterSev}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Severidade" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="Crítico">Crítico</SelectItem><SelectItem value="Alto">Alto</SelectItem><SelectItem value="Médio">Médio</SelectItem><SelectItem value="Baixo">Baixo</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="resolvido">Resolvido</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Severidade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tipo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Mensagem</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Módulo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Data</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><Bell className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum alerta encontrado</p></div>
              </TableCell></TableRow>
            ) : filtered.map(a => (
              <TableRow key={a.id} className="table-row-hover">
                <TableCell><Badge variant={sevVariant(a.severidade)} className="font-semibold">{a.severidade}</Badge></TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{a.tipo}</TableCell>
                <TableCell className="text-[13px] font-medium max-w-[300px] truncate">{a.mensagem}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{a.modulo}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{fmtDate(a.criadoEm)}</TableCell>
                <TableCell><Badge variant={a.resolvido ? 'success' : 'warning'} className="font-semibold">{a.resolvido ? 'Resolvido' : 'Pendente'}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(a)}><Eye className="h-3.5 w-3.5" /></Button>
                    {!a.resolvido && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleResolver(a.id)}><CheckCircle2 className="h-3.5 w-3.5 text-success" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Alerta</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-[13px]">
              <div className="flex gap-2"><Badge variant={sevVariant(viewItem.severidade)}>{viewItem.severidade}</Badge><Badge variant="secondary">{viewItem.tipo}</Badge></div>
              <p className="font-medium">{viewItem.mensagem}</p>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div><span className="font-medium text-foreground">Módulo:</span> {viewItem.modulo}</div>
                <div><span className="font-medium text-foreground">Data:</span> {fmtDate(viewItem.criadoEm)}</div>
                <div><span className="font-medium text-foreground">Status:</span> {viewItem.resolvido ? 'Resolvido' : 'Pendente'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
