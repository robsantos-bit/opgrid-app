import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getPrestadores, addPrestador, updatePrestador, deletePrestador } from '@/data/store';
import { Prestador, PlanoType, StatusType } from '@/types';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const emptyPrestador = (): Partial<Prestador> => ({
  nomeFantasia: '', razaoSocial: '', documento: '', telefone: '', email: '', cidade: '', uf: 'SP', status: 'Ativo', plano: 'Básico', observacoes: '',
});

export default function Prestadores() {
  const [data, setData] = useState(getPrestadores);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlano, setFilterPlano] = useState<string>('all');
  const [filterUf, setFilterUf] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Prestador> | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = useMemo(() => {
    return data.filter(p => {
      const s = search.toLowerCase();
      const matchSearch = !s || p.nomeFantasia.toLowerCase().includes(s) || p.razaoSocial.toLowerCase().includes(s) || p.documento.includes(s) || p.email.toLowerCase().includes(s);
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchPlano = filterPlano === 'all' || p.plano === filterPlano;
      const matchUf = filterUf === 'all' || p.uf === filterUf;
      return matchSearch && matchStatus && matchPlano && matchUf;
    });
  }, [data, search, filterStatus, filterPlano, filterUf]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const openNew = () => { setEditing(emptyPrestador()); setModalOpen(true); };
  const openEdit = (p: Prestador) => { setEditing({ ...p }); setModalOpen(true); };

  const handleSave = () => {
    if (!editing?.nomeFantasia || !editing.documento || !editing.email) {
      toast.error('Preencha os campos obrigatórios: Nome Fantasia, Documento e E-mail.');
      return;
    }
    if (editing.id) {
      updatePrestador(editing as Prestador);
      toast.success('Prestador atualizado com sucesso!');
    } else {
      const newP: Prestador = { ...editing as Prestador, id: `p${Date.now()}` };
      addPrestador(newP);
      toast.success('Prestador cadastrado com sucesso!');
    }
    setData(getPrestadores());
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    deletePrestador(id);
    setData(getPrestadores());
    toast.success('Prestador removido.');
  };

  const updateField = (field: string, value: string) => {
    setEditing(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prestadores</h1>
          <p className="text-sm text-muted-foreground">Gerencie os prestadores de serviço</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Prestador</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, documento ou e-mail..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlano} onValueChange={v => { setFilterPlano(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Planos</SelectItem>
                <SelectItem value="Básico">Básico</SelectItem>
                <SelectItem value="Pró">Pró</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUf} onValueChange={v => { setFilterUf(v); setPage(0); }}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos UFs</SelectItem>
                {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
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
                <TableHead>Nome Fantasia</TableHead>
                <TableHead className="hidden md:table-cell">Documento</TableHead>
                <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum prestador encontrado</TableCell></TableRow>
              ) : paged.map(p => (
                <TableRow key={p.id} className="table-row-hover">
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.nomeFantasia}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">{p.documento}</TableCell>
                  <TableCell className="hidden lg:table-cell">{p.cidade}/{p.uf}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'Ativo' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.plano}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} registro(s)</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="flex items-center px-3 text-sm">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Prestador' : 'Novo Prestador'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome Fantasia *</Label>
                <Input value={editing?.nomeFantasia || ''} onChange={e => updateField('nomeFantasia', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Razão Social</Label>
                <Input value={editing?.razaoSocial || ''} onChange={e => updateField('razaoSocial', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Documento (CNPJ/CPF) *</Label>
                <Input value={editing?.documento || ''} onChange={e => updateField('documento', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={editing?.telefone || ''} onChange={e => updateField('telefone', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" value={editing?.email || ''} onChange={e => updateField('email', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-1 sm:col-span-1">
                <Label>Cidade</Label>
                <Input value={editing?.cidade || ''} onChange={e => updateField('cidade', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Select value={editing?.uf || 'SP'} onValueChange={v => updateField('uf', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={editing?.plano || 'Básico'} onValueChange={v => updateField('plano', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Básico">Básico</SelectItem>
                    <SelectItem value="Pró">Pró</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editing?.status || 'Ativo'} onValueChange={v => updateField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={editing?.observacoes || ''} onChange={e => updateField('observacoes', e.target.value)} rows={3} />
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
