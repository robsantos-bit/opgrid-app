import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  MessageCircle, Phone, User, Clock, Search, RefreshCw, Headphones,
  CheckCircle2, Loader2, Ban, ArrowRight, X, Send,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useConversations, useAssignOperator, useMessages, useCreateMessageLog,
} from '@/hooks/useWhatsAppData';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Conversation, ConversationState } from '@/types/whatsapp';

const STATE_LABELS: Record<string, string> = {
  novo_contato: 'Novo contato',
  aguardando_nome: 'Nome',
  aguardando_telefone: 'Telefone',
  aguardando_veiculo: 'Veículo',
  aguardando_origem: 'Origem',
  aguardando_motivo: 'Motivo',
  aguardando_destino: 'Destino',
  aguardando_observacoes: 'Observações',
  resumo_pronto: 'Resumo',
  aguardando_aceite: 'Aguardando aceite',
  solicitado: 'OS criada',
  cancelado: 'Cancelado',
  humano: 'Encaminhado p/ central',
};

function deriveStatus(state: ConversationState): string {
  if (['novo_contato', 'aguardando_nome', 'aguardando_telefone', 'aguardando_veiculo',
    'aguardando_origem', 'aguardando_motivo', 'aguardando_destino', 'aguardando_observacoes'].includes(state))
    return 'Coletando dados';
  if (state === 'resumo_pronto') return 'Proposta enviada';
  if (state === 'aguardando_aceite') return 'Aguardando aceite';
  if (state === 'solicitado') return 'OS em andamento';
  if (state === 'cancelado') return 'Cancelado';
  if (state === 'humano') return 'Encaminhado p/ central';
  return state;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Coletando dados':
      return <Badge variant="outline" className="gap-1 text-[10px]"><Loader2 className="h-3 w-3 animate-spin" />{status}</Badge>;
    case 'Proposta enviada':
    case 'Aguardando aceite':
      return <Badge className="bg-warning/10 text-warning border-warning/20 gap-1 text-[10px]"><Clock className="h-3 w-3" />{status}</Badge>;
    case 'OS em andamento':
      return <Badge className="bg-info/10 text-info border-info/20 gap-1 text-[10px]"><ArrowRight className="h-3 w-3" />{status}</Badge>;
    case 'Cancelado':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[10px]"><Ban className="h-3 w-3" />{status}</Badge>;
    case 'Encaminhado p/ central':
      return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]"><Headphones className="h-3 w-3" />{status}</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

