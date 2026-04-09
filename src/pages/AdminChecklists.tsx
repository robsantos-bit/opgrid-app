import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Search, ListChecks, ArrowLeft, Save, Type, Camera, PenLine, CircleDot, CheckSquare } from 'lucide-react';
import ChecklistModeloCard from '@/components/checklist/ChecklistModeloCard';
import ChecklistFieldEditor from '@/components/checklist/ChecklistFieldEditor';
import type { ChecklistModelo, ChecklistField, ChecklistFieldType, ChecklistFase } from '@/types/checklist';
import { MODELOS_PADRAO, FIELD_TYPE_LABELS, FASE_LABELS } from '@/types/checklist';

type ViewMode = 'list' | 'edit' | 'view';

const NEW_FIELD_DEFAULTS: Record<ChecklistFieldType, Partial<ChecklistField>> = {
  texto: { titulo: 'Novo campo de texto', descricao: '' },
  foto: { titulo: 'Nova foto', descricao: 'Tire uma foto' },
  assinatura: { titulo: 'Assinatura', descricao: '' },
  escolha_unica: { titulo: 'Nova escolha', descricao: '', opcoes: [{ id: 'o1', label: 'Opção 1' }, { id: 'o2', label: 'Opção 2' }] },
  multipla_escolha: { titulo: 'Nova seleção múltipla', descricao: '', opcoes: [{ id: 'o1', label: 'Opção 1' }, { id: 'o2', label: 'Opção 2' }] },
};

