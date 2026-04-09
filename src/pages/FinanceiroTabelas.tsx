import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Search, Pencil, TableProperties, Calendar, Eye, Save, ArrowLeft, Copy, MapPin } from 'lucide-react';
import { getTarifas } from '@/data/store';

interface TabelaItem {
  tarifaId: string;
  tarifaNome: string;
  categoria: string;
  valor: number;
  franquia: number;
  valorExcedente: number;
  minimo: number;
  observacao: string;
}

const REGIOES_DISPONIVEIS = [
  'São Paulo Capital',
  'Grande São Paulo (ABCD)',
  'Interior SP - Campinas',
  'Interior SP - Ribeirão Preto',
  'Interior SP - Sorocaba',
  'Interior SP - São José dos Campos',
  'Litoral SP',
  'Rio de Janeiro Capital',
  'Grande Rio (Niterói/Baixada)',
  'Belo Horizonte',
  'Curitiba',
  'Nacional (Padrão)',
];

interface TabelaComercial {
  id: string;
  nome: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: 'Vigente' | 'Expirada' | 'Rascunho' | 'Em revisão';
  prestadorVinculado: string;
  regioes: string[];
  prioridade: number;
  itens: TabelaItem[];
}

const buildDefaultItems = (): TabelaItem[] => {
  const tarifas = getTarifas().filter(t => t.situacao === 'Ativo');
  return tarifas.map(t => ({
    tarifaId: t.id,
    tarifaNome: t.nome,
    categoria: t.categoria,
    valor: 0,
    franquia: 0,
    valorExcedente: 0,
    minimo: 0,
    observacao: '',
  }));
};

const SEED_ITEMS_PADRAO: TabelaItem[] = (() => {
  const items = buildDefaultItems();
  const values: Record<string, Partial<TabelaItem>> = {
    'Saída': { valor: 180, minimo: 180 },
    'Km Excedente': { valor: 4.50, franquia: 10, valorExcedente: 5.50 },
    'Hora Trabalhada': { valor: 95 },
    'Hora Parada': { valor: 55 },
    'Diária Base': { valor: 450 },
    'Estrada de Terra': { valor: 6.00 },
    'Pedágio': { valor: 0, observacao: 'Repasse integral' },
    'Adicional Noturno': { valor: 72, observacao: '40% sobre saída' },
    'Patins': { valor: 300 },
    'Guincho Pesado': { valor: 600, minimo: 600 },
  };
  return items.map(i => ({ ...i, ...(values[i.tarifaNome] || {}) }));
})();

const SEED_ITEMS_PREMIUM: TabelaItem[] = (() => {
  const items = buildDefaultItems();
  const values: Record<string, Partial<TabelaItem>> = {
    'Saída': { valor: 250, minimo: 250 },
    'Km Excedente': { valor: 6.00, franquia: 15, valorExcedente: 7.50 },
    'Hora Trabalhada': { valor: 130 },
    'Hora Parada': { valor: 75 },
    'Diária Base': { valor: 600 },
    'Estrada de Terra': { valor: 8.00 },
    'Pedágio': { valor: 0, observacao: 'Repasse integral' },
    'Adicional Noturno': { valor: 100, observacao: '40% sobre saída' },
    'Patins': { valor: 400 },
    'Guincho Pesado': { valor: 800, minimo: 800 },
  };
  return items.map(i => ({ ...i, ...(values[i.tarifaNome] || {}) }));
})();

const SEED_ITEMS_INTERIOR: TabelaItem[] = (() => {
  const items = buildDefaultItems();
  const values: Record<string, Partial<TabelaItem>> = {
    'Saída': { valor: 150, minimo: 150 },
    'Km Excedente': { valor: 3.80, franquia: 15, valorExcedente: 4.80 },
    'Hora Trabalhada': { valor: 80 },
    'Hora Parada': { valor: 45 },
    'Diária Base': { valor: 380 },
    'Pedágio': { valor: 0, observacao: 'Repasse integral' },
    'Adicional Noturno': { valor: 60, observacao: '40% sobre saída' },
    'Patins': { valor: 250 },
  };
  return items.map(i => ({ ...i, ...(values[i.tarifaNome] || {}) }));
})();

const SEED_ITEMS_NOTURNA: TabelaItem[] = (() => {
  const items = buildDefaultItems();
  const values: Record<string, Partial<TabelaItem>> = {
    'Saída': { valor: 280, minimo: 280 },
    'Km Excedente': { valor: 7.00, franquia: 10, valorExcedente: 9.00 },
    'Hora Trabalhada': { valor: 150 },
    'Hora Parada': { valor: 85 },
    'Adicional Noturno': { valor: 0, observacao: 'Já incluso na taxa' },
    'Patins': { valor: 450 },
    'Guincho Pesado': { valor: 900, minimo: 900 },
  };
  return items.map(i => ({ ...i, ...(values[i.tarifaNome] || {}) }));
})();

