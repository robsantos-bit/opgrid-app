import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getPrestadores, addPrestador, updatePrestador, deletePrestador, getAtendimentos, getTabelaPrecoPrestador, getTarifas } from '@/data/store';
import { Prestador, PlanoType, StatusType } from '@/types';
import { Plus, Pencil, Trash2, Search, Eye, LayoutGrid, List, ChevronLeft } from 'lucide-react';

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const TIPOS_SERVICO = ['Guincho', 'Reboque', 'Resgate', 'Patins', 'Munck', 'Guindaste', 'Carga Especial'];

const emptyPrestador = (): Partial<Prestador> => ({
  nomeFantasia: '', razaoSocial: '', documento: '', inscricaoEstadual: '', telefone: '', telefone2: '',
  email: '', responsavel: '', cidade: '', uf: 'SP', endereco: '', cep: '', status: 'Ativo', plano: 'Básico',
  observacoes: '', tiposServico: [], areaCobertura: '', aceitaNoturno: false, aceitaRodoviario: false,
});

const statusBadge = (status: StatusType) => {
  switch (status) {
    case 'Ativo': return 'default';
    case 'Inativo': return 'secondary';
    case 'Bloqueado': return 'destructive';
    default: return 'secondary';
  }
};

export default function Prestadores() {
  const [data, setData] = useState(getPrestadores);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlano, setFilterPlano] = useState<string>('all');
  const [filterUf, setFilterUf] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Prestador> | null>(null);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [detailPrestador, setDetailPrestador] = useState<Prestador | null>(null);
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

  const updateField = (field: string, value: any) => {
    setEditing(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const toggleServico = (servico: string) => {
    setEditing(prev => {
      if (!prev) return prev;
      const current = prev.tiposServico || [];
      return { ...prev, tiposServico: current.includes(servico) ? current.filter(s => s !== servico) : [...current, servico] };
    });
  };

  // Detail view
  if (detailPrestador) {
    const atds = getAtendimentos().filter(a => a.prestadorId === detailPrestador.id);
    const precos = getTabelaPrecoPrestador(detailPrestador.id);
    const tarifas = getTarifas();
    const faturamento = atds.filter(a => a.status === 'Concluído' || a.status === 'Faturado').reduce((s, a) => s + a.valorTotal, 0);

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setDetailPrestador(null)}><ChevronLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{detailPrestador.nomeFantasia}</h1>
            <p className="text-sm text-muted-foreground">{detailPrestador.razaoSocial}</p>
          </div>
          <Badge variant={statusBadge(detailPrestador.status)} className="ml-auto">{detailPrestador.status}</Badge>
          <Badge variant="outline">{detailPrestador.plano}</Badge>
        </div>

        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="tarifas">Tarifas ({precos.length})</TabsTrigger>
            <TabsTrigger value="atendimentos">Atendimentos ({atds.length})</TabsTrigger>
            <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="mt-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Documento:</span> <span className="font-medium ml-1">{detailPrestador.documento}</span></div>
                <div><span className="text-muted-foreground">Inscrição Estadual:</span> <span className="font-medium ml-1">{detailPrestador.inscricaoEstadual || '-'}</span></div>
                <div><span className="text-muted-foreground">Responsável:</span> <span className="font-medium ml-1">{detailPrestador.responsavel}</span></div>
                <div><span className="text-muted-foreground">E-mail:</span> <span className="font-medium ml-1">{detailPrestador.email}</span></div>
                <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium ml-1">{detailPrestador.telefone}</span></div>
                <div><span className="text-muted-foreground">Telefone 2:</span> <span className="font-medium ml-1">{detailPrestador.telefone2 || '-'}</span></div>
                <div><span className="text-muted-foreground">Endereço:</span> <span className="font-medium ml-1">{detailPrestador.endereco}</span></div>
                <div><span className="text-muted-foreground">Cidade/UF:</span> <span className="font-medium ml-1">{detailPrestador.cidade}/{detailPrestador.uf}</span></div>
                <div><span className="text-muted-foreground">CEP:</span> <span className="font-medium ml-1">{detailPrestador.cep}</span></div>
                <div><span className="text-muted-foreground">Área Cobertura:</span> <span className="font-medium ml-1">{detailPrestador.areaCobertura || '-'}</span></div>
                <div><span className="text-muted-foreground">Aceita Noturno:</span> <Badge variant={detailPrestador.aceitaNoturno ? 'default' : 'secondary'} className="ml-1">{detailPrestador.aceitaNoturno ? 'Sim' : 'Não'}</Badge></div>
                <div><span className="text-muted-foreground">Aceita Rodoviário:</span> <Badge variant={detailPrestador.aceitaRodoviario ? 'default' : 'secondary'} className="ml-1">{detailPrestador.aceitaRodoviario ? 'Sim' : 'Não'}</Badge></div>
                {detailPrestador.tiposServico.length > 0 && (
                  <div className="col-span-2"><span className="text-muted-foreground">Serviços:</span> <span className="ml-1">{detailPrestador.tiposServico.map(s => <Badge key={s} variant="outline" className="mr-1 mb-1">{s}</Badge>)}</span></div>
                )}
                {detailPrestador.observacoes && (
                  <div className="col-span-2"><span className="text-muted-foreground">Observações:</span> <span className="font-medium ml-1">{detailPrestador.observacoes}</span></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tarifas" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarifa</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Franquia</TableHead>
                      <TableHead>Mínimo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {precos.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma tarifa configurada</TableCell></TableRow>
                    ) : precos.map(tp => (
                      <TableRow key={tp.id}>
                        <TableCell className="font-medium">{tarifas.find(t => t.id === tp.tarifaId)?.nome || tp.tarifaId}</TableCell>
                        <TableCell>R$ {tp.valor.toFixed(2)}</TableCell>
                        <TableCell>{tp.franquia || '-'}</TableCell>
                        <TableCell>R$ {tp.minimo.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="atendimentos" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atds.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum atendimento</TableCell></TableRow>
                    ) : atds.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-sm">{a.protocolo}</TableCell>
                        <TableCell>{a.clienteNome}</TableCell>
                        <TableCell>{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell><Badge variant={a.status === 'Concluído' || a.status === 'Faturado' ? 'default' : a.status === 'Cancelado' ? 'destructive' : 'secondary'}>{a.status}</Badge></TableCell>
                        <TableCell className="text-right font-medium">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="faturamento" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Faturado</p><p className="text-xl font-bold">R$ {faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Atendimentos</p><p className="text-xl font-bold">{atds.length}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-xl font-bold">R$ {atds.length > 0 ? (faturamento / atds.filter(a => a.valorTotal > 0).length || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p></CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prestadores</h1>
          <p className="text-sm text-muted-foreground">Gerencie os prestadores de serviço cadastrados</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode('cards')}><LayoutGrid className="h-4 w-4" /></Button>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Prestador</Button>
        </div>
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
                <SelectItem value="Bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlano} onValueChange={v => { setFilterPlano(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Planos</SelectItem>
                <SelectItem value="Básico">Básico</SelectItem>
                <SelectItem value="Pró">Pró</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUf} onValueChange={v => { setFilterUf(v); setPage(0); }}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">UF</SelectItem>
                {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map(p => (
            <Card key={p.id} className="card-hover cursor-pointer" onClick={() => setDetailPrestador(p)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{p.nomeFantasia}</p>
                    <p className="text-xs text-muted-foreground">{p.razaoSocial}</p>
                  </div>
                  <Badge variant={statusBadge(p.status)}>{p.status}</Badge>
                </div>
                <Separator />
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">{p.cidade}/{p.uf} · {p.telefone}</p>
                  <p className="text-muted-foreground">{p.email}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{p.plano}</Badge>
                  <div className="flex gap-1">
                    {p.aceitaNoturno && <Badge variant="secondary" className="text-[10px]">Noturno</Badge>}
                    {p.aceitaRodoviario && <Badge variant="secondary" className="text-[10px]">Rodoviário</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {paged.length === 0 && <p className="col-span-3 text-center py-8 text-muted-foreground">Nenhum prestador encontrado</p>}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead className="hidden md:table-cell">Documento</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                  <TableHead className="hidden xl:table-cell">Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum prestador encontrado</TableCell></TableRow>
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
                    <TableCell className="hidden xl:table-cell">{p.responsavel}</TableCell>
                    <TableCell><Badge variant={statusBadge(p.status)}>{p.status}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{p.plano}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetailPrestador(p)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>Deseja realmente excluir o prestador "{p.nomeFantasia}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Prestador' : 'Novo Prestador'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nome Fantasia *</Label><Input value={editing?.nomeFantasia || ''} onChange={e => updateField('nomeFantasia', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Razão Social</Label><Input value={editing?.razaoSocial || ''} onChange={e => updateField('razaoSocial', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>CNPJ/CPF *</Label><Input value={editing?.documento || ''} onChange={e => updateField('documento', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Inscrição Estadual</Label><Input value={editing?.inscricaoEstadual || ''} onChange={e => updateField('inscricaoEstadual', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Responsável</Label><Input value={editing?.responsavel || ''} onChange={e => updateField('responsavel', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={editing?.telefone || ''} onChange={e => updateField('telefone', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Telefone 2</Label><Input value={editing?.telefone2 || ''} onChange={e => updateField('telefone2', e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>E-mail *</Label><Input type="email" value={editing?.email || ''} onChange={e => updateField('email', e.target.value)} /></div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Endereço</Label><Input value={editing?.endereco || ''} onChange={e => updateField('endereco', e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5"><Label>Cidade</Label><Input value={editing?.cidade || ''} onChange={e => updateField('cidade', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>UF</Label>
                  <Select value={editing?.uf || 'SP'} onValueChange={v => updateField('uf', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>CEP</Label><Input value={editing?.cep || ''} onChange={e => updateField('cep', e.target.value)} /></div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Plano</Label>
                <Select value={editing?.plano || 'Básico'} onValueChange={v => updateField('plano', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Básico">Básico</SelectItem>
                    <SelectItem value="Pró">Pró</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={editing?.status || 'Ativo'} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Área de Cobertura</Label><Input value={editing?.areaCobertura || ''} onChange={e => updateField('areaCobertura', e.target.value)} /></div>
            </div>

            <div className="space-y-2">
              <Label>Tipos de Serviço</Label>
              <div className="flex flex-wrap gap-3">
                {TIPOS_SERVICO.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={editing?.tiposServico?.includes(s)} onCheckedChange={() => toggleServico(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={editing?.aceitaNoturno || false} onCheckedChange={v => updateField('aceitaNoturno', v)} /><Label>Aceita noturno</Label></div>
              <div className="flex items-center gap-2"><Switch checked={editing?.aceitaRodoviario || false} onCheckedChange={v => updateField('aceitaRodoviario', v)} /><Label>Aceita rodoviário</Label></div>
            </div>

            <div className="space-y-1.5"><Label>Observações</Label><Textarea value={editing?.observacoes || ''} onChange={e => updateField('observacoes', e.target.value)} rows={3} /></div>
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
