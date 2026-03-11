import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, ListChecks, Pencil, Eye } from 'lucide-react';

interface ChecklistModelo {
  id: string;
  nome: string;
  tipoServico: string;
  obrigatorio: boolean;
  status: 'Ativo' | 'Inativo' | 'Rascunho';
  qtdItens: number;
}

const MOCK: ChecklistModelo[] = [
  { id: '1', nome: 'Checklist Guincho Leve', tipoServico: 'Guincho', obrigatorio: true, status: 'Ativo', qtdItens: 12 },
  { id: '2', nome: 'Checklist Pneu', tipoServico: 'Troca de pneu', obrigatorio: true, status: 'Ativo', qtdItens: 8 },
  { id: '3', nome: 'Checklist Bateria', tipoServico: 'Carga de bateria', obrigatorio: false, status: 'Ativo', qtdItens: 6 },
  { id: '4', nome: 'Checklist Reboque Pesado', tipoServico: 'Reboque', obrigatorio: true, status: 'Rascunho', qtdItens: 15 },
  { id: '5', nome: 'Checklist Chaveiro', tipoServico: 'Chaveiro', obrigatorio: false, status: 'Inativo', qtdItens: 5 },
];

export default function AdminChecklists() {
  const [modelos, setModelos] = useState(MOCK);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', tipoServico: '', obrigatorio: false });

  const filtered = useMemo(() => modelos.filter(m =>
    (!search || m.nome.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || m.status === filterStatus)
  ), [modelos, search, filterStatus]);

  const handleSave = () => {
    if (!form.nome) { toast.error('Informe o nome do checklist.'); return; }
    setModelos(prev => [...prev, { id: `c${Date.now()}`, nome: form.nome, tipoServico: form.tipoServico || '—', obrigatorio: form.obrigatorio, status: 'Rascunho' as const, qtdItens: 0 }]);
    setModalOpen(false);
    setForm({ nome: '', tipoServico: '', obrigatorio: false });
    toast.success('Modelo de checklist criado.');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Checklists Digitais</h1>
          <p>Configure modelos de checklists para uso em campo pelos prestadores</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Novo Checklist</Button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold tabular-nums text-success">{modelos.filter(m => m.status === 'Ativo').length}</p><p className="text-[11px] text-muted-foreground mt-1">Ativos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold tabular-nums text-foreground">{modelos.filter(m => m.obrigatorio).length}</p><p className="text-[11px] text-muted-foreground mt-1">Obrigatórios</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold tabular-nums text-muted-foreground">{modelos.reduce((s, m) => s + m.qtdItens, 0)}</p><p className="text-[11px] text-muted-foreground mt-1">Itens totais</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar checklist..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Rascunho">Rascunho</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tipo de Serviço</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Obrigatório</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center">Itens</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><ListChecks className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum modelo de checklist</p><p className="empty-state-description">Crie modelos para padronizar verificações em campo</p></div>
              </TableCell></TableRow>
            ) : filtered.map(m => (
              <TableRow key={m.id} className="table-row-hover">
                <TableCell><span className="font-semibold text-[13px]">{m.nome}</span></TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{m.tipoServico}</TableCell>
                <TableCell><Badge variant={m.obrigatorio ? 'default' : 'secondary'} className="font-semibold text-[11px]">{m.obrigatorio ? 'Sim' : 'Não'}</Badge></TableCell>
                <TableCell><Badge variant={m.status === 'Ativo' ? 'success' : m.status === 'Rascunho' ? 'warning' : 'secondary'} className="font-semibold">{m.status}</Badge></TableCell>
                <TableCell className="text-center text-[13px] font-medium tabular-nums">{m.qtdItens}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Modelo de Checklist</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Checklist Guincho Leve" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Tipo de Serviço</Label><Input value={form.tipoServico} onChange={e => setForm(p => ({ ...p, tipoServico: e.target.value }))} placeholder="Ex: Guincho, Troca de pneu" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.obrigatorio} onCheckedChange={v => setForm(p => ({ ...p, obrigatorio: v }))} /><Label className="text-xs">Obrigatório para conclusão do atendimento</Label></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Criar Checklist</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
