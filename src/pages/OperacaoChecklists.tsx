import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

export default function OperacaoChecklists() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Checklists Executados</h1>
          <p>Visualize checklists preenchidos em campo</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckSquare className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: checklists executados</p>
        </CardContent>
      </Card>
    </div>
  );
}
