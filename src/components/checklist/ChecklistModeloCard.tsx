import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Eye, Copy, Trash2, ListChecks } from 'lucide-react';
import type { ChecklistModelo } from '@/types/checklist';

interface Props {
  modelo: ChecklistModelo;
  onEdit: () => void;
  onView: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ChecklistModeloCard({ modelo, onEdit, onView, onDuplicate, onDelete }: Props) {
  const statusColor = modelo.status === 'Ativo' ? 'success' : modelo.status === 'Rascunho' ? 'warning' : 'secondary';

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListChecks className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-[14px]">{modelo.nome}</h3>
              <Badge variant="outline" className="text-[10px] font-semibold mt-0.5">Padrão</Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onView}><Eye className="h-3.5 w-3.5 mr-2" />Visualizar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="h-3.5 w-3.5 mr-2" />Duplicar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-[12px] text-muted-foreground mb-3 line-clamp-2">{modelo.descricao}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">📋 {modelo.campos.length} campos</span>
            <span className="flex items-center gap-1">📅 {new Date(modelo.atualizadoEm).toLocaleDateString('pt-BR')}</span>
          </div>
          <Badge variant={statusColor} className="font-semibold text-[10px]">{modelo.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}