import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAtendimentosByPrestador } from '@/hooks/useSupabaseData';
import { Loader2, Headphones } from 'lucide-react';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export default function PrestadorAtendimentos() {
  const { user } = useAuth();
  const { data: atendimentos = [], isLoading } = useAtendimentosByPrestador(user?.provider_id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'finalizado': return 'success' as const;
      case 'em_andamento': return 'info' as const;
      default: return 'secondary' as const;
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { em_andamento: 'Em andamento', finalizado: 'Finalizado' };
    return map[s] || s;
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto p-4">
      <div>
        <h1>Meus Atendimentos</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {atendimentos.length} atendimento{atendimentos.length !== 1 ? 's' : ''} vinculado{atendimentos.length !== 1 ? 's' : ''} ao seu cadastro
        </p>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Placa</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Notas</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Criado</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Finalizado</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {atendimentos.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><Headphones className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum atendimento encontrado</p></div>
              </TableCell></TableRow>
            ) : atendimentos.map((a: any) => (
              <TableRow key={a.id} className="table-row-hover">
                <TableCell><Badge variant={statusVariant(a.status)} className="text-[10px]">{statusLabel(a.status)}</Badge></TableCell>
                <TableCell className="text-[13px]">{a.solicitacoes?.cliente_nome || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground font-mono">{a.solicitacoes?.placa || '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-[12px] text-muted-foreground max-w-[200px] truncate">{a.notas || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{a.created_at ? fmtDate(a.created_at) : '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">
                  {a.finalizado_at ? fmtDate(a.finalizado_at) : <span className="text-info text-[11px]">Em aberto</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
