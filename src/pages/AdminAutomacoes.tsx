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
import { Plus, Search, Zap, Play, Pause, Clock, Pencil, Loader2, Trash2 } from 'lucide-react';
import { useAutomations, useTemplates, useUpsertAutomation, useToggleAutomation, useDeleteAutomation } from '@/hooks/useMessagingData';
import { TRIGGER_EVENTS, type Automation, type AutomationChannel, type AutomationAudience } from '@/types/automation';

const CHANNELS: AutomationChannel[] = ['whatsapp', 'email', 'sms', 'push', 'internal'];
const AUDIENCES: AutomationAudience[] = ['cliente', 'prestador', 'interno'];

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAutomacoes() {
  const { data: automacoes = [], isLoading } = useAutomations();
  const { data: templates = [] } = useTemplates();
  const upsertMut = useUpsertAutomation();
  const toggleMut = useToggleAutomation();
  const deleteMut = useDeleteAutomation();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [form, setForm] = useState({ name: '', trigger_event: 'novo_contato', channel: 'whatsapp' as AutomationChannel, audience: 'cliente' as AutomationAudience, template_key: '__none__', delay_seconds: 0 });

  const filtered = useMemo(() => automacoes.filter(a =>
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.trigger_event.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || (filterStatus === 'ativa' ? a.is_active : !a.is_active)) &&
    (filterChannel === 'all' || a.channel === filterChannel) &&
    (filterAudience === 'all' || (a as any).audience === filterAudience)
  ), [automacoes, search, filterStatus, filterChannel, filterAudience]);

  const openEdit = (a: Automation) => {
    setEditing(a);
    setForm({ name: a.name, trigger_event: a.trigger_event, channel: a.channel, audience: (a as any).audience || 'cliente', template_key: a.template_key || '__none__', delay_seconds: a.delay_seconds });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', trigger_event: 'novo_contato', channel: 'whatsapp', audience: 'cliente', template_key: '__none__', delay_seconds: 0 });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Informe o nome da automação.'); return; }
    try {
      const payload: any = { ...form, template_key: form.template_key === '__none__' ? null : form.template_key };
      if (editing) payload.id = editing.id;
      await upsertMut.mutateAsync(payload);
      toast.success(editing ? 'Automação atualizada.' : 'Automação criada.');
      setModalOpen(false);
    } catch (err: any) { toast.error('Erro: ' + err.message); }
  };

  const handleToggle = async (a: Automation) => {
    try {
      await toggleMut.mutateAsync({ id: a.id, is_active: !a.is_active });
      toast.success('Status atualizado.');
    } catch (err: any) { toast.error('Erro: ' + err.message); }
  };

  const handleDelete = async (a: Automation) => {
    if (!confirm(`Excluir automação "${a.name}"?`)) return;
    try {
      await deleteMut.mutateAsync(a.id);
      toast.success('Automação excluída.');
    } catch (err: any) { toast.error('Erro: ' + err.message); }
  };

  const ativas = automacoes.filter(a => a.is_active).length;
  const totalExec = automacoes.reduce((s, a) => s + (a.executions || 0), 0);

  const templatesByKey = useMemo(() => {
    const map: Record<string, string> = {};
    templates.forEach(t => { map[t.key] = t.name; });
    return map;
  }, [templates]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Automações</h1>
          <p>Configure fluxos automáticos de notificação, alertas e ações do sistema</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Nova Automação</Button>
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
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ativa">Ativas</SelectItem><SelectItem value="inativa">Pausadas</SelectItem></SelectContent></Select>
          <Select value={filterChannel} onValueChange={setFilterChannel}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Canal" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={filterAudience} onValueChange={setFilterAudience}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Audiência" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Automação</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Gatilho</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Canal</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Audiência</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Template</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Delay</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Atualizado</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-center hidden sm:table-cell">Exec.</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-16">
                  <div className="empty-state"><div className="empty-state-icon"><Zap className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhuma automação configurada</p><p className="empty-state-description">Crie automações para agilizar processos operacionais</p></div>
                </TableCell></TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id} className="table-row-hover">
                  <TableCell><span className="font-semibold text-[13px]">{a.name}</span></TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{TRIGGER_EVENTS[a.trigger_event as keyof typeof TRIGGER_EVENTS] || a.trigger_event}</TableCell>
                  <TableCell><Badge variant="outline" className="font-semibold text-[11px]">{a.channel}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell"><Badge variant="secondary" className="font-semibold text-[11px]">{(a as any).audience || '—'}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{a.template_key ? (templatesByKey[a.template_key] || a.template_key) : '—'}</TableCell>
                  <TableCell><Badge variant={a.is_active ? 'success' : 'secondary'} className="font-semibold">{a.is_active ? 'Ativa' : 'Pausada'}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground tabular-nums">{a.delay_seconds > 0 ? `${a.delay_seconds}s` : 'Imediato'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-[12px] text-muted-foreground tabular-nums">{formatDate(a.updated_at)}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell text-[13px] font-medium tabular-nums">{a.executions || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Switch checked={a.is_active} onCheckedChange={() => handleToggle(a)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Automação' : 'Nova Automação'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Notificar prestador" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Gatilho</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm(p => ({ ...p, trigger_event: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TRIGGER_EVENTS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v as AutomationChannel }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Audiência</Label>
                <Select value={form.audience} onValueChange={v => setForm(p => ({ ...p, audience: v as AutomationAudience }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Delay (segundos)</Label><Input type="number" min={0} value={form.delay_seconds} onChange={e => setForm(p => ({ ...p, delay_seconds: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Template</Label>
              <Select value={form.template_key} onValueChange={v => setForm(p => ({ ...p, template_key: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar template..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {templates.map(t => <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsertMut.isPending}>{upsertMut.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}{editing ? 'Salvar' : 'Criar Automação'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
