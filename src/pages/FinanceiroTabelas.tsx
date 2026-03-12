import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Search, Pencil, TableProperties, Calendar, Eye } from 'lucide-react';

interface TabelaComercial {
  id: string;
  nome: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: 'Vigente' | 'Expirada' | 'Rascunho' | 'Em revisão';
  prestadorVinculado: string;
  qtdItens: number;
}

const MOCK_TABELAS: TabelaComercial[] = [
  { id: '1', nome: 'Tabela Padrão Nacional', vigenciaInicio: '2025-01-01', vigenciaFim: '2025-12-31', status: 'Vigente', prestadorVinculado: 'Todos', qtdItens: 18 },
  { id: '2', nome: 'Tabela Premium SP Capital', vigenciaInicio: '2025-03-01', vigenciaFim: '2025-12-31', status: 'Vigente', prestadorVinculado: 'Auto Socorro SP', qtdItens: 24 },
  { id: '3', nome: 'Tabela Interior SP', vigenciaInicio: '2024-06-01', vigenciaFim: '2024-12-31', status: 'Expirada', prestadorVinculado: 'Todos', qtdItens: 15 },
  { id: '4', nome: 'Tabela Emergencial Noturna', vigenciaInicio: '2025-06-01', vigenciaFim: '2026-05-31', status: 'Rascunho', prestadorVinculado: '—', qtdItens: 8 },
];

const statusVariant = (s: string) => {
  switch (s) {
    case 'Vigente': return 'success';
    case 'Expirada': return 'secondary';
    case 'Rascunho': return 'warning';
    case 'Em revisão': return 'info';
    default: return 'default';
  }
};

const fmtDate = (d: string) => {
  if (!d || d === '—') return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
};

export default function FinanceiroTabelas() {
  const [tabelas, setTabelas] = useState(MOCK_TABELAS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<TabelaComercial | null>(null);
  const [editItem, setEditItem] = useState<TabelaComercial | null>(null);
  const [form, setForm] = useState({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '' });
  const [editForm, setEditForm] = useState({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '', status: '' as string });

  const filtered = useMemo(() => tabelas.filter(t =>
    (!search || t.nome.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || t.status === filterStatus)
  ), [tabelas, search, filterStatus]);

  const handleSave = () => {
    if (!form.nome) { toast.error('Informe o nome da tabela.'); return; }
    setTabelas(prev => [...prev, { id: `t${Date.now()}`, nome: form.nome, vigenciaInicio: form.vigenciaInicio || '—', vigenciaFim: form.vigenciaFim || '—', status: 'Rascunho', prestadorVinculado: form.prestadorVinculado || '—', qtdItens: 0 }]);
    setModalOpen(false);
    setForm({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '' });
    toast.success('Tabela comercial criada.');
  };

  const openEdit = (t: TabelaComercial) => {
    setEditItem(t);
    setEditForm({ nome: t.nome, vigenciaInicio: t.vigenciaInicio, vigenciaFim: t.vigenciaFim, prestadorVinculado: t.prestadorVinculado, status: t.status });
  };

  const handleEditSave = () => {
    if (!editItem || !editForm.nome) { toast.error('Informe o nome da tabela.'); return; }
    setTabelas(prev => prev.map(t => t.id === editItem.id ? { ...t, nome: editForm.nome, vigenciaInicio: editForm.vigenciaInicio, vigenciaFim: editForm.vigenciaFim, prestadorVinculado: editForm.prestadorVinculado, status: editForm.status as TabelaComercial['status'] } : t));
    setEditItem(null);
    toast.success('Tabela atualizada com sucesso.');
  };

  const kpis = [
    { label: 'Vigentes', value: tabelas.filter(t => t.status === 'Vigente').length, color: 'text-success' },
    { label: 'Rascunhos', value: tabelas.filter(t => t.status === 'Rascunho').length, color: 'text-warning' },
    { label: 'Expiradas', value: tabelas.filter(t => t.status === 'Expirada').length, color: 'text-muted-foreground' },
    { label: 'Total', value: tabelas.length, color: 'text-foreground' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Tabelas Comerciais</h1>
          <p>Gerencie tabelas de preços, vigências e condições comerciais da rede</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Nova Tabela</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {kpis.map(k => (
          <Card key={k.label}><CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tabela..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Vigente">Vigente</SelectItem>
              <SelectItem value="Rascunho">Rascunho</SelectItem>
              <SelectItem value="Expirada">Expirada</SelectItem>
              <SelectItem value="Em revisão">Em revisão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Vigência</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Itens</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state">
                  <div className="empty-state-icon"><TableProperties className="h-5 w-5 text-muted-foreground" /></div>
                  <p className="empty-state-title">Nenhuma tabela comercial encontrada</p>
                  <p className="empty-state-description">Crie sua primeira tabela para definir condições comerciais</p>
                </div>
              </TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id} className="table-row-hover">
                <TableCell><span className="font-semibold text-[13px]">{t.nome}</span></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{fmtDate(t.vigenciaInicio)} — {fmtDate(t.vigenciaFim)}</div>
                </TableCell>
                <TableCell><Badge variant={statusVariant(t.status) as any} className="font-semibold">{t.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{t.prestadorVinculado}</TableCell>
                <TableCell className="text-center text-[13px] font-medium">{t.qtdItens}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Visualizar" onClick={() => setViewItem(t)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Modal Nova Tabela */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Tabela Comercial</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Tabela Premium SP" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Início vigência</Label><Input type="date" value={form.vigenciaInicio} onChange={e => setForm(p => ({ ...p, vigenciaInicio: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Fim vigência</Label><Input type="date" value={form.vigenciaFim} onChange={e => setForm(p => ({ ...p, vigenciaFim: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Prestador vinculado</Label><Input value={form.prestadorVinculado} onChange={e => setForm(p => ({ ...p, prestadorVinculado: e.target.value }))} placeholder="Todos ou nome específico" /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Criar Tabela</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={open => { if (!open) setViewItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes da Tabela</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Nome</p><p className="font-semibold text-[14px]">{viewItem.nome}</p></div>
                <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Status</p><Badge variant={statusVariant(viewItem.status) as any} className="font-semibold">{viewItem.status}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Início da Vigência</p><p className="text-[13px]">{fmtDate(viewItem.vigenciaInicio)}</p></div>
                <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Fim da Vigência</p><p className="text-[13px]">{fmtDate(viewItem.vigenciaFim)}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Prestador Vinculado</p><p className="text-[13px]">{viewItem.prestadorVinculado}</p></div>
                <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Quantidade de Itens</p><p className="text-[13px] font-semibold">{viewItem.qtdItens}</p></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewItem(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={!!editItem} onOpenChange={open => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Tabela Comercial</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Início vigência</Label><Input type="date" value={editForm.vigenciaInicio} onChange={e => setEditForm(p => ({ ...p, vigenciaInicio: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Fim vigência</Label><Input type="date" value={editForm.vigenciaFim} onChange={e => setEditForm(p => ({ ...p, vigenciaFim: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Prestador vinculado</Label><Input value={editForm.prestadorVinculado} onChange={e => setEditForm(p => ({ ...p, prestadorVinculado: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vigente">Vigente</SelectItem>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Expirada">Expirada</SelectItem>
                  <SelectItem value="Em revisão">Em revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button><Button onClick={handleEditSave}>Salvar Alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}