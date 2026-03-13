import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, FileText, Eye, Pencil, MessageCircle, Loader2, Trash2 } from 'lucide-react';
import { fetchTemplates, upsertTemplate, toggleTemplate, deleteTemplate } from '@/services/automationEngine';
import { TRIGGER_EVENTS, type MessageTemplate, type AutomationChannel, type AutomationAudience } from '@/types/automation';

const CHANNELS: AutomationChannel[] = ['whatsapp', 'email', 'sms', 'push', 'internal'];
const AUDIENCES: AutomationAudience[] = ['cliente', 'prestador', 'interno'];

const audienceBadge = (a: string) => {
  switch (a) { case 'cliente': return 'default'; case 'prestador': return 'info'; case 'interno': return 'warning'; default: return 'secondary'; }
};

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ key: '', name: '', channel: 'whatsapp' as AutomationChannel, audience: 'cliente' as AutomationAudience, trigger_event: 'novo_contato', content: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err: any) {
      toast.error('Erro ao carregar templates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => templates.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.key.toLowerCase().includes(search.toLowerCase())) &&
    (filterChannel === 'all' || t.channel === filterChannel) &&
    (filterAudience === 'all' || t.audience === filterAudience)
  ), [templates, search, filterChannel, filterAudience]);

  const openEdit = (t: MessageTemplate) => {
    setEditing(t);
    setForm({ key: t.key, name: t.name, channel: t.channel, audience: t.audience, trigger_event: t.trigger_event, content: t.content });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ key: '', name: '', channel: 'whatsapp', audience: 'cliente', trigger_event: 'novo_contato', content: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.key) { toast.error('Preencha nome e chave.'); return; }
    if (!form.content) { toast.error('Preencha o conteúdo.'); return; }
    try {
      setSaving(true);
      const payload: any = { ...form };
      if (editing) payload.id = editing.id;
      await upsertTemplate(payload);
      toast.success(editing ? 'Template atualizado.' : 'Template criado.');
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: MessageTemplate) => {
    try {
      await toggleTemplate(t.id, !t.is_active);
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x));
      toast.success('Status atualizado.');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleDelete = async (t: MessageTemplate) => {
    if (!confirm(`Excluir template "${t.name}"?`)) return;
    try {
      await deleteTemplate(t.id);
      setTemplates(prev => prev.filter(x => x.id !== t.id));
      toast.success('Template excluído.');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const activeCount = templates.filter(t => t.is_active).length;
  const whatsappCount = templates.filter(t => t.channel === 'whatsapp').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Templates de Mensagem</h1>
          <p>Gerencie os modelos de mensagens usados em automações e comunicações</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Novo Template</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Ativos', value: activeCount, color: 'text-success' },
          { label: 'Inativos', value: templates.length - activeCount, color: 'text-muted-foreground' },
          { label: 'WhatsApp', value: whatsappCount, color: 'text-success' },
          { label: 'Total', value: templates.length, color: 'text-foreground' },
        ].map(k => (
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
            <Input placeholder="Buscar template..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterChannel} onValueChange={setFilterChannel}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Canal" /></SelectTrigger><SelectContent><SelectItem value="all">Todos canais</SelectItem>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={filterAudience} onValueChange={setFilterAudience}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Audiência" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Template</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Chave</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Canal</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Audiência</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Gatilho</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <div className="empty-state"><div className="empty-state-icon"><FileText className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum template encontrado</p><p className="empty-state-description">Crie templates para padronizar comunicações</p></div>
                </TableCell></TableRow>
              ) : filtered.map(t => (
                <TableRow key={t.id} className="table-row-hover">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="font-semibold text-[13px]">{t.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">{t.key}</code></TableCell>
                  <TableCell><Badge variant="outline" className="font-semibold text-[11px]">{t.channel}</Badge></TableCell>
                  <TableCell><Badge variant={audienceBadge(t.audience) as any} className="font-semibold text-[11px]">{t.audience}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{TRIGGER_EVENTS[t.trigger_event as keyof typeof TRIGGER_EVENTS] || t.trigger_event}</TableCell>
                  <TableCell>
                    <Switch checked={t.is_active} onCheckedChange={() => handleToggle(t)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(t)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      {/* Preview modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{previewTemplate?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{previewTemplate?.channel}</Badge>
              <Badge variant={audienceBadge(previewTemplate?.audience || '') as any}>{previewTemplate?.audience}</Badge>
              <Badge variant="secondary">{previewTemplate?.trigger_event}</Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border text-[13px] leading-relaxed whitespace-pre-wrap font-mono">{previewTemplate?.content}</div>
            <p className="text-[11px] text-muted-foreground">Chave: <code>{previewTemplate?.key}</code></p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPreviewTemplate(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Template' : 'Novo Template'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Chave *</Label><Input value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))} placeholder="ex: welcome_client" disabled={!!editing} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v as AutomationChannel }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Audiência</Label>
                <Select value={form.audience} onValueChange={v => setForm(p => ({ ...p, audience: v as AutomationAudience }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Gatilho</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm(p => ({ ...p, trigger_event: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TRIGGER_EVENTS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Conteúdo *</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5} placeholder="Use {{variavel}} para campos dinâmicos" /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}{editing ? 'Salvar' : 'Criar Template'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
