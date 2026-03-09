import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAtendimentos, getPrestadores, updateAtendimento } from '@/data/store';
import { DollarSign, FileDown, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Faturamento() {
  const [atendimentos, setAtendimentos] = useState(() => getAtendimentos());
  const prestadores = useMemo(() => getPrestadores(), []);
  const [filterPrestador, setFilterPrestador] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const faturaveis = useMemo(() => atendimentos.filter(a => {
    if (a.status === 'Cancelado' || a.status === 'Aberto') return false;
    return (filterPrestador === 'all' || a.prestadorId === filterPrestador)
      && (filterStatus === 'all' || a.status === filterStatus)
      && (!dataInicio || a.dataHora >= dataInicio)
      && (!dataFim || a.dataHora <= dataFim + 'T23:59:59');
  }), [atendimentos, filterPrestador, filterStatus, dataInicio, dataFim]);

  const totalFat = faturaveis.reduce((s, a) => s + a.valorTotal, 0);
  const totalFaturado = faturaveis.filter(a => a.status === 'Faturado').reduce((s, a) => s + a.valorTotal, 0);
  const totalPendente = faturaveis.filter(a => a.status === 'Concluído').reduce((s, a) => s + a.valorTotal, 0);
  const totalAndamento = faturaveis.filter(a => a.status === 'Em andamento').reduce((s, a) => s + a.valorTotal, 0);

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleFaturar = () => {
    if (selected.size === 0) { toast.error('Selecione atendimentos.'); return; }
    selected.forEach(id => { const a = atendimentos.find(x => x.id === id); if (a && a.status === 'Concluído') updateAtendimento({ ...a, status: 'Faturado', timeline: [...a.timeline, { data: new Date().toISOString(), descricao: 'Faturado' }] }); });
    setAtendimentos(getAtendimentos()); setSelected(new Set()); toast.success('Atendimentos faturados!');
  };

  const byPrestador = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; count: number }>();
    faturaveis.forEach(a => { const n = prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '-'; const e = map.get(a.prestadorId) || { nome: n, total: 0, count: 0 }; e.total += a.valorTotal; e.count++; map.set(a.prestadorId, e); });
    return Array.from(map.values());
  }, [faturaveis, prestadores]);

  const kpis = [
    { label: 'Total Faturável', value: totalFat, icon: DollarSign, bg: 'bg-success/10', color: 'text-success' },
    { label: 'Já Faturado', value: totalFaturado, icon: CheckCircle2, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Pendente', value: totalPendente, icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Em Andamento', value: totalAndamento, icon: AlertTriangle, bg: 'bg-info/10', color: 'text-info' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Faturamento</h1><p>Confira e fature atendimentos concluídos</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('CSV exportado (simulado).')}><FileDown className="h-4 w-4 mr-1.5" />Exportar</Button>
          <Button onClick={handleFaturar} disabled={selected.size === 0}><CheckCircle2 className="h-4 w-4 mr-1.5" />Faturar ({selected.size})</Button>
        </div>
      </div>

      <Card><CardContent className="p-3"><div className="filter-bar">
        <div className="space-y-1 min-w-[180px]"><Label className="text-xs">Prestador</Label><Select value={filterPrestador} onValueChange={setFilterPrestador}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{prestadores.map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1 min-w-[120px]"><Label className="text-xs">Status</Label><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Em andamento">Em andamento</SelectItem><SelectItem value="Concluído">Concluído</SelectItem><SelectItem value="Faturado">Faturado</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label className="text-xs">Início</Label><Input type="date" className="h-9" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Fim</Label><Input type="date" className="h-9" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
      </div></CardContent></Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-5 w-5" /></div>
            <div><p className="kpi-label">{k.label}</p><p className="kpi-value tabular-nums">R$ {k.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
          </div>
        ))}
      </div>

      {byPrestador.length > 0 && <Card><CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-[13px] font-medium text-muted-foreground">Resumo por Prestador</CardTitle></CardHeader><CardContent className="p-0">
        <Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="text-[11px] uppercase tracking-wider">Prestador</TableHead><TableHead className="text-[11px] uppercase tracking-wider text-center">Qtd</TableHead><TableHead className="text-[11px] uppercase tracking-wider text-right">Total</TableHead></TableRow></TableHeader>
        <TableBody>{byPrestador.map((b, i) => <TableRow key={i} className="table-row-hover"><TableCell className="font-medium text-[13px]">{b.nome}</TableCell><TableCell className="text-center text-[13px]">{b.count}</TableCell><TableCell className="text-right font-medium tabular-nums text-[13px]">R$ {b.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>)}</TableBody></Table>
      </CardContent></Card>}

      <Card><CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-[13px] font-medium text-muted-foreground">Atendimentos</CardTitle></CardHeader><CardContent className="p-0">
        <Table><TableHeader><TableRow className="hover:bg-transparent">
          <TableHead className="w-[40px]"></TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider">Protocolo</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider">Cliente</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell">Prestador</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider">Data</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider text-right">Valor</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {faturaveis.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Nenhum registro</TableCell></TableRow> : faturaveis.map(a => (
            <TableRow key={a.id} className="table-row-hover">
              <TableCell>{a.status === 'Concluído' && <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} className="h-4 w-4" />}</TableCell>
              <TableCell className="font-mono text-xs">{a.protocolo}</TableCell>
              <TableCell className="text-[13px]">{a.clienteNome}</TableCell>
              <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '-'}</TableCell>
              <TableCell className="text-[13px] text-muted-foreground">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell><Badge variant={a.status === 'Faturado' ? 'success' : a.status === 'Concluído' ? 'warning' : 'info'}>{a.status}</Badge></TableCell>
              <TableCell className="text-right font-medium tabular-nums text-[13px]">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
            </TableRow>
          ))}
          {faturaveis.length > 0 && <TableRow className="bg-muted/30"><TableCell colSpan={6} className="text-right font-semibold text-[13px]">Total</TableCell><TableCell className="text-right font-bold tabular-nums text-[13px]">R$ {totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>}
        </TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
