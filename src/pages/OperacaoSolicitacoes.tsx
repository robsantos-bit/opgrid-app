import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSolicitacoes } from '@/hooks/useSupabaseData';
import { Search, X, Eye, Loader2, ClipboardList, MapPin, ArrowRight } from 'lucide-react';

export default function OperacaoSolicitacoes() {
  const { data: solicitacoes = [], isLoading } = useSolicitacoes();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  const filtered = useMemo(() => {
    return solicitacoes.filter((s: any) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (s.cliente_nome || '').toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [solicitacoes, search, filterStatus]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    solicitacoes.forEach((s: any) => { if (s.status) set.add(s.status); });
    return Array.from(set);
  }, [solicitacoes]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statusVariant = (status: string) => {
    const s = status?.toLowerCase();
    if (s?.includes('finaliz') || s?.includes('conclu')) return 'success' as const;
    if (s?.includes('cancel')) return 'destructive' as const;
    if (s?.includes('aguard') || s?.includes('pend')) return 'warning' as const;
    return 'info' as const;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Solicitações</h1>
          <p>Solicitações registradas no sistema</p>
        </div>
      </div>

      <Card><CardContent className="p-3"><div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por cliente..." className="pl-9 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Telefone</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Placa</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Origem → Destino</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Tipo Veículo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Prioridade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right hidden lg:table-cell">Valor</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Data</TableHead>
            <TableHead className="text-right w-[60px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><ClipboardList className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada</p></div>
              </TableCell></TableRow>
            ) : filtered.map((s: any) => (
              <TableRow key={s.id} className="table-row-hover cursor-pointer" onClick={() => setSelected(s)}>
                <TableCell className="font-medium text-[13px]">{s.cliente_nome || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{s.cliente_telefone || '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground font-mono">{s.placa || '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-1 max-w-[200px]">
                    <span className="truncate">{s.origem_endereco || '—'}</span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <span className="truncate">{s.destino_endereco || '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{s.tipo_veiculo || '—'}</TableCell>
                <TableCell><Badge variant={statusVariant(s.status)}>{s.status || '—'}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{s.prioridade || '—'}</TableCell>
                <TableCell className="text-right hidden lg:table-cell tabular-nums text-[13px] font-medium">{s.valor ? `R$ ${Number(s.valor).toFixed(2)}` : '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">{s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(s); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Solicitação</SheetTitle>
                <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  ['Cliente', selected.cliente_nome],
                  ['Telefone', selected.cliente_telefone],
                  ['Placa', selected.placa],
                  ['Tipo Veículo', selected.tipo_veiculo],
                  ['Origem', selected.origem_endereco],
                  ['Destino', selected.destino_endereco],
                  ['Status', selected.status],
                  ['Prioridade', selected.prioridade],
                  ['Valor', selected.valor ? `R$ ${Number(selected.valor).toFixed(2)}` : '—'],
                  ['Data', selected.created_at ? new Date(selected.created_at).toLocaleString('pt-BR') : '—'],
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
