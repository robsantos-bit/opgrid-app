import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, HelpCircle, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

interface Ticket {
  id: string;
  assunto: string;
  solicitante: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  status: 'Aberto' | 'Em andamento' | 'Resolvido';
  criadoEm: string;
}

const MOCK: Ticket[] = [
  { id: 'SUP-001', assunto: 'Erro ao gerar fatura', solicitante: 'Carlos Silva', prioridade: 'Alta', status: 'Aberto', criadoEm: '2025-03-10T10:00:00' },
  { id: 'SUP-002', assunto: 'Prestador não aparece no mapa', solicitante: 'Ana Souza', prioridade: 'Média', status: 'Em andamento', criadoEm: '2025-03-09T14:30:00' },
  { id: 'SUP-003', assunto: 'Dúvida sobre permissões', solicitante: 'João Oliveira', prioridade: 'Baixa', status: 'Resolvido', criadoEm: '2025-03-08T09:00:00' },
];

export default function AdminSuporte() {
  const [tickets, setTickets] = useState(MOCK);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ assunto: '', descricao: '', prioridade: 'Média' });

  const filtered = tickets.filter(t => !search || t.assunto.toLowerCase().includes(search.toLowerCase()) || t.solicitante.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.assunto) { toast.error('Informe o assunto.'); return; }
    setTickets(prev => [...prev, { id: `SUP-${String(prev.length + 1).padStart(3, '0')}`, assunto: form.assunto, solicitante: 'Você', prioridade: form.prioridade as any, status: 'Aberto', criadoEm: new Date().toISOString() }]);
    setModalOpen(false);
    setForm({ assunto: '', descricao: '', prioridade: 'Média' });
    toast.success('Ticket criado.');
  };

  const kpis = [
    { label: 'Abertos', value: tickets.filter(t => t.status === 'Aberto').length, icon: MessageSquare, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Em andamento', value: tickets.filter(t => t.status === 'Em andamento').length, icon: Clock, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Resolvidos', value: tickets.filter(t => t.status === 'Resolvido').length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Suporte</h1>
          <p>Central de tickets e atendimento interno</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Novo Ticket</Button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-4.5 w-4.5" /></div>
            <div><p className="kpi-label">{k.label}</p><p className="kpi-value">{k.value}</p></div>
          </div>
        ))}
      </div>

      <Card><CardContent className="p-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar ticket..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold w-[90px]">ID</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Assunto</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Solicitante</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prioridade</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Data</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><HelpCircle className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum ticket encontrado</p><p className="empty-state-description">Abra um ticket para relatar problemas ou solicitar suporte</p></div>
              </TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id} className="table-row-hover">
                <TableCell className="font-mono text-[11px] text-muted-foreground font-semibold">{t.id}</TableCell>
                <TableCell className="font-semibold text-[13px]">{t.assunto}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{t.solicitante}</TableCell>
                <TableCell><Badge variant={t.prioridade === 'Urgente' ? 'destructive' : t.prioridade === 'Alta' ? 'warning' : t.prioridade === 'Média' ? 'info' : 'secondary'} className="font-semibold text-[11px]">{t.prioridade}</Badge></TableCell>
                <TableCell><Badge variant={t.status === 'Aberto' ? 'warning' : t.status === 'Em andamento' ? 'info' : 'success'} className="font-semibold">{t.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{new Date(t.criadoEm).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Ticket de Suporte</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Assunto *</Label><Input value={form.assunto} onChange={e => setForm(p => ({ ...p, assunto: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={3} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => setForm(p => ({ ...p, prioridade: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Baixa">Baixa</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Urgente">Urgente</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Criar Ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
