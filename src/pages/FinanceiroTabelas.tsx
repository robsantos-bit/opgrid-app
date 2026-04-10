import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Search, Pencil, TableProperties, Calendar, Save, ArrowLeft, MapPin, Loader2, X, MapPinned } from 'lucide-react';
import { useTabelasComerciais, TabelaComercial, TabelaItem } from '@/hooks/useTabelasComerciais';

const REGIOES_DISPONIVEIS = [
  'São Paulo Capital', 'Grande São Paulo (ABCD)',
  'Interior SP - Campinas', 'Interior SP - Ribeirão Preto',
  'Interior SP - Sorocaba', 'Interior SP - São José dos Campos',
  'Litoral SP', 'Rio de Janeiro Capital', 'Grande Rio (Niterói/Baixada)',
  'Belo Horizonte', 'Curitiba', 'Nacional (Padrão)',
];

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const RegiaoManager = ({
  regioes,
  onToggle,
  onAdd,
  onRemove,
}: {
  regioes: string[];
  onToggle: (r: string) => void;
  onAdd: (r: string) => void;
  onRemove: (r: string) => void;
}) => {
  const [customValue, setCustomValue] = useState('');
  const [selectedUf, setSelectedUf] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [removedRegioes, setRemovedRegioes] = useState<string[]>([]);

  const handleAddRegion = (regiao: string) => {
    setRemovedRegioes(prev => prev.filter(item => item !== regiao));
    onAdd(regiao);
  };

  const handleDeleteRegion = (regiao: string) => {
    onRemove(regiao);
    setRemovedRegioes(prev => prev.includes(regiao) ? prev : [...prev, regiao]);
  };

  const handleAddCustom = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    if (regioes.includes(trimmed)) { toast.error('Região já adicionada.'); return; }
    handleAddRegion(trimmed);
    setCustomValue('');
  };

  const handleUfChange = async (uf: string) => {
    setSelectedUf(uf);
    setCitySearch('');
    if (!uf) { setCities([]); return; }
    setLoadingCities(true);
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      const data = await res.json();
      setCities(data.map((c: { nome: string }) => c.nome));
    } catch {
      toast.error('Erro ao buscar cidades do IBGE.');
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const filteredCities = citySearch
    ? cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  const allRegioes = Array.from(
    new Set([
      ...REGIOES_DISPONIVEIS,
      ...regioes.filter(r => !REGIOES_DISPONIVEIS.includes(r)),
    ]),
  ).filter(r => !removedRegioes.includes(r));

  return (
    <div className="space-y-2">
      {/* Regiões selecionadas com botão de remover */}
      {regioes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {regioes.map(r => (
            <Badge key={r} variant="secondary" className="text-[11px] gap-1 pr-1">
              {r}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleDeleteRegion(r);
                }}
                aria-label={`Excluir região ${r}`}
                className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
              >
                <X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Checkboxes predefinidos + customizados */}
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        {allRegioes.map(r => (
          <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer bg-muted/50 rounded-md px-2.5 py-1.5 hover:bg-muted transition-colors">
            <Checkbox checked={regioes.includes(r)} onCheckedChange={() => onToggle(r)} className="h-3.5 w-3.5" />
            {r}
          </label>
        ))}
      </div>

      {/* Input manual */}
      <div className="flex gap-1.5">
        <Input
          value={customValue}
          onChange={e => setCustomValue(e.target.value)}
          placeholder="Região personalizada..."
          className="text-xs h-8"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustom())}
        />
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs px-3 shrink-0" onClick={handleAddCustom}>
          + Adicionar
        </Button>
      </div>

      {/* Busca por UF/Cidade via IBGE */}
      <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
        <Label className="text-[11px] font-medium flex items-center gap-1.5">
          <MapPinned className="h-3 w-3" />Buscar cidades por UF (IBGE)
        </Label>
        <div className="flex gap-2">
          <Select value={selectedUf} onValueChange={handleUfChange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
            </SelectContent>
          </Select>
          {cities.length > 0 && (
            <Input
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              placeholder="Filtrar cidade..."
              className="text-xs h-8 flex-1"
            />
          )}
          {loadingCities && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
        </div>
        {filteredCities.length > 0 && (
          <ScrollArea className="max-h-32 border rounded-md p-1">
            <div className="flex flex-wrap gap-1">
              {filteredCities.slice(0, 100).map(city => {
                const label = `${city} - ${selectedUf}`;
                if (removedRegioes.includes(label)) return null;
                const isSelected = regioes.includes(label);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => isSelected ? onToggle(label) : handleAddRegion(label)}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
              {filteredCities.length > 100 && (
                <span className="text-[10px] text-muted-foreground px-2 py-1">+{filteredCities.length - 100} cidades...</span>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

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

const toggleRegiao = (regioes: string[], regiao: string) =>
  regioes.includes(regiao) ? regioes.filter(r => r !== regiao) : [...regioes, regiao];

export default function FinanceiroTabelas() {
  const { tabelas, loading, saving, createTabela, saveTabela, cloneItens, updateItemLocal } = useTabelasComerciais();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTabela, setEditingTabela] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '', status: '', regioes: [] as string[], prioridade: 0 });
  const [form, setForm] = useState({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '', regioes: [] as string[], prioridade: 0 });

  const filtered = useMemo(() => tabelas.filter(t =>
    (!search || t.nome.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || t.status === filterStatus)
  ), [tabelas, search, filterStatus]);

  const currentTabela = editingTabela ? tabelas.find(t => t.id === editingTabela) : null;

  const handleCreate = async () => {
    if (!form.nome) { toast.error('Informe o nome da tabela.'); return; }
    if (form.regioes.length === 0) { toast.error('Selecione ao menos uma região.'); return; }
    const id = await createTabela({
      nome: form.nome,
      vigenciaInicio: form.vigenciaInicio,
      vigenciaFim: form.vigenciaFim,
      prestadorVinculado: form.prestadorVinculado,
      regioes: form.regioes,
      prioridade: form.prioridade,
    });
    if (id) {
      setModalOpen(false);
      setForm({ nome: '', vigenciaInicio: '', vigenciaFim: '', prestadorVinculado: '', regioes: [], prioridade: 0 });
    }
  };

  const openEditor = (t: TabelaComercial) => {
    setEditingTabela(t.id);
    setEditForm({ nome: t.nome, vigenciaInicio: t.vigenciaInicio, vigenciaFim: t.vigenciaFim, prestadorVinculado: t.prestadorVinculado, status: t.status, regioes: [...t.regioes], prioridade: t.prioridade });
  };

  const handleSaveTabela = async () => {
    if (!editingTabela || !currentTabela) return;
    const updated: TabelaComercial = {
      ...currentTabela,
      nome: editForm.nome || currentTabela.nome,
      vigenciaInicio: editForm.vigenciaInicio || currentTabela.vigenciaInicio,
      vigenciaFim: editForm.vigenciaFim || currentTabela.vigenciaFim,
      prestadorVinculado: editForm.prestadorVinculado || currentTabela.prestadorVinculado,
      status: (editForm.status || currentTabela.status) as TabelaComercial['status'],
      regioes: editForm.regioes,
      prioridade: editForm.prioridade,
    };
    const result = await saveTabela(updated);
    // Sync editForm with saved data to prevent stale state
    if (result) {
      setEditForm(prev => ({ ...prev, regioes: result.regioes || prev.regioes }));
    }
  };

  const kpis = [
    { label: 'Vigentes', value: tabelas.filter(t => t.status === 'Vigente').length, color: 'text-success' },
    { label: 'Rascunhos', value: tabelas.filter(t => t.status === 'Rascunho').length, color: 'text-warning' },
    { label: 'Expiradas', value: tabelas.filter(t => t.status === 'Expirada').length, color: 'text-muted-foreground' },
    { label: 'Total', value: tabelas.length, color: 'text-foreground' },
  ];

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando tabelas comerciais...</span>
      </div>
    );
  }

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
          <Button onClick={handleSaveTabela} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Salvar Tabela
          </Button>
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
              <Select onValueChange={v => cloneItens(v, editingTabela!)}>
                <SelectTrigger><SelectValue placeholder="Outra tabela..." /></SelectTrigger>
                <SelectContent>
                  {tabelas.filter(t => t.id !== editingTabela).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-[80px]">
              <Label className="text-xs font-medium">Prioridade</Label>
              <Input type="number" min="0" max="100" value={editForm.prioridade} onChange={e => setEditForm(p => ({ ...p, prioridade: parseInt(e.target.value) || 0 }))} className="w-20" />
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-xs font-medium flex items-center gap-1.5 mb-2"><MapPin className="h-3 w-3" />Regiões de aplicação</Label>
            <RegiaoManager
              regioes={editForm.regioes}
              onToggle={(r) => setEditForm(p => ({ ...p, regioes: toggleRegiao(p.regioes, r) }))}
              onAdd={(r) => setEditForm(p => ({ ...p, regioes: [...p.regioes, r] }))}
              onRemove={(r) => setEditForm(p => ({ ...p, regioes: p.regioes.filter(x => x !== r) }))}
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">Tabelas com maior prioridade substituem as de menor prioridade na mesma região.</p>
          </div>
        </CardContent></Card>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="font-semibold">{configuredCount} tarifas configuradas</Badge>
          {pendingCount > 0 && <Badge variant="warning" className="font-semibold">{pendingCount} sem valor</Badge>}
          <Badge variant="outline" className="font-semibold">{currentTabela.itens.length} total</Badge>
        </div>

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
                  {currentTabela.itens.map(item => (
                    <TableRow key={item.tarifaId} className={`table-row-hover ${item.valor === 0 ? 'bg-warning/[0.03]' : ''}`}>
                      <TableCell className="font-semibold text-[13px]">{item.tarifaNome}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{item.categoria}</Badge></TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums"
                          value={item.valor || ''} onChange={e => updateItemLocal(editingTabela!, item.tarifaId, 'valor', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="1" min="0" className="w-20 h-8 text-xs tabular-nums"
                          value={item.franquia || ''} onChange={e => updateItemLocal(editingTabela!, item.tarifaId, 'franquia', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums"
                          value={item.valorExcedente || ''} onChange={e => updateItemLocal(editingTabela!, item.tarifaId, 'valorExcedente', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums"
                          value={item.minimo || ''} onChange={e => updateItemLocal(editingTabela!, item.tarifaId, 'minimo', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-36 h-8 text-xs"
                          value={item.observacao} onChange={e => updateItemLocal(editingTabela!, item.tarifaId, 'observacao', e.target.value)} />
                      </TableCell>
                    </TableRow>
                  ))}
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
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Regiões</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Vigência</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Prio</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Itens</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16">
                <div className="empty-state">
                  <div className="empty-state-icon"><TableProperties className="h-5 w-5 text-muted-foreground" /></div>
                  <p className="empty-state-title">Nenhuma tabela comercial encontrada</p>
                  <p className="empty-state-description">Crie sua primeira tabela para definir condições comerciais</p>
                </div>
              </TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id} className="table-row-hover cursor-pointer" onClick={() => openEditor(t)}>
                <TableCell><span className="font-semibold text-[13px]">{t.nome}</span></TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {t.regioes.map(r => <Badge key={r} variant="outline" className="text-[10px] font-medium">{r}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{fmtDate(t.vigenciaInicio)} — {fmtDate(t.vigenciaFim)}</div>
                </TableCell>
                <TableCell><Badge variant={statusVariant(t.status) as any} className="font-semibold">{t.status}</Badge></TableCell>
                <TableCell className="text-center text-[13px] font-bold tabular-nums">{t.prioridade}</TableCell>
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Tabela Comercial</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Tabela Premium SP" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Início vigência</Label><Input type="date" value={form.vigenciaInicio} onChange={e => setForm(p => ({ ...p, vigenciaInicio: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Fim vigência</Label><Input type="date" value={form.vigenciaFim} onChange={e => setForm(p => ({ ...p, vigenciaFim: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Prestador vinculado</Label><Input value={form.prestadorVinculado} onChange={e => setForm(p => ({ ...p, prestadorVinculado: e.target.value }))} placeholder="Todos ou nome" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Prioridade</Label><Input type="number" min="0" max="100" value={form.prioridade} onChange={e => setForm(p => ({ ...p, prioridade: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3" />Regiões de aplicação *</Label>
              <RegiaoManager
                regioes={form.regioes}
                onToggle={(r) => setForm(p => ({ ...p, regioes: toggleRegiao(p.regioes, r) }))}
                onAdd={(r) => setForm(p => ({ ...p, regioes: [...p.regioes, r] }))}
                onRemove={(r) => setForm(p => ({ ...p, regioes: p.regioes.filter(x => x !== r) }))}
              />
              <p className="text-[10px] text-muted-foreground">Tabelas com maior prioridade são usadas primeiro na mesma região.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Criar Tabela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
