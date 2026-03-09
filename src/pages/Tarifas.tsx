import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getTarifas, addTarifa, updateTarifa } from '@/data/store';
import { Tarifa, UnidadeMedida, FormaCobranca, CategoriaTarifa } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Pencil, Info, Search, Copy, Ban, Lock, Tag } from 'lucide-react';

const UNIDADES: UnidadeMedida[] = ['Quilometragem', 'Hora', 'Unidade', 'Dia'];
const FORMAS: FormaCobranca[] = ['Valor unitário', 'Valor final', 'Limite de valor'];
const CATEGORIAS: CategoriaTarifa[] = ['Deslocamento', 'Tempo', 'Adicional', 'Equipamento', 'Desconto', 'Ajuste'];

const catVariant = (cat: CategoriaTarifa) => {
  switch (cat) {
    case 'Deslocamento': return 'default';
    case 'Tempo': return 'info';
    case 'Adicional': return 'warning';
    case 'Equipamento': return 'success';
    case 'Desconto': return 'destructive';
    case 'Ajuste': return 'secondary';
  }
};

const emptyTarifa = (): Partial<Tarifa> => ({
  nome: '', codigo: '', descricao: '', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Usuário', categoria: 'Adicional',
});

export default function Tarifas() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(getTarifas);
  const [search, setSearch] = useState('');
  const [filterSituacao, setFilterSituacao] = useState<string>('all');
  const [filterUnidade, setFilterUnidade] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Tarifa> | null>(null);

  const filtered = useMemo(() => {
    return data.filter(t => {
      const s = search.toLowerCase();
      return (!s || t.nome.toLowerCase().includes(s) || t.codigo.toLowerCase().includes(s))
        && (filterSituacao === 'all' || t.situacao === filterSituacao)
        && (filterUnidade === 'all' || t.unidadeMedida === filterUnidade)
        && (filterCategoria === 'all' || t.categoria === filterCategoria)
        && (filterNivel === 'all' || t.nivel === filterNivel);
    });
  }, [data, search, filterSituacao, filterUnidade, filterCategoria, filterNivel]);

  const canEdit = (t: Tarifa) => isAdmin || t.nivel === 'Usuário';

  const openEdit = (t: Tarifa) => {
    if (!canEdit(t)) { toast.info('Tarifas de nível Sistema só podem ser editadas pelo administrador.'); return; }
    setEditing({ ...t }); setModalOpen(true);
  };

  const openNew = () => {
    if (!isAdmin) { toast.info('Apenas administradores podem criar novas tarifas.'); return; }
    setEditing(emptyTarifa()); setModalOpen(true);
  };

  const handleDuplicate = (t: Tarifa) => {
    addTarifa({ ...t, id: `t${Date.now()}`, nome: `${t.nome} (Cópia)`, codigo: `${t.codigo}_CP`, nivel: 'Usuário' });
    setData(getTarifas()); toast.success('Tarifa duplicada com sucesso.');
  };

  const handleToggle = (t: Tarifa) => {
    if (!canEdit(t)) return;
    updateTarifa({ ...t, situacao: t.situacao === 'Ativo' ? 'Inativo' : 'Ativo' });
    setData(getTarifas()); toast.success(`Tarifa ${t.situacao === 'Ativo' ? 'inativada' : 'ativada'}.`);
  };

  const handleSave = () => {
    if (!editing?.nome || !editing?.codigo) { toast.error('Preencha nome e código obrigatórios.'); return; }
    if (editing.id) { updateTarifa(editing as Tarifa); toast.success('Tarifa atualizada.'); }
    else { addTarifa({ ...editing as Tarifa, id: `t${Date.now()}` }); toast.success('Tarifa cadastrada.'); }
    setData(getTarifas()); setModalOpen(false);
  };

  const updateField = (field: string, value: any) => setEditing(prev => prev ? { ...prev, [field]: value } : prev);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Tarifas</h1>
          <p>Motor de governança comercial — padronize, versione e controle tarifas da rede</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[12px] text-muted-foreground">
            <Badge variant="outline" className="font-semibold">{data.filter(t => t.nivel === 'Sistema').length} sistema</Badge>
            <Badge variant="secondary" className="font-semibold">{data.filter(t => t.nivel === 'Usuário').length} customizadas</Badge>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Nova Tarifa</Button>
        </div>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tarifa ou código..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="all">Categorias</SelectItem>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={filterSituacao} onValueChange={setFilterSituacao}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Situação" /></SelectTrigger><SelectContent><SelectItem value="all">Situação</SelectItem><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select>
          <Select value={filterNivel} onValueChange={setFilterNivel}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Nível" /></SelectTrigger><SelectContent><SelectItem value="all">Nível</SelectItem><SelectItem value="Sistema">Sistema</SelectItem><SelectItem value="Usuário">Usuário</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold w-[55px]">Cód</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tarifa</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell font-semibold">Categoria</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cobrança</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell font-semibold">Unidade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Situação</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden lg:table-cell font-semibold">Nível</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><Tag className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhuma tarifa encontrada</p><p className="empty-state-description">Ajuste os filtros ou crie uma nova tarifa</p></div>
              </TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id} className="table-row-hover">
                <TableCell className="font-mono text-[11px] text-muted-foreground font-semibold">{t.codigo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[13px]">{t.nome}</span>
                    {t.nivel === 'Sistema' && <Lock className="h-3 w-3 text-muted-foreground/40" />}
                    {t.permiteRepetir && <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold">Repetível</Badge>}
                  </div>
                  {t.descricao && <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[240px] truncate">{t.descricao}</p>}
                </TableCell>
                <TableCell className="hidden md:table-cell"><Badge variant={catVariant(t.categoria) as any} className="font-semibold">{t.categoria}</Badge></TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{t.formaCobranca}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{t.unidadeMedida}</TableCell>
                <TableCell><Badge variant={t.situacao === 'Ativo' ? 'success' : 'secondary'} className="font-semibold">{t.situacao}</Badge></TableCell>
                <TableCell className="hidden lg:table-cell"><Badge variant={t.nivel === 'Sistema' ? 'outline' : 'secondary'} className="font-semibold">{t.nivel}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-0.5">
                    {canEdit(t) ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(t)}><Ban className="h-3.5 w-3.5" /></Button>
                      </>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild><span><Button variant="ghost" size="icon" className="h-8 w-8" disabled><Info className="h-3.5 w-3.5" /></Button></span></TooltipTrigger>
                        <TooltipContent>Tarifa de nível Sistema — edição restrita ao administrador.</TooltipContent>
                      </Tooltip>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(t)}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader><DialogTitle className="text-lg">{editing?.id ? 'Editar Tarifa' : 'Nova Tarifa'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={editing?.nome || ''} onChange={e => updateField('nome', e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Código *</Label><Input value={editing?.codigo || ''} onChange={e => updateField('codigo', e.target.value.toUpperCase())} maxLength={5} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Descrição</Label><Textarea value={editing?.descricao || ''} onChange={e => updateField('descricao', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Categoria</Label><Select value={editing?.categoria || 'Adicional'} onValueChange={v => updateField('categoria', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Unidade</Label><Select value={editing?.unidadeMedida || 'Unidade'} onValueChange={v => updateField('unidadeMedida', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Cobrança</Label><Select value={editing?.formaCobranca || 'Valor unitário'} onValueChange={v => updateField('formaCobranca', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FORMAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Situação</Label><Select value={editing?.situacao || 'Ativo'} onValueChange={v => updateField('situacao', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Nível</Label><Select value={editing?.nivel || 'Usuário'} onValueChange={v => updateField('nivel', v)} disabled={!isAdmin}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Sistema">Sistema</SelectItem><SelectItem value="Usuário">Usuário</SelectItem></SelectContent></Select></div>
              <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-[13px] cursor-pointer"><Switch checked={editing?.permiteRepetir || false} onCheckedChange={v => updateField('permiteRepetir', v)} />Permite repetir no atendimento</label></div>
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Salvar Tarifa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
