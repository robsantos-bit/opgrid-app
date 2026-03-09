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
import { Atendimento, AtendimentoTarifa, StatusAtendimento, PrioridadeAtendimento } from '@/types';
import { Plus, Pencil, Trash2, Eye, Search, X, ChevronLeft, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS: StatusAtendimento[] = ['Aberto', 'Em andamento', 'Concluído', 'Cancelado', 'Faturado'];
const PRIORIDADE_OPTIONS: PrioridadeAtendimento[] = ['Normal', 'Urgente', 'Crítico'];
const TIPOS_ATD = ['Guincho', 'Reboque', 'Resgate', 'Munck', 'Guindaste', 'Carga Especial', 'Outro'];

const statusVariant = (s: StatusAtendimento) => {
  switch (s) { case 'Concluído': case 'Faturado': return 'success' as const; case 'Cancelado': return 'destructive' as const; case 'Aberto': return 'warning' as const; default: return 'info' as const; }
};

const prioridadeVariant = (p: PrioridadeAtendimento) => {
  switch (p) { case 'Crítico': return 'destructive' as const; case 'Urgente': return 'warning' as const; default: return 'secondary' as const; }
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
    return (!s || a.protocolo.toLowerCase().includes(s) || a.clienteNome.toLowerCase().includes(s) || a.placa.toLowerCase().includes(s))
      && (filterStatus === 'all' || a.status === filterStatus)
      && (filterPrestador === 'all' || a.prestadorId === filterPrestador);
  }), [data, search, filterStatus, filterPrestador]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const openNew = () => {
    const proto = `ATD-2026-${String(data.length + 1).padStart(4, '0')}`;
    setForm({ protocolo: proto, dataHora: new Date().toISOString().slice(0, 16), clienteNome: '', solicitante: '', origem: '', destino: '', tipoAtendimento: 'Guincho', veiculo: '', placa: '', kmPrevisto: 0, km: 0, horasTrabalhadas: 0, horasParadas: 0, status: 'Aberto', prioridade: 'Normal', observacoes: '', prestadorId: '' });
    setFormTarifas([]); setModalOpen(true);
  };
  const openEdit = (a: Atendimento) => { setForm({ ...a }); setFormTarifas([...a.tarifas]); setModalOpen(true); };
  const addTarifaLine = () => setFormTarifas(prev => [...prev, { tarifaId: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }]);
  const updateTarifaLine = (idx: number, field: string, value: any) => {
    setFormTarifas(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'tarifaId' && form.prestadorId) {
        const preco = getTabelaPrecoPrestador(form.prestadorId).find(p => p.tarifaId === value);
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
    const timeline = form.id ? (data.find(a => a.id === form.id)?.timeline || []) : [{ data: now, descricao: 'Atendimento aberto' }];
    const atd: Atendimento = { ...form as Atendimento, id: form.id || `a${Date.now()}`, tarifas: formTarifas, valorTotal: totalCalc, timeline };
    if (form.id) { updateAtendimento(atd); toast.success('Atualizado!'); } else { addAtendimento(atd); toast.success('Criado!'); }
    setData(getAtendimentos()); setModalOpen(false);
  };
  const handleDelete = (id: string) => { deleteAtendimento(id); setData(getAtendimentos()); toast.success('Removido.'); };
  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  if (detailAtd) {
    const prest = prestadores.find(p => p.id === detailAtd.prestadorId);
    const kmDiff = detailAtd.km - detailAtd.kmPrevisto;
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailAtd(null)}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate">{detailAtd.protocolo}</h1>
              <Badge variant={statusVariant(detailAtd.status)}>{detailAtd.status}</Badge>
              <Badge variant={prioridadeVariant(detailAtd.prioridade)}>{detailAtd.prioridade}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{detailAtd.clienteNome} · {prest?.nomeFantasia}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => openEdit(detailAtd)}><Pencil className="h-3.5 w-3.5 mr-1.5" />Editar</Button>
        </div>

        {kmDiff > 2 && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3.5 py-2 text-[13px]">
            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
            <span>Divergência de {kmDiff} km entre previsto e realizado</span>
          </div>
        )}

        <Tabs defaultValue="dados">
          <TabsList className="h-9"><TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger><TabsTrigger value="tarifas" className="text-xs">Tarifas ({detailAtd.tarifas.length})</TabsTrigger><TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger></TabsList>
          <TabsContent value="dados" className="mt-4">
            <Card><CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
                {[['Solicitante', detailAtd.solicitante || '—'], ['Tipo', detailAtd.tipoAtendimento], ['Prioridade', detailAtd.prioridade], ['Veículo', detailAtd.veiculo], ['Placa', detailAtd.placa], ['Origem', detailAtd.origem], ['Destino', detailAtd.destino], ['Km Previsto', detailAtd.kmPrevisto], ['Km Realizado', detailAtd.km], ['Horas Trab.', detailAtd.horasTrabalhadas], ['Horas Paradas', detailAtd.horasParadas], ['Data/Hora', new Date(detailAtd.dataHora).toLocaleString('pt-BR')]].map(([l, v]) => (
                  <div key={String(l)} className="flex justify-between py-1.5 border-b border-dashed border-border/60">
                    <span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 border-b border-dashed border-border/60 md:col-span-2">
                  <span className="text-muted-foreground">Valor Total</span><span className="font-bold text-lg">R$ {detailAtd.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              {detailAtd.observacoes && <div className="mt-4 p-3 rounded-lg bg-muted/50 text-[13px]"><span className="text-muted-foreground">Obs: </span>{detailAtd.observacoes}</div>}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="tarifas" className="mt-4">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="text-[11px] uppercase tracking-wider">Tarifa</TableHead><TableHead className="text-[11px] uppercase tracking-wider">Qtd</TableHead><TableHead className="text-[11px] uppercase tracking-wider">Unitário</TableHead><TableHead className="text-[11px] uppercase tracking-wider text-right">Subtotal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {detailAtd.tarifas.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-sm">Sem tarifas</TableCell></TableRow> : (
                    <>{detailAtd.tarifas.map((t, i) => (
                      <TableRow key={i} className="table-row-hover"><TableCell className="font-medium text-[13px]">{tarifasList.find(x => x.id === t.tarifaId)?.nome || t.tarifaId}</TableCell><TableCell className="tabular-nums text-[13px]">{t.quantidade}</TableCell><TableCell className="tabular-nums text-[13px]">R$ {t.valorUnitario.toFixed(2)}</TableCell><TableCell className="text-right font-medium tabular-nums text-[13px]">R$ {t.valorTotal.toFixed(2)}</TableCell></TableRow>
                    ))}<TableRow className="bg-muted/30"><TableCell colSpan={3} className="text-right font-semibold text-[13px]">Total</TableCell><TableCell className="text-right font-bold text-[13px]">R$ {detailAtd.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell></TableRow></>
                  )}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <Card><CardContent className="p-5">
              <div className="space-y-0">
                {detailAtd.timeline.map((ev, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-primary mt-2" />{i < detailAtd.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}</div>
                    <div className="pb-5"><p className="text-[13px] font-medium">{ev.descricao}</p><p className="text-[11px] text-muted-foreground">{new Date(ev.data).toLocaleString('pt-BR')}</p></div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Operações</h1><p>Central operacional — gerencie atendimentos, despachos e execuções da rede</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Novo Atendimento</Button>
      </div>

      <Card><CardContent className="p-3"><div className="filter-bar">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Protocolo, cliente ou placa..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}><SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos Status</SelectItem>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={filterPrestador} onValueChange={v => { setFilterPrestador(v); setPage(0); }}><SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Prestador" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{prestadores.map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}</SelectContent></Select>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider">Protocolo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden lg:table-cell">Tipo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden xl:table-cell">Data</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-center">Prioridade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-right">Valor</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-right w-[100px]">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {paged.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">Nenhum atendimento</TableCell></TableRow> : paged.map(a => {
              const prest = prestadores.find(p => p.id === a.prestadorId);
              return (
                <TableRow key={a.id} className="table-row-hover cursor-pointer" onClick={() => setDetailAtd(a)}>
                  <TableCell className="font-mono text-xs">{a.protocolo}</TableCell>
                  <TableCell><p className="font-medium text-[13px]">{a.clienteNome}</p><p className="text-[11px] text-muted-foreground font-mono">{a.placa}</p></TableCell>
                  <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{prest?.nomeFantasia || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{a.tipoAtendimento}</TableCell>
                  <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-center"><Badge variant={prioridadeVariant(a.prioridade)} className="text-[10px]">{a.prioridade}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant(a.status)}>{a.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-[13px]">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-0.5" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailAtd(a)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {a.protocolo}?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(a.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  </div></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      {totalPages > 1 && <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{filtered.length} registro(s)</span><div className="flex items-center gap-1"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button><span className="px-3 text-muted-foreground">{page + 1} de {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button></div></div>}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader><DialogTitle>{form.id ? 'Editar Atendimento' : 'Novo Atendimento'}</DialogTitle></DialogHeader>
          <div className="grid gap-3.5 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Protocolo</Label><Input value={form.protocolo || ''} readOnly className="bg-muted" /></div>
              <div className="space-y-1"><Label className="text-xs">Data/Hora</Label><Input type="datetime-local" value={form.dataHora?.slice(0, 16) || ''} onChange={e => updateField('dataHora', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label><Select value={form.status || 'Aberto'} onValueChange={v => updateField('status', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Prestador *</Label><Select value={form.prestadorId || ''} onValueChange={v => updateField('prestadorId', v)}><SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{prestadores.filter(p => p.status === 'Ativo').map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-xs">Cliente *</Label><Input value={form.clienteNome || ''} onChange={e => updateField('clienteNome', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Solicitante</Label><Input value={form.solicitante || ''} onChange={e => updateField('solicitante', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Tipo</Label><Select value={form.tipoAtendimento || 'Guincho'} onValueChange={v => updateField('tipoAtendimento', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{TIPOS_ATD.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-xs">Prioridade</Label><Select value={form.prioridade || 'Normal'} onValueChange={v => updateField('prioridade', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{PRIORIDADE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Veículo</Label><Input value={form.veiculo || ''} onChange={e => updateField('veiculo', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Placa</Label><Input value={form.placa || ''} onChange={e => updateField('placa', e.target.value.toUpperCase())} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Origem</Label><Input value={form.origem || ''} onChange={e => updateField('origem', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Destino</Label><Input value={form.destino || ''} onChange={e => updateField('destino', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1"><Label className="text-xs">Km previsto</Label><Input type="number" value={form.kmPrevisto || ''} onChange={e => updateField('kmPrevisto', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1"><Label className="text-xs">Km realizado</Label><Input type="number" value={form.km || ''} onChange={e => updateField('km', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1"><Label className="text-xs">Horas trab.</Label><Input type="number" step="0.5" value={form.horasTrabalhadas || ''} onChange={e => updateField('horasTrabalhadas', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1"><Label className="text-xs">Horas paradas</Label><Input type="number" step="0.5" value={form.horasParadas || ''} onChange={e => updateField('horasParadas', parseFloat(e.target.value) || 0)} /></div>
            </div>
            <Separator />
            <div>
              <div className="flex justify-between mb-2"><Label className="text-xs font-medium">Tarifas Aplicadas</Label><Button variant="outline" size="sm" onClick={addTarifaLine}><Plus className="h-3 w-3 mr-1" />Tarifa</Button></div>
              {formTarifas.length === 0 ? <p className="text-xs text-muted-foreground py-3">Nenhuma tarifa adicionada.</p> : (
                <div className="space-y-2">
                  {formTarifas.map((ft, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4 space-y-1"><Select value={ft.tarifaId} onValueChange={v => updateTarifaLine(i, 'tarifaId', v)}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tarifa..." /></SelectTrigger><SelectContent>{tarifasList.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
                      <div className="col-span-2 space-y-1"><Input type="number" min="0" step="0.5" className="h-8 text-xs" placeholder="Qtd" value={ft.quantidade || ''} onChange={e => updateTarifaLine(i, 'quantidade', parseFloat(e.target.value) || 0)} /></div>
                      <div className="col-span-2 space-y-1"><Input type="number" min="0" step="0.01" className="h-8 text-xs" placeholder="Unit." value={ft.valorUnitario || ''} onChange={e => updateTarifaLine(i, 'valorUnitario', parseFloat(e.target.value) || 0)} /></div>
                      <div className="col-span-3 text-right text-xs font-medium tabular-nums self-center">R$ {ft.valorTotal.toFixed(2)}</div>
                      <div className="col-span-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTarifaLine(i)}><X className="h-3 w-3" /></Button></div>
                    </div>
                  ))}
                  <div className="text-right text-sm font-bold pt-2 border-t">Total: R$ {totalCalc.toFixed(2)}</div>
                </div>
              )}
            </div>
            <div className="space-y-1"><Label className="text-xs">Observações</Label><Textarea value={form.observacoes || ''} onChange={e => updateField('observacoes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
