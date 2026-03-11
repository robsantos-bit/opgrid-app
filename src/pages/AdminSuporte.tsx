import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function AdminSuporte() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Suporte</h1>
          <p>Central de suporte e ajuda do sistema</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <HelpCircle className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: central de suporte</p>
        </CardContent>
      </Card>
    </div>
  );
}
