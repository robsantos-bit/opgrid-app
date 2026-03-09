import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores, getAtendimentos, getTarifas, getTabelaPrecos } from '@/data/store';
import { Users, Tag, ClipboardList, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['hsl(220,72%,50%)', 'hsl(174,62%,38%)', 'hsl(38,92%,50%)', 'hsl(152,60%,36%)', 'hsl(280,60%,50%)'];

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

  const prestadoresInativos = prestadores.filter(p => p.status !== 'Ativo');
  const tarifasSemValor = tarifas.filter(t => t.situacao === 'Ativo' && !tabelaPrecos.some(tp => tp.tarifaId === t.id && tp.valor > 0));
  const atdPendentes = atendimentos.filter(a => a.status === 'Concluído');

  const alerts = [
    ...(prestadoresInativos.length > 0 ? [{ text: `${prestadoresInativos.length} prestador(es) inativo(s) ou bloqueado(s)` }] : []),
    ...(tarifasSemValor.length > 0 ? [{ text: `${tarifasSemValor.length} tarifa(s) ativa(s) sem valor configurado` }] : []),
    ...(atdPendentes.length > 0 ? [{ text: `${atdPendentes.length} atendimento(s) concluído(s) pendente(s) de faturamento` }] : []),
  ];

  const statusData = [
    { name: 'Ativos', value: prestadores.filter(p => p.status === 'Ativo').length },
    { name: 'Inativos', value: prestadores.filter(p => p.status === 'Inativo').length },
    { name: 'Bloqueados', value: prestadores.filter(p => p.status === 'Bloqueado').length },
  ].filter(d => d.value > 0);

  const atdPorPrestador = prestadores.filter(p => p.status === 'Ativo').slice(0, 6).map(p => ({
    name: p.nomeFantasia.length > 10 ? p.nomeFantasia.slice(0, 10) + '…' : p.nomeFantasia,
    faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
  }));

  const kpis = [
    { label: 'Prestadores Ativos', value: prestadoresAtivos, icon: Users, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Tarifas Ativas', value: tarifasAtivas, icon: Tag, bg: 'bg-accent/10', color: 'text-accent' },
    { label: 'Atendimentos', value: atdMes, icon: ClipboardList, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Ticket Médio', value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, bg: 'bg-info/10', color: 'text-info' },
    { label: 'Faturamento', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, bg: 'bg-success/10', color: 'text-success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Bem-vindo, {user?.nome}.</p>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-lg border border-warning/20 bg-warning/5 px-3.5 py-2 text-[13px]">
              <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}>
              <k.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-value">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[13px] font-medium text-muted-foreground">Faturamento por Prestador</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atdPorPrestador}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Faturamento']} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214,20%,91%)', fontSize: 12 }} />
                  <Bar dataKey="faturamento" fill="hsl(220,72%,50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[13px] font-medium text-muted-foreground">Status dos Prestadores</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 11 }}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214,20%,91%)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-[13px] font-medium text-muted-foreground">Últimos Atendimentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-medium uppercase tracking-wider">Protocolo</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider">Cliente</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider hidden md:table-cell">Prestador</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider hidden lg:table-cell">Data</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentos.slice(0, 6).map(a => {
                const prest = prestadores.find(p => p.id === a.prestadorId);
                const sv = a.status === 'Concluído' || a.status === 'Faturado' ? 'success' : a.status === 'Cancelado' ? 'destructive' : a.status === 'Aberto' ? 'warning' : 'info';
                return (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell className="font-mono text-xs">{a.protocolo}</TableCell>
                    <TableCell className="text-[13px]">{a.clienteNome}</TableCell>
                    <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{prest?.nomeFantasia || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell><Badge variant={sv as any}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right text-[13px] font-medium tabular-nums">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
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
