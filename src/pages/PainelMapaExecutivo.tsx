import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/useSupabaseData';
import { Loader2, Map, BarChart3, TrendingUp, Users, Headphones, DollarSign } from 'lucide-react';

const regioes = [
  { nome: 'Sudeste', solicitacoes: 145, atendimentos: 132, prestadores: 48, receita: 'R$ 89.400' },
  { nome: 'Sul', solicitacoes: 67, atendimentos: 61, prestadores: 22, receita: 'R$ 41.200' },
  { nome: 'Nordeste', solicitacoes: 53, atendimentos: 45, prestadores: 18, receita: 'R$ 28.700' },
  { nome: 'Centro-Oeste', solicitacoes: 31, atendimentos: 28, prestadores: 12, receita: 'R$ 17.500' },
  { nome: 'Norte', solicitacoes: 14, atendimentos: 11, prestadores: 5, receita: 'R$ 7.800' },
];

export default function PainelMapaExecutivo() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const s = stats!;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Mapa Executivo</h1><p>Visão estratégica por região e indicadores gerenciais</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Regiões Ativas', value: '5', icon: Map, bg: 'bg-primary/10', color: 'text-primary' },
          { label: 'Prestadores Rede', value: s.totalPrestadores, icon: Users, bg: 'bg-info/10', color: 'text-info' },
          { label: 'Atendimentos Mês', value: s.totalAtendimentos, icon: Headphones, bg: 'bg-success/10', color: 'text-success' },
          { label: 'Receita Estimada', value: 'R$ 184.6k', icon: DollarSign, bg: 'bg-warning/10', color: 'text-warning' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div><p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{k.label}</p><p className="text-2xl font-bold tabular-nums">{k.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Performance por Região</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground border-b pb-2">
              <span>Região</span><span className="text-right">Solicitações</span><span className="text-right">Atendimentos</span><span className="text-right">Prestadores</span><span className="text-right">Receita</span>
            </div>
            {regioes.map(r => {
              const taxaConversao = r.solicitacoes > 0 ? Math.round((r.atendimentos / r.solicitacoes) * 100) : 0;
              return (
                <div key={r.nome} className="grid grid-cols-5 items-center text-[13px] py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.nome}</span>
                    <Badge variant={taxaConversao >= 90 ? 'success' : taxaConversao >= 75 ? 'warning' : 'destructive'} className="text-[10px]">{taxaConversao}%</Badge>
                  </div>
                  <span className="text-right tabular-nums">{r.solicitacoes}</span>
                  <span className="text-right tabular-nums">{r.atendimentos}</span>
                  <span className="text-right tabular-nums">{r.prestadores}</span>
                  <span className="text-right tabular-nums font-medium">{r.receita}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
