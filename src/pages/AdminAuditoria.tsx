import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuditLogs } from '@/data/store';
import { History, Search, Shield, User, Settings, FileText } from 'lucide-react';

const actionIcon = (action: string) => {
  if (action.includes('login') || action.includes('usuário')) return User;
  if (action.includes('config')) return Settings;
  if (action.includes('documento') || action.includes('template')) return FileText;
  return Shield;
};

export default function AdminAuditoria() {
  const logs = useMemo(() => getAuditLogs(), []);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const actions = useMemo(() => [...new Set(logs.map(l => l.acao))], [logs]);

  const filtered = useMemo(() => logs.filter(l =>
    (!search || l.descricao.toLowerCase().includes(search.toLowerCase()) || l.usuario.toLowerCase().includes(search.toLowerCase())) &&
    (filterAction === 'all' || l.acao === filterAction)
  ).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()), [logs, search, filterAction]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Auditoria</h1>
          <p>Histórico de ações, alterações e acessos ao sistema</p>
        </div>
        <Badge variant="outline" className="font-semibold">{logs.length} registros</Badge>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por descrição ou usuário..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas ações</SelectItem>{actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold w-[160px]">Data/Hora</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Usuário</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Ação</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Descrição</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><History className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum registro de auditoria</p><p className="empty-state-description">Ações do sistema serão registradas aqui automaticamente</p></div>
              </TableCell></TableRow>
            ) : filtered.map(l => {
              const Icon = actionIcon(l.acao);
              return (
                <TableRow key={l.id} className="table-row-hover">
                  <TableCell className="text-[12px] text-muted-foreground tabular-nums">{new Date(l.dataHora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell><span className="font-semibold text-[13px]">{l.usuario}</span></TableCell>
                  <TableCell><Badge variant="outline" className="font-semibold text-[11px] gap-1"><Icon className="h-3 w-3" />{l.acao}</Badge></TableCell>
                  <TableCell className="text-[13px] text-muted-foreground max-w-[300px] truncate">{l.descricao}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