export default function AdminChecklists() {
  const [modelos, setModelos] = useState<ChecklistModelo[]>(MODELOS_PADRAO);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingModelo, setEditingModelo] = useState<ChecklistModelo | null>(null);

  const filtered = useMemo(() => modelos.filter(m =>
    !search || m.nome.toLowerCase().includes(search.toLowerCase()) || m.descricao.toLowerCase().includes(search.toLowerCase())
  ), [modelos, search]);

  const openEditor = (modelo: ChecklistModelo, mode: ViewMode = 'edit') => {
    setEditingModelo(JSON.parse(JSON.stringify(modelo)));
    setViewMode(mode);
  };

  const createNew = () => {
    const novo: ChecklistModelo = {
      id: `modelo-${Date.now()}`,
      nome: '',
      descricao: '',
      status: 'Rascunho',
      ativo: true,
      fasePadrao: 'ambos',
      campos: [],
      criadoEm: new Date().toISOString().slice(0, 10),
      atualizadoEm: new Date().toISOString().slice(0, 10),
    };
    openEditor(novo);
  };

  const duplicateModelo = (m: ChecklistModelo) => {
    const dup: ChecklistModelo = {
      ...JSON.parse(JSON.stringify(m)),
      id: `modelo-${Date.now()}`,
      nome: `${m.nome} (Cópia)`,
      status: 'Rascunho' as const,
      criadoEm: new Date().toISOString().slice(0, 10),
      atualizadoEm: new Date().toISOString().slice(0, 10),
    };
    setModelos(prev => [...prev, dup]);
    toast.success('Modelo duplicado com sucesso.');
  };

  const deleteModelo = (id: string) => {
    setModelos(prev => prev.filter(m => m.id !== id));
    toast.success('Modelo excluído.');
  };

  const saveModelo = () => {
    if (!editingModelo) return;
    if (!editingModelo.nome.trim()) { toast.error('Informe o título do checklist.'); return; }
    const updated = { ...editingModelo, atualizadoEm: new Date().toISOString().slice(0, 10) };
    setModelos(prev => {
      const exists = prev.find(m => m.id === updated.id);
      if (exists) return prev.map(m => m.id === updated.id ? updated : m);
      return [...prev, updated];
    });
    setViewMode('list');
    setEditingModelo(null);
    toast.success('Checklist salvo com sucesso.');
  };

  const addField = (tipo: ChecklistFieldType) => {
    if (!editingModelo) return;
    const defaults = NEW_FIELD_DEFAULTS[tipo];
    const field: ChecklistField = {
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tipo,
      titulo: defaults.titulo || '',
      descricao: defaults.descricao || '',
      fase: 'coleta',
      obrigatorio: false,
      ...(defaults.opcoes ? { opcoes: defaults.opcoes } : {}),
    };
    setEditingModelo({ ...editingModelo, campos: [...editingModelo.campos, field] });
  };

  const updateField = (idx: number, updated: ChecklistField) => {
    if (!editingModelo) return;
    const campos = [...editingModelo.campos];
    campos[idx] = updated;
    setEditingModelo({ ...editingModelo, campos });
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    if (!editingModelo) return;
    const campos = [...editingModelo.campos];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= campos.length) return;
    [campos[idx], campos[newIdx]] = [campos[newIdx], campos[idx]];
    setEditingModelo({ ...editingModelo, campos });
  };

  const removeField = (idx: number) => {
    if (!editingModelo) return;
    const campos = editingModelo.campos.filter((_, i) => i !== idx);
    setEditingModelo({ ...editingModelo, campos });
  };

  // ---- EDITOR VIEW ----
  if ((viewMode === 'edit' || viewMode === 'view') && editingModelo) {
    const readOnly = viewMode === 'view';
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setViewMode('list'); setEditingModelo(null); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{readOnly ? 'Visualizar' : editingModelo.id.startsWith('modelo-') && !modelos.find(m => m.id === editingModelo.id) ? 'Novo Checklist' : 'Editar Checklist'}</h1>
            <p className="text-[13px] text-muted-foreground">{readOnly ? 'Detalhes do modelo' : 'Atualize as informações do modelo'}</p>
          </div>
          {!readOnly && (
            <Button onClick={saveModelo} className="gap-1.5"><Save className="h-4 w-4" />Salvar</Button>
          )}
        </div>

        {/* Warning for default templates */}
        {MODELOS_PADRAO.some(m => m.id === editingModelo.id) && !readOnly && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-[12px] text-warning font-medium">Este checklist é um modelo padrão do sistema. Ao salvar, uma cópia personalizada será criada para a sua empresa.</p>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-5 pr-4">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="font-bold text-[15px]">Informações Básicas</h2>
                <p className="text-[12px] text-muted-foreground -mt-3">Nome e descrição do checklist</p>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Título do Checklist</Label>
                  <Input value={editingModelo.nome} readOnly={readOnly} onChange={e => setEditingModelo({ ...editingModelo, nome: e.target.value })} placeholder="Ex: CARRO" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</Label>
                  <Textarea value={editingModelo.descricao} readOnly={readOnly} onChange={e => setEditingModelo({ ...editingModelo, descricao: e.target.value })} placeholder="Descreva o checklist..." rows={3} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <p className="text-[13px] font-semibold">Checklist Ativo</p>
                    <p className="text-[11px] text-muted-foreground">Apenas checklists ativos podem ser usados</p>
                  </div>
                  <Switch checked={editingModelo.ativo} disabled={readOnly} onCheckedChange={v => setEditingModelo({ ...editingModelo, ativo: v, status: v ? 'Ativo' : 'Inativo' })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Fase do Checklist</Label>
                  <p className="text-[11px] text-muted-foreground">Define em qual momento do serviço este checklist será aplicado</p>
                  <Select value={editingModelo.fasePadrao} disabled={readOnly} onValueChange={(v: ChecklistFase) => setEditingModelo({ ...editingModelo, fasePadrao: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coleta">{FASE_LABELS.coleta}</SelectItem>
                      <SelectItem value="entrega">{FASE_LABELS.entrega}</SelectItem>
                      <SelectItem value="ambos">{FASE_LABELS.ambos}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold text-[15px]">Campos do Checklist</h2>
                  <p className="text-[12px] text-muted-foreground">{editingModelo.campos.length} campo(s) configurado(s)</p>
                </div>
              </div>

              <div className="space-y-3">
                {editingModelo.campos.map((field, idx) => (
                  <ChecklistFieldEditor
                    key={field.id}
                    field={field}
                    index={idx}
                    total={editingModelo.campos.length}
                    onChange={updated => updateField(idx, updated)}
                    onMoveUp={() => moveField(idx, -1)}
                    onMoveDown={() => moveField(idx, 1)}
                    onRemove={() => removeField(idx)}
                  />
                ))}
              </div>

              {/* Add field buttons */}
              {!readOnly && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    { tipo: 'texto' as const, icon: Type, label: 'Texto' },
                    { tipo: 'foto' as const, icon: Camera, label: 'Foto' },
                    { tipo: 'assinatura' as const, icon: PenLine, label: 'Assinatura' },
                    { tipo: 'escolha_unica' as const, icon: CircleDot, label: 'Escolha Única' },
                    { tipo: 'multipla_escolha' as const, icon: CheckSquare, label: 'Múltipla Escolha' },
                  ]).map(({ tipo, icon: Icon, label }) => (
                    <Button key={tipo} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => addField(tipo)}>
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Save button at bottom */}
            {!readOnly && (
              <div className="flex gap-3 pt-2 pb-6">
                <Button variant="outline" className="flex-1" onClick={() => { setViewMode('list'); setEditingModelo(null); }}>Cancelar</Button>
                <Button className="flex-1" onClick={saveModelo}><Save className="h-4 w-4 mr-1.5" />Salvar Checklist</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Modelos de Checklist</h1>
          <p>Crie e gerencie seus modelos de checklist</p>
        </div>
        <Button onClick={createNew} className="gap-1.5"><Plus className="h-4 w-4" />Criar Modelo</Button>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar modelos..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-16 text-center">
          <div className="empty-state">
            <div className="empty-state-icon"><ListChecks className="h-5 w-5 text-muted-foreground" /></div>
            <p className="empty-state-title">Nenhum modelo de checklist</p>
            <p className="empty-state-description">Crie modelos para padronizar verificações em campo</p>
          </div>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(m => (
            <ChecklistModeloCard
              key={m.id}
              modelo={m}
              onEdit={() => openEditor(m, 'edit')}
              onView={() => openEditor(m, 'view')}
              onDuplicate={() => duplicateModelo(m)}
              onDelete={() => deleteModelo(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}