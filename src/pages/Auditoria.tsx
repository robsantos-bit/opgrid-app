import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuditLogs } from '@/data/store';
import { AuditLog } from '@/types';
import { Search, History, Shield, AlertTriangle, Info } from 'lucide-react';

const critVariant = (c: AuditLog['criticidade']) => {
  switch (c) {
    case 'critical': return 'destructive' as const;
    case 'warning': return 'warning' as const;
    default: return 'secondary' as const;
  }
};

export default function Auditoria() {
  const logs = useMemo(() => getAuditLogs(), []);
  const [search, setSearch] = useState('');
  const [filterModulo, setFilterModulo] = useState<string>('all');
  const [filterCriticidade, setFilterCriticidade] = useState<string>('all');

  const modulos = useMemo(() => [...new Set(logs.map(l => l.modulo))], [logs]);

  const filtered = useMemo(() => logs.filter(l => {
    const s = search.toLowerCase();
    return (!s || l.descricao.toLowerCase().includes(s) || l.usuario.toLowerCase().includes(s) || l.acao.toLowerCase().includes(s))
      && (filterModulo === 'all' || l.modulo === filterModulo)
      && (filterCriticidade === 'all' || l.criticidade === filterCriticidade);
  }), [logs, search, filterModulo, filterCriticidade]);

  const criticalCount = logs.filter(l => l.criticidade === 'critical').length;
  const warningCount = logs.filter(l => l.criticidade === 'warning').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Auditoria</h1>
          <p>Rastreabilidade completa de ações e alterações no sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><History className="h-5 w-5" /></div><div><p className="kpi-label">Total de Eventos</p><p className="kpi-value">{logs.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-destructive/10 text-destructive"><AlertTriangle className="h-5 w-5" /></div><div><p className="kpi-label">Ações Críticas</p><p className="kpi-value">{criticalCount}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><AlertTriangle className="h-5 w-5" /></div><div><p className="kpi-label">Alertas</p><p className="kpi-value">{warningCount}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Shield className="h-5 w-5" /></div><div><p className="kpi-label">Módulos</p><p className="kpi-value">{modulos.length}</p></div></div>
      </div>

      <Card><CardContent className="p-3"><div className="filter-bar">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Buscar evento, usuário ou ação..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={filterModulo} onValueChange={setFilterModulo}><SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Módulo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{modulos.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={filterCriticidade} onValueChange={setFilterCriticidade}><SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Criticidade" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Alerta</SelectItem><SelectItem value="critical">Crítico</SelectItem></SelectContent></Select>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider">Data</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Usuário</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Ação</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell">Módulo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-center">Nível</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Nenhum evento encontrado</TableCell></TableRow> : filtered.map(l => (
              <TableRow key={l.id} className="table-row-hover">
                <TableCell className="text-[13px] text-muted-foreground whitespace-nowrap">{new Date(l.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                <TableCell className="font-medium text-[13px]">{l.usuario}</TableCell>
                <TableCell className="text-[13px]">{l.acao}</TableCell>
                <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{l.modulo}</Badge></TableCell>
                <TableCell className="text-[13px] text-muted-foreground max-w-[300px] truncate">{l.descricao}</TableCell>
                <TableCell className="text-center"><Badge variant={critVariant(l.criticidade)} className="text-[10px]">{l.criticidade === 'critical' ? 'Crítico' : l.criticidade === 'warning' ? 'Alerta' : 'Info'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
