import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';

export default function AdminAuditoria() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Auditoria</h1>
          <p>Histórico de ações e logs do sistema</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <History className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: logs de auditoria</p>
        </CardContent>
      </Card>
    </div>
  );
}
