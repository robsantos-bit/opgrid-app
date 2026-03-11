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
import { Plus, Search, Zap, Play, Pause, Clock, CheckCircle2, XCircle, Pencil } from 'lucide-react';

interface Automacao {
  id: string;
  nome: string;
  gatilho: string;
  canal: string;
  ativa: boolean;
  ultimaExecucao: string | null;
  execucoes: number;
}

const MOCK: Automacao[] = [
  { id: '1', nome: 'Notificar prestador - Nova OS', gatilho: 'Solicitação criada', canal: 'WhatsApp', ativa: true, ultimaExecucao: '2025-03-10T14:30:00', execucoes: 342 },
  { id: '2', nome: 'Alerta SLA crítico', gatilho: 'SLA > 80%', canal: 'WhatsApp + E-mail', ativa: true, ultimaExecucao: '2025-03-10T12:15:00', execucoes: 87 },
  { id: '3', nome: 'Lembrete aceite pendente', gatilho: 'Oferta sem resposta 5min', canal: 'WhatsApp', ativa: true, ultimaExecucao: '2025-03-10T11:00:00', execucoes: 156 },
  { id: '4', nome: 'Confirmar chegada ao local', gatilho: 'Status → A caminho', canal: 'Push', ativa: false, ultimaExecucao: '2025-02-28T09:00:00', execucoes: 45 },
  { id: '5', nome: 'Pesquisa satisfação cliente', gatilho: 'Atendimento concluído', canal: 'WhatsApp', ativa: true, ultimaExecucao: '2025-03-10T16:45:00', execucoes: 210 },
  { id: '6', nome: 'Relatório diário operação', gatilho: 'Cron 18:00', canal: 'E-mail', ativa: false, ultimaExecucao: null, execucoes: 0 },
];

export default function AdminAutomacoes() {
  const [automacoes, setAutomacoes] = useState(MOCK);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', gatilho: '', canal: 'WhatsApp' });

  const filtered = useMemo(() => automacoes.filter(a =>
    (!search || a.nome.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || (filterStatus === 'ativa' ? a.ativa : !a.ativa))
  ), [automacoes, search, filterStatus]);

  const handleToggle = (id: string) => {
    setAutomacoes(prev => prev.map(a => a.id === id ? { ...a, ativa: !a.ativa } : a));
    toast.success('Status atualizado.');
  };

  const handleSave = () => {
    if (!form.nome) { toast.error('Informe o nome da automação.'); return; }
    setAutomacoes(prev => [...prev, { id: `a${Date.now()}`, nome: form.nome, gatilho: form.gatilho || '—', canal: form.canal, ativa: false, ultimaExecucao: null, execucoes: 0 }]);
    setModalOpen(false);
    setForm({ nome: '', gatilho: '', canal: 'WhatsApp' });
    toast.success('Automação criada.');
  };

  const ativas = automacoes.filter(a => a.ativa).length;
  const totalExec = automacoes.reduce((s, a) => s + a.execucoes, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Automações</h1>
          <p>Configure fluxos automáticos de notificação, alertas e ações do sistema</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Nova Automação</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Zap className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Ativas</p><p className="kpi-value">{ativas}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-muted text-muted-foreground"><Pause className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pausadas</p><p className="kpi-value">{automacoes.length - ativas}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><Play className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Execuções totais</p><p className="kpi-value">{totalExec}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total</p><p className="kpi-value">{automacoes.length}</p></div></div>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar automação..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ativa">Ativas</SelectItem><SelectItem value="inativa">Pausadas</SelectItem></SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Automação</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Gatilho</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Canal</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Última execução</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center hidden sm:table-cell">Execuções</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><Zap className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhuma automação configurada</p><p className="empty-state-description">Crie automações para agilizar processos operacionais</p></div>
              </TableCell></TableRow>
            ) : filtered.map(a => (
              <TableRow key={a.id} className="table-row-hover">
                <TableCell><span className="font-semibold text-[13px]">{a.nome}</span></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{a.gatilho}</TableCell>
                <TableCell><Badge variant="outline" className="font-semibold text-[11px]">{a.canal}</Badge></TableCell>
                <TableCell><Badge variant={a.ativa ? 'success' : 'secondary'} className="font-semibold">{a.ativa ? 'Ativa' : 'Pausada'}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{a.ultimaExecucao ? new Date(a.ultimaExecucao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                <TableCell className="text-center hidden sm:table-cell text-[13px] font-medium tabular-nums">{a.execucoes}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Switch checked={a.ativa} onCheckedChange={() => handleToggle(a.id)} />
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
          <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Notificar prestador" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Gatilho</Label><Input value={form.gatilho} onChange={e => setForm(p => ({ ...p, gatilho: e.target.value }))} placeholder="Ex: Solicitação criada" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Canal</Label>
              <Select value={form.canal} onValueChange={v => setForm(p => ({ ...p, canal: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="E-mail">E-mail</SelectItem><SelectItem value="Push">Push</SelectItem><SelectItem value="WhatsApp + E-mail">WhatsApp + E-mail</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Criar Automação</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
