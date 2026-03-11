import { Card, CardContent } from '@/components/ui/card';
import { FileSearch } from 'lucide-react';

export default function FinanceiroConferencia() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Conferência</h1>
          <p>Confira valores e documentos financeiros</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileSearch className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: conferência financeira</p>
        </CardContent>
      </Card>
    </div>
  );
}
