import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function RedeDisparoMassa() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Disparo em Massa</h1>
          <p>Envie comunicações em larga escala para a rede</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Megaphone className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: disparo em massa</p>
        </CardContent>
      </Card>
    </div>
  );
}
