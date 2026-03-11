import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePrestadorById } from '@/hooks/useSupabaseData';
import { Loader2, User, Building2, Phone, Tag } from 'lucide-react';

export default function PrestadorInicio() {
  const { user } = useAuth();
  const { data: prestador, isLoading } = usePrestadorById(user?.provider_id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto p-4">
      <div>
        <h1>Portal do Prestador</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Bem-vindo, {user?.nome}</p>
      </div>

      {prestador ? (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{prestador.nome}</p>
                <Badge variant={prestador.status === 'ativo' ? 'success' : 'secondary'}>{prestador.status}</Badge>
              </div>
            </div>
            <div className="space-y-2 text-[13px]">
              {[
                ['CNPJ', prestador.cnpj],
                ['Telefone', prestador.telefone],
                ['Tipo', prestador.tipo],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val || '—'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum prestador vinculado ao seu perfil.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
