import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores, getAtendimentos, getTarifas } from '@/data/store';
import { Users, Tag, ClipboardList, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(220,72%,45%)', 'hsl(174,62%,42%)', 'hsl(38,92%,50%)', 'hsl(152,60%,40%)', 'hsl(280,60%,50%)'];

export default function Dashboard() {
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const tarifas = useMemo(() => getTarifas(), []);

  const totalPrestadores = prestadores.length;
  const tarifasAtivas = tarifas.filter(t => t.situacao === 'Ativo').length;
  const atendimentosMes = atendimentos.length;
  const faturamento = atendimentos.filter(a => a.status === 'Concluído').reduce((s, a) => s + a.valorTotal, 0);

  const statusData = [
    { name: 'Ativos', value: prestadores.filter(p => p.status === 'Ativo').length },
    { name: 'Inativos', value: prestadores.filter(p => p.status === 'Inativo').length },
  ];

  const atdPorPrestador = prestadores.slice(0, 5).map(p => ({
    name: p.nomeFantasia.length > 12 ? p.nomeFantasia.slice(0, 12) + '…' : p.nomeFantasia,
    atendimentos: atendimentos.filter(a => a.prestadorId === p.id).length,
    faturamento: atendimentos.filter(a => a.prestadorId === p.id && a.status === 'Concluído').reduce((s, a) => s + a.valorTotal, 0),
  }));

  const kpis = [
    { label: 'Total Prestadores', value: totalPrestadores, icon: Users, color: 'text-primary' },
    { label: 'Tarifas Ativas', value: tarifasAtivas, icon: Tag, color: 'text-accent' },
    { label: 'Atendimentos do Mês', value: atendimentosMes, icon: ClipboardList, color: 'text-warning' },
    { label: 'Faturamento Estimado', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="card-hover">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos por Prestador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atdPorPrestador}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Bar dataKey="faturamento" fill="hsl(220,72%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status dos Prestadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Últimos Atendimentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentos.slice(0, 5).map(a => {
                const prest = prestadores.find(p => p.id === a.prestadorId);
                return (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell className="font-mono text-sm">{a.protocolo}</TableCell>
                    <TableCell>{a.clienteNome}</TableCell>
                    <TableCell>{prest?.nomeFantasia || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'Concluído' ? 'default' : a.status === 'Cancelado' ? 'destructive' : 'secondary'} className="text-xs">
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
