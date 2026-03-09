import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores, getAtendimentos, getTarifas, getTabelaPrecos } from '@/data/store';
import { Users, Tag, ClipboardList, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['hsl(220,72%,45%)', 'hsl(174,62%,42%)', 'hsl(38,92%,50%)', 'hsl(152,60%,40%)', 'hsl(280,60%,50%)'];

export default function Dashboard() {
  const { user } = useAuth();
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const tarifas = useMemo(() => getTarifas(), []);
  const tabelaPrecos = useMemo(() => getTabelaPrecos(), []);

  const prestadoresAtivos = prestadores.filter(p => p.status === 'Ativo').length;
  const tarifasAtivas = tarifas.filter(t => t.situacao === 'Ativo').length;
  const atdMes = atendimentos.filter(a => a.status !== 'Cancelado').length;
  const concluidos = atendimentos.filter(a => a.status === 'Concluído' || a.status === 'Faturado');
  const faturamento = concluidos.reduce((s, a) => s + a.valorTotal, 0);
  const ticketMedio = concluidos.length > 0 ? faturamento / concluidos.length : 0;

  // Alerts
  const prestadoresInativos = prestadores.filter(p => p.status !== 'Ativo');
  const tarifasSemValor = tarifas.filter(t => t.situacao === 'Ativo' && !tabelaPrecos.some(tp => tp.tarifaId === t.id && tp.valor > 0));
  const atdPendentes = atendimentos.filter(a => a.status === 'Concluído');

  const alerts = [
    ...(prestadoresInativos.length > 0 ? [{ text: `${prestadoresInativos.length} prestador(es) inativo(s)/bloqueado(s)`, type: 'warning' as const }] : []),
    ...(tarifasSemValor.length > 0 ? [{ text: `${tarifasSemValor.length} tarifa(s) sem valor definido`, type: 'warning' as const }] : []),
    ...(atdPendentes.length > 0 ? [{ text: `${atdPendentes.length} atendimento(s) pendente(s) de faturamento`, type: 'info' as const }] : []),
  ];

  const statusData = [
    { name: 'Ativos', value: prestadores.filter(p => p.status === 'Ativo').length },
    { name: 'Inativos', value: prestadores.filter(p => p.status === 'Inativo').length },
    { name: 'Bloqueados', value: prestadores.filter(p => p.status === 'Bloqueado').length },
  ].filter(d => d.value > 0);

  const atdPorPrestador = prestadores.filter(p => p.status === 'Ativo').slice(0, 6).map(p => ({
    name: p.nomeFantasia.length > 10 ? p.nomeFantasia.slice(0, 10) + '…' : p.nomeFantasia,
    faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
    atendimentos: atendimentos.filter(a => a.prestadorId === p.id).length,
  }));

  const kpis = [
    { label: 'Prestadores Ativos', value: prestadoresAtivos, icon: Users, color: 'text-primary' },
    { label: 'Tarifas Ativas', value: tarifasAtivas, icon: Tag, color: 'text-accent' },
    { label: 'Atendimentos no Mês', value: atdMes, icon: ClipboardList, color: 'text-warning' },
    { label: 'Ticket Médio', value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-info' },
    { label: 'Faturamento Previsto', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Bem-vindo, {user?.nome}. Visão geral do sistema.</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm bg-warning/5 border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <span className="text-foreground">{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">{k.label}</p>
                <p className="text-lg font-bold text-foreground truncate">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento por Prestador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atdPorPrestador}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Faturamento']} />
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

      {/* Recent */}
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
                <TableHead className="hidden md:table-cell">Prestador</TableHead>
                <TableHead className="hidden lg:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentos.slice(0, 6).map(a => {
                const prest = prestadores.find(p => p.id === a.prestadorId);
                const statusVariant = a.status === 'Concluído' || a.status === 'Faturado' ? 'default' : a.status === 'Cancelado' ? 'destructive' : 'secondary';
                return (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell className="font-mono text-sm">{a.protocolo}</TableCell>
                    <TableCell>{a.clienteNome}</TableCell>
                    <TableCell className="hidden md:table-cell">{prest?.nomeFantasia || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell><Badge variant={statusVariant} className="text-xs">{a.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
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
