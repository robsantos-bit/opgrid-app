import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ScrollText, Eye } from 'lucide-react';
import { useMessageLogs } from '@/hooks/useMessagingData';
import type { MessageSendLog } from '@/types/automation';

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const directionLabel: Record<string, string> = { inbound: 'Entrada', outbound: 'Saída' };

export default function AdminLogsMensagens() {
  const { data: logs = [], isLoading } = useMessageLogs();
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewItem, setViewItem] = useState<MessageSendLog | null>(null);

  const statuses = useMemo(() => [...new Set(logs.map(l => l.status))].sort(), [logs]);

  const filtered = useMemo(() => logs.filter(l =>
    (filterDirection === 'all' || l.direction === filterDirection) &&
    (filterStatus === 'all' || l.status === filterStatus)
  ), [logs, filterDirection, filterStatus]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Logs de Mensagens</h1>
          <p>Registro de envios e respostas do motor de automação</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[
          { label: 'Saída', value: logs.filter(l => l.direction === 'outbound').length, color: 'text-primary' },
          { label: 'Entrada', value: logs.filter(l => l.direction === 'inbound').length, color: 'text-info' },
          { label: 'Total', value: logs.length, color: 'text-foreground' },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-3.5">
        <div className="filter-bar">
          <Select value={filterDirection} onValueChange={setFilterDirection}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Direção" /></SelectTrigger><SelectContent><SelectItem value="all">Todas direções</SelectItem><SelectItem value="inbound">Entrada</SelectItem><SelectItem value="outbound">Saída</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos status</SelectItem>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Provider ID</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Direção</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Criado</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-16">
                  <div className="empty-state"><div className="empty-state-icon"><ScrollText className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum log encontrado</p><p className="empty-state-description">Logs serão registrados automaticamente pelo motor de automação</p></div>
                </TableCell></TableRow>
              ) : filtered.map(l => (
                <TableRow key={l.id} className="table-row-hover">
                  <TableCell className="text-[12px] font-mono tabular-nums max-w-[180px] truncate">{l.provider_message_id || '—'}</TableCell>
                  <TableCell><Badge variant={l.direction === 'outbound' ? 'default' : 'info'} className="font-semibold text-[11px]">{directionLabel[l.direction] || l.direction}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className="font-semibold text-[11px]">{l.status}</Badge></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground tabular-nums">{formatDate(l.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewItem(l)}><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Log</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-[13px]">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Provider ID:</span> <span className="font-mono text-[11px]">{viewItem.provider_message_id || '—'}</span></div>
                <div><span className="text-muted-foreground">Direção:</span> <Badge variant={viewItem.direction === 'outbound' ? 'default' : 'info'}>{directionLabel[viewItem.direction]}</Badge></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{viewItem.status}</Badge></div>
                <div><span className="text-muted-foreground">Criado:</span> {formatDate(viewItem.created_at)}</div>
                <div><span className="text-muted-foreground">Queue ID:</span> <span className="font-mono text-[11px]">{viewItem.queue_id || '—'}</span></div>
                <div><span className="text-muted-foreground">Conversation ID:</span> <span className="font-mono text-[11px]">{viewItem.conversation_id || '—'}</span></div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 font-medium">Response JSON:</p>
                <pre className="p-3 rounded-lg bg-muted/50 border text-[11px] leading-relaxed overflow-auto max-h-[200px] font-mono">{JSON.stringify(viewItem.response_json, null, 2)}</pre>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewItem(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
