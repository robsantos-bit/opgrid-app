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
import { Atendimento } from '@/types';
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

  const faturaveis = useMemo(() => {
    return atendimentos.filter(a => {
      if (a.status === 'Cancelado' || a.status === 'Aberto') return false;
      const matchPrestador = filterPrestador === 'all' || a.prestadorId === filterPrestador;
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      let matchData = true;
      if (dataInicio) matchData = matchData && a.dataHora >= dataInicio;
      if (dataFim) matchData = matchData && a.dataHora <= dataFim + 'T23:59:59';
      return matchPrestador && matchStatus && matchData;
    });
  }, [atendimentos, filterPrestador, filterStatus, dataInicio, dataFim]);

  const totalFaturamento = faturaveis.reduce((s, a) => s + a.valorTotal, 0);
  const totalFaturado = faturaveis.filter(a => a.status === 'Faturado').reduce((s, a) => s + a.valorTotal, 0);
  const totalPendente = faturaveis.filter(a => a.status === 'Concluído').reduce((s, a) => s + a.valorTotal, 0);
  const totalEmAndamento = faturaveis.filter(a => a.status === 'Em andamento').reduce((s, a) => s + a.valorTotal, 0);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFaturar = () => {
    if (selected.size === 0) { toast.error('Selecione atendimentos para faturar.'); return; }
    selected.forEach(id => {
      const atd = atendimentos.find(a => a.id === id);
      if (atd && atd.status === 'Concluído') {
        updateAtendimento({ ...atd, status: 'Faturado', timeline: [...atd.timeline, { data: new Date().toISOString(), descricao: 'Faturado' }] });
      }
    });
    setAtendimentos(getAtendimentos());
    setSelected(new Set());
    toast.success('Atendimentos faturados com sucesso!');
  };

  const handleExport = () => {
    toast.success('Exportação CSV gerada (simulado).');
  };

  // Group by prestador
  const byPrestador = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; count: number }>();
    faturaveis.forEach(a => {
      const pName = prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '-';
      const existing = map.get(a.prestadorId) || { nome: pName, total: 0, count: 0 };
      existing.total += a.valorTotal;
      existing.count += 1;
      map.set(a.prestadorId, existing);
    });
    return Array.from(map.values());
  }, [faturaveis, prestadores]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturamento</h1>
          <p className="text-sm text-muted-foreground">Confira e fature atendimentos concluídos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><FileDown className="h-4 w-4 mr-2" />Exportar</Button>
          <Button onClick={handleFaturar} disabled={selected.size === 0}>
            <CheckCircle2 className="h-4 w-4 mr-2" />Faturar ({selected.size})
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 min-w-[200px]">
            <Label>Prestador</Label>
            <Select value={filterPrestador} onValueChange={setFilterPrestador}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {prestadores.map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 min-w-[140px]">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Faturado">Faturado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Data Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-success"><DollarSign className="h-5 w-5" /></div>
            <div><p className="text-[11px] text-muted-foreground">Total Faturável</p><p className="text-lg font-bold">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-[11px] text-muted-foreground">Já Faturado</p><p className="text-lg font-bold">R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-warning"><Clock className="h-5 w-5" /></div>
            <div><p className="text-[11px] text-muted-foreground">Pendente</p><p className="text-lg font-bold">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-info"><AlertTriangle className="h-5 w-5" /></div>
            <div><p className="text-[11px] text-muted-foreground">Em Andamento</p><p className="text-lg font-bold">R$ {totalEmAndamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
      </div>

      {byPrestador.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Resumo por Prestador</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Prestador</TableHead><TableHead className="text-center">Atendimentos</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {byPrestador.map((bp, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{bp.nome}</TableCell><TableCell className="text-center">{bp.count}</TableCell><TableCell className="text-right font-medium">R$ {bp.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Atendimentos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Prestador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturaveis.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>
              ) : faturaveis.map(a => (
                <TableRow key={a.id} className="table-row-hover">
                  <TableCell>
                    {a.status === 'Concluído' && (
                      <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{a.protocolo}</TableCell>
                  <TableCell>{a.clienteNome}</TableCell>
                  <TableCell className="hidden md:table-cell">{prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '-'}</TableCell>
                  <TableCell className="text-sm">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><Badge variant={a.status === 'Faturado' ? 'default' : a.status === 'Concluído' ? 'secondary' : 'outline'}>{a.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              {faturaveis.length > 0 && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={6} className="text-right font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
