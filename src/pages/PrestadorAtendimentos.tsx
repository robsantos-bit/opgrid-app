import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAtendimentosByPrestador } from '@/hooks/useSupabaseData';
import { Loader2, Headphones } from 'lucide-react';

export default function PrestadorAtendimentos() {
  const { user } = useAuth();
  const { data: atendimentos = [], isLoading } = useAtendimentosByPrestador(user?.provider_id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statusVariant = (status: string) => {
    const s = status?.toLowerCase();
    if (s?.includes('conclu') || s?.includes('fatura')) return 'success' as const;
    if (s?.includes('cancel')) return 'destructive' as const;
    return 'info' as const;
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto p-4">
      <div>
        <h1>Meus Atendimentos</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Atendimentos vinculados ao seu cadastro</p>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Notas</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Criado em</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Finalizado em</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {atendimentos.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><Headphones className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum atendimento encontrado</p></div>
              </TableCell></TableRow>
            ) : atendimentos.map((a: any) => (
              <TableRow key={a.id} className="table-row-hover">
                <TableCell><Badge variant={statusVariant(a.status)}>{a.status || '—'}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[13px]">{a.solicitacoes?.cliente_nome || '—'}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground max-w-[200px] truncate">{a.notas || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{a.finalizado_at ? new Date(a.finalizado_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
