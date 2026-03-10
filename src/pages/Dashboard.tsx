import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores, getAtendimentos, getTarifas, getTabelaPrecos, getContratos } from '@/data/store';
import { Users, ClipboardList, DollarSign, TrendingUp, AlertTriangle, Activity, Clock, Target, Gauge, ArrowUpRight, ArrowDownRight, Shield, Radio, MapPin, Truck, WifiOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { StatusRastreamento } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const tabelaPrecos = useMemo(() => getTabelaPrecos(), []);
  const contratos = useMemo(() => getContratos(), []);

  const prestadoresAtivos = prestadores.filter(p => p.status === 'Ativo').length;
  const atdTotal = atendimentos.filter(a => a.status !== 'Cancelado').length;
  const concluidos = atendimentos.filter(a => a.status === 'Concluído' || a.status === 'Faturado');
  const faturamento = concluidos.reduce((s, a) => s + a.valorTotal, 0);
  const ticketMedio = concluidos.length > 0 ? faturamento / concluidos.length : 0;
  const divergencias = atendimentos.filter(a => a.km > a.kmPrevisto + 5).length;

  const pctAtivos = prestadores.length > 0 ? Math.round((prestadoresAtivos / prestadores.length) * 100) : 0;
  const pctConcluidos = atendimentos.length > 0 ? Math.round((concluidos.length / atdTotal) * 100) : 0;
  const tabelasVigentes = prestadores.filter(p => p.status === 'Ativo' && tabelaPrecos.some(tp => tp.prestadorId === p.id && tp.valor > 0)).length;
  const pctTabelasVigentes = prestadoresAtivos > 0 ? Math.round((tabelasVigentes / prestadoresAtivos) * 100) : 0;
  const pendenciasFat = atendimentos.filter(a => a.status === 'Concluído').length;
  const contratosAtivos = contratos.filter(c => c.status === 'Ativo').length;
  const homologados = prestadores.filter(p => p.homologacao === 'Homologado').length;
  const prestadoresCriticos = prestadores.filter(p => p.homologacao === 'Crítico');

  // Map data
  const mapStats = useMemo(() => {
    const counts: Record<string, number> = {};
    prestadores.forEach(p => {
      if (p.localizacao) {
        counts[p.localizacao.statusRastreamento] = (counts[p.localizacao.statusRastreamento] || 0) + 1;
      }
    });
    return counts;
  }, [prestadores]);

  const alerts = [
    ...(prestadoresCriticos.length > 0 ? [{ text: `${prestadoresCriticos.length} prestador(es) com homologação crítica`, type: 'critical' as const }] : []),
    ...(divergencias > 0 ? [{ text: `${divergencias} atendimento(s) com divergência de km acima do tolerado`, type: 'warning' as const }] : []),
    ...(pendenciasFat > 0 ? [{ text: `${pendenciasFat} atendimento(s) concluído(s) pendente(s) de faturamento`, type: 'info' as const }] : []),
  ];

  const rankingPrestadores = prestadores
    .filter(p => p.status === 'Ativo')
    .map(p => ({
      name: p.nomeFantasia.length > 14 ? p.nomeFantasia.slice(0, 14) + '…' : p.nomeFantasia,
      fullName: p.nomeFantasia,
      uf: p.uf,
      atendimentos: atendimentos.filter(a => a.prestadorId === p.id).length,
      faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
      score: p.scoreOperacional,
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 6);

  const kpis = [
    { label: 'Rede Ativa', value: prestadoresAtivos, icon: Users, bg: 'bg-primary/10', color: 'text-primary', sub: `${prestadores.length} total` },
    { label: 'Operações', value: atdTotal, icon: ClipboardList, bg: 'bg-warning/10', color: 'text-warning', sub: `${atendimentos.filter(a => a.status === 'Aberto').length} abertas` },
    { label: 'Faturamento', value: `R$ ${(faturamento/1000).toFixed(1)}k`, icon: DollarSign, bg: 'bg-success/10', color: 'text-success', sub: 'período atual' },
    { label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(0)}`, icon: TrendingUp, bg: 'bg-info/10', color: 'text-info', sub: 'por atendimento' },
    { label: 'Divergências', value: divergencias, icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive', sub: 'km fora da faixa' },
  ];

  const healthItems = [
    { label: 'Rede ativa', value: pctAtivos, color: pctAtivos >= 70 ? 'bg-success' : pctAtivos >= 50 ? 'bg-warning' : 'bg-destructive' },
    { label: 'Conclusão', value: pctConcluidos, color: pctConcluidos >= 70 ? 'bg-success' : pctConcluidos >= 50 ? 'bg-warning' : 'bg-destructive' },
    { label: 'Cobertura tarifária', value: pctTabelasVigentes, color: pctTabelasVigentes >= 70 ? 'bg-success' : pctTabelasVigentes >= 50 ? 'bg-warning' : 'bg-destructive' },
  ];

  const statusAtd = [
    { name: 'Abertos', value: atendimentos.filter(a => a.status === 'Aberto').length, color: 'hsl(36,92%,48%)' },
    { name: 'Em andamento', value: atendimentos.filter(a => a.status === 'Em andamento').length, color: 'hsl(208,80%,46%)' },
    { name: 'Concluídos', value: atendimentos.filter(a => a.status === 'Concluído').length, color: 'hsl(152,60%,36%)' },
    { name: 'Faturados', value: atendimentos.filter(a => a.status === 'Faturado').length, color: 'hsl(228,72%,44%)' },
  ].filter(d => d.value > 0);

  const tt = { borderRadius: '6px', border: '1px solid hsl(220,18%,89%)', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };

  const statusMapColors: Record<string, string> = {
    'Online': 'bg-success', 'A caminho': 'bg-info', 'Em atendimento': 'bg-warning', 'Offline': 'bg-muted-foreground/40',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1>Painel Executivo</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Olá, {user?.nome}. Visão consolidada da operação e da rede credenciada.</p>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((a, i) => (
            <div key={i} className={`alert-banner ${a.type === 'critical' ? 'alert-banner-critical' : a.type === 'warning' ? 'alert-banner-warning' : 'alert-banner-info'}`}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-4.5 w-4.5" /></div>
            <div className="min-w-0 flex-1">
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-value">{k.value}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map summary + Health side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center"><Radio className="h-3.5 w-3.5 text-success animate-pulse" /></div>
                <div>
                  <CardTitle className="text-[13px] font-bold">Rede em Tempo Real</CardTitle>
                  <p className="text-[11px] text-muted-foreground">Rastreamento via app</p>
                </div>
              </div>
              <Link to="/mapa" className="text-[11px] text-primary font-medium hover:underline">Ver mapa →</Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {[
              { label: 'Online', count: mapStats['Online'] || 0, icon: Radio, color: 'text-success', bg: 'bg-success' },
              { label: 'A caminho', count: mapStats['A caminho'] || 0, icon: Truck, color: 'text-info', bg: 'bg-info' },
              { label: 'Em atendimento', count: mapStats['Em atendimento'] || 0, icon: MapPin, color: 'text-warning', bg: 'bg-warning' },
              { label: 'Offline', count: mapStats['Offline'] || 0, icon: WifiOff, color: 'text-muted-foreground', bg: 'bg-muted-foreground/40' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.bg}`} />
                  <span className="text-[12px] text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-[13px] font-bold">{item.count}</span>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Sem sinal / indisponível</span>
                <span className="font-bold text-destructive">{(mapStats['Sem sinal'] || 0) + (mapStats['Indisponível'] || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><Activity className="h-3.5 w-3.5 text-primary" /></div>
              <div>
                <CardTitle className="text-[13px] font-bold">Saúde da Operação</CardTitle>
                <p className="text-[11px] text-muted-foreground">Indicadores-chave de eficiência da rede</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {healthItems.map(h => (
                <div key={h.label} className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">{h.label}</span>
                    <span className="font-bold">{h.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${h.color}`} style={{ width: `${h.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t text-[12px]">
              <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-warning" /><span className="text-muted-foreground">Pendências:</span><span className="font-bold">{pendenciasFat}</span></div>
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">Contratos:</span><span className="font-bold">{contratosAtivos}</span></div>
              <div className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-success" /><span className="text-muted-foreground">Homologados:</span><span className="font-bold">{homologados}/{prestadores.length}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Ranking — Faturamento por Prestador</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingPrestadores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,18%,89%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(220,12%,44%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(220,12%,44%)' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Faturamento']} contentStyle={tt} />
                  <Bar dataKey="faturamento" fill="hsl(228,72%,44%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center"><Gauge className="h-3.5 w-3.5 text-accent" /></div>
              <CardTitle className="text-[13px] font-bold">Indicadores</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            {[
              { label: 'Score médio', value: `${Math.round(prestadores.filter(p => p.status === 'Ativo').reduce((s, p) => s + p.scoreOperacional, 0) / Math.max(prestadoresAtivos, 1))}/100`, up: true },
              { label: '24h disponíveis', value: `${prestadores.filter(p => p.disponibilidade24h).length}/${prestadores.length}`, up: true },
              { label: 'Cobertura UF', value: `${new Set(prestadores.filter(p => p.status === 'Ativo').map(p => p.uf)).size} estados`, up: true },
              { label: 'Custo médio', value: `R$ ${(contratos.filter(c => c.custoMedioEstimado > 0).reduce((s, c) => s + c.custoMedioEstimado, 0) / Math.max(contratos.filter(c => c.custoMedioEstimado > 0).length, 1)).toFixed(0)}`, up: false },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-1">
                <span className="text-[12px] text-muted-foreground">{m.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-bold">{m.value}</span>
                  {m.up ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Distribuição Operacional</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusAtd} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                    {statusAtd.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tt} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Top Prestadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Prestador</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-center font-semibold">UF</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-center font-semibold">Score</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right font-semibold">Fat.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingPrestadores.map((r, i) => (
                  <TableRow key={i} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded text-[10px] font-bold bg-primary/8 flex items-center justify-center text-primary">{i + 1}</span>
                        <span className="font-medium text-[13px]">{r.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{r.uf}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant={r.score >= 80 ? 'success' : r.score >= 60 ? 'warning' : 'destructive'} className="text-[10px] font-bold">{r.score}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums text-[13px] font-bold">R$ {r.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent operations */}
      <Card>
        <CardHeader className="pb-1 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Últimas Operações</CardTitle>
            <Link to="/atendimentos" className="text-[11px] text-primary font-medium hover:underline">Ver todas →</Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Cliente</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold hidden md:table-cell">Prestador</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right font-semibold">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentos.slice(0, 6).map(a => {
                const prest = prestadores.find(p => p.id === a.prestadorId);
                return (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{a.protocolo}</TableCell>
                    <TableCell className="text-[13px] font-medium">{a.clienteNome}</TableCell>
                    <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{prest?.nomeFantasia || '-'}</TableCell>
                    <TableCell><Badge variant={a.status === 'Concluído' || a.status === 'Faturado' ? 'success' : a.status === 'Cancelado' ? 'destructive' : a.status === 'Aberto' ? 'warning' : 'info'}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right text-[13px] font-bold tabular-nums">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
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