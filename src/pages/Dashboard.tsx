import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getPrestadores, getAtendimentos, getTarifas, getTabelaPrecos, getContratos } from '@/data/store';
import { Users, Tag, ClipboardList, DollarSign, TrendingUp, AlertTriangle, Shield, Activity, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['hsl(220,72%,50%)', 'hsl(174,62%,38%)', 'hsl(38,92%,50%)', 'hsl(152,60%,36%)', 'hsl(280,60%,50%)'];

export default function Dashboard() {
  const { user } = useAuth();
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const tarifas = useMemo(() => getTarifas(), []);
  const tabelaPrecos = useMemo(() => getTabelaPrecos(), []);
  const contratos = useMemo(() => getContratos(), []);

  const prestadoresAtivos = prestadores.filter(p => p.status === 'Ativo').length;
  const tarifasAtivas = tarifas.filter(t => t.situacao === 'Ativo').length;
  const atdTotal = atendimentos.filter(a => a.status !== 'Cancelado').length;
  const concluidos = atendimentos.filter(a => a.status === 'Concluído' || a.status === 'Faturado');
  const faturamento = concluidos.reduce((s, a) => s + a.valorTotal, 0);
  const ticketMedio = concluidos.length > 0 ? faturamento / concluidos.length : 0;

  // Saúde da operação
  const pctAtivos = prestadores.length > 0 ? Math.round((prestadoresAtivos / prestadores.length) * 100) : 0;
  const pctConcluidos = atendimentos.length > 0 ? Math.round((concluidos.length / atendimentos.filter(a => a.status !== 'Cancelado').length) * 100) : 0;
  const tabelasVigentes = prestadores.filter(p => p.status === 'Ativo' && tabelaPrecos.some(tp => tp.prestadorId === p.id && tp.valor > 0)).length;
  const pctTabelasVigentes = prestadoresAtivos > 0 ? Math.round((tabelasVigentes / prestadoresAtivos) * 100) : 0;
  const pendenciasFat = atendimentos.filter(a => a.status === 'Concluído').length;

  const tarifasSemValor = tarifas.filter(t => t.situacao === 'Ativo' && !tabelaPrecos.some(tp => tp.tarifaId === t.id && tp.valor > 0));
  const prestadoresInativos = prestadores.filter(p => p.status !== 'Ativo');
  const prestadoresCriticos = prestadores.filter(p => p.homologacao === 'Crítico');

  const alerts = [
    ...(prestadoresCriticos.length > 0 ? [{ text: `${prestadoresCriticos.length} prestador(es) com homologação crítica`, type: 'critical' as const }] : []),
    ...(prestadoresInativos.length > 0 ? [{ text: `${prestadoresInativos.length} prestador(es) inativo(s) ou bloqueado(s)`, type: 'warning' as const }] : []),
    ...(tarifasSemValor.length > 0 ? [{ text: `${tarifasSemValor.length} tarifa(s) ativa(s) sem valor configurado`, type: 'warning' as const }] : []),
    ...(pendenciasFat > 0 ? [{ text: `${pendenciasFat} atendimento(s) pendente(s) de faturamento`, type: 'info' as const }] : []),
  ];

  const statusData = [
    { name: 'Ativos', value: prestadores.filter(p => p.status === 'Ativo').length },
    { name: 'Inativos', value: prestadores.filter(p => p.status === 'Inativo').length },
    { name: 'Bloqueados', value: prestadores.filter(p => p.status === 'Bloqueado').length },
  ].filter(d => d.value > 0);

  const rankingPrestadores = prestadores
    .filter(p => p.status === 'Ativo')
    .map(p => ({
      name: p.nomeFantasia.length > 14 ? p.nomeFantasia.slice(0, 14) + '…' : p.nomeFantasia,
      fullName: p.nomeFantasia,
      atendimentos: atendimentos.filter(a => a.prestadorId === p.id).length,
      faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
      score: p.scoreOperacional,
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 6);

  const kpis = [
    { label: 'Prestadores Ativos', value: prestadoresAtivos, icon: Users, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Tarifas Ativas', value: tarifasAtivas, icon: Tag, bg: 'bg-accent/10', color: 'text-accent' },
    { label: 'Atendimentos', value: atdTotal, icon: ClipboardList, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Ticket Médio', value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, bg: 'bg-info/10', color: 'text-info' },
    { label: 'Faturamento', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, bg: 'bg-success/10', color: 'text-success' },
  ];

  const healthItems = [
    { label: 'Prestadores ativos', value: pctAtivos, color: pctAtivos >= 70 ? 'bg-success' : pctAtivos >= 50 ? 'bg-warning' : 'bg-destructive' },
    { label: 'Atendimentos concluídos', value: pctConcluidos, color: pctConcluidos >= 70 ? 'bg-success' : pctConcluidos >= 50 ? 'bg-warning' : 'bg-destructive' },
    { label: 'Tabelas vigentes', value: pctTabelasVigentes, color: pctTabelasVigentes >= 70 ? 'bg-success' : pctTabelasVigentes >= 50 ? 'bg-warning' : 'bg-destructive' },
  ];

  const statusAtd = [
    { name: 'Abertos', value: atendimentos.filter(a => a.status === 'Aberto').length, color: 'hsl(38,92%,50%)' },
    { name: 'Em andamento', value: atendimentos.filter(a => a.status === 'Em andamento').length, color: 'hsl(200,80%,50%)' },
    { name: 'Concluídos', value: atendimentos.filter(a => a.status === 'Concluído').length, color: 'hsl(152,60%,36%)' },
    { name: 'Faturados', value: atendimentos.filter(a => a.status === 'Faturado').length, color: 'hsl(220,72%,50%)' },
    { name: 'Cancelados', value: atendimentos.filter(a => a.status === 'Cancelado').length, color: 'hsl(0,72%,51%)' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Painel Executivo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Bem-vindo, {user?.nome}. Visão consolidada da operação.</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-[13px] ${
              a.type === 'critical' ? 'border-destructive/20 bg-destructive/5' : a.type === 'warning' ? 'border-warning/20 bg-warning/5' : 'border-info/20 bg-info/5'
            }`}>
              <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${a.type === 'critical' ? 'text-destructive' : a.type === 'warning' ? 'text-warning' : 'text-info'}`} />
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-5 w-5" /></div>
            <div className="min-w-0"><p className="kpi-label">{k.label}</p><p className="kpi-value">{k.value}</p></div>
          </div>
        ))}
      </div>

      {/* Saúde da Operação */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Saúde da Operação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {healthItems.map(h => (
              <div key={h.label} className="space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">{h.label}</span>
                  <span className="font-semibold">{h.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${h.color}`} style={{ width: `${h.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t text-[13px]">
            <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-warning" /><span className="text-muted-foreground">Pendências faturamento:</span><span className="font-semibold">{pendenciasFat}</span></div>
            <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">Contratos ativos:</span><span className="font-semibold">{contratos.filter(c => c.status === 'Ativo').length}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[13px] font-medium text-muted-foreground">Ranking de Prestadores — Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingPrestadores}>
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
            <CardTitle className="text-[13px] font-medium text-muted-foreground">Status dos Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusAtd} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                    {statusAtd.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214,20%,91%)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table + Last Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[13px] font-medium text-muted-foreground">Top Prestadores por Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider">Prestador</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Atd.</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Score</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">Fat.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingPrestadores.map((r, i) => (
                  <TableRow key={i} className="table-row-hover">
                    <TableCell className="font-medium text-[13px]">{r.fullName}</TableCell>
                    <TableCell className="text-center text-[13px]">{r.atendimentos}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.score >= 80 ? 'success' : r.score >= 60 ? 'warning' : 'destructive'} className="text-[10px]">{r.score}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px] font-medium">R$ {r.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[13px] font-medium text-muted-foreground">Últimos Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider">Protocolo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Cliente</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.slice(0, 6).map(a => {
                  const sv = a.status === 'Concluído' || a.status === 'Faturado' ? 'success' : a.status === 'Cancelado' ? 'destructive' : a.status === 'Aberto' ? 'warning' : 'info';
                  return (
                    <TableRow key={a.id} className="table-row-hover">
                      <TableCell className="font-mono text-xs">{a.protocolo}</TableCell>
                      <TableCell className="text-[13px]">{a.clienteNome}</TableCell>
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
    </div>
  );
}
