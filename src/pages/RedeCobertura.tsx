import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrestadores } from '@/hooks/useSupabaseData';
import { Globe, MapPin, Users, AlertTriangle, Loader2 } from 'lucide-react';

export default function RedeCobertura() {
  const { data: prestadores = [], isLoading } = usePrestadores();

  const byUf = useMemo(() => {
    const map = new Map<string, { count: number; ativos: number; cidades: Set<string> }>();
    prestadores.forEach((p: any) => {
      const uf = p.uf || 'N/D';
      const e = map.get(uf) || { count: 0, ativos: 0, cidades: new Set<string>() };
      e.count++;
      if (p.status === 'ativo' || p.status === 'Ativo') e.ativos++;
      if (p.cidade) e.cidades.add(p.cidade);
      map.set(uf, e);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [prestadores]);

  const totalUfs = byUf.length;
  const totalCidades = new Set(prestadores.map((p: any) => p.cidade).filter(Boolean)).size;
  const semCobertura = byUf.filter(([, v]) => v.ativos === 0).length;

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Cobertura</h1>
          <p>Análise geográfica de cobertura da rede de prestadores por estado e cidade</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><Globe className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Estados</p><p className="kpi-value">{totalUfs}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><MapPin className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Cidades</p><p className="kpi-value">{totalCidades}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Users className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Prestadores</p><p className="kpi-value">{prestadores.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-destructive/10 text-destructive"><AlertTriangle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">UFs sem ativos</p><p className="kpi-value">{semCobertura}</p></div></div>
      </div>

      <div className="grid gap-2.5">
        {byUf.map(([uf, data]) => (
          <Card key={uf} className="card-hover">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-primary">{uf}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[14px]">{uf}</span>
                  <Badge variant={data.ativos > 0 ? 'success' : 'destructive'} className="text-[10px] font-semibold">{data.ativos > 0 ? 'Coberto' : 'Sem cobertura'}</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground">{data.cidades.size} cidade(s) • {data.count} prestador(es) total • {data.ativos} ativo(s)</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold tabular-nums text-foreground">{data.ativos}</p>
                <p className="text-[10px] text-muted-foreground">ativos</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {byUf.length === 0 && (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <div className="empty-state"><div className="empty-state-icon"><Globe className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum dado de cobertura</p><p className="empty-state-description">Cadastre prestadores para visualizar a cobertura geográfica</p></div>
        </CardContent></Card>
      )}
    </div>
  );
}