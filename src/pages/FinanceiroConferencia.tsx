import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtendimentos, usePrestadores } from '@/hooks/useSupabaseData';
import { Search, FileSearch, CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function FinanceiroConferencia() {
  const { data: rawAtendimentos = [], isLoading: loadA } = useAtendimentos();
  const { data: rawPrestadores = [], isLoading: loadP } = usePrestadores();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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

  const filtered = useMemo(() => atendimentos.filter((a: any) =>
    (!search || (a.protocolo || '').toLowerCase().includes(search.toLowerCase()) || (a.clienteNome || '').toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || a.status === filterStatus)
  ), [atendimentos, search, filterStatus]);

  const totalConferido = filtered.filter((a: any) => a.status === 'faturado').length;
  const totalPendente = filtered.filter((a: any) => a.status === 'finalizado' || a.status === 'concluido').length;

  const isLoading = loadA || loadP;
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Conferência</h1>
          <p>Confira valores, documentos e evidências antes da aprovação de faturamento</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pendentes</p><p className="kpi-value">{totalPendente}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Conferidos</p><p className="kpi-value">{totalConferido}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><FileSearch className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total</p><p className="kpi-value">{filtered.length}</p></div></div>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar protocolo ou cliente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="finalizado">Pendente</SelectItem><SelectItem value="faturado">Conferido</SelectItem></SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Valor</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><FileSearch className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum atendimento para conferência</p><p className="empty-state-description">Atendimentos concluídos aparecerão aqui para conferência</p></div>
              </TableCell></TableRow>
            ) : filtered.map((a: any) => (
              <TableRow key={a.id} className="table-row-hover">
                <TableCell className="font-mono text-[11px] font-semibold">{a.protocolo}</TableCell>
                <TableCell className="text-[13px] font-semibold">{a.clienteNome}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{a.prestadorNome}</TableCell>
                <TableCell><Badge variant={a.status === 'faturado' ? 'success' : 'warning'} className="font-semibold capitalize">{a.status === 'faturado' ? 'Conferido' : 'Pendente'}</Badge></TableCell>
                <TableCell className="text-right font-medium tabular-nums text-[13px]">{fmt(a.valorTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}