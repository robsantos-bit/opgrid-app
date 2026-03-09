import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAtendimentos, getPrestadores } from '@/data/store';
import { DollarSign } from 'lucide-react';

export default function Faturamento() {
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const prestadores = useMemo(() => getPrestadores(), []);
  const [filterPrestador, setFilterPrestador] = useState<string>('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const faturaveis = useMemo(() => {
    return atendimentos.filter(a => {
      if (a.status === 'Cancelado') return false;
      const matchPrestador = filterPrestador === 'all' || a.prestadorId === filterPrestador;
      let matchData = true;
      if (dataInicio) matchData = matchData && a.dataHora >= dataInicio;
      if (dataFim) matchData = matchData && a.dataHora <= dataFim + 'T23:59:59';
      return matchPrestador && matchData;
    });
  }, [atendimentos, filterPrestador, dataInicio, dataFim]);

  const totalFaturamento = faturaveis.reduce((s, a) => s + a.valorTotal, 0);
  const totalConcluidos = faturaveis.filter(a => a.status === 'Concluído').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Faturamento</h1>
        <p className="text-sm text-muted-foreground">Visualize os atendimentos faturáveis</p>
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
          <div className="space-y-1.5">
            <Label>Data Início</Label>
            <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data Fim</Label>
            <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-success">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faturamento Total</p>
              <p className="text-xl font-bold">R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atendimentos Concluídos</p>
              <p className="text-xl font-bold">{totalConcluidos} de {faturaveis.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Atendimentos Faturáveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro</TableCell></TableRow>
              ) : faturaveis.map(a => (
                <TableRow key={a.id} className="table-row-hover">
                  <TableCell className="font-mono text-sm">{a.protocolo}</TableCell>
                  <TableCell>{a.clienteNome}</TableCell>
                  <TableCell className="hidden md:table-cell">{prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '-'}</TableCell>
                  <TableCell className="text-sm">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><Badge variant={a.status === 'Concluído' ? 'default' : 'secondary'}>{a.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              {faturaveis.length > 0 && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="text-right font-bold">Total</TableCell>
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
