import { Card, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export default function AdminAutomacoes() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Automações</h1>
          <p>Configure automações e fluxos do sistema</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Zap className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: configuração de automações</p>
        </CardContent>
      </Card>
    </div>
  );
}
