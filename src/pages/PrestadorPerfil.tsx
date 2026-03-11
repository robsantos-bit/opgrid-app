import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePrestadorById } from '@/hooks/useSupabaseData';
import { Loader2, Building2 } from 'lucide-react';

export default function PrestadorPerfil() {
  const { user } = useAuth();
  const { data: prestador, isLoading } = usePrestadorById(user?.provider_id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!prestador) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum prestador vinculado</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto p-4">
      <h1>Meu Perfil</h1>
      <Card>
        <CardContent className="p-5 space-y-3 text-[13px]">
          {[
            ['Nome', prestador.nome],
            ['CNPJ', prestador.cnpj],
            ['Telefone', prestador.telefone],
            ['Tipo', prestador.tipo],
            ['Status', prestador.status],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{val || '—'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
