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
import { toast } from 'sonner';
import { getTarifas, addTarifa, updateTarifa } from '@/data/store';
import { Tarifa, UnidadeMedida, FormaCobranca, NivelTarifa } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Pencil, Info, Search } from 'lucide-react';

const UNIDADES: UnidadeMedida[] = ['Quilometragem', 'Hora', 'Unidade', 'Dia'];
const FORMAS: FormaCobranca[] = ['Valor unitário', 'Valor final', 'Limite de valor'];

const emptyTarifa = (): Partial<Tarifa> => ({
  nome: '', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Usuário',
});

export default function Tarifas() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(getTarifas);
  const [search, setSearch] = useState('');
  const [filterSituacao, setFilterSituacao] = useState<string>('all');
  const [filterUnidade, setFilterUnidade] = useState<string>('all');
  const [filterForma, setFilterForma] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Tarifa> | null>(null);

  const filtered = useMemo(() => {
    return data.filter(t => {
      const s = search.toLowerCase();
      const matchSearch = !s || t.nome.toLowerCase().includes(s);
      const matchSit = filterSituacao === 'all' || t.situacao === filterSituacao;
      const matchUni = filterUnidade === 'all' || t.unidadeMedida === filterUnidade;
      const matchForma = filterForma === 'all' || t.formaCobranca === filterForma;
      return matchSearch && matchSit && matchUni && matchForma;
    });
  }, [data, search, filterSituacao, filterUnidade, filterForma]);

  const canEdit = (t: Tarifa) => isAdmin || t.nivel === 'Usuário';

  const openEdit = (t: Tarifa) => {
    if (!canEdit(t)) {
      toast.info('Tarifas de nível Sistema só podem ser editadas pelo administrador.');
      return;
    }
    setEditing({ ...t });
    setModalOpen(true);
  };

  const openNew = () => { setEditing(emptyTarifa()); setModalOpen(true); };

  const handleSave = () => {
    if (!editing?.nome) { toast.error('Informe o nome da tarifa.'); return; }
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
          <p className="text-sm text-muted-foreground">Gerencie as tarifas do sistema</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Tarifa</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tarifa..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterSituacao} onValueChange={setFilterSituacao}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Situação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Situações</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterForma} onValueChange={setFilterForma}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cobrança" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Formas</SelectItem>
                {FORMAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
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
                <TableHead>Tarifa</TableHead>
                <TableHead>Forma de Cobrança</TableHead>
                <TableHead className="hidden md:table-cell">Unidade de Medida</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="hidden lg:table-cell">Nível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma tarifa encontrada</TableCell></TableRow>
              ) : filtered.map(t => (
                <TableRow key={t.id} className="table-row-hover">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.nome}</span>
                      {t.permiteRepetir && (
                        <Tooltip>
                          <TooltipTrigger><Badge variant="outline" className="text-[10px]">Repetível</Badge></TooltipTrigger>
                          <TooltipContent>Permite repetir no atendimento</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{t.formaCobranca}</TableCell>
                  <TableCell className="hidden md:table-cell">{t.unidadeMedida}</TableCell>
                  <TableCell>
                    <Badge variant={t.situacao === 'Ativo' ? 'default' : 'secondary'}>{t.situacao}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={t.nivel === 'Sistema' ? 'outline' : 'secondary'}>{t.nivel}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit(t) ? (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button variant="ghost" size="icon" disabled>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Tarifa de nível Sistema. Somente tarifas de nível Usuário com plano Pró podem ser editadas.</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Tarifa' : 'Nova Tarifa'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={editing?.nome || ''} onChange={e => updateField('nome', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Unidade de Medida</Label>
                <Select value={editing?.unidadeMedida || 'Unidade'} onValueChange={v => updateField('unidadeMedida', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de Cobrança</Label>
                <Select value={editing?.formaCobranca || 'Valor unitário'} onValueChange={v => updateField('formaCobranca', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Situação</Label>
                <Select value={editing?.situacao || 'Ativo'} onValueChange={v => updateField('situacao', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nível</Label>
                <Select value={editing?.nivel || 'Usuário'} onValueChange={v => updateField('nivel', v)} disabled={!isAdmin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sistema">Sistema</SelectItem>
                    <SelectItem value="Usuário">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editing?.permiteRepetir || false} onCheckedChange={v => updateField('permiteRepetir', v)} />
              <Label>Permite repetir no atendimento</Label>
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
