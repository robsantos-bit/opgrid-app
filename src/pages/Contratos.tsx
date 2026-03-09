import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getContratos, addContrato, updateContrato, getPrestadores } from '@/data/store';
import { Contrato, StatusContrato } from '@/types';
import { Plus, Pencil, Search, FileText, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STATUS_OPTIONS: StatusContrato[] = ['Ativo', 'Em negociação', 'Suspenso', 'Encerrado'];

const statusVariant = (s: StatusContrato) => {
  switch (s) {
    case 'Ativo': return 'success' as const;
    case 'Em negociação': return 'info' as const;
    case 'Suspenso': return 'warning' as const;
    case 'Encerrado': return 'secondary' as const;
  }
};

export default function Contratos() {
  const [data, setData] = useState(getContratos);
  const prestadores = useMemo(() => getPrestadores(), []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Contrato> | null>(null);

  const filtered = useMemo(() => data.filter(c => {
    const s = search.toLowerCase();
    const prest = prestadores.find(p => p.id === c.prestadorId);
    return (!s || c.numero.toLowerCase().includes(s) || c.descricao.toLowerCase().includes(s) || (prest?.nomeFantasia || '').toLowerCase().includes(s))
      && (filterStatus === 'all' || c.status === filterStatus);
  }), [data, search, filterStatus, prestadores]);

  const ativos = data.filter(c => c.status === 'Ativo').length;
  const negociacao = data.filter(c => c.status === 'Em negociação').length;
  const suspensos = data.filter(c => c.status === 'Suspenso').length;

  const openNew = () => {
    setEditing({ numero: `CTR-2026-${String(data.length + 1).padStart(3, '0')}`, descricao: '', prestadorId: '', plano: 'Básico', tabelaVinculada: '', dataInicio: '', dataFim: '', status: 'Em negociação', observacoes: '', custoMedioEstimado: 0 });
    setModalOpen(true);
  };
  const openEdit = (c: Contrato) => { setEditing({ ...c }); setModalOpen(true); };
  const updateField = (field: string, value: any) => setEditing(prev => prev ? { ...prev, [field]: value } : prev);

  const handleSave = () => {
    if (!editing?.prestadorId || !editing.descricao) { toast.error('Preencha os campos obrigatórios.'); return; }
    if (editing.id) { updateContrato(editing as Contrato); toast.success('Contrato atualizado.'); }
    else { addContrato({ ...editing as Contrato, id: `c${Date.now()}` }); toast.success('Contrato criado.'); }
    setData(getContratos()); setModalOpen(false);
  };

  const kpis = [
    { label: 'Contratos Ativos', value: ativos, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success' },
    { label: 'Em Negociação', value: negociacao, icon: FileText, bg: 'bg-info/10', color: 'text-info' },
    { label: 'Suspensos', value: suspensos, icon: AlertTriangle, bg: 'bg-warning/10', color: 'text-warning' },
    { label: 'Custo Médio', value: `R$ ${(data.filter(c => c.custoMedioEstimado > 0).reduce((s, c) => s + c.custoMedioEstimado, 0) / Math.max(data.filter(c => c.custoMedioEstimado > 0).length, 1)).toFixed(0)}`, icon: DollarSign, bg: 'bg-primary/10', color: 'text-primary' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Contratos</h1>
          <p>Gerencie os acordos comerciais com a rede credenciada</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Novo Contrato</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-5 w-5" /></div>
            <div><p className="kpi-label">{k.label}</p><p className="kpi-value">{k.value}</p></div>
          </div>
        ))}
      </div>

      <Card><CardContent className="p-3"><div className="filter-bar">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Buscar contrato ou prestador..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider">Número</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell">Descrição</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider hidden lg:table-cell">Vigência</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Plano</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">Nenhum contrato encontrado</TableCell></TableRow> : filtered.map(c => {
              const prest = prestadores.find(p => p.id === c.prestadorId);
              return (
                <TableRow key={c.id} className="table-row-hover">
                  <TableCell className="font-mono text-xs">{c.numero}</TableCell>
                  <TableCell className="font-medium text-[13px]">{prest?.nomeFantasia || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground max-w-[250px] truncate">{c.descricao}</TableCell>
                  <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{c.dataInicio ? `${new Date(c.dataInicio).toLocaleDateString('pt-BR')} — ${new Date(c.dataFim).toLocaleDateString('pt-BR')}` : '—'}</TableCell>
                  <TableCell><Badge variant="outline">{c.plano}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle></DialogHeader>
          <div className="grid gap-3.5 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Número</Label><Input value={editing?.numero || ''} readOnly className="bg-muted" /></div>
              <div className="space-y-1"><Label className="text-xs">Prestador *</Label><Select value={editing?.prestadorId || ''} onValueChange={v => updateField('prestadorId', v)}><SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{prestadores.map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Descrição *</Label><Textarea value={editing?.descricao || ''} onChange={e => updateField('descricao', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Plano</Label><Select value={editing?.plano || 'Básico'} onValueChange={v => updateField('plano', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Básico">Básico</SelectItem><SelectItem value="Pró">Pró</SelectItem><SelectItem value="Enterprise">Enterprise</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label><Select value={editing?.status || 'Em negociação'} onValueChange={v => updateField('status', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-xs">Custo Médio</Label><Input type="number" value={editing?.custoMedioEstimado || ''} onChange={e => updateField('custoMedioEstimado', parseFloat(e.target.value) || 0)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Início</Label><Input type="date" value={editing?.dataInicio || ''} onChange={e => updateField('dataInicio', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Fim</Label><Input type="date" value={editing?.dataFim || ''} onChange={e => updateField('dataFim', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Tabela Vinculada</Label><Input value={editing?.tabelaVinculada || ''} onChange={e => updateField('tabelaVinculada', e.target.value)} placeholder="Nome da tabela..." /></div>
            <div className="space-y-1"><Label className="text-xs">Observações</Label><Textarea value={editing?.observacoes || ''} onChange={e => updateField('observacoes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