export default function AdminConversas() {
  const { data: conversations = [], isLoading } = useConversations();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const assignOperator = useAssignOperator();
  const [search, setSearch] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Real-time subscription for conversations & messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-conversas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const convId = (payload.new as any)?.conversation_id;
        if (convId) {
          queryClient.invalidateQueries({ queryKey: ['messages', convId] });
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || null;

  const handleAssumir = (convId: string) => {
    if (!user) { toast.error('Você precisa estar logado.'); return; }
    assignOperator.mutate(
      { conversationId: convId, operatorId: user.id },
      {
        onSuccess: () => {
          toast.success('Conversa assumida com sucesso.');
          setSelectedConvId(convId);
        },
        onError: (err) => toast.error(`Erro ao assumir: ${(err as Error).message}`),
      }
    );
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = c.contact_name?.toLowerCase() || '';
    const phone = c.contact_phone || '';
    return name.includes(q) || phone.includes(q) || c.id.includes(q);
  });

  const terminal: ConversationState[] = ['solicitado', 'cancelado', 'humano'];
  const stats = {
    total: conversations.length,
    emAndamento: conversations.filter(c => !terminal.includes(c.state)).length,
    concluidas: conversations.filter(c => c.state === 'solicitado').length,
    humano: conversations.filter(c => c.state === 'humano').length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Conversas WhatsApp</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Acompanhe em tempo real todas as jornadas conversacionais em andamento.
          </p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
          variant="outline" size="sm" className="gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: MessageCircle, color: 'text-primary' },
          { label: 'Em andamento', value: stats.emAndamento, icon: Loader2, color: 'text-info' },
          { label: 'OS criada', value: stats.concluidas, icon: CheckCircle2, color: 'text-success' },
          { label: 'Encaminhadas', value: stats.humano, icon: Headphones, color: 'text-warning' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversation list */}
        <Card className={selectedConvId ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-40" />
                <p className="text-sm">Carregando conversas...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhuma conversa registrada</p>
                <p className="text-xs mt-1">As conversas aparecerão aqui quando o webhook receber mensagens.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px]">Contato</TableHead>
                      <TableHead className="text-[11px]">Telefone</TableHead>
                      <TableHead className="text-[11px]">Etapa</TableHead>
                      <TableHead className="text-[11px]">Status</TableHead>
                      <TableHead className="text-[11px]">Última atualização</TableHead>
                      <TableHead className="text-[11px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(conv => {
                      const status = deriveStatus(conv.state);
                      const isSelected = conv.id === selectedConvId;
                      return (
                        <TableRow
                          key={conv.id}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-accent' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedConvId(conv.id)}
                        >
                          <TableCell className="text-xs font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {conv.contact_name || '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {conv.contact_phone || '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px]">
                              {STATE_LABELS[conv.state] || conv.state}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {conv.updated_at
                                ? formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: ptBR })
                                : '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] gap-1"
                              disabled={conv.state === 'humano' && conv.assigned_operator_id === user?.id}
                              onClick={(e) => { e.stopPropagation(); handleAssumir(conv.id); }}
                            >
                              <Headphones className="h-3 w-3" />
                              {conv.state === 'humano' && conv.assigned_operator_id === user?.id ? 'Assumida' : 'Assumir'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message detail panel */}
        {selectedConvId && selectedConv && (
          <MessagePanel
            conversation={selectedConv}
            onClose={() => setSelectedConvId(null)}
          />
        )}
      </div>
    </div>
  );
}

function MessagePanel({ conversation, onClose }: { conversation: Conversation; onClose: () => void }) {
  const { data: messages = [], isLoading } = useMessages(conversation.id);
  const createMessage = useCreateMessageLog();
  const [replyText, setReplyText] = useState('');
  const isHumano = conversation.state === 'humano';

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await createMessage.mutateAsync({
        conversation_id: conversation.id,
        direction: 'outbound' as const,
        type: 'text',
        content: replyText.trim(),
        wa_message_id: null,
        status: 'sent',
      });

      // Also send via Edge Function
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      if (projectId) {
        fetch(`https://${projectId}.supabase.co/functions/v1/whatsapp-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: conversation.contact_phone,
            type: 'text',
            text: { body: replyText.trim() },
          }),
        }).catch(console.error);
      }

      setReplyText('');
      toast.success('Mensagem enviada.');
    } catch (err) {
      toast.error(`Erro: ${(err as Error).message}`);
    }
  };

  return (
    <Card className="lg:col-span-1 flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{conversation.contact_name || 'Sem nome'}</p>
            <p className="text-[11px] text-muted-foreground">{conversation.contact_phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] shrink-0">
            {STATE_LABELS[conversation.state] || conversation.state}
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Nenhuma mensagem registrada.</p>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                    msg.direction === 'outgoing'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content || '[mídia]'}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.direction === 'outgoing' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  }`}>
                    {msg.created_at ? format(new Date(msg.created_at), 'HH:mm', { locale: ptBR }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {isHumano && (
        <div className="p-3 border-t flex gap-2">
          <Input
            placeholder="Digite uma mensagem..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
            className="text-xs"
          />
          <Button
            size="sm"
            className="shrink-0 h-9 w-9 p-0"
            disabled={!replyText.trim() || createMessage.isPending}
            onClick={handleSendReply}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
