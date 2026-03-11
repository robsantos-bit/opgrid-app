import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAtendimentos } from '@/hooks/useSupabaseData';
import { Search, X, Eye, Loader2, Headphones } from 'lucide-react';

export default function OperacaoAtendimentos() {
  const { data: atendimentos = [], isLoading } = useAtendimentos();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    atendimentos.forEach((a: any) => { if (a.status) set.add(a.status); });
    return Array.from(set);
  }, [atendimentos]);

  const filtered = useMemo(() => {
    return atendimentos.filter((a: any) => {
      const q = search.toLowerCase();
      const clienteNome = a.solicitacoes?.cliente_nome || '';
      const prestadorNome = a.prestadores?.nome || '';
      const matchSearch = !q || clienteNome.toLowerCase().includes(q) || prestadorNome.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [atendimentos, search, filterStatus]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statusVariant = (status: string) => {
    const s = status?.toLowerCase();
    if (s?.includes('conclu') || s?.includes('fatura')) return 'success' as const;
    if (s?.includes('cancel')) return 'destructive' as const;
    if (s?.includes('aberto') || s?.includes('pend')) return 'warning' as const;
    return 'info' as const;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Atendimentos</h1>
          <p>Atendimentos registrados com dados de prestadores e solicitações</p>
        </div>
      </div>

      <Card><CardContent className="p-3"><div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou prestador..." className="pl-9 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
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
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">ID</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Solicitação</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Notas</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Criado em</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Finalizado em</TableHead>
            <TableHead className="text-right w-[60px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><Headphones className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum atendimento encontrado</p></div>
              </TableCell></TableRow>
            ) : filtered.map((a: any) => (
              <TableRow key={a.id} className="table-row-hover cursor-pointer" onClick={() => setSelected(a)}>
                <TableCell className="font-mono text-[11px] text-muted-foreground">{a.id?.substring(0, 8)}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-[11px] text-muted-foreground">{a.solicitacao_id?.substring(0, 8) || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px]">{a.solicitacoes?.cliente_nome || '—'}</TableCell>
                <TableCell className="text-[13px] font-medium">{a.prestadores?.nome || '—'}</TableCell>
                <TableCell><Badge variant={statusVariant(a.status)}>{a.status || '—'}</Badge></TableCell>
                <TableCell className="hidden lg:table-cell text-[12px] text-muted-foreground max-w-[150px] truncate">{a.notas || '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">{a.finalizado_at ? new Date(a.finalizado_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(a); }}>
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
                <SheetTitle>Atendimento</SheetTitle>
                <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  ['ID', selected.id],
                  ['Solicitação', selected.solicitacao_id || '—'],
                  ['Cliente', selected.solicitacoes?.cliente_nome || '—'],
                  ['Prestador', selected.prestadores?.nome || '—'],
                  ['Status', selected.status],
                  ['Notas', selected.notas || '—'],
                  ['Criado em', selected.created_at ? new Date(selected.created_at).toLocaleString('pt-BR') : '—'],
                  ['Finalizado em', selected.finalizado_at ? new Date(selected.finalizado_at).toLocaleString('pt-BR') : '—'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[60%] break-all">{val || '—'}</span>
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
