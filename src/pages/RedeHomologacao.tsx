import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function RedeHomologacao() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Homologação</h1>
          <p>Gerencie o processo de homologação de prestadores</p>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Shield className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Em breve: homologação de prestadores</p>
        </CardContent>
      </Card>
    </div>
  );
}
