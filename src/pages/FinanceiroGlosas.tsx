import { Card, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function FinanceiroGlosas() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Glosas</h1>
          <p>Gerencie glosas e contestações</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <XCircle className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: gestão de glosas</p>
        </CardContent>
      </Card>
    </div>
  );
}
