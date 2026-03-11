import { Card, CardContent } from '@/components/ui/card';
import { Radio } from 'lucide-react';

export default function OperacaoTesteAcionamento() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Teste de Acionamento</h1>
          <p>Simule acionamentos para validar fluxos operacionais</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Radio className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: teste de acionamento</p>
        </CardContent>
      </Card>
    </div>
  );
}
