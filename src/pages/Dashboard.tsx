import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores, getAtendimentos, getTarifas, getTabelaPrecos, getContratos } from '@/data/store';
import { Users, Tag, ClipboardList, DollarSign, TrendingUp, AlertTriangle, Shield, Activity, Clock, Target, Gauge, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['hsl(225,70%,48%)', 'hsl(172,58%,36%)', 'hsl(38,88%,50%)', 'hsl(152,56%,38%)', 'hsl(280,56%,50%)'];

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

  // Health metrics
  const pctAtivos = prestadores.length > 0 ? Math.round((prestadoresAtivos / prestadores.length) * 100) : 0;
  const pctConcluidos = atendimentos.length > 0 ? Math.round((concluidos.length / atendimentos.filter(a => a.status !== 'Cancelado').length) * 100) : 0;
  const tabelasVigentes = prestadores.filter(p => p.status === 'Ativo' && tabelaPrecos.some(tp => tp.prestadorId === p.id && tp.valor > 0)).length;
  const pctTabelasVigentes = prestadoresAtivos > 0 ? Math.round((tabelasVigentes / prestadoresAtivos) * 100) : 0;
  const pendenciasFat = atendimentos.filter(a => a.status === 'Concluído').length;
  const contratosAtivos = contratos.filter(c => c.status === 'Ativo').length;

  const tarifasSemValor = tarifas.filter(t => t.situacao === 'Ativo' && !tabelaPrecos.some(tp => tp.tarifaId === t.id && tp.valor > 0));
  const prestadoresInativos = prestadores.filter(p => p.status !== 'Ativo');
  const prestadoresCriticos = prestadores.filter(p => p.homologacao === 'Crítico');
  const homologados = prestadores.filter(p => p.homologacao === 'Homologado').length;

  const alerts = [
    ...(prestadoresCriticos.length > 0 ? [{ text: `${prestadoresCriticos.length} prestador(es) com homologação crítica — ação necessária`, type: 'critical' as const }] : []),
    ...(prestadoresInativos.length > 0 ? [{ text: `${prestadoresInativos.length} prestador(es) inativo(s) ou bloqueado(s) na rede`, type: 'warning' as const }] : []),
    ...(tarifasSemValor.length > 0 ? [{ text: `${tarifasSemValor.length} tarifa(s) ativa(s) sem parametrização de valor`, type: 'warning' as const }] : []),
    ...(pendenciasFat > 0 ? [{ text: `${pendenciasFat} atendimento(s) concluído(s) pendente(s) de faturamento`, type: 'info' as const }] : []),
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
      uf: p.uf,
      atendimentos: atendimentos.filter(a => a.prestadorId === p.id).length,
      faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
      score: p.scoreOperacional,
      homologacao: p.homologacao,
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 6);

  const kpis = [
    { label: 'Prestadores Ativos', value: prestadoresAtivos, icon: Users, bg: 'bg-primary/10', color: 'text-primary', trend: '+2 este mês' },
    { label: 'Tarifas Configuradas', value: tarifasAtivas, icon: Tag, bg: 'bg-accent/10', color: 'text-accent', trend: `${tarifas.filter(t => t.nivel === 'Sistema').length} do sistema` },
    { label: 'Atendimentos', value: atdTotal, icon: ClipboardList, bg: 'bg-warning/10', color: 'text-warning', trend: `${atendimentos.filter(a => a.status === 'Aberto').length} em aberto` },
    { label: 'Ticket Médio', value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, bg: 'bg-info/10', color: 'text-info', trend: 'por atendimento' },
    { label: 'Faturamento Total', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, bg: 'bg-success/10', color: 'text-success', trend: 'concluídos + faturados' },
  ];

  const healthItems = [
    { label: 'Prestadores ativos', value: pctAtivos, color: pctAtivos >= 70 ? 'bg-success' : pctAtivos >= 50 ? 'bg-warning' : 'bg-destructive' },
    { label: 'Taxa de conclusão', value: pctConcluidos, color: pctConcluidos >= 70 ? 'bg-success' : pctConcluidos >= 50 ? 'bg-warning' : 'bg-destructive' },
    { label: 'Cobertura tarifária', value: pctTabelasVigentes, color: pctTabelasVigentes >= 70 ? 'bg-success' : pctTabelasVigentes >= 50 ? 'bg-warning' : 'bg-destructive' },
  ];

  const statusAtd = [
    { name: 'Abertos', value: atendimentos.filter(a => a.status === 'Aberto').length, color: 'hsl(38,88%,50%)' },
    { name: 'Em andamento', value: atendimentos.filter(a => a.status === 'Em andamento').length, color: 'hsl(205,78%,48%)' },
    { name: 'Concluídos', value: atendimentos.filter(a => a.status === 'Concluído').length, color: 'hsl(152,56%,38%)' },
    { name: 'Faturados', value: atendimentos.filter(a => a.status === 'Faturado').length, color: 'hsl(225,70%,48%)' },
    { name: 'Cancelados', value: atendimentos.filter(a => a.status === 'Cancelado').length, color: 'hsl(0,68%,48%)' },
  ].filter(d => d.value > 0);

  const tooltipStyle = { borderRadius: '10px', border: '1px solid hsl(220,16%,90%)', fontSize: 12, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1>Painel Executivo</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Bem-vindo, {user?.nome}. Visão consolidada da operação da rede credenciada.</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`alert-banner ${
              a.type === 'critical' ? 'alert-banner-critical' : a.type === 'warning' ? 'alert-banner-warning' : 'alert-banner-info'
            }`}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
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
            <div className="min-w-0 flex-1">
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-value">{k.value}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">{k.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Health & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Saúde da Operação</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Indicadores-chave de performance da rede</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {healthItems.map(h => (
                <div key={h.label} className="space-y-2.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground font-medium">{h.label}</span>
                    <span className="font-bold">{h.value}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${h.color}`} style={{ width: `${h.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-5 mt-5 pt-4 border-t text-[13px]">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-muted-foreground">Pendências faturamento:</span>
                <span className="font-bold">{pendenciasFat}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Contratos ativos:</span>
                <span className="font-bold">{contratosAtivos}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-success" />
                <span className="text-muted-foreground">Homologados:</span>
                <span className="font-bold">{homologados}/{prestadores.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick metrics card */}
        <Card>
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Indicadores Rápidos</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Métricas da rede</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3.5">
            {[
              { label: 'Score médio da rede', value: `${Math.round(prestadores.filter(p => p.status === 'Ativo').reduce((s, p) => s + p.scoreOperacional, 0) / Math.max(prestadoresAtivos, 1))}/100`, good: true },
              { label: 'Prestadores 24h', value: `${prestadores.filter(p => p.disponibilidade24h).length} de ${prestadores.length}`, good: true },
              { label: 'Cobertura UF', value: `${new Set(prestadores.filter(p => p.status === 'Ativo').map(p => p.uf)).size} estados`, good: true },
              { label: 'Custo médio contrato', value: `R$ ${(contratos.filter(c => c.custoMedioEstimado > 0).reduce((s, c) => s + c.custoMedioEstimado, 0) / Math.max(contratos.filter(c => c.custoMedioEstimado > 0).length, 1)).toFixed(0)}`, good: false },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-1.5">
                <span className="text-[13px] text-muted-foreground">{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold">{m.value}</span>
                  {m.good ? <ArrowUpRight className="h-3.5 w-3.5 text-success" /> : <ArrowDownRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground">Ranking de Prestadores — Faturamento</CardTitle>
            <p className="text-[11px] text-muted-foreground/60">Prestadores com maior volume financeiro no período</p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingPrestadores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(220,10%,46%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(220,10%,46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Faturamento']} contentStyle={tooltipStyle} />
                  <Bar dataKey="faturamento" fill="hsl(225,70%,48%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-5 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground">Status dos Atendimentos</CardTitle>
            <p className="text-[11px] text-muted-foreground/60">Distribuição por fase operacional</p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusAtd} cx="50%" cy="50%" innerRadius={48} outerRadius={78} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                    {statusAtd.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table + Last Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground">Top Prestadores — Performance</CardTitle>
            <p className="text-[11px] text-muted-foreground/60">Ranking por volume e qualidade operacional</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center font-semibold">UF</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center font-semibold">Atd.</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center font-semibold">Score</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold">Fat.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingPrestadores.map((r, i) => (
                  <TableRow key={i} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center text-[11px] font-bold text-primary">{i + 1}</div>
                        <span className="font-semibold text-[13px]">{r.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-[10px] font-semibold">{r.uf}</Badge></TableCell>
                    <TableCell className="text-center text-[13px] font-medium">{r.atendimentos}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.score >= 80 ? 'success' : r.score >= 60 ? 'warning' : 'destructive'} className="text-[10px] font-bold">{r.score}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px] font-bold">R$ {r.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground">Últimos Atendimentos</CardTitle>
            <p className="text-[11px] text-muted-foreground/60">Movimentações recentes da operação</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cliente</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.slice(0, 6).map(a => {
                  const sv = a.status === 'Concluído' || a.status === 'Faturado' ? 'success' : a.status === 'Cancelado' ? 'destructive' : a.status === 'Aberto' ? 'warning' : 'info';
                  return (
                    <TableRow key={a.id} className="table-row-hover">
                      <TableCell className="font-mono text-[11px] font-semibold text-muted-foreground">{a.protocolo}</TableCell>
                      <TableCell className="text-[13px] font-medium">{a.clienteNome}</TableCell>
                      <TableCell><Badge variant={sv as any} className="font-semibold">{a.status}</Badge></TableCell>
                      <TableCell className="text-right text-[13px] font-bold tabular-nums">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
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
