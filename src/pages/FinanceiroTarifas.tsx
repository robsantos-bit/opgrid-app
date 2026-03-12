import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, DollarSign, Tag, Loader2 } from 'lucide-react';

interface TarifaLocal {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  formaCobranca: string;
  status: 'Ativo' | 'Inativo';
}

const MOCK_TARIFAS: TarifaLocal[] = [
  { id: '1', nome: 'KM Rodado', categoria: 'Deslocamento', unidade: 'Quilometragem', formaCobranca: 'Valor unitário', status: 'Ativo' },
  { id: '2', nome: 'Hora Parada', categoria: 'Tempo', unidade: 'Hora', formaCobranca: 'Valor unitário', status: 'Ativo' },
  { id: '3', nome: 'Taxa de Saída', categoria: 'Adicional', unidade: 'Unidade', formaCobranca: 'Valor final', status: 'Ativo' },
  { id: '4', nome: 'Pedágio', categoria: 'Adicional', unidade: 'Unidade', formaCobranca: 'Valor final', status: 'Ativo' },
  { id: '5', nome: 'Noturno', categoria: 'Adicional', unidade: 'Unidade', formaCobranca: 'Valor unitário', status: 'Inativo' },
];

export default function FinanceiroTarifas() {
  const [tarifas, setTarifas] = useState(MOCK_TARIFAS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', categoria: 'Deslocamento', unidade: 'Quilometragem', formaCobranca: 'Valor unitário' });

  const filtered = useMemo(() => tarifas.filter(t =>
    (!search || t.nome.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || t.status === filterStatus)
  ), [tarifas, search, filterStatus]);

  const ativos = tarifas.filter(t => t.status === 'Ativo').length;

  const handleSave = () => {
    if (!form.nome) { toast.error('Informe o nome da tarifa.'); return; }
    setTarifas(prev => [...prev, { id: `t${Date.now()}`, nome: form.nome, categoria: form.categoria, unidade: form.unidade, formaCobranca: form.formaCobranca, status: 'Ativo' }]);
    setModalOpen(false);
    setForm({ nome: '', categoria: 'Deslocamento', unidade: 'Quilometragem', formaCobranca: 'Valor unitário' });
    toast.success('Tarifa criada.');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text"><h1>Tarifas</h1><p>Gerencie tarifas de serviço aplicáveis aos atendimentos</p></div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Nova Tarifa</Button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><DollarSign className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Ativas</p><p className="kpi-value">{ativos}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-muted text-muted-foreground"><Tag className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total</p><p className="kpi-value">{tarifas.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Tag className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Inativas</p><p className="kpi-value">{tarifas.length - ativos}</p></div></div>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tarifa..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Categoria</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Unidade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Forma de Cobrança</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><DollarSign className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhuma tarifa encontrada</p><p className="empty-state-description">Crie tarifas para gerenciar valores de serviço</p></div>
              </TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id} className="table-row-hover">
                <TableCell className="font-semibold text-[13px]">{t.nome}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{t.categoria}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{t.unidade}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{t.formaCobranca}</TableCell>
                <TableCell><Badge variant={t.status === 'Ativo' ? 'success' : 'secondary'} className="font-semibold">{t.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Tarifa</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: KM Rodado" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Deslocamento">Deslocamento</SelectItem><SelectItem value="Tempo">Tempo</SelectItem><SelectItem value="Adicional">Adicional</SelectItem><SelectItem value="Equipamento">Equipamento</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Unidade</Label>
              <Select value={form.unidade} onValueChange={v => setForm(p => ({ ...p, unidade: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Quilometragem">Quilometragem</SelectItem><SelectItem value="Hora">Hora</SelectItem><SelectItem value="Unidade">Unidade</SelectItem><SelectItem value="Dia">Dia</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Criar Tarifa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}