import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  getSandboxContacts, getSandboxMessages, getSandboxLogs, getConversationThreads,
  addSandboxMessage, sandboxSendMessage, resetSandbox, getMessagesForContact,
  SandboxContact, SandboxMessage, SandboxAutomationLog, SandboxSender,
} from '@/lib/sandboxWhatsApp';
import {
  addSolicitacao, addAtendimento, addDespacho, getPrestadores, getSolicitacoes,
  getAtendimentos, getDespachos, updateAtendimento, updateSolicitacao, updateDespacho,
} from '@/data/store';
import { addNotification } from '@/lib/notifications';
import { Solicitacao, Atendimento, Despacho, OfertaPrestador } from '@/types';
import {
  MessageCircle, Send, Phone, User, Clock, CheckCircle2, Eye, Zap, Shield,
  AlertTriangle, Play, FastForward, Truck, MapPin, Car, DollarSign, FileText,
  Radio, RefreshCw, Inbox, Bot, UserCircle, Building, Filter, Search,
  ChevronRight, ArrowRight, RotateCcw, Smartphone, Navigation, X, Terminal,
  Hash, Tag, Activity, KeyRound
} from 'lucide-react';

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const statusIcon = (s: string) => {
  if (s === 'lida_simulada') return '✓✓';
  if (s === 'entregue_simulada') return '✓';
  return '○';
};

const statusColor = (s: string) => {
  if (s === 'lida_simulada') return 'text-info';
  if (s === 'entregue_simulada') return 'text-success';
  return 'text-muted-foreground';
};

const senderLabel: Record<SandboxSender, string> = {
  sistema: 'Sistema OpGrid',
  cliente: 'Cliente',
  prestador: 'Prestador',
  central: 'Central',
};

const senderColor: Record<SandboxSender, string> = {
  sistema: 'bg-primary/10 text-primary',
  cliente: 'bg-success/10 text-success',
  prestador: 'bg-warning/10 text-warning',
  central: 'bg-info/10 text-info',
};

