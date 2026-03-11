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
import { Plus, Search, FileText, Eye, Pencil, MessageCircle } from 'lucide-react';

interface Template {
  id: string;
  nome: string;
  tipo: 'Notificação' | 'Confirmação' | 'Lembrete' | 'Pesquisa' | 'Alerta';
  canal: 'WhatsApp' | 'E-mail' | 'SMS' | 'Push';
  status: 'Ativo' | 'Rascunho' | 'Inativo';
  ultimaAtualizacao: string;
  conteudo: string;
}

const MOCK: Template[] = [
  { id: '1', nome: 'Oferta de serviço ao prestador', tipo: 'Notificação', canal: 'WhatsApp', status: 'Ativo', ultimaAtualizacao: '2025-03-08', conteudo: 'Olá {{prestador}}, nova OS disponível: {{protocolo}} em {{cidade}}. Aceitar?' },
  { id: '2', nome: 'Confirmação de aceite', tipo: 'Confirmação', canal: 'WhatsApp', status: 'Ativo', ultimaAtualizacao: '2025-03-05', conteudo: 'OS {{protocolo}} confirmada! Dirija-se a {{endereco}}. Cliente: {{cliente}}.' },
  { id: '3', nome: 'Lembrete de chegada', tipo: 'Lembrete', canal: 'WhatsApp', status: 'Ativo', ultimaAtualizacao: '2025-02-28', conteudo: 'Prestador {{prestador}} está a caminho. Previsão: {{eta}} minutos.' },
  { id: '4', nome: 'Pesquisa de satisfação', tipo: 'Pesquisa', canal: 'WhatsApp', status: 'Ativo', ultimaAtualizacao: '2025-03-01', conteudo: 'Como foi seu atendimento? Avalie de 1 a 5.' },
  { id: '5', nome: 'Alerta SLA crítico', tipo: 'Alerta', canal: 'E-mail', status: 'Rascunho', ultimaAtualizacao: '2025-02-20', conteudo: 'ATENÇÃO: OS {{protocolo}} ultrapassou o SLA. Ação imediata necessária.' },
  { id: '6', nome: 'Boas-vindas prestador', tipo: 'Notificação', canal: 'E-mail', status: 'Inativo', ultimaAtualizacao: '2025-01-15', conteudo: 'Bem-vindo à rede OpGrid, {{prestador}}!' },
];

const tipoVariant = (t: string) => {
  switch (t) { case 'Notificação': return 'default'; case 'Confirmação': return 'success'; case 'Lembrete': return 'info'; case 'Pesquisa': return 'warning'; case 'Alerta': return 'destructive'; default: return 'secondary'; }
};

export default function AdminTemplates() {
  const [templates, setTemplates] = useState(MOCK);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', tipo: 'Notificação', canal: 'WhatsApp', conteudo: '' });

  const filtered = useMemo(() => templates.filter(t =>
    (!search || t.nome.toLowerCase().includes(search.toLowerCase())) &&
    (filterTipo === 'all' || t.tipo === filterTipo) &&
    (filterStatus === 'all' || t.status === filterStatus)
  ), [templates, search, filterTipo, filterStatus]);

  const handleSave = () => {
    if (!form.nome) { toast.error('Informe o nome do template.'); return; }
    setTemplates(prev => [...prev, { id: `t${Date.now()}`, nome: form.nome, tipo: form.tipo as any, canal: form.canal as any, status: 'Rascunho', ultimaAtualizacao: new Date().toISOString().slice(0, 10), conteudo: form.conteudo }]);
    setModalOpen(false);
    setForm({ nome: '', tipo: 'Notificação', canal: 'WhatsApp', conteudo: '' });
    toast.success('Template criado.');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Templates de Mensagem</h1>
          <p>Gerencie os modelos de mensagens usados em automações e comunicações</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Novo Template</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Ativos', value: templates.filter(t => t.status === 'Ativo').length, color: 'text-success' },
          { label: 'Rascunhos', value: templates.filter(t => t.status === 'Rascunho').length, color: 'text-warning' },
          { label: 'WhatsApp', value: templates.filter(t => t.canal === 'WhatsApp').length, color: 'text-success' },
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
          <Select value={filterTipo} onValueChange={setFilterTipo}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos tipos</SelectItem><SelectItem value="Notificação">Notificação</SelectItem><SelectItem value="Confirmação">Confirmação</SelectItem><SelectItem value="Lembrete">Lembrete</SelectItem><SelectItem value="Pesquisa">Pesquisa</SelectItem><SelectItem value="Alerta">Alerta</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Rascunho">Rascunho</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tipo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Canal</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Atualizado</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><FileText className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum template encontrado</p><p className="empty-state-description">Crie templates para padronizar comunicações</p></div>
              </TableCell></TableRow>
            ) : filtered.map(t => (
              <TableRow key={t.id} className="table-row-hover">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="font-semibold text-[13px]">{t.nome}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant={tipoVariant(t.tipo) as any} className="font-semibold text-[11px]">{t.tipo}</Badge></TableCell>
                <TableCell><Badge variant="outline" className="font-semibold text-[11px]">{t.canal}</Badge></TableCell>
                <TableCell><Badge variant={t.status === 'Ativo' ? 'success' : t.status === 'Rascunho' ? 'warning' : 'secondary'} className="font-semibold">{t.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{new Date(t.ultimaAtualizacao).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(t)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Preview modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{previewTemplate?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2"><Badge variant={tipoVariant(previewTemplate?.tipo || '') as any}>{previewTemplate?.tipo}</Badge><Badge variant="outline">{previewTemplate?.canal}</Badge></div>
            <div className="p-4 rounded-lg bg-muted/50 border text-[13px] leading-relaxed whitespace-pre-wrap font-mono">{previewTemplate?.conteudo}</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPreviewTemplate(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Notificação">Notificação</SelectItem><SelectItem value="Confirmação">Confirmação</SelectItem><SelectItem value="Lembrete">Lembrete</SelectItem><SelectItem value="Pesquisa">Pesquisa</SelectItem><SelectItem value="Alerta">Alerta</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Canal</Label><Select value={form.canal} onValueChange={v => setForm(p => ({ ...p, canal: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="E-mail">E-mail</SelectItem><SelectItem value="SMS">SMS</SelectItem><SelectItem value="Push">Push</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Conteúdo</Label><Textarea value={form.conteudo} onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))} rows={4} placeholder="Use {{variavel}} para campos dinâmicos" /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Criar Template</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
