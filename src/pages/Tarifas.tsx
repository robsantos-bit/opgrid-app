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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getTarifas, addTarifa, updateTarifa, deleteTarifa } from '@/data/store';
import { Tarifa, UnidadeMedida, FormaCobranca, NivelTarifa, CategoriaTarifa } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Pencil, Info, Search, Copy, Ban, Lock } from 'lucide-react';

const UNIDADES: UnidadeMedida[] = ['Quilometragem', 'Hora', 'Unidade', 'Dia'];
const FORMAS: FormaCobranca[] = ['Valor unitário', 'Valor final', 'Limite de valor'];
const CATEGORIAS: CategoriaTarifa[] = ['Deslocamento', 'Tempo', 'Adicional', 'Equipamento', 'Desconto', 'Ajuste'];

const categoriaBadgeColor = (cat: CategoriaTarifa) => {
  switch (cat) {
    case 'Deslocamento': return 'bg-primary/10 text-primary border-primary/20';
    case 'Tempo': return 'bg-info/10 text-info border-info/20';
    case 'Adicional': return 'bg-warning/10 text-warning border-warning/20';
    case 'Equipamento': return 'bg-accent/10 text-accent border-accent/20';
    case 'Desconto': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'Ajuste': return 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20';
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
  const [filterForma, setFilterForma] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Tarifa> | null>(null);

  const filtered = useMemo(() => {
    return data.filter(t => {
      const s = search.toLowerCase();
      const matchSearch = !s || t.nome.toLowerCase().includes(s) || t.codigo.toLowerCase().includes(s);
      const matchSit = filterSituacao === 'all' || t.situacao === filterSituacao;
      const matchUni = filterUnidade === 'all' || t.unidadeMedida === filterUnidade;
      const matchForma = filterForma === 'all' || t.formaCobranca === filterForma;
      const matchCat = filterCategoria === 'all' || t.categoria === filterCategoria;
      const matchNivel = filterNivel === 'all' || t.nivel === filterNivel;
      return matchSearch && matchSit && matchUni && matchForma && matchCat && matchNivel;
    });
  }, [data, search, filterSituacao, filterUnidade, filterForma, filterCategoria, filterNivel]);

  const canEdit = (t: Tarifa) => isAdmin || t.nivel === 'Usuário';

  const openEdit = (t: Tarifa) => {
    if (!canEdit(t)) {
      toast.info('Tarifas de nível Sistema só podem ser editadas pelo administrador.');
      return;
    }
    setEditing({ ...t });
    setModalOpen(true);
  };

  const openNew = () => {
    if (!isAdmin) {
      toast.info('Apenas administradores podem criar novas tarifas.');
      return;
    }
    setEditing(emptyTarifa());
    setModalOpen(true);
  };

  const handleDuplicate = (t: Tarifa) => {
    const dup: Tarifa = { ...t, id: `t${Date.now()}`, nome: `${t.nome} (Cópia)`, codigo: `${t.codigo}_CP`, nivel: 'Usuário' };
    addTarifa(dup);
    setData(getTarifas());
    toast.success('Tarifa duplicada!');
  };

  const handleToggleSituacao = (t: Tarifa) => {
    if (!canEdit(t)) return;
    updateTarifa({ ...t, situacao: t.situacao === 'Ativo' ? 'Inativo' : 'Ativo' });
    setData(getTarifas());
    toast.success(`Tarifa ${t.situacao === 'Ativo' ? 'inativada' : 'ativada'}.`);
  };

  const handleSave = () => {
    if (!editing?.nome) { toast.error('Informe o nome da tarifa.'); return; }
    if (!editing?.codigo) { toast.error('Informe o código da tarifa.'); return; }
    if (editing.id) {
      updateTarifa(editing as Tarifa);
      toast.success('Tarifa atualizada!');
    } else {
      addTarifa({ ...editing as Tarifa, id: `t${Date.now()}` });
      toast.success('Tarifa cadastrada!');
    }
    setData(getTarifas());
    setModalOpen(false);
  };

  const updateField = (field: string, value: any) => {
    setEditing(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarifas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as tarifas do sistema ({data.filter(t => t.nivel === 'Sistema').length} sistema · {data.filter(t => t.nivel === 'Usuário').length} customizadas)</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Tarifa</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tarifa ou código..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Categorias</SelectItem>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSituacao} onValueChange={setFilterSituacao}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Situação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Situação</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Nível</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
                <SelectItem value="Usuário">Usuário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Unidades</SelectItem>
                {UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Cód</TableHead>
                <TableHead>Tarifa</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead className="hidden md:table-cell">Unidade</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="hidden lg:table-cell">Nível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma tarifa encontrada</TableCell></TableRow>
              ) : filtered.map(t => (
                <TableRow key={t.id} className="table-row-hover">
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.codigo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.nome}</span>
                      {t.nivel === 'Sistema' && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {t.permiteRepetir && (
                        <Tooltip>
                          <TooltipTrigger><Badge variant="outline" className="text-[10px]">Repetível</Badge></TooltipTrigger>
                          <TooltipContent>Permite repetir no atendimento</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {t.descricao && <p className="text-xs text-muted-foreground mt-0.5 max-w-[250px] truncate">{t.descricao}</p>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className={`text-[10px] ${categoriaBadgeColor(t.categoria)}`}>{t.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{t.formaCobranca}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{t.unidadeMedida}</TableCell>
                  <TableCell>
                    <Badge variant={t.situacao === 'Ativo' ? 'default' : 'secondary'}>{t.situacao}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={t.nivel === 'Sistema' ? 'outline' : 'secondary'}>{t.nivel}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit(t) ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleSituacao(t)} title={t.situacao === 'Ativo' ? 'Inativar' : 'Ativar'}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex"><Button variant="ghost" size="icon" disabled><Info className="h-4 w-4 text-muted-foreground" /></Button></span>
                          </TooltipTrigger>
                          <TooltipContent>Tarifa de nível Sistema — edição restrita ao administrador.</TooltipContent>
                        </Tooltip>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(t)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Tarifa' : 'Nova Tarifa'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5"><Label>Nome *</Label><Input value={editing?.nome || ''} onChange={e => updateField('nome', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Código *</Label><Input value={editing?.codigo || ''} onChange={e => updateField('codigo', e.target.value.toUpperCase())} maxLength={5} /></div>
            </div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={editing?.descricao || ''} onChange={e => updateField('descricao', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Categoria</Label>
                <Select value={editing?.categoria || 'Adicional'} onValueChange={v => updateField('categoria', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Unidade de Medida</Label>
                <Select value={editing?.unidadeMedida || 'Unidade'} onValueChange={v => updateField('unidadeMedida', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Forma de Cobrança</Label>
                <Select value={editing?.formaCobranca || 'Valor unitário'} onValueChange={v => updateField('formaCobranca', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Situação</Label>
                <Select value={editing?.situacao || 'Ativo'} onValueChange={v => updateField('situacao', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nível</Label>
                <Select value={editing?.nivel || 'Usuário'} onValueChange={v => updateField('nivel', v)} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sistema">Sistema</SelectItem>
                    <SelectItem value="Usuário">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-3">
                  <Switch checked={editing?.permiteRepetir || false} onCheckedChange={v => updateField('permiteRepetir', v)} />
                  <Label>Permite repetir</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