export default function SandboxWhatsApp() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('conversas');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [replyAs, setReplyAs] = useState<SandboxSender>('central');
  const [replyText, setReplyText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const threads = useMemo(() => getConversationThreads(), [refreshKey]);
  const allMessages = useMemo(() => getSandboxMessages(), [refreshKey]);
  const allLogs = useMemo(() => getSandboxLogs(), [refreshKey]);
  const contacts = useMemo(() => getSandboxContacts(), [refreshKey]);

  const selectedThread = threads.find(t => t.contact.id === selectedContactId);
  const selectedMessages = useMemo(() =>
    selectedContactId ? getMessagesForContact(selectedContactId) : [],
    [selectedContactId, refreshKey]
  );

  // Listen for sandbox events
  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1);
    window.addEventListener('opgrid-sandbox-message', handler);
    window.addEventListener('opgrid-sandbox-update', handler);
    return () => {
      window.removeEventListener('opgrid-sandbox-message', handler);
      window.removeEventListener('opgrid-sandbox-update', handler);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  const handleReply = () => {
    if (!replyText.trim() || !selectedContactId) return;
    const contact = contacts.find(c => c.id === selectedContactId);
    if (!contact) return;
    addSandboxMessage({
      contactId: selectedContactId,
      sender: replyAs,
      tipo: 'texto',
      conteudo: replyText.trim(),
    });
    setReplyText('');
    setRefreshKey(k => k + 1);
  };

  const handleReset = () => {
    resetSandbox();
    setSelectedContactId(null);
    setRefreshKey(k => k + 1);
    toast.success('Sandbox resetado com sucesso.');
  };

  // ===== QUICK TEST ACTIONS =====
  const runFullClientJourney = useCallback(() => {
    const tel = '5512992184913';
    const nome = 'Contato Teste WhatsApp';

    // Step 1: Initial contact
    sandboxSendMessage(nome, tel, 'teste', '👋 Olá! Bem-vindo à OpGrid Assistência Veicular.\nSou seu assistente virtual.', { sender: 'sistema', template: 'greeting', evento: 'inicio_jornada' });

    setTimeout(() => {
      sandboxSendMessage(nome, tel, 'teste', 'João da Silva', { sender: 'cliente', evento: 'resposta_nome' });
      sandboxSendMessage(nome, tel, 'teste', 'Prazer, João! 🤝\nQual seu telefone com DDD?', { sender: 'sistema', template: 'coleta_telefone', evento: 'coleta_dados' });
    }, 400);

    setTimeout(() => {
      sandboxSendMessage(nome, tel, 'teste', '12992184913', { sender: 'cliente', evento: 'resposta_telefone' });
      sandboxSendMessage(nome, tel, 'teste', '📱 Telefone registrado: (12) 99218-4913\nQual a placa do veículo?', { sender: 'sistema', template: 'coleta_placa', evento: 'coleta_dados' });
    }, 800);

    setTimeout(() => {
      sandboxSendMessage(nome, tel, 'teste', 'ABC1234', { sender: 'cliente', evento: 'resposta_placa' });
      sandboxSendMessage(nome, tel, 'teste', '🚗 Veículo identificado: Honda Civic 2022 (ABC1234)\n📍 Qual sua localização atual?', { sender: 'sistema', template: 'coleta_localizacao', evento: 'coleta_dados' });
    }, 1200);

    setTimeout(() => {
      sandboxSendMessage(nome, tel, 'teste', 'Av. Paulista, 1000 - São Paulo', { sender: 'cliente', evento: 'resposta_localizacao' });
      sandboxSendMessage(nome, tel, 'teste', '🔧 Qual o motivo do atendimento?\n1. Pane mecânica\n2. Pane elétrica\n3. Pneu furado\n4. Colisão\n5. Outro', { sender: 'sistema', template: 'coleta_motivo', evento: 'coleta_dados' });
    }, 1600);

    setTimeout(() => {
      sandboxSendMessage(nome, tel, 'teste', 'Pane mecânica', { sender: 'cliente', evento: 'resposta_motivo' });
      sandboxSendMessage(nome, tel, 'teste', '🏁 Qual o destino do veículo?', { sender: 'sistema', template: 'coleta_destino', evento: 'coleta_dados' });
    }, 2000);

    setTimeout(() => {
      sandboxSendMessage(nome, tel, 'teste', 'Oficina Mecânica Central, Rua Augusta, 500', { sender: 'cliente', evento: 'resposta_destino' });
      const dist = 12;
      const valor = 120 + dist * 4.5;
      sandboxSendMessage(nome, tel, 'teste',
        `📋 Resumo da solicitação:\n👤 João da Silva\n📱 (12) 99218-4913\n🚗 Honda Civic 2022 (ABC1234)\n📍 Av. Paulista, 1000\n🔧 Pane mecânica\n🏁 Oficina Central\n\n💰 Valor estimado: R$ ${valor.toFixed(2)}\n• Taxa base: R$ 120,00\n• ${dist} km × R$ 4,50 = R$ ${(dist * 4.5).toFixed(2)}\n\nDeseja aceitar? SIM ou NÃO`,
        { sender: 'sistema', template: 'proposta_orcamento', evento: 'envio_proposta' }
      );
    }, 2400);

    toast.success('Jornada do cliente simulada! Verifique as conversas.');
    setTimeout(() => setRefreshKey(k => k + 1), 2800);
  }, []);

  const runAcceptProposal = useCallback(() => {
    const tel = '5512992184913';
    const nome = 'Contato Teste WhatsApp';
    sandboxSendMessage(nome, tel, 'teste', 'SIM', { sender: 'cliente', evento: 'aceite_proposta' });
    sandboxSendMessage(nome, tel, 'teste', '✅ Proposta aceita!\n⏳ Gerando sua Ordem de Serviço...', { sender: 'sistema', template: 'confirmacao_aceite', evento: 'aceite_proposta' });

    setTimeout(() => {
      const protocolo = `SOL-TEST-${Date.now().toString(36).toUpperCase()}`;
      sandboxSendMessage(nome, tel, 'teste', `📄 OS gerada com sucesso!\nProtocolo: ${protocolo}\n🚀 Despacho automático iniciado...`, { sender: 'sistema', template: 'os_gerada', evento: 'geracao_os' });

      // Create actual OS records
      const now = new Date().toISOString();
      const solId = `sol-sandbox-${Date.now()}`;
      const atId = `at-sandbox-${Date.now()}`;
      const despId = `desp-sandbox-${Date.now()}`;

      const solicitacao: Solicitacao = {
        id: solId, protocolo, dataHora: now, canal: 'WhatsApp',
        clienteNome: 'João da Silva', clienteTelefone: '(12) 99218-4913', clienteWhatsApp: tel,
        veiculoPlaca: 'ABC1234', veiculoModelo: 'Honda Civic 2022',
        origemEndereco: 'Av. Paulista, 1000 - São Paulo', destinoEndereco: 'Oficina Mecânica Central, Rua Augusta, 500',
        motivo: 'Pane mecânica', observacoes: '', fotos: [],
        distanciaEstimadaKm: 12, valorEstimado: 174,
        composicaoCusto: [
          { descricao: 'Taxa de saída', valor: 120, tipo: 'base' },
          { descricao: 'Km estimado (12 km)', valor: 54, tipo: 'km' },
        ],
        status: 'Convertida em OS', statusProposta: 'Aceita',
        propostaEnviadaEm: now, propostaRespondidaEm: now,
        atendimentoId: atId, despachoId: despId,
        linkAcompanhamento: `/acompanhar/${atId}`,
        timeline: [
          { data: now, descricao: 'Solicitação recebida via Sandbox WhatsApp', tipo: 'sistema' },
          { data: now, descricao: 'Proposta enviada ao cliente', tipo: 'sistema' },
          { data: now, descricao: 'Cliente aceitou a proposta', tipo: 'cliente' },
          { data: now, descricao: 'OS gerada automaticamente', tipo: 'sistema' },
        ],
      };

      const atendimento: Atendimento = {
        id: atId, protocolo, dataHora: now, prestadorId: '',
        clienteNome: 'João da Silva', solicitante: 'João da Silva',
        origem: 'Av. Paulista, 1000 - São Paulo', destino: 'Oficina Mecânica Central, Rua Augusta, 500',
        tipoAtendimento: 'Guincho', veiculo: 'Honda Civic 2022', placa: 'ABC1234',
        kmPrevisto: 12, km: 0, horasTrabalhadas: 0, horasParadas: 0,
        status: 'Aberto', prioridade: 'Normal', observacoes: '',
        tarifas: [
          { tarifaId: 't1', quantidade: 1, valorUnitario: 120, valorTotal: 120 },
          { tarifaId: 't2', quantidade: 12, valorUnitario: 4.5, valorTotal: 54 },
        ],
        valorTotal: 174,
        timeline: [{ data: now, descricao: 'OS gerada via Sandbox WhatsApp' }],
        solicitacaoId: solId, despachoId: despId,
        linkCliente: `/acompanhar/${atId}`,
      };

      addSolicitacao(solicitacao);
      addAtendimento(atendimento);

      const prestadores = getPrestadores().filter(p => p.status === 'Ativo' && p.homologacao === 'Homologado');
      const top2 = prestadores.slice(0, 2);

      const ofertas: OfertaPrestador[] = top2.map((p, i) => ({
        id: `of-sandbox-${Date.now()}-${i}`,
        despachoId: despId,
        prestadorId: p.id,
        rodada: 1,
        status: 'Pendente' as const,
        enviadaEm: now,
        tempoLimiteMinutos: 10,
        distanciaEstimadaKm: Math.floor(Math.random() * 15) + 3,
        tempoEstimadoMinutos: Math.floor(Math.random() * 20) + 10,
        valorServico: 174,
        linkOferta: `/prestador/oferta/of-sandbox-${Date.now()}-${i}`,
      }));

      const despacho: Despacho = {
        id: despId, solicitacaoId: solId, atendimentoId: atId,
        rodadaAtual: 1, modoDespacho: 'automatico', status: 'Ofertas enviadas', criadoEm: now, atualizadoEm: now,
        ofertas, observacoes: 'Despacho automático via Sandbox',
      };
      addDespacho(despacho);

      // Send notifications to providers via sandbox
      top2.forEach(p => {
        sandboxSendMessage(p.nomeFantasia, p.telefone || '55119999999', 'prestador',
          `🔔 Nova oferta de serviço!\n\n🚗 Honda Civic 2022 (ABC1234)\n🔧 Pane mecânica\n📍 Av. Paulista → Oficina Central\n💰 R$ 174,00\n\n🔗 Acesse: ${window.location.origin}/prestador/oferta/${ofertas.find(o => o.prestadorId === p.id)?.id}`,
          { sender: 'sistema', template: 'oferta_prestador', evento: 'despacho_automatico', metadata: { prestadorId: p.id } }
        );
      });

      sandboxSendMessage(nome, tel, 'teste',
        `📡 ${top2.length} prestador(es) notificado(s):\n${top2.map(p => `• ${p.nomeFantasia}`).join('\n')}\n\n⏳ Aguardando resposta...`,
        { sender: 'sistema', template: 'despacho_status', evento: 'despacho_automatico' }
      );

      addNotification({
        type: 'solicitacao_nova',
        title: '📦 Nova OS via Sandbox',
        message: `João da Silva — Pane mecânica — Honda Civic 2022`,
        solicitacaoId: solId,
      });

      setRefreshKey(k => k + 1);
    }, 600);

    toast.success('Aceite e OS gerada via sandbox!');
  }, []);

  const runProviderAccept = useCallback(() => {
    const despachos = getDespachos();
    const pending = despachos.find(d => d.status === 'Ofertas enviadas');
    if (!pending) { toast.error('Nenhum despacho pendente encontrado.'); return; }

    const oferta = pending.ofertas.find(o => o.status === 'Pendente');
    if (!oferta) { toast.error('Nenhuma oferta pendente.'); return; }

    const prestadores = getPrestadores();
    const prest = prestadores.find(p => p.id === oferta.prestadorId);
    const now = new Date().toISOString();

    // Accept offer
    pending.ofertas = pending.ofertas.map(o => o.id === oferta.id ? { ...o, status: 'Aceita' as const, respondidaEm: now } : o);
    pending.ofertas = pending.ofertas.map(o => o.id !== oferta.id && o.status === 'Pendente' ? { ...o, status: 'Encerrada' as const, respondidaEm: now } : o);
    pending.status = 'Aceito';
    pending.prestadorAceitoId = oferta.prestadorId;
    pending.atualizadoEm = now;
    updateDespacho(pending);

    if (pending.atendimentoId) {
      const atd = getAtendimentos().find(a => a.id === pending.atendimentoId);
      if (atd) {
        atd.prestadorId = oferta.prestadorId;
        atd.status = 'Em andamento';
        atd.statusPrestador = 'Aceito';
        atd.linkPrestador = `/prestador/os/${atd.id}`;
        atd.timeline = [...atd.timeline, { data: now, descricao: `Prestador ${prest?.nomeFantasia || ''} aceitou a OS` }];
        updateAtendimento(atd);
      }
    }

    const sol = getSolicitacoes().find(s => s.id === pending.solicitacaoId);
    if (sol) {
      sol.status = 'Em atendimento';
      sol.timeline.push({ data: now, descricao: `Prestador ${prest?.nomeFantasia || ''} aceitou a oferta`, tipo: 'sistema' });
      updateSolicitacao(sol);
    }

    // Sandbox messages
    sandboxSendMessage(prest?.nomeFantasia || 'Prestador', prest?.telefone || '', 'prestador',
      '✅ Oferta aceita! Preparando para o atendimento.',
      { sender: 'prestador', template: 'aceite_oferta', evento: 'prestador_aceite' }
    );
    sandboxSendMessage('Contato Teste WhatsApp', '5512992184913', 'teste',
      `🎉 Ótima notícia!\nO prestador ${prest?.nomeFantasia || ''} aceitou seu chamado!\n🚛 Previsão de chegada: 15-25 min\n\n🔗 Acompanhe: ${window.location.origin}/acompanhar/${pending.atendimentoId}`,
      { sender: 'sistema', template: 'prestador_confirmado', evento: 'prestador_aceite' }
    );

    addNotification({
      type: 'oferta_aceita',
      title: '✅ Oferta aceita (Sandbox)',
      message: `${prest?.nomeFantasia || 'Prestador'} aceitou`,
      solicitacaoId: pending.solicitacaoId,
      prestadorNome: prest?.nomeFantasia,
    });

    setRefreshKey(k => k + 1);
    toast.success(`Prestador ${prest?.nomeFantasia} aceitou a oferta!`);
  }, []);

  const runProviderArrival = useCallback(() => {
    const atds = getAtendimentos().filter(a => a.statusPrestador === 'A caminho' || a.statusPrestador === 'Aceito');
    const atd = atds[0];
    if (!atd) { toast.error('Nenhum atendimento em curso encontrado.'); return; }

    const now = new Date().toISOString();
    const prest = getPrestadores().find(p => p.id === atd.prestadorId);

    atd.statusPrestador = 'Cheguei ao local';
    atd.horaChegada = now;
    atd.timeline = [...atd.timeline, { data: now, descricao: 'Prestador chegou ao local (sandbox)' }];
    updateAtendimento(atd);

    sandboxSendMessage('Contato Teste WhatsApp', '5512992184913', 'teste',
      `📍 ${prest?.nomeFantasia || 'Prestador'} chegou ao local!\nO atendimento vai começar.`,
      { sender: 'sistema', template: 'prestador_chegou', evento: 'chegada_local' }
    );

    setRefreshKey(k => k + 1);
    toast.success('Chegada simulada!');
  }, []);

  const runConcludeOS = useCallback(() => {
    const atds = getAtendimentos().filter(a => a.status === 'Em andamento' && a.statusPrestador !== 'Concluído');
    const atd = atds[0];
    if (!atd) { toast.error('Nenhum atendimento em andamento.'); return; }

    const now = new Date().toISOString();
    atd.statusPrestador = 'Concluído';
    atd.status = 'Concluído';
    atd.horaConclusao = now;
    atd.timeline = [...atd.timeline, { data: now, descricao: 'Atendimento concluído (sandbox)' }];
    updateAtendimento(atd);

    if (atd.solicitacaoId) {
      const sol = getSolicitacoes().find(s => s.id === atd.solicitacaoId);
      if (sol) {
        sol.status = 'Finalizada';
        sol.timeline.push({ data: now, descricao: 'Atendimento concluído', tipo: 'sistema' });
        updateSolicitacao(sol);
      }
    }

    sandboxSendMessage('Contato Teste WhatsApp', '5512992184913', 'teste',
      `✅ Atendimento concluído com sucesso!\n📄 Protocolo: ${atd.protocolo}\n💰 Valor: R$ ${atd.valorTotal.toFixed(2)}\nObrigado por utilizar a OpGrid! 💙`,
      { sender: 'sistema', template: 'atendimento_concluido', evento: 'conclusao_os' }
    );

    setRefreshKey(k => k + 1);
    toast.success('OS concluída via sandbox!');
  }, []);

  // Stats
  const totalMessages = allMessages.length;
  const totalContacts = contacts.length;
  const systemMessages = allMessages.filter(m => m.sender === 'sistema').length;
  const clientMessages = allMessages.filter(m => m.sender === 'cliente').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1>Sandbox WhatsApp</h1>
            <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px] font-bold gap-1">
              <Radio className="h-3 w-3 animate-pulse" />MODO SANDBOX
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Console de automação conversacional — <span className="text-warning font-medium">nenhuma mensagem externa real é enviada</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" size="sm" className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />Resetar
          </Button>
        </div>
      </div>

      {/* Sandbox banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-warning/30 bg-warning/5">
        <Shield className="h-5 w-5 text-warning shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-warning">Modo Simulação Ativo</p>
          <p className="text-xs text-muted-foreground">Todas as mensagens são internas. Nenhum envio real para WhatsApp, SMS ou API externa.</p>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">Contato teste: (12) 99218-4913</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Mensagens', value: totalMessages, icon: MessageCircle, bg: 'bg-primary/10', color: 'text-primary' },
          { label: 'Contatos', value: totalContacts, icon: User, bg: 'bg-success/10', color: 'text-success' },
          { label: 'Do Sistema', value: systemMessages, icon: Bot, bg: 'bg-info/10', color: 'text-info' },
          { label: 'Do Cliente', value: clientMessages, icon: UserCircle, bg: 'bg-warning/10', color: 'text-warning' },
        ].map(k => (
          <div key={k.label} className="kpi-card">
            <div className={`kpi-icon ${k.bg} ${k.color}`}><k.icon className="h-4.5 w-4.5" /></div>
            <div className="min-w-0 flex-1">
              <p className="kpi-label">{k.label}</p>
              <p className="kpi-value">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center"><Play className="h-3.5 w-3.5 text-success" /></div>
            <div>
              <CardTitle className="text-[13px] font-bold">Ações Rápidas de Teste</CardTitle>
              <p className="text-[11px] text-muted-foreground">Execute cada etapa da jornada individualmente</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Iniciar jornada do cliente', icon: MessageCircle, action: runFullClientJourney, color: 'bg-success hover:bg-success/90' },
              { label: 'Simular aceite do orçamento', icon: CheckCircle2, action: runAcceptProposal, color: 'bg-primary hover:bg-primary/90' },
              { label: 'Simular aceite do prestador', icon: Truck, action: runProviderAccept, color: 'bg-warning hover:bg-warning/90 text-warning-foreground' },
              { label: 'Simular chegada ao local', icon: MapPin, action: runProviderArrival, color: 'bg-info hover:bg-info/90' },
              { label: 'Simular conclusão da OS', icon: CheckCircle2, action: runConcludeOS, color: 'bg-success hover:bg-success/90' },
            ].map(btn => (
              <Button key={btn.label} onClick={btn.action} size="sm" className={`gap-1.5 text-xs text-white ${btn.color}`}>
                <btn.icon className="h-3.5 w-3.5" />{btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="conversas" className="gap-1.5 text-xs"><Inbox className="h-3.5 w-3.5" />Conversas</TabsTrigger>
          <TabsTrigger value="caixa" className="gap-1.5 text-xs"><Send className="h-3.5 w-3.5" />Caixa de Saída</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5 text-xs"><Terminal className="h-3.5 w-3.5" />Logs</TabsTrigger>
        </TabsList>

        {/* CONVERSATIONS TAB */}
        <TabsContent value="conversas" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-[500px]">
            {/* Contact list */}
            <Card className="lg:col-span-1">
              <CardContent className="p-0">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar contato..."
                      className="pl-8 h-8 text-xs"
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[450px]">
                  {threads.length === 0 && (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhuma conversa ainda.<br />Use as ações rápidas acima.
                    </div>
                  )}
                  {threads
                    .filter(t => !searchFilter || t.contact.nome.toLowerCase().includes(searchFilter.toLowerCase()))
                    .map(t => (
                    <button
                      key={t.contact.id}
                      onClick={() => setSelectedContactId(t.contact.id)}
                      className={`w-full text-left px-3 py-2.5 border-b hover:bg-muted/30 transition-colors ${
                        selectedContactId === t.contact.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          t.contact.tipo === 'prestador' ? 'bg-warning/10' : t.contact.tipo === 'teste' ? 'bg-success/10' : 'bg-primary/10'
                        }`}>
                          {t.contact.tipo === 'prestador' ? <Truck className="h-4 w-4 text-warning" /> :
                           t.contact.tipo === 'teste' ? <Smartphone className="h-4 w-4 text-success" /> :
                           <User className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] font-semibold truncate">{t.contact.nome}</p>
                            {t.lastMessage && (
                              <span className="text-[9px] text-muted-foreground shrink-0">{formatTime(t.lastMessage.dataHora)}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {t.lastMessage?.conteudo.substring(0, 40) || 'Sem mensagens'}
                          </p>
                        </div>
                        {t.unread > 0 && (
                          <Badge className="bg-success text-white text-[9px] h-4 w-4 p-0 flex items-center justify-center rounded-full shrink-0">{t.unread}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat area */}
            <Card className="lg:col-span-2">
              {selectedContactId ? (
                <CardContent className="p-0 flex flex-col h-[500px]">
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedThread?.contact.tipo === 'prestador' ? 'bg-warning/10' : 'bg-success/10'
                    }`}>
                      {selectedThread?.contact.tipo === 'prestador' ? <Truck className="h-4 w-4 text-warning" /> : <User className="h-4 w-4 text-success" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{selectedThread?.contact.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedThread?.contact.telefone} • {selectedThread?.contact.tipo}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{selectedMessages.length} msgs</Badge>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                      {selectedMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'sistema' || msg.sender === 'central' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 shadow-sm ${
                            msg.sender === 'cliente' || msg.sender === 'prestador'
                              ? 'bg-[hsl(152,60%,90%)] rounded-tr-sm'
                              : 'bg-card border rounded-tl-sm'
                          }`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge className={`text-[8px] px-1 py-0 h-3.5 border-0 ${senderColor[msg.sender]}`}>{senderLabel[msg.sender]}</Badge>
                              {msg.template && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{msg.template}</Badge>}
                            </div>
                            <p className="text-[12px] leading-relaxed whitespace-pre-line">{msg.conteudo}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <span className="text-[9px] text-muted-foreground/60">{formatTime(msg.dataHora)}</span>
                              <span className={`text-[9px] ${statusColor(msg.status)}`}>{statusIcon(msg.status)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Reply */}
                  <div className="p-3 border-t flex gap-2 items-end">
                    <Select value={replyAs} onValueChange={v => setReplyAs(v as SandboxSender)}>
                      <SelectTrigger className="w-[120px] h-9 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="prestador">Prestador</SelectItem>
                        <SelectItem value="sistema">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReply()}
                      placeholder="Responder como..."
                      className="flex-1 h-9 text-xs"
                    />
                    <Button onClick={handleReply} size="icon" className="h-9 w-9 bg-success hover:bg-success/90 shrink-0" disabled={!replyText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="flex flex-col items-center justify-center h-[500px] text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Selecione uma conversa</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">ou use as ações rápidas para iniciar uma simulação</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* OUTBOX TAB */}
        <TabsContent value="caixa" className="mt-3">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Horário</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Remetente</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Destinatário</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Conteúdo</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMessages.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma mensagem registrada</td></tr>
                    )}
                    {[...allMessages].reverse().slice(0, 50).map(msg => {
                      const contact = contacts.find(c => c.id === msg.contactId);
                      return (
                        <tr key={msg.id} className="border-b hover:bg-muted/10">
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-muted-foreground">{formatDateTime(msg.dataHora)}</td>
                          <td className="px-3 py-2"><Badge className={`text-[9px] px-1.5 py-0 border-0 ${senderColor[msg.sender]}`}>{senderLabel[msg.sender]}</Badge></td>
                          <td className="px-3 py-2 font-medium">{contact?.nome || '—'}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-[9px]">{msg.tipo}</Badge></td>
                          <td className="px-3 py-2 max-w-[300px] truncate">{msg.conteudo}</td>
                          <td className="px-3 py-2">
                            <Badge variant={msg.status === 'lida_simulada' ? 'success' : msg.status === 'entregue_simulada' ? 'info' : 'secondary'} className="text-[9px]">
                              {msg.status.replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGS TAB */}
        <TabsContent value="logs" className="mt-3">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  <CardTitle className="text-[13px] font-bold">Logs de Automação</CardTitle>
                </div>
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-[11px]">
                    <SelectValue placeholder="Filtrar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="inicio_jornada">Início jornada</SelectItem>
                    <SelectItem value="coleta_dados">Coleta dados</SelectItem>
                    <SelectItem value="envio_proposta">Proposta</SelectItem>
                    <SelectItem value="aceite_proposta">Aceite</SelectItem>
                    <SelectItem value="geracao_os">Geração OS</SelectItem>
                    <SelectItem value="despacho_automatico">Despacho</SelectItem>
                    <SelectItem value="prestador_aceite">Aceite prestador</SelectItem>
                    <SelectItem value="conclusao_os">Conclusão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Horário</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Evento</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Gatilho</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Template</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Destinatário</th>
                      <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLogs.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum log registrado</td></tr>
                    )}
                    {allLogs
                      .filter(l => logFilter === 'all' || l.evento === logFilter)
                      .slice(0, 50)
                      .map(log => (
                      <tr key={log.id} className="border-b hover:bg-muted/10">
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-muted-foreground">{formatDateTime(log.dataHora)}</td>
                        <td className="px-3 py-2"><Badge variant="outline" className="text-[9px] font-mono">{log.evento}</Badge></td>
                        <td className="px-3 py-2 text-muted-foreground">{log.gatilho}</td>
                        <td className="px-3 py-2"><Badge className="text-[9px] bg-primary/10 text-primary border-0">{log.template}</Badge></td>
                        <td className="px-3 py-2 max-w-[200px] truncate font-medium">{log.destinatario}</td>
                        <td className="px-3 py-2">
                          <Badge variant={log.sucesso ? 'success' : 'destructive'} className="text-[9px]">
                            {log.sucesso ? '✓ Sucesso' : '✗ Falha'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
