import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { usePrestadores } from '@/hooks/useSupabaseData';
import { Search, X, Eye, Loader2, Users } from 'lucide-react';

export default function RedePrestadores() {
  const { data: prestadores = [], isLoading } = usePrestadores();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<any>(null);

  const filtered = useMemo(() => {
    return prestadores.filter((p: any) => {
      const s = search.toLowerCase();
      const matchSearch = !s || (p.nome || '').toLowerCase().includes(s);
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [prestadores, search, filterStatus]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ativo': case 'Ativo': return 'success' as const;
      case 'inativo': case 'Inativo': return 'secondary' as const;
      case 'bloqueado': case 'Bloqueado': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Prestadores</h1>
          <p>Rede de prestadores cadastrados no sistema</p>
        </div>
      </div>

      <Card><CardContent className="p-3"><div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." className="pl-9 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="bloqueado">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">CNPJ</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Telefone</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Tipo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Cadastro</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right w-[60px]">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum prestador encontrado</p></div>
              </TableCell></TableRow>
            ) : filtered.map((p: any) => (
              <TableRow key={p.id} className="table-row-hover cursor-pointer" onClick={() => setSelected(p)}>
                <TableCell className="font-medium text-[13px]">{p.nome || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground font-mono">{p.cnpj || '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{p.telefone || '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{p.tipo || '—'}</TableCell>
                <TableCell><Badge variant={statusBadge(p.status)}>{p.status || '—'}</Badge></TableCell>
                <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(p); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.nome}</SheetTitle>
                <Badge variant={statusBadge(selected.status)}>{selected.status}</Badge>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  ['CNPJ', selected.cnpj],
                  ['Telefone', selected.telefone],
                  ['Tipo', selected.tipo],
                  ['Status', selected.status],
                  ['Cadastrado em', selected.created_at ? new Date(selected.created_at).toLocaleString('pt-BR') : '—'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{val || '—'}</span>
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
