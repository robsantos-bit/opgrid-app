import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Star, TrendingUp, Users, BarChart3, ThumbsUp, ThumbsDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationRating {
  id: string;
  client_phone: string;
  nota_satisfacao: number;
  updated_at: string;
  state: string;
}

function useSatisfactionData() {
  return useQuery({
    queryKey: ['satisfaction-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, contact_phone, nota_satisfacao, updated_at, state')
        .not('nota_satisfacao', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({ ...d, client_phone: d.contact_phone })) as ConversationRating[];
    },
  });
}

function usePrestadorRatings() {
  return useQuery({
    queryKey: ['prestador-ratings'],
    queryFn: async () => {
      // Get atendimentos with their prestador info + linked solicitacao conversation
      const { data: atendimentos, error } = await supabase
        .from('atendimentos')
        .select(`
          id, status, prestador_id,
          prestadores ( id, nome ),
          solicitacoes ( id, cliente_telefone )
        `)
        .in('status', ['Concluído', 'finalizado', 'Finalizado']);

      if (error) throw error;

      // Get all conversations with ratings
      const { data: conversations } = await supabase
        .from('conversations')
        .select('contact_phone, nota_satisfacao')
        .not('nota_satisfacao', 'is', null);

      // Map phone -> nota
      const phoneToNota = new Map<string, number[]>();
      (conversations || []).forEach((c: any) => {
        const arr = phoneToNota.get(c.contact_phone) || [];
        arr.push(c.nota_satisfacao);
        phoneToNota.set(c.contact_phone, arr);
      });

      // Aggregate by prestador
      const prestadorMap = new Map<string, { nome: string; notas: number[] }>();
      (atendimentos || []).forEach((a: any) => {
        if (!a.prestadores?.id || !a.solicitacoes?.cliente_telefone) return;
        const phone = a.solicitacoes.cliente_telefone.replace(/\D/g, '');
        const notas = phoneToNota.get(phone) || phoneToNota.get('55' + phone) || [];
        if (notas.length === 0) return;

        const existing = prestadorMap.get(a.prestador_id) || { nome: a.prestadores.nome, notas: [] };
        existing.notas.push(...notas);
        prestadorMap.set(a.prestador_id, existing);
      });

      return Array.from(prestadorMap.entries()).map(([id, { nome, notas }]) => ({
        id,
        nome,
        totalAvaliacoes: notas.length,
        media: notas.reduce((a, b) => a + b, 0) / notas.length,
        distribuicao: [1, 2, 3, 4, 5].map(n => notas.filter(x => x === n).length),
      }));
    },
  });
}

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(220 14% 60%)', 'hsl(var(--info))', 'hsl(var(--success))'];
const STAR_LABELS = ['1 ⭐', '2 ⭐⭐', '3 ⭐⭐⭐', '4 ⭐⭐⭐⭐', '5 ⭐⭐⭐⭐⭐'];

