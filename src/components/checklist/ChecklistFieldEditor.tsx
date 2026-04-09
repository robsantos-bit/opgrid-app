import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus, Type, Camera, PenLine, CircleDot, CheckSquare } from 'lucide-react';
import type { ChecklistField, ChecklistFieldType, ChecklistFase } from '@/types/checklist';
import { FIELD_TYPE_LABELS, FASE_LABELS } from '@/types/checklist';

const FIELD_ICONS: Record<ChecklistFieldType, React.ElementType> = {
  texto: Type,
  foto: Camera,
  assinatura: PenLine,
  escolha_unica: CircleDot,
  multipla_escolha: CheckSquare,
};

const FIELD_COLORS: Record<ChecklistFieldType, string> = {
  texto: 'bg-info/15 text-info border-info/20',
  foto: 'bg-success/15 text-success border-success/20',
  assinatura: 'bg-accent/15 text-accent border-accent/20',
  escolha_unica: 'bg-warning/15 text-warning border-warning/20',
  multipla_escolha: 'bg-primary/15 text-primary border-primary/20',
};

interface Props {
  field: ChecklistField;
  index: number;
  total: number;
  onChange: (updated: ChecklistField) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export default function ChecklistFieldEditor({ field, index, total, onChange, onMoveUp, onMoveDown, onRemove }: Props) {
  const Icon = FIELD_ICONS[field.tipo];
  const colorClass = FIELD_COLORS[field.tipo];

  const updateField = (partial: Partial<ChecklistField>) => onChange({ ...field, ...partial });

  const addOption = () => {
    const opcoes = [...(field.opcoes || []), { id: `opt-${Date.now()}`, label: '' }];
    updateField({ opcoes });
  };

  const updateOption = (optId: string, label: string) => {
    const opcoes = (field.opcoes || []).map(o => o.id === optId ? { ...o, label } : o);
    updateField({ opcoes });
  };

  const removeOption = (optId: string) => {
    const opcoes = (field.opcoes || []).filter(o => o.id !== optId);
    updateField({ opcoes });
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />
          <Badge variant="outline" className={`text-[11px] font-semibold gap-1 ${colorClass}`}>
            <Icon className="h-3 w-3" />
            {FIELD_TYPE_LABELS[field.tipo]}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">#{index + 1}</span>
          <div className="ml-auto flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={onMoveUp}><ChevronUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === total - 1} onClick={onMoveDown}><ChevronDown className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Título do Campo</Label>
            <Input value={field.titulo} onChange={e => updateField({ titulo: e.target.value })} placeholder="Ex: Foto Frontal" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</Label>
            <Input value={field.descricao} onChange={e => updateField({ descricao: e.target.value })} placeholder="Instruções adicionais..." />
          </div>

          {/* Options for escolha_unica and multipla_escolha */}
          {(field.tipo === 'escolha_unica' || field.tipo === 'multipla_escolha') && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Opções</Label>
              {(field.opcoes || []).map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Input value={opt.label} onChange={e => updateOption(opt.id, e.target.value)} placeholder="Nome da opção" className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => removeOption(opt.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5 text-xs">
                <Plus className="h-3 w-3" /> Adicionar Opção
              </Button>
            </div>
          )}

          {/* Phase */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Fase do Checklist</Label>
            <Select value={field.fase} onValueChange={(v: ChecklistFase) => updateField({ fase: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="coleta">{FASE_LABELS.coleta}</SelectItem>
                <SelectItem value="entrega">{FASE_LABELS.entrega}</SelectItem>
                <SelectItem value="ambos">{FASE_LABELS.ambos}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Define quando esta pergunta aparece no checklist</p>
          </div>

          {/* Required */}
          <div className="flex items-center gap-2">
            <Switch checked={field.obrigatorio} onCheckedChange={v => updateField({ obrigatorio: v })} />
            <Label className="text-xs font-medium">Campo obrigatório</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}