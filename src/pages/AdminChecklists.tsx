import { Card, CardContent } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

export default function AdminChecklists() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Checklists Digitais</h1>
          <p>Configure modelos de checklists para uso em campo</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ListChecks className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: checklists digitais</p>
        </CardContent>
      </Card>
    </div>
  );
}
