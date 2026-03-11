import { Card, CardContent } from '@/components/ui/card';
import { TableProperties } from 'lucide-react';

export default function FinanceiroTabelas() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Tabelas Comerciais</h1>
          <p>Gerencie as tabelas de preços e condições comerciais</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <TableProperties className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: tabelas comerciais</p>
        </CardContent>
      </Card>
    </div>
  );
}
