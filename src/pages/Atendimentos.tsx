import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getAtendimentos, addAtendimento, updateAtendimento, deleteAtendimento, getPrestadores, getTarifas, getTabelaPrecoPrestador } from '@/data/store';
import { Atendimento, AtendimentoTarifa, StatusAtendimento } from '@/types';
import { Plus, Pencil, Trash2, Eye, Search, X } from 'lucide-react';

const STATUS_OPTIONS: StatusAtendimento[] = ['Aberto', 'Em andamento', 'Concluído', 'Cancelado'];

export default function Atendimentos() {
  const [data, setData] = useState(getAtendimentos);
  const prestadores = useMemo(() => getPrestadores(), []);
  const tarifasList = useMemo(() => getTarifas().filter(t => t.situacao === 'Ativo'), []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState<Atendimento | null>(null);
  const [form, setForm] = useState<Partial<Atendimento>>({});
  const [formTarifas, setFormTarifas] = useState<AtendimentoTarifa[]>([]);

  const filtered = useMemo(() => data.filter(a => {
    const s = search.toLowerCase();
    const match = !s || a.protocolo.toLowerCase().includes(s) || a.clienteNome.toLowerCase().includes(s);
    const matchS = filterStatus === 'all' || a.status === filterStatus;
    return match && matchS;
  }), [data, search, filterStatus]);

  const openNew = () => {
    const proto = `ATD-2026-${String(data.length + 1).padStart(4, '0')}`;
    setForm({ protocolo: proto, dataHora: new Date().toISOString().slice(0, 16), clienteNome: '', origem: '', destino: '', km: 0, horasTrabalhadas: 0, status: 'Aberto', prestadorId: '' });
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

  const removeTarifaLine = (idx: number) => {
    setFormTarifas(prev => prev.filter((_, i) => i !== idx));
  };

  const totalCalc = formTarifas.reduce((s, t) => s + t.valorTotal, 0);

  const handleSave = () => {
    if (!form.prestadorId || !form.clienteNome) {
      toast.error('Preencha prestador e cliente.');
      return;
    }
    const atd: Atendimento = {
      ...form as Atendimento,
      id: form.id || `a${Date.now()}`,
      tarifas: formTarifas,
      valorTotal: totalCalc,
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
            <Input placeholder="Buscar por protocolo ou cliente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                <TableHead className="hidden lg:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum atendimento</TableCell></TableRow>
              ) : filtered.map(a => {
                const prest = prestadores.find(p => p.id === a.prestadorId);
                return (
                  <TableRow key={a.id} className="table-row-hover">
                    <TableCell className="font-mono text-sm">{a.protocolo}</TableCell>
                    <TableCell>{a.clienteNome}</TableCell>
                    <TableCell className="hidden md:table-cell">{prest?.nomeFantasia || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'Concluído' ? 'default' : a.status === 'Cancelado' ? 'destructive' : 'secondary'}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewModal(a)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Atendimento</DialogTitle></DialogHeader>
          {viewModal && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Protocolo:</span> <span className="font-medium">{viewModal.protocolo}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary">{viewModal.status}</Badge></div>
                <div><span className="text-muted-foreground">Cliente:</span> {viewModal.clienteNome}</div>
                <div><span className="text-muted-foreground">Prestador:</span> {prestadores.find(p => p.id === viewModal.prestadorId)?.nomeFantasia}</div>
                <div><span className="text-muted-foreground">Origem:</span> {viewModal.origem}</div>
                <div><span className="text-muted-foreground">Destino:</span> {viewModal.destino}</div>
                <div><span className="text-muted-foreground">Km:</span> {viewModal.km}</div>
                <div><span className="text-muted-foreground">Horas:</span> {viewModal.horasTrabalhadas}</div>
              </div>
              <Separator />
              <p className="font-medium">Breakdown de Tarifas</p>
              {viewModal.tarifas.length === 0 ? (
                <p className="text-muted-foreground">Sem tarifas</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarifa</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewModal.tarifas.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{tarifasList.find(x => x.id === t.tarifaId)?.nome || t.tarifaId}</TableCell>
                        <TableCell>{t.quantidade}</TableCell>
                        <TableCell>R$ {t.valorUnitario.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">R$ {t.valorTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">R$ {viewModal.valorTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? 'Editar Atendimento' : 'Novo Atendimento'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Protocolo</Label>
                <Input value={form.protocolo || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label>Data/Hora</Label>
                <Input type="datetime-local" value={form.dataHora?.slice(0, 16) || ''} onChange={e => updateField('dataHora', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status || 'Aberto'} onValueChange={v => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prestador *</Label>
                <Select value={form.prestadorId || ''} onValueChange={v => updateField('prestadorId', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{prestadores.filter(p => p.status === 'Ativo').map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Input value={form.clienteNome || ''} onChange={e => updateField('clienteNome', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Origem</Label><Input value={form.origem || ''} onChange={e => updateField('origem', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Destino</Label><Input value={form.destino || ''} onChange={e => updateField('destino', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Km</Label><Input type="number" value={form.km || ''} onChange={e => updateField('km', parseFloat(e.target.value) || 0)} /></div>
              <div className="space-y-1.5"><Label>Horas Trabalhadas</Label><Input type="number" step="0.5" value={form.horasTrabalhadas || ''} onChange={e => updateField('horasTrabalhadas', parseFloat(e.target.value) || 0)} /></div>
            </div>

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
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{tarifasList.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Qtd</Label>}
                  <Input type="number" step="0.5" min="0" value={ft.quantidade} onChange={e => updateTarifaLine(idx, 'quantidade', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-xs">Valor Unit.</Label>}
                  <Input type="number" step="0.01" min="0" value={ft.valorUnitario} onChange={e => updateTarifaLine(idx, 'valorUnitario', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs">Subtotal</Label>}
                  <Input readOnly className="bg-muted font-medium" value={`R$ ${ft.valorTotal.toFixed(2)}`} />
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => removeTarifaLine(idx)}><X className="h-4 w-4 text-destructive" /></Button>
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
