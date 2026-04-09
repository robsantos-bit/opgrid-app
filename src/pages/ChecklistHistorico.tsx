import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, Eye, FileDown, Receipt, Image, MessageCircle, Pencil, UserCheck, Trash2,
  ListChecks, Clock, CheckCircle2, AlertTriangle, Mail, Link2, Copy, ArrowLeft,
} from 'lucide-react';
import type { ChecklistRealizado } from '@/types/checklist';
import { CHECKLISTS_REALIZADOS_MOCK } from '@/types/checklist';

export default function ChecklistHistorico() {
  const [checklists, setChecklists] = useState<ChecklistRealizado[]>(CHECKLISTS_REALIZADOS_MOCK);
  const [search, setSearch] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [viewItem, setViewItem] = useState<ChecklistRealizado | null>(null);

  const filtered = useMemo(() => checklists.filter(c => {
    if (search) {
      const s = search.toLowerCase();
      if (!c.protocolo.toLowerCase().includes(s) && !c.placa.toLowerCase().includes(s) && !c.cliente.toLowerCase().includes(s) && !c.executante.toLowerCase().includes(s)) return false;
    }
    if (dataInicial && c.dataHora < dataInicial) return false;
    if (dataFinal && c.dataHora > dataFinal + 'T23:59:59') return false;
    return true;
  }), [checklists, search, dataInicial, dataFinal]);

  const concluidos = checklists.filter(c => c.status === 'Concluído').length;
  const pendentes = checklists.filter(c => c.status === 'Pendente Entrega').length;
  const andamento = checklists.filter(c => c.status === 'Em andamento').length;

  const statusBadge = (status: string) => {
    if (status === 'Concluído') return <Badge variant="success" className="font-semibold text-[10px]">Concluído</Badge>;
    if (status === 'Pendente Entrega') return <Badge variant="warning" className="font-semibold text-[10px]">Pendente Entrega</Badge>;
    return <Badge variant="default" className="font-semibold text-[10px]">Em andamento</Badge>;
  };

  const handleAction = (action: string, item: ChecklistRealizado) => {
    switch (action) {
      case 'entrega': toast.info(`Realizar entrega do checklist ${item.protocolo}`); break;
      case 'view': setViewItem(item); break;
      case 'pdf': toast.success(`PDF gerado para ${item.protocolo}`); break;
      case 'recibo': toast.success(`Recibo gerado para ${item.protocolo}`); break;
      case 'fotos': toast.info(`Abrindo fotos extras de ${item.protocolo}`); break;
      case 'whatsapp': toast.success(`Enviando via WhatsApp: ${item.protocolo}`); break;
      case 'edit': toast.info(`Editando checklist ${item.protocolo}`); break;
      case 'trocar': toast.info(`Trocar executante de ${item.protocolo}`); break;
      case 'excluir':
        setChecklists(prev => prev.filter(c => c.id !== item.id));
        toast.success('Checklist excluído.');
        break;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Histórico</h1>
          <p>Checklists realizados</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Concluídos</p><p className="kpi-value">{concluidos}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><AlertTriangle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pendentes</p><p className="kpi-value">{pendentes}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Em andamento</p><p className="kpi-value">{andamento}</p></div></div>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-[13px] flex items-center gap-2"><Search className="h-4 w-4" /> Filtros</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa, protocolo ou cliente..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Data inicial</label>
            <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground font-medium">Data final</label>
            <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
          </div>
        </div>
      </CardContent></Card>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-16 text-center">
            <div className="empty-state">
              <div className="empty-state-icon"><ListChecks className="h-5 w-5 text-muted-foreground" /></div>
              <p className="empty-state-title">Nenhum checklist encontrado</p>
              <p className="empty-state-description">Ajuste os filtros ou aguarde novos checklists</p>
            </div>
          </CardContent></Card>
        ) : filtered.map(item => (
          <Card key={item.id} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ListChecks className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[14px]">{item.modeloVeiculo}</h3>
                      {statusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">🕐 {new Date(item.dataHora).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Executado por: <strong>{item.executante}</strong></p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-1.5">
                {item.status === 'Pendente Entrega' && (
                  <Button size="sm" variant="default" className="gap-1 text-[11px] h-7" onClick={() => handleAction('entrega', item)}>
                    <ListChecks className="h-3 w-3" /> Realizar Entrega
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1 text-[11px] h-7" onClick={() => handleAction('view', item)}><Eye className="h-3 w-3" /> Visualizar</Button>
                <Button size="sm" variant="outline" className="gap-1 text-[11px] h-7" onClick={() => handleAction('pdf', item)}><FileDown className="h-3 w-3" /> PDF</Button>
                <Button size="sm" variant="outline" className="gap-1 text-[11px] h-7" onClick={() => handleAction('recibo', item)}><Receipt className="h-3 w-3" /> Recibo</Button>
                <Button size="sm" variant="outline" className="gap-1 text-[11px] h-7" onClick={() => handleAction('fotos', item)}><Image className="h-3 w-3" /> Fotos Extras</Button>
                <Button size="sm" variant="outline" className="gap-1 text-[11px] h-7" onClick={() => handleAction('whatsapp', item)}><MessageCircle className="h-3 w-3" /> WhatsApp</Button>
                <Button size="sm" variant="ghost" className="gap-1 text-[11px] h-7" onClick={() => handleAction('edit', item)}><Pencil className="h-3 w-3" /> Editar</Button>
                <Button size="sm" variant="ghost" className="gap-1 text-[11px] h-7" onClick={() => handleAction('trocar', item)}><UserCheck className="h-3 w-3" /> Trocar Executante</Button>
                <Button size="sm" variant="ghost" className="gap-1 text-[11px] h-7 text-destructive hover:text-destructive" onClick={() => handleAction('excluir', item)}><Trash2 className="h-3 w-3" /> Excluir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={open => { if (!open) setViewItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2">
            <span>{viewItem?.modeloNome}</span>
            {viewItem && statusBadge(viewItem.status)}
          </DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <p className="text-[12px] text-muted-foreground">Detalhes do checklist</p>
              <div className="space-y-3 rounded-lg border border-border/50 p-4">
                {[
                  { icon: '🏢', label: 'Cliente', value: viewItem.cliente },
                  { icon: '👤', label: 'Realizado por', value: viewItem.executante },
                  { icon: '🕐', label: 'Data/Hora', value: new Date(viewItem.dataHora).toLocaleString('pt-BR') },
                  { icon: '🚗', label: 'Modelo do Veículo', value: viewItem.modeloVeiculo },
                  { icon: '🔢', label: 'Placa', value: viewItem.placa },
                  { icon: '📋', label: 'Protocolo', value: viewItem.protocolo },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-lg">{row.icon}</span>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{row.label}</p>
                      <p className="text-[13px] font-semibold">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-[13px]">Compartilhar</h3>
                <p className="text-[11px] text-muted-foreground">Envie este checklist por email ou gere um link</p>
                <div className="space-y-1.5">
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[12px]" onClick={() => toast.success('Enviando via WhatsApp...')}><MessageCircle className="h-3.5 w-3.5" /> Enviar por WhatsApp</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[12px]" onClick={() => toast.success('Enviando por email...')}><Mail className="h-3.5 w-3.5" /> Enviar por Email</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[12px]" onClick={() => toast.success('Link gerado!')}><Link2 className="h-3.5 w-3.5" /> Gerar Link Compartilhável</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[12px]" onClick={() => { navigator.clipboard.writeText(`https://opgrid.lovable.app/checklist/${viewItem.id}`); toast.success('Link copiado!'); }}><Copy className="h-3.5 w-3.5" /> Copiar Link Rápido</Button>
                  <Button variant="default" className="w-full justify-start gap-2 h-9 text-[12px]" onClick={() => toast.success('PDF gerado!')}><FileDown className="h-3.5 w-3.5" /> Baixar PDF</Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-[12px]" onClick={() => toast.info('Trocar executante...')}><UserCheck className="h-3.5 w-3.5" /> Trocar Executante</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewItem(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}