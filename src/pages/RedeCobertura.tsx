import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';

export default function RedeCobertura() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Cobertura</h1>
          <p>Mapa de cobertura da rede de prestadores</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Globe className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: mapa de cobertura</p>
        </CardContent>
      </Card>
    </div>
  );
}