const MOCK_TABELAS: TabelaComercial[] = [
  { id: '1', nome: 'Tabela Padrão Nacional', vigenciaInicio: '2025-01-01', vigenciaFim: '2025-12-31', status: 'Vigente', prestadorVinculado: 'Todos', itens: SEED_ITEMS_PADRAO },
  { id: '2', nome: 'Tabela Premium SP Capital', vigenciaInicio: '2025-03-01', vigenciaFim: '2025-12-31', status: 'Vigente', prestadorVinculado: 'Auto Socorro SP', itens: SEED_ITEMS_PREMIUM },
  { id: '3', nome: 'Tabela Interior SP', vigenciaInicio: '2024-06-01', vigenciaFim: '2024-12-31', status: 'Expirada', prestadorVinculado: 'Todos', itens: SEED_ITEMS_INTERIOR },
  { id: '4', nome: 'Tabela Emergencial Noturna', vigenciaInicio: '2025-06-01', vigenciaFim: '2026-05-31', status: 'Rascunho', prestadorVinculado: '—', itens: SEED_ITEMS_NOTURNA },
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

const fmtCurrency = (v: number) => v ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';

export default function FinanceiroTabelas() {
  const [tabelas, setTabelas] = useState(MOCK_TABELAS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTabela, setEditingTabela] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '', status: '' });
  const [form, setForm] = useState({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '' });

  const filtered = useMemo(() => tabelas.filter(t =>
    (!search || t.nome.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || t.status === filterStatus)
  ), [tabelas, search, filterStatus]);

  const currentTabela = editingTabela ? tabelas.find(t => t.id === editingTabela) : null;

  const handleSave = () => {
    if (!form.nome) { toast.error('Informe o nome da tabela.'); return; }
    const newTabela: TabelaComercial = {
      id: `t${Date.now()}`,
      nome: form.nome,
      vigenciaInicio: form.vigenciaInicio || '—',
      vigenciaFim: form.vigenciaFim || '—',
      status: 'Rascunho',
      prestadorVinculado: form.prestadorVinculado || '—',
      itens: buildDefaultItems(),
    };
    setTabelas(prev => [...prev, newTabela]);
    setModalOpen(false);
    setForm({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '' });
    toast.success('Tabela comercial criada. Clique no ícone de edição para configurar os valores.');
  };

  const openEditor = (t: TabelaComercial) => {
    setEditingTabela(t.id);
    setEditForm({ nome: t.nome, vigenciaInicio: t.vigenciaInicio, vigenciaFim: t.vigenciaFim, prestadorVinculado: t.prestadorVinculado, status: t.status });
  };

  const updateItemField = (tarifaId: string, field: keyof TabelaItem, value: string | number) => {
    setTabelas(prev => prev.map(tab => {
      if (tab.id !== editingTabela) return tab;
      return {
        ...tab,
        itens: tab.itens.map(item =>
          item.tarifaId === tarifaId ? { ...item, [field]: value } : item
        ),
      };
    }));
  };

  const handleSaveTabela = () => {
    if (!editingTabela) return;
    setTabelas(prev => prev.map(t => t.id === editingTabela ? {
      ...t,
      nome: editForm.nome || t.nome,
      vigenciaInicio: editForm.vigenciaInicio || t.vigenciaInicio,
      vigenciaFim: editForm.vigenciaFim || t.vigenciaFim,
      prestadorVinculado: editForm.prestadorVinculado || t.prestadorVinculado,
      status: (editForm.status || t.status) as TabelaComercial['status'],
    } : t));
    toast.success('Tabela salva com sucesso!');
  };

  const handleCloneTabela = (sourceId: string) => {
    const source = tabelas.find(t => t.id === sourceId);
    if (!source || !editingTabela) return;
    setTabelas(prev => prev.map(tab => {
      if (tab.id !== editingTabela) return tab;
      return { ...tab, itens: source.itens.map(i => ({ ...i })) };
    }));
    toast.success(`Valores importados de "${source.nome}".`);
  };

  const kpis = [
    { label: 'Vigentes', value: tabelas.filter(t => t.status === 'Vigente').length, color: 'text-success' },
    { label: 'Rascunhos', value: tabelas.filter(t => t.status === 'Rascunho').length, color: 'text-warning' },
    { label: 'Expiradas', value: tabelas.filter(t => t.status === 'Expirada').length, color: 'text-muted-foreground' },
    { label: 'Total', value: tabelas.length, color: 'text-foreground' },
  ];

  // ===== EDITOR VIEW =====
  if (currentTabela) {
    const configuredCount = currentTabela.itens.filter(i => i.valor > 0).length;
    const pendingCount = currentTabela.itens.filter(i => i.valor === 0).length;

    return (
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setEditingTabela(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="page-header-text">
              <h1>{currentTabela.nome}</h1>
              <p>Edite valores, franquias e mínimos de cada tarifa desta tabela</p>
            </div>
          </div>
          <Button onClick={handleSaveTabela}><Save className="h-4 w-4 mr-1.5" />Salvar Tabela</Button>
        </div>

        {/* Metadados + Clone */}
        <Card><CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <Label className="text-xs font-medium">Nome</Label>
              <Input value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-1.5 min-w-[130px]">
              <Label className="text-xs font-medium">Início</Label>
              <Input type="date" value={editForm.vigenciaInicio} onChange={e => setEditForm(p => ({ ...p, vigenciaInicio: e.target.value }))} />
            </div>
            <div className="space-y-1.5 min-w-[130px]">
              <Label className="text-xs font-medium">Fim</Label>
              <Input type="date" value={editForm.vigenciaFim} onChange={e => setEditForm(p => ({ ...p, vigenciaFim: e.target.value }))} />
            </div>
            <div className="space-y-1.5 min-w-[120px]">
              <Label className="text-xs font-medium">Status</Label>
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
            <div className="space-y-1.5 min-w-[180px]">
              <Label className="text-xs font-medium">Importar valores de</Label>
              <Select onValueChange={handleCloneTabela}>
                <SelectTrigger><SelectValue placeholder="Outra tabela..." /></SelectTrigger>
                <SelectContent>
                  {tabelas.filter(t => t.id !== editingTabela).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent></Card>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <Badge variant="success" className="font-semibold">{configuredCount} tarifas configuradas</Badge>
          {pendingCount > 0 && <Badge variant="warning" className="font-semibold">{pendingCount} sem valor</Badge>}
          <Badge variant="outline" className="font-semibold">{currentTabela.itens.length} total</Badge>
        </div>

        {/* Pricing Grid */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wider min-w-[160px] font-semibold">Tarifa</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider min-w-[80px] font-semibold">Categoria</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider min-w-[110px] font-semibold">Valor (R$)</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider min-w-[100px] font-semibold">Franquia</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider min-w-[110px] font-semibold">Excedente (R$)</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider min-w-[110px] font-semibold">Mínimo (R$)</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wider min-w-[150px] font-semibold">Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTabela.itens.map(item => {
                    const hasValue = item.valor > 0;
                    return (
                      <TableRow key={item.tarifaId} className={`table-row-hover ${!hasValue ? 'bg-warning/[0.03]' : ''}`}>
                        <TableCell className="font-semibold text-[13px]">{item.tarifaNome}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{item.categoria}</Badge></TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums"
                            value={item.valor || ''} onChange={e => updateItemField(item.tarifaId, 'valor', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="1" min="0" className="w-20 h-8 text-xs tabular-nums"
                            value={item.franquia || ''} onChange={e => updateItemField(item.tarifaId, 'franquia', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums"
                            value={item.valorExcedente || ''} onChange={e => updateItemField(item.tarifaId, 'valorExcedente', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums"
                            value={item.minimo || ''} onChange={e => updateItemField(item.tarifaId, 'minimo', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input className="w-36 h-8 text-xs"
                            value={item.observacao} onChange={e => updateItemField(item.tarifaId, 'observacao', e.target.value)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== LIST VIEW =====
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
              <TableRow key={t.id} className="table-row-hover cursor-pointer" onClick={() => openEditor(t)}>
                <TableCell><span className="font-semibold text-[13px]">{t.nome}</span></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{fmtDate(t.vigenciaInicio)} — {fmtDate(t.vigenciaFim)}</div>
                </TableCell>
                <TableCell><Badge variant={statusVariant(t.status) as any} className="font-semibold">{t.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{t.prestadorVinculado}</TableCell>
                <TableCell className="text-center text-[13px] font-medium">{t.itens.filter(i => i.valor > 0).length}/{t.itens.length}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar valores" onClick={e => { e.stopPropagation(); openEditor(t); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
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
    </div>
  );
}
