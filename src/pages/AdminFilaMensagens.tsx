import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Inbox, Eye } from 'lucide-react';
import { useMessageQueue } from '@/hooks/useMessagingData';
import type { MessageQueueItem } from '@/types/automation';

const STATUS_VARIANTS: Record<string, string> = {
  pending: 'warning',
  scheduled: 'info',
  sending: 'info',
  sent: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminFilaMensagens() {
  const { data: queue = [], isLoading } = useMessageQueue();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [viewItem, setViewItem] = useState<MessageQueueItem | null>(null);

  const filtered = useMemo(() => queue.filter(q =>
    (filterStatus === 'all' || q.status === filterStatus) &&
    (filterChannel === 'all' || q.channel === filterChannel)
  ), [queue, filterStatus, filterChannel]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    queue.forEach(q => { c[q.status] = (c[q.status] || 0) + 1; });
    return c;
  }, [queue]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Fila de Mensagens</h1>
          <p>Acompanhe mensagens agendadas e enviadas pelo motor de automação</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Pendentes', value: statusCounts['pending'] || 0, color: 'text-warning' },
          { label: 'Enviadas', value: statusCounts['sent'] || 0, color: 'text-success' },
          { label: 'Falhas', value: statusCounts['failed'] || 0, color: 'text-destructive' },
          { label: 'Total', value: queue.length, color: 'text-foreground' },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos status</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="scheduled">Agendado</SelectItem><SelectItem value="sending">Enviando</SelectItem><SelectItem value="sent">Enviado</SelectItem><SelectItem value="failed">Falha</SelectItem><SelectItem value="cancelled">Cancelado</SelectItem></SelectContent></Select>
          <Select value={filterChannel} onValueChange={setFilterChannel}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Canal" /></SelectTrigger><SelectContent><SelectItem value="all">Todos canais</SelectItem><SelectItem value="whatsapp">whatsapp</SelectItem><SelectItem value="email">email</SelectItem><SelectItem value="sms">sms</SelectItem><SelectItem value="push">push</SelectItem><SelectItem value="internal">internal</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Destinatário</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Canal</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Template</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Agendado</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Enviado</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Erro</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Criado</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-16">
                  <div className="empty-state"><div className="empty-state-icon"><Inbox className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Fila vazia</p><p className="empty-state-description">As mensagens aparecerão aqui ao serem enfileiradas pelo sistema</p></div>
                </TableCell></TableRow>
              ) : filtered.map(q => (
                <TableRow key={q.id} className="table-row-hover">
                  <TableCell className="text-[13px] font-mono tabular-nums">{q.recipient_phone || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="font-semibold text-[11px]">{q.channel}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell"><code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">{q.template_key || '—'}</code></TableCell>
                  <TableCell><Badge variant={(STATUS_VARIANTS[q.status] || 'secondary') as any} className="font-semibold">{q.status}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground tabular-nums">{formatDate(q.scheduled_at)}</TableCell>
                  <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground tabular-nums">{formatDate(q.sent_at)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-[12px] text-destructive max-w-[200px] truncate">{q.error_message || '—'}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground tabular-nums">{formatDate(q.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(q)}><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes da Mensagem</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Destinatário:</span> <span className="font-mono">{viewItem.recipient_phone || '—'}</span></div>
                <div><span className="text-muted-foreground">Canal:</span> {viewItem.channel}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={(STATUS_VARIANTS[viewItem.status] || 'secondary') as any}>{viewItem.status}</Badge></div>
                <div><span className="text-muted-foreground">Template:</span> {viewItem.template_key || '—'}</div>
                <div><span className="text-muted-foreground">Agendado:</span> {formatDate(viewItem.scheduled_at)}</div>
                <div><span className="text-muted-foreground">Enviado:</span> {formatDate(viewItem.sent_at)}</div>
              </div>
              {viewItem.error_message && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[12px]">{viewItem.error_message}</div>
              )}
              <div>
                <p className="text-muted-foreground mb-1.5 font-medium">Payload JSON:</p>
                <pre className="p-3 rounded-lg bg-muted/50 border text-[11px] leading-relaxed overflow-auto max-h-[200px] font-mono">{JSON.stringify(viewItem.payload_json, null, 2)}</pre>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewItem(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
