import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAtendimentos, getPrestadores, getTarifas } from '@/data/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['hsl(220,72%,50%)', 'hsl(174,62%,38%)', 'hsl(38,92%,50%)', 'hsl(152,60%,36%)', 'hsl(280,60%,50%)', 'hsl(0,72%,51%)', 'hsl(200,80%,50%)'];

export default function Relatorios() {
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const prestadores = useMemo(() => getPrestadores(), []);
  const tarifas = useMemo(() => getTarifas(), []);

  const atdPorPrestador = useMemo(() => prestadores.map(p => ({
    name: p.nomeFantasia.length > 12 ? p.nomeFantasia.slice(0, 12) + '…' : p.nomeFantasia,
    total: atendimentos.filter(a => a.prestadorId === p.id).length,
    faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total), [atendimentos, prestadores]);

  const tarifaUsage = useMemo(() => {
    const map = new Map<string, number>();
    atendimentos.forEach(a => a.tarifas.forEach(t => map.set(t.tarifaId, (map.get(t.tarifaId) || 0) + t.quantidade)));
    return Array.from(map.entries()).map(([id, qty]) => ({ name: tarifas.find(t => t.id === id)?.nome || id, value: qty })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [atendimentos, tarifas]);

  const fatPorPrestador = useMemo(() => prestadores.map(p => ({
    name: p.nomeFantasia, value: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
  })).filter(x => x.value > 0).sort((a, b) => b.value - a.value), [atendimentos, prestadores]);

  const tooltipStyle = { borderRadius: '8px', border: '1px solid hsl(214,20%,91%)', fontSize: 12 };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header"><div className="page-header-text"><h1>Relatórios</h1><p>Análises e relatórios gerenciais</p></div></div>

      <Tabs defaultValue="prestadores">
        <TabsList className="h-9"><TabsTrigger value="prestadores" className="text-xs">Por Prestador</TabsTrigger><TabsTrigger value="faturamento" className="text-xs">Faturamento</TabsTrigger><TabsTrigger value="tarifas" className="text-xs">Tarifas</TabsTrigger></TabsList>

        <TabsContent value="prestadores" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => toast.success('CSV exportado (simulado).')}><FileDown className="h-3.5 w-3.5 mr-1.5" />Exportar</Button></div>
          <Card><CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-[13px] font-medium text-muted-foreground">Atendimentos por Prestador</CardTitle></CardHeader><CardContent className="px-2 pb-3"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={atdPorPrestador}><CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,91%)" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="total" fill="hsl(220,72%,50%)" radius={[4, 4, 0, 0]} name="Atendimentos" /></BarChart></ResponsiveContainer></div></CardContent></Card>
          <Card><CardContent className="p-0"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="text-[11px] uppercase tracking-wider">Prestador</TableHead><TableHead className="text-[11px] uppercase tracking-wider text-center">Atd.</TableHead><TableHead className="text-[11px] uppercase tracking-wider text-right">Faturamento</TableHead></TableRow></TableHeader><TableBody>{atdPorPrestador.map((r, i) => <TableRow key={i} className="table-row-hover"><TableCell className="font-medium text-[13px]">{r.name}</TableCell><TableCell className="text-center text-[13px]">{r.total}</TableCell><TableCell className="text-right tabular-nums text-[13px]">R$ {r.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="faturamento" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => toast.success('CSV exportado (simulado).')}><FileDown className="h-3.5 w-3.5 mr-1.5" />Exportar</Button></div>
          <Card><CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-[13px] font-medium text-muted-foreground">Faturamento por Prestador</CardTitle></CardHeader><CardContent className="px-2 pb-3"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={fatPorPrestador} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: R$ ${value.toFixed(0)}`} labelLine={false} style={{ fontSize: 10 }}>{fatPorPrestador.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div></CardContent></Card>
          <Card><CardContent className="p-0"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="text-[11px] uppercase tracking-wider">Prestador</TableHead><TableHead className="text-[11px] uppercase tracking-wider text-right">Faturamento</TableHead></TableRow></TableHeader><TableBody>{fatPorPrestador.map((r, i) => <TableRow key={i} className="table-row-hover"><TableCell className="font-medium text-[13px]">{r.name}</TableCell><TableCell className="text-right font-medium tabular-nums text-[13px]">R$ {r.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>)}<TableRow className="bg-muted/30"><TableCell className="font-semibold text-[13px]">Total</TableCell><TableCell className="text-right font-bold tabular-nums text-[13px]">R$ {fatPorPrestador.reduce((s, r) => s + r.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow></TableBody></Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="tarifas" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => toast.success('CSV exportado (simulado).')}><FileDown className="h-3.5 w-3.5 mr-1.5" />Exportar</Button></div>
          <Card><CardHeader className="pb-1 pt-4 px-4"><CardTitle className="text-[13px] font-medium text-muted-foreground">Tarifas Mais Utilizadas</CardTitle></CardHeader><CardContent className="px-2 pb-3"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={tarifaUsage} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,91%)" /><XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} width={110} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="hsl(174,62%,38%)" radius={[0, 4, 4, 0]} name="Quantidade" /></BarChart></ResponsiveContainer></div></CardContent></Card>
          <Card><CardContent className="p-0"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="text-[11px] uppercase tracking-wider">Tarifa</TableHead><TableHead className="text-[11px] uppercase tracking-wider text-right">Quantidade</TableHead></TableRow></TableHeader><TableBody>{tarifaUsage.map((r, i) => <TableRow key={i} className="table-row-hover"><TableCell className="font-medium text-[13px]">{r.name}</TableCell><TableCell className="text-right tabular-nums text-[13px]">{r.value}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
