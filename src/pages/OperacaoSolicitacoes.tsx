import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSolicitacoes } from '@/hooks/useSupabaseData';
import { Search, X, Eye, Loader2, ClipboardList, ArrowRight } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
const fmtDateTime = (d: string) => new Date(d).toLocaleString('pt-BR');
const PAGE_SIZE = 20;

export default function OperacaoSolicitacoes() {
  const { data: solicitacoes = [], isLoading } = useSolicitacoes();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrioridade, setFilterPrioridade] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    setPage(0);
    return solicitacoes.filter((s: any) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (s.cliente_nome || '').toLowerCase().includes(q) || (s.placa || '').toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      const matchPrio = filterPrioridade === 'all' || s.prioridade === filterPrioridade;
      return matchSearch && matchStatus && matchPrio;
    });
  }, [solicitacoes, search, filterStatus, filterPrioridade]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'concluida': return 'success' as const;
      case 'cancelada': return 'destructive' as const;
      case 'pendente': return 'warning' as const;
      case 'em_andamento': return 'info' as const;
      default: return 'secondary' as const;
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' };
    return map[s] || s;
  };

  const prioridadeBadge = (p: string) => {
    switch (p) {
      case 'urgente': return 'destructive' as const;
      case 'alta': return 'warning' as const;
      default: return 'outline' as const;
    }
  };

  const valorTotal = filtered.reduce((sum: number, s: any) => sum + (Number(s.valor) || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Solicitações</h1>
          <p>{solicitacoes.length} registradas · Valor total filtrado: <strong>{fmt(valorTotal)}</strong></p>
        </div>
      </div>

      <Card><CardContent className="p-3"><div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou placa..." className="pl-9 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="h-9 px-3 flex items-center text-[11px] font-medium">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Placa</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Origem → Destino</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Prioridade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right hidden lg:table-cell">Valor</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Data</TableHead>
            <TableHead className="text-right w-[60px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><ClipboardList className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada</p></div>
              </TableCell></TableRow>
            ) : paged.map((s: any) => (
              <TableRow key={s.id} className="table-row-hover cursor-pointer" onClick={() => setSelected(s)}>
                <TableCell>
                  <div>
                    <p className="font-medium text-[13px]">{s.cliente_nome || '—'}</p>
                    <p className="text-[11px] text-muted-foreground md:hidden">{s.placa || ''}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground font-mono">{s.placa || '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1 max-w-[220px]">
                    <span className="truncate">{s.origem_endereco || '—'}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    <span className="truncate">{s.destino_endereco || '—'}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant={statusVariant(s.status)} className="text-[10px]">{statusLabel(s.status)}</Badge></TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={prioridadeBadge(s.prioridade)} className="text-[10px] capitalize">{s.prioridade || '—'}</Badge>
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell tabular-nums text-[13px] font-medium">
                  {s.valor ? fmt(Number(s.valor)) : '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{s.created_at ? fmtDate(s.created_at) : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(s); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-[11px] text-muted-foreground">Página {page + 1} de {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </CardContent></Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Solicitação</SheetTitle>
                <div className="flex gap-2">
                  <Badge variant={statusVariant(selected.status)}>{statusLabel(selected.status)}</Badge>
                  <Badge variant={prioridadeBadge(selected.prioridade)} className="capitalize">{selected.prioridade}</Badge>
                </div>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  ['Cliente', selected.cliente_nome],
                  ['Telefone', selected.cliente_telefone],
                  ['Placa', selected.placa],
                  ['Tipo Veículo', selected.tipo_veiculo],
                  ['Origem', selected.origem_endereco],
                  ['Destino', selected.destino_endereco],
                  ['Valor', selected.valor ? fmt(Number(selected.valor)) : '—'],
                  ['Data', selected.created_at ? fmtDateTime(selected.created_at) : '—'],
                  ['Atualização', selected.updated_at ? fmtDateTime(selected.updated_at) : '—'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[60%]">{val || '—'}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
