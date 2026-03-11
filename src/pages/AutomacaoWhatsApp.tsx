import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  getSessions,
  getWebhookLogs,
  getAutomationEvents,
  getWindowStatus,
  resetWhatsAppData,
  handleIncomingMessage,
} from '@/services/whatsapp';
import type { ConversationSession, WebhookLog, AutomationEvent, IncomingMessage } from '@/services/whatsapp';
import {
  MessageCircle, Send, Phone, Clock, CheckCircle2, AlertTriangle,
  Activity, RefreshCw, Inbox, Terminal, Zap, Shield, Radio, Eye,
  RotateCcw, Hash, XCircle, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const stepLabels: Record<string, string> = {
  greeting: 'Saudação',
  collect_nome: 'Coletando nome',
  collect_telefone: 'Coletando telefone',
  collect_placa: 'Coletando placa',
  collect_localizacao: 'Coletando localização',
  collect_motivo: 'Coletando motivo',
  collect_destino: 'Coletando destino',
  collect_observacoes: 'Coletando observações',
  resumo: 'Resumo',
  orcamento: 'Orçamento',
  aguardando_aceite: 'Aguardando aceite',
  aceite_confirmado: 'Aceite confirmado',
  criando_os: 'Criando OS',
  despacho: 'Despacho',
  aguardando_prestador: 'Aguardando prestador',
  prestador_confirmado: 'Prestador confirmado',
  em_atendimento: 'Em atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const windowStatusColors: Record<string, string> = {
  open: 'bg-success/15 text-success border-success/30',
  closed: 'bg-destructive/15 text-destructive border-destructive/30',
  expiring_soon: 'bg-warning/15 text-warning border-warning/30',
};

const windowStatusLabels: Record<string, string> = {
  open: '🟢 Aberta',
  closed: '🔴 Fechada',
  expiring_soon: '🟡 Expirando',
};

export default function AutomacaoWhatsApp() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [tab, setTab] = useState('sessions');

  const refresh = useCallback(() => {
    setSessions(getSessions().map(s => ({ ...s, windowStatus: getWindowStatus(s) })));
    setLogs(getWebhookLogs());
    setEvents(getAutomationEvents());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('opgrid-wa-session-update', handler);
    window.addEventListener('opgrid-wa-log', handler);
    return () => {
      window.removeEventListener('opgrid-wa-session-update', handler);
      window.removeEventListener('opgrid-wa-log', handler);
    };
  }, [refresh]);

  const handleReset = () => {
    resetWhatsAppData();
    refresh();
    toast.success('Dados da automação WhatsApp resetados');
  };

  const handleSimulateMessage = async () => {
    const msg: IncomingMessage = {
      from: '5511999990000',
      id: `wamid.sim_${Date.now()}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'text',
      text: { body: 'Olá, preciso de um guincho' },
    };
    await handleIncomingMessage('5511999990000', 'Cliente Teste API', msg);
    refresh();
    toast.success('Mensagem simulada processada');
  };

  // Stats
  const activeSessions = sessions.filter(s => s.windowStatus === 'open').length;
  const errorLogs = logs.filter(l => l.level === 'error').length;
  const totalMessages = logs.filter(l => l.type === 'send' || l.type === 'message').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automação WhatsApp</h1>
          <p className="text-sm text-muted-foreground">WhatsApp Cloud API — Painel de controle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleSimulateMessage}>
            <Zap className="h-4 w-4 mr-1" /> Simular mensagem
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sessões ativas</p>
                <p className="text-2xl font-bold text-foreground">{activeSessions}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Radio className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total sessões</p>
                <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Mensagens</p>
                <p className="text-2xl font-bold text-foreground">{totalMessages}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Erros</p>
                <p className="text-2xl font-bold text-foreground">{errorLogs}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sessions" className="gap-1"><MessageCircle className="h-3.5 w-3.5" /> Sessões</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><Terminal className="h-3.5 w-3.5" /> Webhook Logs</TabsTrigger>
          <TabsTrigger value="events" className="gap-1"><Activity className="h-3.5 w-3.5" /> Eventos</TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-3">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma sessão ativa. Clique em "Simular mensagem" para testar.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sessions.map(session => {
                const ws = getWindowStatus(session);
                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{session.contactName || session.contactPhone}</p>
                            <p className="text-xs text-muted-foreground">{session.contactPhone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={windowStatusColors[ws]}>
                            {windowStatusLabels[ws]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {stepLabels[session.currentStep] || session.currentStep}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{timeAgo(session.lastMessageAt)}</span>
                        </div>
                      </div>

                      {selectedSession === session.id && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{session.data.nome || '—'}</span></div>
                            <div><span className="text-muted-foreground">Placa:</span> <span className="font-medium">{session.data.placa || '—'}</span></div>
                            <div><span className="text-muted-foreground">Motivo:</span> <span className="font-medium">{session.data.motivo || '—'}</span></div>
                            <div><span className="text-muted-foreground">Valor:</span> <span className="font-medium">{session.data.valorEstimado ? `R$ ${session.data.valorEstimado.toFixed(2)}` : '—'}</span></div>
                            <div className="col-span-2"><span className="text-muted-foreground">Origem:</span> <span className="font-medium">{session.data.localizacao || '—'}</span></div>
                            <div className="col-span-2"><span className="text-muted-foreground">Destino:</span> <span className="font-medium">{session.data.destino || '—'}</span></div>
                          </div>
                          <div className="flex gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Janela: {formatDateTime(session.windowOpenedAt)} → {formatDateTime(session.windowExpiresAt)}</span>
                          </div>
                          {session.solicitacaoId && (
                            <div className="flex gap-1 text-xs">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">OS: {session.atendimentoId}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Webhook Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Webhook Logs ({logs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum log registrado</p>
                ) : (
                  <div className="space-y-1">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-start gap-2 py-1.5 border-b border-border/50 text-xs">
                        {log.direction === 'incoming' ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        )}
                        <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0">
                          {log.type}
                        </Badge>
                        <span className="text-muted-foreground shrink-0">{formatDateTime(log.timestamp)}</span>
                        {log.contactPhone && <span className="font-mono text-foreground">{log.contactPhone}</span>}
                        {log.details && <span className="text-muted-foreground truncate max-w-[300px]">{log.details}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Eventos de Automação ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
                ) : (
                  <div className="space-y-1">
                    {events.map(evt => (
                      <div key={evt.id} className="flex items-start gap-2 py-1.5 border-b border-border/50 text-xs">
                        {evt.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        )}
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {stepLabels[evt.step] || evt.step}
                        </Badge>
                        <span className="text-muted-foreground shrink-0">{formatDateTime(evt.timestamp)}</span>
                        <span className="text-foreground">{evt.action}</span>
                        {evt.details && <span className="text-muted-foreground truncate max-w-[300px]">{evt.details}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cloud API Status Banner */}
      <Card className="border-dashed border-warning/50 bg-warning/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">Modo Híbrido — Simulação Local</p>
              <p className="text-xs text-muted-foreground">
                As Edge Functions (webhook + envio) estão prontas em <code className="bg-muted px-1 rounded">supabase/functions/</code>.
                Ative o Lovable Cloud para implantar e conectar à API oficial da Meta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
