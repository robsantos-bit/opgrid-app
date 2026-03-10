import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { addSolicitacao, addAtendimento, addDespacho, getPrestadores, getSolicitacoes } from '@/data/store';
import { addNotification } from '@/lib/notifications';
import { Solicitacao, Atendimento, Despacho, MotivoSolicitacao, OfertaPrestador } from '@/types';
import { toast } from 'sonner';
import {
  Send, MessageCircle, CheckCircle2, Clock, MapPin, Car, Phone, User, FileText,
  DollarSign, ArrowRight, Zap, Shield, Navigation, AlertTriangle, RefreshCw,
  ChevronRight, X, Smartphone, Link2, Truck, Timer, Ban, Eye
} from 'lucide-react';

// ========== TYPES ==========
type ChatStep =
  | 'greeting' | 'nome' | 'telefone' | 'placa' | 'localizacao' | 'motivo'
  | 'destino' | 'observacoes' | 'resumo' | 'calculando' | 'proposta'
  | 'aceite' | 'gerando_os' | 'despacho' | 'aguardando_prestador'
  | 'prestador_confirmado' | 'prestador_caminho' | 'prestador_chegou'
  | 'em_atendimento' | 'concluido' | 'cancelado';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: Date;
  typing?: boolean;
  options?: string[];
}

interface ChatState {
  step: ChatStep;
  nome: string;
  telefone: string;
  placa: string;
  modelo: string;
  localizacao: string;
  motivo: MotivoSolicitacao | '';
  destino: string;
  observacoes: string;
  valorEstimado: number;
  distanciaKm: number;
  solicitacaoId: string;
  atendimentoId: string;
  despachoId: string;
  prestadorNome: string;
  protocolo: string;
}

// ========== VALIDATION HELPERS ==========
function validateNome(nome: string): string | null {
  const clean = nome.trim();
  if (clean.length < 3) return 'Por favor, informe seu nome completo (mínimo 3 caracteres).';
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(clean)) return 'O nome deve conter apenas letras. Tente novamente.';
  if (!clean.includes(' ')) return 'Por favor, informe nome e sobrenome.';
  return null;
}

function validateTelefone(tel: string): string | null {
  const digits = tel.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return 'Informe o telefone com DDD (ex: 11999998888).';
  return null;
}

function validateLocalizacao(loc: string): string | null {
  if (loc.trim().length < 5) return 'Não consegui identificar a localização. Informe o endereço completo com número e bairro.';
  return null;
}

