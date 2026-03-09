import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getAtendimentos, addAtendimento, updateAtendimento, deleteAtendimento, getPrestadores, getTarifas, getTabelaPrecoPrestador } from '@/data/store';
import { Atendimento, AtendimentoTarifa, StatusAtendimento } from '@/types';
import { Plus, Pencil, Trash2, Eye, Search, X, ChevronLeft, Clock } from 'lucide-react';

const STATUS_OPTIONS: StatusAtendimento[] = ['Aberto', 'Em andamento', 'Concluído', 'Cancelado', 'Faturado'];
const TIPOS_ATD = ['Guincho', 'Reboque', 'Resgate', 'Munck', 'Guindaste', 'Carga Especial', 'Outro'];

const statusVariant = (s: StatusAtendimento) => {
  switch (s) {
    case 'Concluído': case 'Faturado': return 'default' as const;
    case 'Cancelado': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

export default function Atendimentos() {
  const [data, setData] = useState(getAtendimentos);
  const prestadores = useMemo(() => getPrestadores(), []);
  const tarifasList = useMemo(() => getTarifas().filter(t => t.situacao === 'Ativo'), []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPrestador, setFilterPrestador] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailAtd, setDetailAtd] = useState<Atendimento | null>(null);
  const [form, setForm] = useState<Partial<Atendimento>>({});
  const [formTarifas, setFormTarifas] = useState<AtendimentoTarifa[]>([]);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = useMemo(() => data.filter(a => {
    const s = search.toLowerCase();
    const match = !s || a.protocolo.toLowerCase().includes(s) || a.clienteNome.toLowerCase().includes(s) || a.placa.toLowerCase().includes(s);
    const matchS = filterStatus === 'all' || a.status === filterStatus;
    const matchP = filterPrestador === 'all' || a.prestadorId === filterPrestador;
    return match && matchS && matchP;
  }), [data, search, filterStatus, filterPrestador]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const openNew = () => {
    const proto = `ATD-2026-${String(data.length + 1).padStart(4, '0')}`;
    setForm({
      protocolo: proto, dataHora: new Date().toISOString().slice(0, 16), clienteNome: '', solicitante: '',
      origem: '', destino: '', tipoAtendimento: 'Guincho', veiculo: '', placa: '',
      kmPrevisto: 0, km: 0, horasTrabalhadas: 0, horasParadas: 0, status: 'Aberto', observacoes: '', prestadorId: '',
    });
    setFormTarifas([]);
    setModalOpen(true);
  };

  const openEdit = (a: Atendimento) => {
    setForm({ ...a });
    setFormTarifas([...a.tarifas]);
    setModalOpen(true);
  };

  const addTarifaLine = () => {
    setFormTarifas(prev => [...prev, { tarifaId: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  };

  const updateTarifaLine = (idx: number, field: string, value: any) => {
    setFormTarifas(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'tarifaId' && form.prestadorId) {
        const precos = getTabelaPrecoPrestador(form.prestadorId);
        const preco = precos.find(p => p.tarifaId === value);
        if (preco) updated[idx].valorUnitario = preco.valor;
      }
      updated[idx].valorTotal = updated[idx].quantidade * updated[idx].valorUnitario;
      return updated;
    });
  };

  const removeTarifaLine = (idx: number) => setFormTarifas(prev => prev.filter((_, i) => i !== idx));
  const totalCalc = formTarifas.reduce((s, t) => s + t.valorTotal, 0);

  const handleSave = () => {
    if (!form.prestadorId || !form.clienteNome) { toast.error('Preencha prestador e cliente.'); return; }
    const now = new Date().toISOString();
    const timeline = form.id
      ? (data.find(a => a.id === form.id)?.timeline || [])
      : [{ data: now, descricao: 'Atendimento aberto' }];

    const atd: Atendimento = {
      ...form as Atendimento,
      id: form.id || `a${Date.now()}`,
      tarifas: formTarifas,
      valorTotal: totalCalc,
      timeline,
    };
    if (form.id) { updateAtendimento(atd); toast.success('Atendimento atualizado!'); }
    else { addAtendimento(atd); toast.success('Atendimento criado!'); }
    setData(getAtendimentos());
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteAtendimento(id);
    setData(getAtendimentos());
    toast.success('Atendimento removido.');
  };

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  // Detail view
  if (detailAtd) {
    const prest = prestadores.find(p => p.id === detailAtd.prestadorId);
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setDetailAtd(null)}><ChevronLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{detailAtd.protocolo}</h1>
            <p className="text-sm text-muted-foreground">{detailAtd.clienteNome} · {prest?.nomeFantasia}</p>
          </div>
          <Badge variant={statusVariant(detailAtd.status)} className="ml-auto">{detailAtd.status}</Badge>
        </div>

        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="tarifas">Tarifas ({detailAtd.tarifas.length})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="mt-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Solicitante:</span> <span className="font-medium ml-1">{detailAtd.solicitante || '-'}</span></div>
                <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium ml-1">{detailAtd.tipoAtendimento}</span></div>
                <div><span className="text-muted-foreground">Veículo:</span> <span className="font-medium ml-1">{detailAtd.veiculo}</span></div>
                <div><span className="text-muted-foreground">Placa:</span> <span className="font-mono font-medium ml-1">{detailAtd.placa}</span></div>
                <div><span className="text-muted-foreground">Origem:</span> <span className="font-medium ml-1">{detailAtd.origem}</span></div>
                <div><span className="text-muted-foreground">Destino:</span> <span className="font-medium ml-1">{detailAtd.destino}</span></div>
                <div><span className="text-muted-foreground">Km Previsto:</span> <span className="font-medium ml-1">{detailAtd.kmPrevisto}</span></div>
                <div><span className="text-muted-foreground">Km Realizado:</span> <span className="font-medium ml-1">{detailAtd.km}</span></div>
                <div><span className="text-muted-foreground">Horas Trabalhadas:</span> <span className="font-medium ml-1">{detailAtd.horasTrabalhadas}</span></div>
                <div><span className="text-muted-foreground">Horas Paradas:</span> <span className="font-medium ml-1">{detailAtd.horasParadas}</span></div>
                <div><span className="text-muted-foreground">Data/Hora:</span> <span className="font-medium ml-1">{new Date(detailAtd.dataHora).toLocaleString('pt-BR')}</span></div>
                <div><span className="text-muted-foreground">Valor Total:</span> <span className="font-bold text-lg ml-1">R$ {detailAtd.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                {detailAtd.observacoes && <div className="col-span-2"><span className="text-muted-foreground">Observações:</span> <span className="ml-1">{detailAtd.observacoes}</span></div>}
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
                      <TableHead>Qtd</TableHead>
                      <TableHead>Unitário</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailAtd.tarifas.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem tarifas aplicadas</TableCell></TableRow>
                    ) : (
                      <>
                        {detailAtd.tarifas.map((t, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{tarifasList.find(x => x.id === t.tarifaId)?.nome || t.tarifaId}</TableCell>
                            <TableCell>{t.quantidade}</TableCell>
                            <TableCell>R$ {t.valorUnitario.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">R$ {t.valorTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                          <TableCell className="text-right font-bold">R$ {detailAtd.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {detailAtd.timeline.map((ev, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                        {i < detailAtd.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">{ev.descricao}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ev.data).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Atendimentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os atendimentos realizados</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Atendimento</Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar protocolo, cliente ou placa..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPrestador} onValueChange={v => { setFilterPrestador(v); setPage(0); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Prestador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Prestadores</SelectItem>
              {prestadores.map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Prestador</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                <TableHead className="hidden xl:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum atendimento</TableCell></TableRow>
              ) : paged.map(a => {
                const prest = prestadores.find(p => p.id === a.prestadorId);
                return (
                  <TableRow key={a.id} className="table-row-hover cursor-pointer" onClick={() => setDetailAtd(a)}>
                    <TableCell className="font-mono text-sm">{a.protocolo}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{a.clienteNome}</p>
                        <p className="text-xs text-muted-foreground">{a.placa}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{prest?.nomeFantasia || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{a.tipoAtendimento}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell><Badge variant={statusVariant(a.status)}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => setDetailAtd(a)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>Deseja excluir o atendimento {a.protocolo}?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(a.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {/* Edit/Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? 'Editar Atendimento' : 'Novo Atendimento'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Protocolo</Label><Input value={form.protocolo || ''} readOnly className="bg-muted" /></div>
              <div className="space-y-1.5"><Label>Data/Hora</Label><Input type="datetime-local" value={form.dataHora?.slice(0, 16) || ''} onChange={e => updateField('dataHora', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status || 'Aberto'} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Prestador *</Label>
                <Select value={form.prestadorId || ''} onValueChange={v => updateField('prestadorId', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{prestadores.filter(p => p.status === 'Ativo').map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Cliente *</Label><Input value={form.clienteNome || ''} onChange={e => updateField('clienteNome', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Solicitante</Label><Input value={form.solicitante || ''} onChange={e => updateField('solicitante', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Tipo</Label>
                <Select value={form.tipoAtendimento || 'Guincho'} onValueChange={v => updateField('tipoAtendimento', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_ATD.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Placa</Label><Input value={form.placa || ''} onChange={e => updateField('placa', e.target.value.toUpperCase())} maxLength={8} /></div>
            </div>
            <div className="space-y-1.5"><Label>Veículo</Label><Input value={form.veiculo || ''} onChange={e => updateField('veiculo', e.target.value)} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Origem</Label><Input value={form.origem || ''} onChange={e => updateField('origem', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Destino</Label><Input value={form.destino || ''} onChange={e => updateField('destino', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5"><Label>Km Previsto</Label><Input type="number" value={form.kmPrevisto || ''} onChange={e => updateField('kmPrevisto', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1.5"><Label>Km Realizado</Label><Input type="number" value={form.km || ''} onChange={e => updateField('km', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1.5"><Label>Horas Trab.</Label><Input type="number" step="0.5" value={form.horasTrabalhadas || ''} onChange={e => updateField('horasTrabalhadas', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1.5"><Label>Horas Paradas</Label><Input type="number" step="0.5" value={form.horasParadas || ''} onChange={e => updateField('horasParadas', parseFloat(e.target.value) || 0)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Observações</Label><Textarea value={form.observacoes || ''} onChange={e => updateField('observacoes', e.target.value)} rows={2} /></div>

            <Separator />
            <div className="flex items-center justify-between">
              <p className="font-medium">Tarifas do Atendimento</p>
              <Button variant="outline" size="sm" onClick={addTarifaLine}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
            </div>
            {formTarifas.map((ft, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1">
                  {idx === 0 && <Label className="text-xs">Tarifa</Label>}
                  <Select value={ft.tarifaId} onValueChange={v => updateTarifaLine(idx, 'tarifaId', v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{tarifasList.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Qtd</Label>}
                  <Input type="number" step="0.5" min="0" className="h-9" value={ft.quantidade} onChange={e => updateTarifaLine(idx, 'quantidade', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Valor Unit.</Label>}
                  <Input type="number" step="0.01" min="0" className="h-9" value={ft.valorUnitario} onChange={e => updateTarifaLine(idx, 'valorUnitario', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Subtotal</Label>}
                  <Input readOnly className="bg-muted font-medium h-9" value={`R$ ${ft.valorTotal.toFixed(2)}`} />
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeTarifaLine(idx)}><X className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            <div className="text-right text-lg font-bold">Total: R$ {totalCalc.toFixed(2)}</div>
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
