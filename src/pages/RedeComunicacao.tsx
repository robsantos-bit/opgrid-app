import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function RedeComunicacao() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Comunicação com Prestadores</h1>
          <p>Envie mensagens e notificações para prestadores</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: comunicação com prestadores</p>
        </CardContent>
      </Card>
    </div>
  );
}
