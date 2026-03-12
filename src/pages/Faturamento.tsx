import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtendimentos, usePrestadores } from '@/hooks/useSupabaseData';
import { DollarSign, FileDown, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export default function Faturamento() {
  const { data: rawAtendimentos = [], isLoading: loadA } = useAtendimentos();
  const { data: rawPrestadores = [], isLoading: loadP } = usePrestadores();
  const [filterPrestador, setFilterPrestador] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const atendimentos = useMemo(() => rawAtendimentos.map((a: any) => ({
    id: a.id,
    protocolo: a.protocolo || a.id?.slice(0, 8),
    clienteNome: a.solicitacoes?.cliente_nome || '—',
    prestadorId: a.prestador_id,
    prestadorNome: a.prestadores?.nome || '—',
    status: a.status,
    valorTotal: a.valor_total || 0,
    km: a.km || 0,
    kmPrevisto: a.km_previsto || 0,
    dataHora: a.created_at,
  })), [rawAtendimentos]);

  const filtered = useMemo(() => atendimentos.filter((a: any) =>
    (filterPrestador === 'all' || a.prestadorId === filterPrestador) &&
    (filterStatus === 'all' || a.status === filterStatus)
  ), [atendimentos, filterPrestador, filterStatus]);

  const totalFat = filtered.reduce((s: number, a: any) => s + (a.valorTotal || 0), 0);
  const totalFaturado = filtered.filter((a: any) => a.status === 'faturado' || a.status === 'Faturado').reduce((s: number, a: any) => s + (a.valorTotal || 0), 0);
  const totalPendente = filtered.filter((a: any) => a.status === 'finalizado' || a.status === 'concluido').reduce((s: number, a: any) => s + (a.valorTotal || 0), 0);

  const kpis = [
    { label: 'Total Faturável', value: fmt(totalFat), icon: DollarSign, bg: 'bg-success/10', color: 'text-success' },
    { label: 'Faturado', value: fmt(totalFaturado), icon: CheckCircle2, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Pendente', value: fmt(totalPendente), icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Atendimentos', value: String(filtered.length), icon: XCircle, bg: 'bg-info/10', color: 'text-info' },
  ];

  const isLoading = loadA || loadP;
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Faturamento</h1><p>Cockpit financeiro — conferência, divergências e aprovação de faturamento da rede</p></div>
        <Button variant="outline" onClick={() => toast.success('CSV exportado (simulado).')}><FileDown className="h-4 w-4 mr-1.5" />Exportar</Button>
      </div>

      <Card><CardContent className="p-3"><div className="filter-bar">
        <div className="space-y-1 min-w-[180px]"><Label className="text-xs">Prestador</Label>
          <Select value={filterPrestador} onValueChange={setFilterPrestador}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{rawPrestadores.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1 min-w-[120px]"><Label className="text-xs">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="em_andamento">Em andamento</SelectItem><SelectItem value="finalizado">Finalizado</SelectItem><SelectItem value="faturado">Faturado</SelectItem></SelectContent></Select>
        </div>
      </div></CardContent></Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-5 w-5" /></div>
            <div><p className="kpi-label">{k.label}</p><p className="kpi-value tabular-nums">{k.value}</p></div>
          </div>
        ))}
      </div>

      <Card><CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-[13px] font-medium text-muted-foreground">Atendimentos</CardTitle></CardHeader><CardContent className="p-0">
        <Table><TableHeader><TableRow className="hover:bg-transparent">
          <TableHead className="text-[11px] uppercase tracking-wider">Protocolo</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider">Cliente</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell">Prestador</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider">Data</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider text-right">Valor</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Nenhum registro</TableCell></TableRow> : filtered.map((a: any) => (
            <TableRow key={a.id} className="table-row-hover">
              <TableCell className="font-mono text-xs">{a.protocolo}</TableCell>
              <TableCell className="text-[13px]">{a.clienteNome}</TableCell>
              <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{a.prestadorNome}</TableCell>
              <TableCell className="text-[13px] text-muted-foreground">{fmtDate(a.dataHora)}</TableCell>
              <TableCell><Badge variant={a.status === 'faturado' ? 'success' : a.status === 'finalizado' ? 'warning' : 'info'} className="capitalize">{a.status?.replace('_', ' ')}</Badge></TableCell>
              <TableCell className="text-right font-medium tabular-nums text-[13px]">{fmt(a.valorTotal)}</TableCell>
            </TableRow>
          ))}
          {filtered.length > 0 && <TableRow className="bg-muted/30"><TableCell colSpan={5} className="text-right font-semibold text-[13px]">Total</TableCell><TableCell className="text-right font-bold tabular-nums text-[13px]">{fmt(totalFat)}</TableCell></TableRow>}
        </TableBody></Table>
      </CardContent></Card>
    </div>
  );
}