function validateMotivo(motivo: string): string | null {
  const valid: MotivoSolicitacao[] = [
    'Pane elétrica', 'Pane mecânica', 'Pneu furado', 'Bateria descarregada',
    'Colisão', 'Remoção simples', 'Veículo sem partida', 'Veículo travado', 'Outro'
  ];
  if (!valid.includes(motivo as MotivoSolicitacao)) {
    return `Por favor, escolha um motivo válido:\n${valid.map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
  }
  return null;
}

function validateDestino(dest: string): string | null {
  if (dest.trim().length < 5) return 'O destino precisa ser mais detalhado. Informe o endereço completo.';
  return null;
}

const MOTIVOS: MotivoSolicitacao[] = [
  'Pane elétrica', 'Pane mecânica', 'Pneu furado', 'Bateria descarregada',
  'Colisão', 'Remoção simples', 'Veículo sem partida', 'Veículo travado', 'Outro'
];

// ========== MOCK VEHICLE DB ==========
const MOCK_VEHICLES: Record<string, string> = {
  'ABC1234': 'Honda Civic 2022',
  'DEF5678': 'Toyota Corolla 2023',
  'GHI9012': 'Fiat Uno 2020',
  'JKL3456': 'Volkswagen Gol 2021',
  'BRA2E19': 'Fiat Argo 2024',
  'RIO3A45': 'Jeep Compass 2023',
};

// ========== COMPONENT ==========
export default function WhatsAppSimulador() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [state, setState] = useState<ChatState>({
    step: 'greeting', nome: '', telefone: '', placa: '', modelo: '', localizacao: '',
    motivo: '', destino: '', observacoes: '', valorEstimado: 0, distanciaKm: 0,
    solicitacaoId: '', atendimentoId: '', despachoId: '', prestadorNome: '', protocolo: '',
  });
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100);
  }, []);

  const addMsg = useCallback((sender: ChatMessage['sender'], text: string, options?: string[]) => {
    const msg: ChatMessage = { id: crypto.randomUUID(), sender, text, timestamp: new Date(), options };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
    return msg;
  }, [scrollToBottom]);

  const botSay = useCallback((text: string, delay = 800, options?: string[]) => {
    setIsTyping(true);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setIsTyping(false);
        addMsg('bot', text, options);
        resolve();
      }, delay);
    });
  }, [addMsg]);

  const systemSay = useCallback((text: string) => {
    addMsg('system', text);
  }, [addMsg]);

  // Initialize greeting
  useEffect(() => {
    const init = async () => {
      await botSay('👋 Olá! Bem-vindo à *OpGrid Assistência Veicular*.');
      await botSay('Sou seu assistente virtual e vou te ajudar a solicitar um atendimento de forma rápida e segura.', 600);
      await botSay('Para começar, qual é o seu *nome completo*?', 500);
      setState(s => ({ ...s, step: 'nome' }));
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => scrollToBottom(), [messages, isTyping, scrollToBottom]);

  // Handle user input
  const handleSend = useCallback(async () => {
    const value = input.trim();
    if (!value || isTyping) return;
    setInput('');
    addMsg('user', value);

    switch (state.step) {
      case 'nome': {
        const err = validateNome(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        setState(s => ({ ...s, nome: value, step: 'telefone' }));
        await botSay(`Prazer, *${value.split(' ')[0]}*! 🤝`);
        await botSay('Agora, informe seu *telefone com DDD* (ex: 11999998888):', 500);
        break;
      }
      case 'telefone': {
        const err = validateTelefone(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        const digits = value.replace(/\D/g, '');
        const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        setState(s => ({ ...s, telefone: formatted, step: 'placa' }));
        await botSay(`📱 Telefone registrado: *${formatted}*`);
        await botSay('Qual a *placa do veículo*? (ex: ABC1234)', 500);
        break;
      }
      case 'placa': {
        const clean = value.replace(/[-\s]/g, '').toUpperCase();
        if (clean.length < 7) {
          await botSay('⚠️ Placa inválida. Informe no formato ABC1234 ou ABC1D23.');
          return;
        }
        const modelo = MOCK_VEHICLES[clean] || `Veículo ${clean}`;
        setState(s => ({ ...s, placa: clean, modelo, step: 'localizacao' }));
        await botSay(`🚗 Veículo identificado: *${modelo}* (${clean})`);
        await botSay('📍 Qual sua *localização atual*? Informe o endereço completo:', 500);
        break;
      }
      case 'localizacao': {
        const err = validateLocalizacao(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        setState(s => ({ ...s, localizacao: value, step: 'motivo' }));
        await botSay(`📍 Localização registrada: *${value}*`);
        await botSay('Qual o *motivo do atendimento*? Escolha uma opção:', 500, MOTIVOS);
        break;
      }
      case 'motivo': {
        // Accept number or text
        let motivo = value;
        const num = parseInt(value);
        if (num >= 1 && num <= MOTIVOS.length) {
          motivo = MOTIVOS[num - 1];
        }
        const err = validateMotivo(motivo);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        setState(s => ({ ...s, motivo: motivo as MotivoSolicitacao, step: 'destino' }));
        await botSay(`🔧 Motivo: *${motivo}*`);
        await botSay('Qual o *destino* do veículo? (oficina, residência, etc.):', 500);
        break;
      }
      case 'destino': {
        const err = validateDestino(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        setState(s => ({ ...s, destino: value, step: 'observacoes' }));
        await botSay(`🏁 Destino: *${value}*`);
        await botSay('Alguma *observação adicional*? (ou digite "não")', 500);
        break;
      }
      case 'observacoes': {
        const obs = value.toLowerCase() === 'não' || value.toLowerCase() === 'nao' ? '' : value;
        setState(s => ({ ...s, observacoes: obs, step: 'resumo' }));
        // Show summary
        await botSay('📋 *Resumo da sua solicitação:*', 600);
        const dist = Math.floor(Math.random() * 25) + 5;
        const valorBase = 120;
        const valorKm = dist * 4.5;
        const valorTotal = Math.round(valorBase + valorKm);
        setState(s => ({ ...s, distanciaKm: dist, valorEstimado: valorTotal, step: 'calculando' }));

        const summary = [
          `👤 *${state.nome}*`,
          `📱 ${state.telefone}`,
          `🚗 ${state.modelo} (${state.placa})`,
          `📍 ${state.localizacao}`,
          `🔧 ${state.motivo}`,
          `🏁 ${value}`,
          obs ? `📝 ${obs}` : '',
        ].filter(Boolean).join('\n');
        await botSay(summary, 400);

        systemSay('Calculando valor estimado...');
        await botSay('⏳ Calculando o valor do seu atendimento...', 1200);

        setState(s => ({ ...s, step: 'proposta' }));
        await botSay(
          `💰 *Proposta de atendimento:*\n\n` +
          `• Taxa de saída: R$ 120,00\n` +
          `• Km estimado (${dist} km): R$ ${valorKm.toFixed(2)}\n` +
          `• *Valor total: R$ ${valorTotal.toFixed(2)}*\n\n` +
          `Distância estimada: ${dist} km`,
          800
        );
        await botSay('Deseja *aceitar* esta proposta?\n\nDigite *SIM* para confirmar ou *NÃO* para cancelar.', 500, ['SIM ✅', 'NÃO ❌']);
        setState(s => ({ ...s, step: 'aceite' }));
        break;
      }
      case 'aceite': {
        const resp = value.toUpperCase().replace(/[^A-Z]/g, '');
        if (resp === 'SIM' || resp === 'ACEITAR' || resp === 'CONFIRMAR' || resp === 'S') {
          setState(s => ({ ...s, step: 'gerando_os' }));
          await botSay('✅ *Proposta aceita!*', 600);
          systemSay('Gerando Ordem de Serviço...');
          await botSay('⏳ Gerando sua Ordem de Serviço...', 1000);

          // Generate OS
          const protocolo = `SOL-${Date.now().toString(36).toUpperCase()}`;
          const solId = `sol-chat-${Date.now()}`;
          const atId = `at-chat-${Date.now()}`;
          const despId = `desp-chat-${Date.now()}`;
          const now = new Date().toISOString();

          const solicitacao: Solicitacao = {
            id: solId, protocolo, dataHora: now, canal: 'WhatsApp',
            clienteNome: state.nome, clienteTelefone: state.telefone, clienteWhatsApp: state.telefone,
            veiculoPlaca: state.placa, veiculoModelo: state.modelo,
            origemEndereco: state.localizacao, destinoEndereco: state.destino,
            motivo: state.motivo as MotivoSolicitacao, observacoes: state.observacoes, fotos: [],
            distanciaEstimadaKm: state.distanciaKm, valorEstimado: state.valorEstimado,
            composicaoCusto: [
              { descricao: 'Taxa de saída', valor: 120, tipo: 'base' },
              { descricao: `Km estimado (${state.distanciaKm} km)`, valor: state.distanciaKm * 4.5, tipo: 'km' },
            ],
            status: 'Convertida em OS', statusProposta: 'Aceita',
            propostaEnviadaEm: now, propostaRespondidaEm: now,
            atendimentoId: atId, despachoId: despId,
            linkAcompanhamento: `/acompanhar/${atId}`,
            timeline: [
              { data: now, descricao: 'Solicitação recebida via WhatsApp', tipo: 'sistema' },
              { data: now, descricao: 'Proposta enviada ao cliente', tipo: 'sistema' },
              { data: now, descricao: 'Cliente aceitou a proposta', tipo: 'cliente' },
              { data: now, descricao: 'OS gerada automaticamente', tipo: 'sistema' },
            ],
          };

          const atendimento: Atendimento = {
            id: atId, protocolo, dataHora: now, prestadorId: '',
            clienteNome: state.nome, solicitante: state.nome,
            origem: state.localizacao, destino: state.destino,
            tipoAtendimento: 'Guincho', veiculo: state.modelo, placa: state.placa,
            kmPrevisto: state.distanciaKm, km: 0, horasTrabalhadas: 0, horasParadas: 0,
            status: 'Aberto', prioridade: 'Normal', observacoes: state.observacoes,
            tarifas: [
              { tarifaId: 't1', quantidade: 1, valorUnitario: 120, valorTotal: 120 },
              { tarifaId: 't2', quantidade: state.distanciaKm, valorUnitario: 4.5, valorTotal: state.distanciaKm * 4.5 },
            ],
            valorTotal: state.valorEstimado,
            timeline: [{ data: now, descricao: 'OS gerada via WhatsApp' }],
            solicitacaoId: solId, despachoId: despId,
            linkCliente: `/acompanhar/${atId}`,
          };

          addSolicitacao(solicitacao);
          addAtendimento(atendimento);

          // Find nearest active providers
          const prestadores = getPrestadores().filter(p => p.status === 'Ativo' && p.homologacao === 'Homologado');
          const top2 = prestadores.slice(0, 2);

          const ofertas: OfertaPrestador[] = top2.map((p, i) => ({
            id: `of-${Date.now()}-${i}`,
            despachoId: despId,
            prestadorId: p.id,
            rodada: 1,
            status: 'Pendente' as const,
            enviadaEm: now,
            tempoLimiteMinutos: 10,
            distanciaEstimadaKm: Math.floor(Math.random() * 15) + 3,
            tempoEstimadoMinutos: Math.floor(Math.random() * 20) + 10,
            valorServico: state.valorEstimado,
            linkOferta: `/prestador/oferta/of-${Date.now()}-${i}`,
          }));

          const despacho: Despacho = {
            id: despId, solicitacaoId: solId, atendimentoId: atId,
            rodadaAtual: 1, status: 'Ofertas enviadas', criadoEm: now, atualizadoEm: now,
            ofertas, observacoes: 'Despacho automático via WhatsApp',
          };

          addDespacho(despacho);

          addNotification({
            type: 'solicitacao_nova',
            title: 'Nova OS via WhatsApp',
            message: `${state.nome} — ${state.motivo} — ${state.modelo}`,
          });

          setState(s => ({
            ...s,
            protocolo, solicitacaoId: solId, atendimentoId: atId, despachoId: despId,
            prestadorNome: top2[0]?.nomeFantasia || 'Prestador',
            step: 'despacho',
          }));

          await botSay(`📄 *OS gerada com sucesso!*\n\nProtocolo: *${protocolo}*`, 800);
          systemSay('Iniciando despacho automático...');
          await botSay(`🚀 Despacho automático iniciado!\nBuscando prestadores próximos...`, 1000);
          await botSay(
            `📡 ${top2.length} prestador(es) notificado(s):\n` +
            top2.map(p => `• ${p.nomeFantasia} (${p.cidade}/${p.uf})`).join('\n'),
            800
          );
          await botSay('⏳ Aguardando resposta do prestador... Isso pode levar alguns minutos.', 600);

          // Simulate provider acceptance after delay
          setTimeout(async () => {
            const provName = top2[0]?.nomeFantasia || 'Auto Socorro';
            setState(s => ({ ...s, prestadorNome: provName, step: 'prestador_confirmado' }));
            addMsg('system', 'Prestador aceitou a oferta!');
            await botSay(`🎉 *Ótima notícia, ${state.nome.split(' ')[0]}!*`);
            await botSay(
              `O prestador *${provName}* aceitou seu chamado!\n\n` +
              `🚛 Ele está se preparando para ir até você.\n` +
              `📍 Previsão de chegada: 15-25 minutos`,
              600
            );
            await botSay(
              `🔗 Acompanhe em tempo real:\n${window.location.origin}/acompanhar/${atId}\n\n` +
              `Você receberá atualizações automáticas sobre o deslocamento.`,
              500
            );

            // Simulate "a caminho"
            setTimeout(async () => {
              setState(s => ({ ...s, step: 'prestador_caminho' }));
              addMsg('system', 'Prestador a caminho');
              await botSay(`🚛 *${provName}* está *a caminho* da sua localização!\n📍 Chegada estimada em 12 minutos.`, 600);

              // Simulate "chegou"
              setTimeout(async () => {
                setState(s => ({ ...s, step: 'prestador_chegou' }));
                addMsg('system', 'Prestador chegou ao local');
                await botSay(`📍 *${provName}* chegou ao local!\nO prestador está se identificando.`, 600);

                // Simulate "em atendimento"
                setTimeout(async () => {
                  setState(s => ({ ...s, step: 'em_atendimento' }));
                  addMsg('system', 'Atendimento em andamento');
                  await botSay('🔧 O serviço está sendo realizado. Aguarde a finalização.', 600);

                  // Simulate "concluído"
                  setTimeout(async () => {
                    setState(s => ({ ...s, step: 'concluido' }));
                    addMsg('system', 'Atendimento concluído');
                    await botSay(
                      `✅ *Atendimento concluído com sucesso!*\n\n` +
                      `📄 Protocolo: *${protocolo}*\n` +
                      `💰 Valor: *R$ ${state.valorEstimado.toFixed(2)}*\n` +
                      `🚛 Prestador: *${provName}*\n\n` +
                      `Obrigado por utilizar a *OpGrid*! 💙`,
                      800
                    );
                  }, 6000);
                }, 5000);
              }, 5000);
            }, 5000);
          }, 4000);

        } else if (resp === 'NAO' || resp === 'N' || resp === 'CANCELAR' || resp === 'RECUSAR') {
          setState(s => ({ ...s, step: 'cancelado' }));
          await botSay('❌ Proposta recusada. Sua solicitação foi cancelada.');
          await botSay('Se precisar de ajuda novamente, é só nos chamar! 👋', 500);
        } else {
          await botSay('⚠️ Resposta inválida. Por favor, digite *SIM* para aceitar ou *NÃO* para cancelar.', 600, ['SIM ✅', 'NÃO ❌']);
        }
        break;
      }
      default:
        await botSay('Obrigado pela mensagem! Se precisar de algo mais, inicie uma nova solicitação.', 600);
    }
  }, [input, isTyping, state, addMsg, botSay, systemSay]);

  const handleOptionClick = (option: string) => {
    setInput(option.replace(/[✅❌]/g, '').trim());
    setTimeout(() => {
      const cleanValue = option.replace(/[✅❌]/g, '').trim();
      setInput('');
      addMsg('user', cleanValue);
      // Process directly
      const fakeInput = cleanValue;
      setInput(fakeInput);
    }, 50);
  };

  const handleReset = () => {
    setMessages([]);
    setState({
      step: 'greeting', nome: '', telefone: '', placa: '', modelo: '', localizacao: '',
      motivo: '', destino: '', observacoes: '', valorEstimado: 0, distanciaKm: 0,
      solicitacaoId: '', atendimentoId: '', despachoId: '', prestadorNome: '', protocolo: '',
    });
    // Re-init
    setTimeout(async () => {
      await botSay('👋 Olá! Bem-vindo à *OpGrid Assistência Veicular*.');
      await botSay('Sou seu assistente virtual e vou te ajudar a solicitar um atendimento de forma rápida e segura.', 600);
      await botSay('Para começar, qual é o seu *nome completo*?', 500);
      setState(s => ({ ...s, step: 'nome' }));
    }, 300);
  };

  const stepProgress: Record<string, number> = {
    greeting: 0, nome: 7, telefone: 14, placa: 21, localizacao: 28, motivo: 35,
    destino: 42, observacoes: 50, resumo: 57, calculando: 64, proposta: 71,
    aceite: 78, gerando_os: 85, despacho: 88, aguardando_prestador: 90,
    prestador_confirmado: 92, prestador_caminho: 94, prestador_chegou: 96,
    em_atendimento: 98, concluido: 100, cancelado: 100,
  };

  const stepLabels: Record<string, string> = {
    greeting: 'Início', nome: 'Nome', telefone: 'Telefone', placa: 'Veículo',
    localizacao: 'Localização', motivo: 'Motivo', destino: 'Destino',
    observacoes: 'Observações', resumo: 'Resumo', calculando: 'Calculando',
    proposta: 'Proposta', aceite: 'Aceite', gerando_os: 'Gerando OS',
    despacho: 'Despacho', aguardando_prestador: 'Aguardando',
    prestador_confirmado: 'Confirmado', prestador_caminho: 'A caminho',
    prestador_chegou: 'No local', em_atendimento: 'Atendimento', concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  const isFinished = state.step === 'concluido' || state.step === 'cancelado';
  const isWaiting = ['gerando_os', 'despacho', 'aguardando_prestador', 'prestador_confirmado', 'prestador_caminho', 'prestador_chegou', 'em_atendimento', 'concluido'].includes(state.step);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Simulador WhatsApp</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Jornada conversacional completa — do primeiro contato à conclusão. <span className="text-success font-medium">100% via chat.</span>
          </p>
        </div>
        <Button onClick={handleReset} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />Nova simulação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-success/20">
            {/* WhatsApp header */}
            <div className="bg-[hsl(var(--success))] px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">OpGrid Assistência</p>
                <p className="text-white/70 text-[11px]">
                  {isTyping ? 'digitando...' : isWaiting ? 'online' : 'online'}
                </p>
              </div>
              <Badge className="bg-white/20 text-white border-0 text-[10px]">
                <Shield className="h-3 w-3 mr-1" />Verificado
              </Badge>
            </div>

            {/* Chat messages */}
            <div ref={chatRef} className="h-[500px] overflow-y-auto p-4 space-y-3 bg-[hsl(220,20%,95%)]"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
                  {msg.sender === 'system' ? (
                    <div className="bg-info/10 text-info border border-info/20 rounded-full px-3 py-1 text-[10px] font-medium flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />{msg.text}
                    </div>
                  ) : (
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[hsl(152,60%,90%)] text-foreground rounded-tr-sm'
                        : 'bg-card text-foreground rounded-tl-sm'
                    }`}>
                      <p className="text-[13px] leading-relaxed whitespace-pre-line">
                        {msg.text.split('*').map((part, i) =>
                          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                        )}
                      </p>
                      <p className={`text-[9px] mt-1 ${msg.sender === 'user' ? 'text-right text-muted-foreground/60' : 'text-muted-foreground/50'}`}>
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {msg.sender === 'user' && ' ✓✓'}
                      </p>
                      {/* Quick options */}
                      {msg.options && msg.sender === 'bot' && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
                          {msg.options.map(opt => (
                            <button key={opt}
                              onClick={() => {
                                const cleanVal = opt.replace(/[✅❌]/g, '').trim();
                                setInput(cleanVal);
                                inputRef.current?.focus();
                              }}
                              className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors font-medium">
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-card rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-card flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={isWaiting ? 'Aguarde...' : isFinished ? 'Simulação finalizada' : 'Digite sua mensagem...'}
                disabled={isWaiting || isFinished}
                className="flex-1 text-sm"
              />
              <Button onClick={handleSend} size="icon" disabled={!input.trim() || isTyping || isWaiting || isFinished}
                className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Pipeline sidebar */}
        <div className="space-y-4">
          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Progresso da Jornada</p>
              <Progress value={stepProgress[state.step] || 0} className="h-2 mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stepLabels[state.step]}</span>
                <span className="text-xs font-bold">{stepProgress[state.step] || 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline stages */}
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Pipeline Operacional</p>
              <div className="space-y-1">
                {[
                  { key: 'nome', icon: User, label: 'Identificação', steps: ['nome', 'telefone'] },
                  { key: 'placa', icon: Car, label: 'Veículo', steps: ['placa'] },
                  { key: 'localizacao', icon: MapPin, label: 'Localização', steps: ['localizacao'] },
                  { key: 'motivo', icon: AlertTriangle, label: 'Problema', steps: ['motivo'] },
                  { key: 'destino', icon: Navigation, label: 'Trajeto', steps: ['destino', 'observacoes'] },
                  { key: 'proposta', icon: DollarSign, label: 'Cotação', steps: ['resumo', 'calculando', 'proposta'] },
                  { key: 'aceite', icon: CheckCircle2, label: 'Aceite', steps: ['aceite'] },
                  { key: 'gerando_os', icon: FileText, label: 'OS Gerada', steps: ['gerando_os'] },
                  { key: 'despacho', icon: Zap, label: 'Despacho', steps: ['despacho', 'aguardando_prestador'] },
                  { key: 'prestador_confirmado', icon: Truck, label: 'Prestador', steps: ['prestador_confirmado', 'prestador_caminho', 'prestador_chegou'] },
                  { key: 'concluido', icon: CheckCircle2, label: 'Conclusão', steps: ['em_atendimento', 'concluido'] },
                ].map(stage => {
                  const allSteps = Object.keys(stepProgress);
                  const currentIdx = allSteps.indexOf(state.step);
                  const stageIdx = allSteps.indexOf(stage.steps[0]);
                  const isActive = stage.steps.includes(state.step);
                  const isDone = currentIdx > allSteps.indexOf(stage.steps[stage.steps.length - 1]);
                  const isCancelled = state.step === 'cancelado';

                  return (
                    <div key={stage.key} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                      isActive ? 'bg-primary/10 text-primary font-semibold' :
                      isDone ? 'text-success' :
                      isCancelled ? 'text-muted-foreground/30' :
                      'text-muted-foreground/50'
                    }`}>
                      <stage.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">{stage.label}</span>
                      {isDone && <CheckCircle2 className="h-3 w-3 text-success" />}
                      {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Generated data */}
          {state.protocolo && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dados Gerados</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Protocolo:</span>
                    <span className="font-mono font-bold">{state.protocolo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-success" />
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-bold">R$ {state.valorEstimado.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-info" />
                    <span className="text-muted-foreground">Prestador:</span>
                    <span className="font-medium">{state.prestadorNome}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7 gap-1"
                    onClick={() => window.open(`/acompanhar/${state.atendimentoId}`, '_blank')}>
                    <Eye className="h-3 w-3" />Link cliente
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7 gap-1"
                    onClick={() => window.open('/solicitacoes', '_self')}>
                    <FileText className="h-3 w-3" />Ver OS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
