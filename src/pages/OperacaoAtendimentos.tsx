import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAtendimentos } from '@/hooks/useSupabaseData';
import { getDespachos } from '@/data/store';
import { ModoDespacho } from '@/types';
import { Search, X, Eye, Loader2, Headphones, Hand, Bot, Sparkles } from 'lucide-react';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
const fmtDateTime = (d: string) => new Date(d).toLocaleString('pt-BR');
const getSolicitacaoPlaca = (s?: any) => s?.placa || s?.veiculo_placa || '—';

const modoIcons: Record<ModoDespacho, typeof Hand> = { manual: Hand, automatico: Bot, assistido: Sparkles };
const modoLabels: Record<ModoDespacho, string> = { manual: 'Manual', automatico: 'Automático', assistido: 'Assistido' };
const modoVariants: Record<ModoDespacho, 'warning' | 'info' | 'success'> = { manual: 'warning', automatico: 'info', assistido: 'success' };

export default function OperacaoAtendimentos() {
  const { data: atendimentos = [], isLoading } = useAtendimentos();
  const despachos = useMemo(() => getDespachos(), []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<any>(null);

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
    switch (status) {
      case 'finalizado': return 'success' as const;
      case 'em_andamento': return 'info' as const;
      case 'cancelado': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { em_andamento: 'Em andamento', finalizado: 'Finalizado', cancelado: 'Cancelado' };
    return map[s] || s;
  };

  const emAndamento = atendimentos.filter((a: any) => a.status === 'em_andamento').length;
  const finalizados = atendimentos.filter((a: any) => a.status === 'finalizado').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Atendimentos</h1>
          <p>{atendimentos.length} registrados · <strong>{emAndamento}</strong> em andamento · <strong>{finalizados}</strong> finalizados</p>
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
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="h-9 px-3 flex items-center text-[11px] font-medium">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Placa</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Modo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Notas</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Criado</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Finalizado</TableHead>
            <TableHead className="text-right w-[60px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><Headphones className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum atendimento encontrado</p></div>
              </TableCell></TableRow>
            ) : filtered.map((a: any) => (
              <TableRow key={a.id} className="table-row-hover cursor-pointer" onClick={() => setSelected(a)}>
                <TableCell className="text-[13px] font-medium">{a.prestadores?.nome || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px]">{a.solicitacoes?.cliente_nome || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground font-mono">{getSolicitacaoPlaca(a.solicitacoes)}</TableCell>
                <TableCell><Badge variant={statusVariant(a.status)} className="text-[10px]">{statusLabel(a.status)}</Badge></TableCell>
                <TableCell className="hidden md:table-cell">
                  {(() => {
                    const desp = despachos.find((d: any) => d.atendimentoId === a.id);
                    if (!desp) return <span className="text-[10px] text-muted-foreground">—</span>;
                    const modo = desp.modoDespacho as ModoDespacho;
                    const MIcon = modoIcons[modo];
                    return <Badge variant={modoVariants[modo]} className="text-[10px] gap-1"><MIcon className="h-2.5 w-2.5" />{modoLabels[modo]}</Badge>;
                  })()}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[12px] text-muted-foreground max-w-[180px] truncate">{a.notas || '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">{a.created_at ? fmtDate(a.created_at) : '—'}</TableCell>
                <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">
                  {a.finalizado_at ? fmtDate(a.finalizado_at) : <span className="text-info text-[11px]">Em aberto</span>}
                </TableCell>
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
                <Badge variant={statusVariant(selected.status)}>{statusLabel(selected.status)}</Badge>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-[13px]">
                {[
                  ['Prestador', selected.prestadores?.nome],
                  ['Tel. Prestador', selected.prestadores?.telefone],
                  ['Cliente', selected.solicitacoes?.cliente_nome],
                  ['Tel. Cliente', selected.solicitacoes?.cliente_telefone],
                  ['Placa', getSolicitacaoPlaca(selected.solicitacoes)],
                  ['Notas', selected.notas],
                  ['Criado em', selected.created_at ? fmtDateTime(selected.created_at) : '—'],
                  ['Finalizado em', selected.finalizado_at ? fmtDateTime(selected.finalizado_at) : 'Em aberto'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[60%] break-words">{val || '—'}</span>
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
