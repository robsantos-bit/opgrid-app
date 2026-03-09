import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAtendimentos, getPrestadores, getTarifas } from '@/data/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['hsl(220,72%,45%)', 'hsl(174,62%,42%)', 'hsl(38,92%,50%)', 'hsl(152,60%,40%)', 'hsl(280,60%,50%)', 'hsl(0,72%,51%)', 'hsl(200,80%,50%)'];

export default function Relatorios() {
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const prestadores = useMemo(() => getPrestadores(), []);
  const tarifas = useMemo(() => getTarifas(), []);

  const handleExport = (tipo: string) => {
    toast.success(`Exportação CSV de "${tipo}" gerada (simulado).`);
  };

  // Atendimentos por prestador
  const atdPorPrestador = useMemo(() => {
    return prestadores.map(p => ({
      name: p.nomeFantasia.length > 12 ? p.nomeFantasia.slice(0, 12) + '…' : p.nomeFantasia,
      total: atendimentos.filter(a => a.prestadorId === p.id).length,
      faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
    })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);
  }, [atendimentos, prestadores]);

  // Tarifas mais utilizadas
  const tarifaUsage = useMemo(() => {
    const map = new Map<string, number>();
    atendimentos.forEach(a => a.tarifas.forEach(t => map.set(t.tarifaId, (map.get(t.tarifaId) || 0) + t.quantidade)));
    return Array.from(map.entries())
      .map(([id, qty]) => ({ name: tarifas.find(t => t.id === id)?.nome || id, value: qty }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [atendimentos, tarifas]);

  // Faturamento por prestador
  const fatPorPrestador = useMemo(() => {
    return prestadores.map(p => ({
      name: p.nomeFantasia,
      value: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
    })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  }, [atendimentos, prestadores]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Relatórios gerenciais e análises</p>
      </div>

      <Tabs defaultValue="prestadores">
        <TabsList>
          <TabsTrigger value="prestadores">Por Prestador</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
        </TabsList>

        <TabsContent value="prestadores" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('Atendimentos por Prestador')}>
              <FileDown className="h-4 w-4 mr-2" />Exportar CSV
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Atendimentos por Prestador</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atdPorPrestador}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(220,72%,45%)" radius={[4, 4, 0, 0]} name="Atendimentos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Prestador</TableHead><TableHead className="text-center">Atendimentos</TableHead><TableHead className="text-right">Faturamento</TableHead></TableRow></TableHeader>
                <TableBody>
                  {atdPorPrestador.map((r, i) => (
                    <TableRow key={i}><TableCell className="font-medium">{r.name}</TableCell><TableCell className="text-center">{r.total}</TableCell><TableCell className="text-right">R$ {r.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturamento" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('Faturamento')}>
              <FileDown className="h-4 w-4 mr-2" />Exportar CSV
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Faturamento por Prestador</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fatPorPrestador} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: R$ ${value.toFixed(0)}`}>
                      {fatPorPrestador.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Prestador</TableHead><TableHead className="text-right">Faturamento</TableHead></TableRow></TableHeader>
                <TableBody>
                  {fatPorPrestador.map((r, i) => (
                    <TableRow key={i}><TableCell className="font-medium">{r.name}</TableCell><TableCell className="text-right font-medium">R$ {r.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>
                  ))}
                  <TableRow className="bg-muted/30"><TableCell className="font-bold">Total</TableCell><TableCell className="text-right font-bold">R$ {fatPorPrestador.reduce((s, r) => s + r.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarifas" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport('Tarifas Utilizadas')}>
              <FileDown className="h-4 w-4 mr-2" />Exportar CSV
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tarifas Mais Utilizadas</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tarifaUsage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(174,62%,42%)" radius={[0, 4, 4, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Tarifa</TableHead><TableHead className="text-right">Quantidade Utilizada</TableHead></TableRow></TableHeader>
                <TableBody>
                  {tarifaUsage.map((r, i) => (
                    <TableRow key={i}><TableCell className="font-medium">{r.name}</TableCell><TableCell className="text-right">{r.value}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