export default function PainelSatisfacao() {
  const { data: ratings, isLoading } = useSatisfactionData();
  const { data: prestadorRatings, isLoading: loadingPrestadores } = usePrestadorRatings();

  const stats = useMemo(() => {
    if (!ratings || ratings.length === 0) return null;

    const notas = ratings.map(r => r.nota_satisfacao);
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    const distribuicao = [1, 2, 3, 4, 5].map(n => ({
      nota: STAR_LABELS[n - 1],
      quantidade: notas.filter(x => x === n).length,
      fill: COLORS[n - 1],
    }));

    // Trend: last 30 days
    const today = startOfDay(new Date());
    const trend = Array.from({ length: 30 }, (_, i) => {
      const day = subDays(today, 29 - i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRatings = ratings.filter(r => r.updated_at?.startsWith(dayStr));
      const dayNotas = dayRatings.map(r => r.nota_satisfacao);
      return {
        data: format(day, 'dd/MM', { locale: ptBR }),
        media: dayNotas.length > 0 ? +(dayNotas.reduce((a, b) => a + b, 0) / dayNotas.length).toFixed(1) : null,
        total: dayNotas.length,
      };
    }).filter(d => d.total > 0);

    const promotores = notas.filter(n => n >= 4).length;
    const detratores = notas.filter(n => n <= 2).length;
    const nps = Math.round(((promotores - detratores) / notas.length) * 100);

    return { media, total: notas.length, distribuicao, trend, nps, promotores, detratores };
  }, [ratings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Satisfação do Cliente</h1>
          <p>Notas de avaliação pós-atendimento, médias e tendências</p>
        </div>
      </div>

      {!stats || stats.total === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="empty-state">
              <div className="empty-state-icon"><Star className="h-5 w-5 text-muted-foreground" /></div>
              <p className="empty-state-title">Nenhuma avaliação registrada</p>
              <p className="empty-state-description">As notas de satisfação aparecerão aqui após os clientes avaliarem os atendimentos via WhatsApp</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Nota Média', value: stats.media.toFixed(1), icon: Star, bg: 'bg-warning/10', color: 'text-warning', sub: 'de 5.0' },
              { label: 'Total Avaliações', value: stats.total, icon: BarChart3, bg: 'bg-primary/10', color: 'text-primary', sub: 'respostas' },
              { label: 'Promotores (4-5)', value: stats.promotores, icon: ThumbsUp, bg: 'bg-success/10', color: 'text-success', sub: `${Math.round((stats.promotores / stats.total) * 100)}%` },
              { label: 'NPS Score', value: stats.nps, icon: TrendingUp, bg: stats.nps >= 0 ? 'bg-success/10' : 'bg-destructive/10', color: stats.nps >= 0 ? 'text-success' : 'text-destructive', sub: stats.nps >= 50 ? 'Excelente' : stats.nps >= 0 ? 'Bom' : 'Crítico' },
            ].map(k => (
              <Card key={k.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                    <k.icon className={`h-5 w-5 ${k.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{k.label}</p>
                    <p className="text-2xl font-bold tabular-nums">{k.value}</p>
                    <p className="text-[10px] text-muted-foreground">{k.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Distribuição */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-[13px] font-bold">Distribuição de Notas</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.distribuicao} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="nota" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [v, 'Avaliações']} />
                    <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                      {stats.distribuicao.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tendência */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-[13px] font-bold">Tendência (últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {stats.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [v, 'Média']} />
                      <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes para tendência</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Média por Prestador */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-[13px] font-bold">Média por Prestador</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPrestadores ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : !prestadorRatings || prestadorRatings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum prestador com avaliações ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Avaliações</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Média</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Distribuição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prestadorRatings
                      .sort((a, b) => b.media - a.media)
                      .map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-semibold text-[13px]">{p.nome}</TableCell>
                          <TableCell className="text-[13px] text-muted-foreground">{p.totalAvaliacoes}</TableCell>
                          <TableCell>
                            <Badge variant={p.media >= 4 ? 'success' : p.media >= 3 ? 'secondary' : 'destructive'} className="font-bold">
                              {p.media.toFixed(1)} ⭐
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex gap-1">
                              {p.distribuicao.map((count, i) => (
                                <div key={i} className="text-center">
                                  <div className="text-[9px] text-muted-foreground">{i + 1}★</div>
                                  <div className="text-[11px] font-mono font-bold">{count}</div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Últimas avaliações */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-[13px] font-bold">Últimas Avaliações</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Telefone</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nota</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ratings || []).slice(0, 20).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-[13px] font-mono text-muted-foreground">
                        {r.client_phone?.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4') || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.nota_satisfacao >= 4 ? 'success' : r.nota_satisfacao >= 3 ? 'secondary' : 'destructive'} className="font-bold">
                          {r.nota_satisfacao} ⭐
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {r.updated_at ? format(new Date(r.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
