import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProfiles } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, ShieldCheck } from 'lucide-react';

const roleLabels: Record<string, string> = { admin: 'Admin', operador: 'Operador', financeiro: 'Financeiro', comercial: 'Comercial', prestador: 'Prestador' };
const roleVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { admin: 'default', operador: 'secondary', financeiro: 'secondary', comercial: 'secondary', prestador: 'outline' };

export default function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const { data: profiles = [], isLoading } = useProfiles();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Usuários</h1>
          <p>Usuários do sistema com perfis e permissões</p>
        </div>
      </div>

      {currentUser && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-semibold">Logado como: {currentUser.nome}</p>
              <p className="text-[11px] text-muted-foreground">{currentUser.email} · {roleLabels[currentUser.role] || currentUser.role}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">E-mail</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Perfil</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Provider ID</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p></div>
              </TableCell></TableRow>
            ) : profiles.map((p: any) => {
              const role = p.user_roles?.[0]?.role || p.user_roles?.role || '—';
              return (
                <TableRow key={p.id} className={`table-row-hover ${p.id === currentUser?.id ? 'bg-primary/5' : ''}`}>
                  <TableCell className="font-medium text-[13px]">
                    {p.nome || '—'}
                    {p.id === currentUser?.id && <Badge variant="outline" className="ml-2 text-[9px]">Você</Badge>}
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{p.email || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[role] || 'secondary'} className="text-[10px]">
                      {roleLabels[role] || role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground font-mono">{p.provider_id || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
