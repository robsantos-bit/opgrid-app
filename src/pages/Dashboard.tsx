import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrestadores, getAtendimentos, getTarifas, getTabelaPrecos, getContratos, getSolicitacoes, getDespachos } from '@/data/store';
import {
  Users, ClipboardList, DollarSign, TrendingUp, AlertTriangle, Activity, Clock, Target, Gauge, ArrowUpRight, ArrowDownRight,
  Shield, Radio, MapPin, Truck, WifiOff, MessageCircle, Radar, Smartphone, Link2, Bell, Zap, CheckCircle2,
  User, FileText, Navigation, Phone, Eye, KeyRound, Car
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const prestadores = useMemo(() => getPrestadores(), []);
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const tabelaPrecos = useMemo(() => getTabelaPrecos(), []);
  const contratos = useMemo(() => getContratos(), []);
  const solicitacoes = useMemo(() => getSolicitacoes(), []);
  const despachos = useMemo(() => getDespachos(), []);

  const prestadoresAtivos = prestadores.filter(p => p.status === 'Ativo').length;
  const concluidos = atendimentos.filter(a => a.status === 'Concluído' || a.status === 'Faturado');
  const faturamento = concluidos.reduce((s, a) => s + a.valorTotal, 0);
  const ticketMedio = concluidos.length > 0 ? faturamento / concluidos.length : 0;
  const divergencias = atendimentos.filter(a => a.km > a.kmPrevisto + 5).length;

  const solWhatsApp = solicitacoes.filter(s => s.canal === 'WhatsApp').length;
  const despachosAuto = despachos.length;
  const totalOfertas = despachos.reduce((s, d) => s + d.ofertas.length, 0);
  const ofertasAceitas = despachos.reduce((s, d) => s + d.ofertas.filter(o => o.status === 'Aceita').length, 0);
  const taxaAceite = totalOfertas > 0 ? Math.round((ofertasAceitas / totalOfertas) * 100) : 0;
  const solConvertidas = solicitacoes.filter(s => s.atendimentoId).length;
  const taxaConversao = solicitacoes.length > 0 ? Math.round((solConvertidas / solicitacoes.length) * 100) : 0;

  const mapStats = useMemo(() => {
    const counts: Record<string, number> = {};
    prestadores.forEach(p => {
      if (p.localizacao) counts[p.localizacao.statusRastreamento] = (counts[p.localizacao.statusRastreamento] || 0) + 1;
    });
    return counts;
  }, [prestadores]);

  const alerts = [
    ...(prestadores.filter(p => p.homologacao === 'Crítico').length > 0 ? [{ text: `${prestadores.filter(p => p.homologacao === 'Crítico').length} prestador(es) com homologação crítica`, type: 'critical' as const }] : []),
    ...(divergencias > 0 ? [{ text: `${divergencias} atendimento(s) com divergência de km`, type: 'warning' as const }] : []),
  ];

  const rankingPrestadores = prestadores
    .filter(p => p.status === 'Ativo')
    .map(p => ({
      name: p.nomeFantasia.length > 14 ? p.nomeFantasia.slice(0, 14) + '…' : p.nomeFantasia,
      fullName: p.nomeFantasia, uf: p.uf,
      atendimentos: atendimentos.filter(a => a.prestadorId === p.id).length,
      faturamento: atendimentos.filter(a => a.prestadorId === p.id && (a.status === 'Concluído' || a.status === 'Faturado')).reduce((s, a) => s + a.valorTotal, 0),
      score: p.scoreOperacional,
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 6);

  const statusAtd = [
    { name: 'Abertos', value: atendimentos.filter(a => a.status === 'Aberto').length, color: 'hsl(36,92%,48%)' },
    { name: 'Em andamento', value: atendimentos.filter(a => a.status === 'Em andamento').length, color: 'hsl(208,80%,46%)' },
    { name: 'Concluídos', value: atendimentos.filter(a => a.status === 'Concluído').length, color: 'hsl(152,60%,36%)' },
    { name: 'Faturados', value: atendimentos.filter(a => a.status === 'Faturado').length, color: 'hsl(228,72%,44%)' },
  ].filter(d => d.value > 0);

  const tt = { borderRadius: '6px', border: '1px solid hsl(220,18%,89%)', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' };

  // Journey data
  const journeys = [
    {
      title: 'Jornada do Cliente',
      icon: User,
      color: 'text-success',
      bg: 'bg-success/10',
      steps: ['WhatsApp', 'Dados', 'Cotação', 'Aceite', 'Acompanhamento'],
      description: 'Solicita via WhatsApp, aceita proposta e acompanha por link',
      badge: 'Sem app',
    },
    {
      title: 'Jornada do Despacho',
      icon: Radar,
      color: 'text-primary',
      bg: 'bg-primary/10',
      steps: ['OS Gerada', 'Busca Rede', 'Oferta', 'Aceite', 'Vinculação'],
      description: 'Automático para os 2 prestadores mais próximos e aptos',
      badge: 'Automático',
    },
    {
      title: 'Jornada do Prestador',
      icon: Truck,
      color: 'text-warning',
      bg: 'bg-warning/10',
      steps: ['Oferta', 'Aceite', 'A caminho', 'Placa', 'Checklist', 'Conclusão'],
      description: 'Recebe link, aceita, confirma placa, preenche checklist',
      badge: 'Sem app',
    },
    {
      title: 'Jornada de Acompanhamento',
      icon: Eye,
      color: 'text-info',
      bg: 'bg-info/10',
      steps: ['Confirmado', 'A caminho', 'No local', 'Atendimento', 'Concluído'],
      description: 'Cliente acompanha em tempo real por link com mapa e timeline',
      badge: 'Tempo real',
    },
    {
      title: 'Jornada da Central',
      icon: Shield,
      color: 'text-accent',
      bg: 'bg-accent/10',
      steps: ['Sirene', 'Pipeline', 'Despacho', 'Monitor', 'Mapa'],
      description: 'Painel operacional com alertas, pipeline e mapa em tempo real',
      badge: 'Controle total',
    },
    {
      title: 'Jornada Financeira',
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
      steps: ['OS Concluída', 'Conferência', 'Glosas', 'Aprovação', 'Faturamento'],
      description: 'Conferência automática, tratamento de divergências e faturamento',
      badge: 'Auditoria',
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1>Central Operacional</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Olá, {user?.nome}. <span className="text-primary font-medium">Operação 100% sem app</span> — WhatsApp + Links + Despacho inteligente.
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map((a, i) => (
            <div key={i} className={`alert-banner ${a.type === 'critical' ? 'alert-banner-critical' : 'alert-banner-warning'}`}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 6 Journeys Strip */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><Zap className="h-3.5 w-3.5 text-primary" /></div>
            <div>
              <CardTitle className="text-[13px] font-bold">6 Jornadas Operacionais</CardTitle>
              <p className="text-[11px] text-muted-foreground">Arquitetura completa — cliente, despacho, prestador, acompanhamento, central e financeiro</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {journeys.map(j => (
              <div key={j.title} className="relative border rounded-xl p-3.5 hover:shadow-premium-lg transition-all group overflow-hidden">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className={`w-9 h-9 rounded-lg ${j.bg} flex items-center justify-center shrink-0`}>
                    <j.icon className={`h-4.5 w-4.5 ${j.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] font-bold leading-tight">{j.title}</p>
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-primary/20 text-primary shrink-0">{j.badge}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{j.description}</p>
                  </div>
                </div>
                {/* Step flow */}
                <div className="flex items-center gap-0.5 flex-wrap">
                  {j.steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-0.5">
                      <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{step}</span>
                      {i < j.steps.length - 1 && <span className="text-muted-foreground/30 text-[10px]">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operation Flow — visual funnel */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><Zap className="h-3.5 w-3.5 text-primary" /></div>
              <div>
                <CardTitle className="text-[13px] font-bold">Fluxo da Operação — Sem App</CardTitle>
                <p className="text-[11px] text-muted-foreground">WhatsApp → Sirene → Despacho → Link Prestador → Confirmação Placa → Link Cliente</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
            {[
              { icon: MessageCircle, label: 'WhatsApp', value: solicitacoes.length, color: 'bg-success', textColor: 'text-success' },
              { icon: Bell, label: 'Sirene Central', value: solicitacoes.length, color: 'bg-destructive', textColor: 'text-destructive' },
              { icon: Radar, label: 'Despacho', value: despachosAuto, color: 'bg-primary', textColor: 'text-primary' },
              { icon: Bell, label: 'Sirene Prestador', value: totalOfertas, color: 'bg-warning', textColor: 'text-warning' },
              { icon: CheckCircle2, label: 'Aceite', value: ofertasAceitas, color: 'bg-success', textColor: 'text-success' },
              { icon: KeyRound, label: 'Conf. Placa', value: ofertasAceitas, color: 'bg-warning', textColor: 'text-warning' },
              { icon: Smartphone, label: 'Portal Link', value: ofertasAceitas, color: 'bg-info', textColor: 'text-info' },
              { icon: Link2, label: 'Acompanhamento', value: solConvertidas, color: 'bg-accent', textColor: 'text-accent' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-muted/20 border min-w-[90px] text-center">
                  <div className={`w-8 h-8 rounded-lg ${step.color}/10 flex items-center justify-center`}>
                    <step.icon className={`h-4 w-4 ${step.textColor}`} />
                  </div>
                  <p className="text-[18px] font-bold leading-none">{step.value}</p>
                  <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">{step.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-muted-foreground/20 text-lg">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Rede Ativa', value: prestadoresAtivos, icon: Users, bg: 'bg-primary/10', color: 'text-primary', sub: `${prestadores.length} total` },
          { label: 'Faturamento', value: `R$ ${(faturamento / 1000).toFixed(1)}k`, icon: DollarSign, bg: 'bg-success/10', color: 'text-success', sub: 'período atual' },
          { label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(0)}`, icon: TrendingUp, bg: 'bg-info/10', color: 'text-info', sub: 'por atendimento' },
          { label: 'Divergências', value: divergencias, icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive', sub: 'km fora da faixa' },
        ].map(k => (
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

      {/* Map + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center"><Radio className="h-3.5 w-3.5 text-success animate-pulse" /></div>
                <div>
                  <CardTitle className="text-[13px] font-bold">Rede em Tempo Real</CardTitle>
                  <p className="text-[11px] text-muted-foreground">Localização via link — sem app</p>
                </div>
              </div>
              <Link to="/app/mapa" className="text-[11px] text-primary font-medium hover:underline">Ver mapa →</Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {[
              { label: 'Online', count: mapStats['Online'] || 0, bg: 'bg-success' },
              { label: 'A caminho', count: mapStats['A caminho'] || 0, bg: 'bg-info' },
              { label: 'Em atendimento', count: mapStats['Em atendimento'] || 0, bg: 'bg-warning' },
              { label: 'Offline', count: mapStats['Offline'] || 0, bg: 'bg-muted-foreground/40' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.bg}`} /><span className="text-[12px] text-muted-foreground">{item.label}</span></div>
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
                <p className="text-[11px] text-muted-foreground">Indicadores-chave de eficiência</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: 'Rede ativa', value: prestadores.length > 0 ? Math.round((prestadoresAtivos / prestadores.length) * 100) : 0 },
                { label: 'Conclusão', value: atendimentos.length > 0 ? Math.round((concluidos.length / atendimentos.filter(a => a.status !== 'Cancelado').length) * 100) : 0 },
                { label: 'Conversão WhatsApp', value: taxaConversao },
              ].map(h => (
                <div key={h.label} className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">{h.label}</span>
                    <span className="font-bold">{h.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${h.value >= 70 ? 'bg-success' : h.value >= 50 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${h.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t text-[12px]">
              <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-warning" /><span className="text-muted-foreground">Pendências:</span><span className="font-bold">{atendimentos.filter(a => a.status === 'Concluído').length}</span></div>
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">Contratos:</span><span className="font-bold">{contratos.filter(c => c.status === 'Ativo').length}</span></div>
              <div className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-success" /><span className="text-muted-foreground">Homologados:</span><span className="font-bold">{prestadores.filter(p => p.homologacao === 'Homologado').length}/{prestadores.length}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
      </div>

      {/* Recent + Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right font-semibold">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.slice(0, 5).map(a => (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{a.protocolo}</TableCell>
                    <TableCell className="text-[13px] font-medium">{a.clienteNome}</TableCell>
                    <TableCell><Badge variant={a.status === 'Concluído' || a.status === 'Faturado' ? 'success' : a.status === 'Cancelado' ? 'destructive' : a.status === 'Aberto' ? 'warning' : 'info'}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right text-[13px] font-bold tabular-nums">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Top Prestadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Prestador</TableHead>
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
                    <TableCell className="text-center"><Badge variant={r.score >= 80 ? 'success' : r.score >= 60 ? 'warning' : 'destructive'} className="text-[10px] font-bold">{r.score}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums text-[13px] font-bold">R$ {r.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
