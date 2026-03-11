import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function AdminPermissoes() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Permissões</h1>
          <p>Gerencie perfis de acesso e permissões do sistema</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: gestão de permissões</p>
        </CardContent>
      </Card>
    </div>
  );
}
