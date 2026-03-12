import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { addSolicitacao, addAtendimento, addDespacho, getPrestadores } from '@/data/store';
import { addNotification } from '@/lib/notifications';
import { Solicitacao, Atendimento, Despacho, MotivoSolicitacao, OfertaPrestador } from '@/types';
import {
  Send, MessageCircle, CheckCircle2, MapPin, Car, Phone, User, FileText,
  DollarSign, Zap, Shield, Navigation, AlertTriangle, RefreshCw,
  Truck, Eye, Headphones, Ban, Clock
} from 'lucide-react';

// ========== TYPES ==========
type ChatStep =
  | 'greeting' | 'nome' | 'telefone' | 'placa' | 'localizacao' | 'motivo'
  | 'destino' | 'observacoes' | 'resumo' | 'calculando' | 'proposta'
  | 'aceite' | 'gerando_os' | 'despacho' | 'aguardando_prestador'
  | 'prestador_confirmado' | 'prestador_caminho' | 'prestador_chegou'
  | 'em_atendimento' | 'concluido' | 'cancelado' | 'encaminhado_humano';

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

// ========== VALIDATION ==========
function validateNome(nome: string): string | null {
  const clean = nome.trim();
  if (clean.length < 3) return 'Preciso do seu nome completo para registrar o atendimento. Pode informar novamente?';
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(clean)) return 'O nome deve conter apenas letras. Pode tentar novamente?';
  if (!clean.includes(' ')) return 'Preciso do seu nome e sobrenome para seguir com o atendimento.';
  return null;
}

function validateTelefone(tel: string): string | null {
  const digits = tel.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return 'Não consegui identificar o telefone. Informe com DDD, por exemplo: 11999998888.';
  return null;
}

function validatePlaca(placa: string): string | null {
  const clean = placa.replace(/[-\s]/g, '').toUpperCase();
  if (clean.length < 7) return 'Placa não reconhecida. Informe no formato ABC1234 ou ABC1D23.';
  if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(clean)) return 'Formato de placa inválido. Tente novamente no padrão ABC1234 ou ABC1D23.';
  return null;
}

function validateLocalizacao(loc: string): string | null {
  if (loc.trim().length < 5) return 'Não consegui identificar a localização. Informe o endereço completo com rua, número e bairro.';
  return null;
}

function validateDestino(dest: string): string | null {
  if (dest.trim().length < 5) return 'Preciso de um endereço de destino mais detalhado para calcular a rota. Pode informar com mais detalhes?';
  return null;
}

const MOTIVOS: MotivoSolicitacao[] = [
  'Pane elétrica', 'Pane mecânica', 'Pneu furado', 'Bateria descarregada',
  'Colisão', 'Remoção simples', 'Veículo sem partida', 'Veículo travado', 'Outro'
];

const OBSERVACOES_SUGESTOES = [
  'Veículo rebaixado', 'Roda travada', 'Garagem subterrânea',
  'Local de difícil acesso', 'Sem chave', 'Sem observações'
];

// ========== MOCK VEHICLE DB ==========
const MOCK_VEHICLES: Record<string, string> = {
  'ABC1234': 'Honda Civic 2022', 'DEF5678': 'Toyota Corolla 2023',
  'GHI9012': 'Fiat Uno 2020', 'JKL3456': 'Volkswagen Gol 2021',
  'BRA2E19': 'Fiat Argo 2024', 'RIO3A45': 'Jeep Compass 2023',
};

// ========== CONVERSATION STORAGE ==========
function saveConversation(state: ChatState) {
  try {
    const convs = JSON.parse(localStorage.getItem('opgrid_wa_conversations') || '[]');
    const idx = convs.findIndex((c: any) => c.telefone === state.telefone && c.telefone);
    const entry = {
      id: state.solicitacaoId || `conv-${Date.now()}`,
      nome: state.nome,
      telefone: state.telefone,
      etapa: state.step,
      status: getStepStatus(state.step),
      ultimaInteracao: new Date().toISOString(),
      origem: 'WhatsApp Simulador',
      protocolo: state.protocolo,
      atendimentoId: state.atendimentoId,
    };
    if (idx >= 0) convs[idx] = entry; else convs.unshift(entry);
    localStorage.setItem('opgrid_wa_conversations', JSON.stringify(convs.slice(0, 200)));
    window.dispatchEvent(new CustomEvent('opgrid-conversation-update'));
  } catch {}
}

function getStepStatus(step: ChatStep): string {
  if (['greeting', 'nome', 'telefone', 'placa', 'localizacao', 'motivo', 'destino', 'observacoes'].includes(step)) return 'Coletando dados';
  if (['resumo', 'calculando', 'proposta'].includes(step)) return 'Proposta enviada';
  if (step === 'aceite') return 'Aguardando aceite';
  if (['gerando_os', 'despacho', 'aguardando_prestador'].includes(step)) return 'OS em andamento';
  if (['prestador_confirmado', 'prestador_caminho', 'prestador_chegou', 'em_atendimento'].includes(step)) return 'Em atendimento';
  if (step === 'concluido') return 'Concluído';
  if (step === 'cancelado') return 'Cancelado';
  if (step === 'encaminhado_humano') return 'Encaminhado p/ central';
  return 'Em andamento';
}

function isHumanRequest(text: string): boolean {
  const triggers = ['atendente', 'humano', 'pessoa', 'falar com alguém', 'falar com alguem', 'central', 'operador', 'ajuda humana', 'falar com a central'];
  return triggers.some(t => text.toLowerCase().includes(t));
}

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
      await botSay('👋 Olá! Que bom ter você aqui.');
      await botSay('Sou o assistente da *OpGrid Assistência Veicular* e vou te guiar para solicitar um atendimento de forma rápida e segura.', 700);
      await botSay('Para começar, me diga seu *nome completo*:', 500);
      setState(s => ({ ...s, step: 'nome' }));
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => scrollToBottom(), [messages, isTyping, scrollToBottom]);

  // Save conversation state on changes
  useEffect(() => {
    if (state.step !== 'greeting') saveConversation(state);
  }, [state]);

  // Handle user input
  const handleSend = useCallback(async () => {
    const value = input.trim();
    if (!value || isTyping) return;
    setInput('');
    addMsg('user', value);

    // Check for human handoff at any step
    if (isHumanRequest(value) && !['concluido', 'cancelado', 'encaminhado_humano'].includes(state.step)) {
      setState(s => ({ ...s, step: 'encaminhado_humano' }));
      await botSay('Entendi. Vou encaminhar seu atendimento para a *central de operações*. 🧑‍💼', 600);
      await botSay('Um de nossos operadores vai assumir a conversa em instantes. Por favor, aguarde.', 500);
      systemSay('Conversa encaminhada para atendimento humano');
      return;
    }

    // Check for cancel at any collection step
    if ((value.toLowerCase() === 'cancelar' || value.toLowerCase() === 'sair') && !['concluido', 'cancelado', 'encaminhado_humano', 'greeting'].includes(state.step)) {
      setState(s => ({ ...s, step: 'cancelado' }));
      await botSay('Solicitação cancelada com sucesso. ✅\nSe precisar novamente, é só chamar. Estamos sempre por aqui! 👋', 600);
      return;
    }

    switch (state.step) {
      case 'nome': {
        const err = validateNome(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        const firstName = value.trim().split(' ')[0];
        setState(s => ({ ...s, nome: value.trim(), step: 'telefone' }));
        await botSay(`Prazer, *${firstName}*! 🤝`);
        await botSay('Agora, informe seu *telefone com DDD*.\nExemplo: 11999998888', 500);
        break;
      }
      case 'telefone': {
        const err = validateTelefone(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        const digits = value.replace(/\D/g, '');
        const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        setState(s => ({ ...s, telefone: formatted, step: 'placa' }));
        await botSay(`📱 Telefone registrado: *${formatted}*`);
        await botSay('Qual a *placa do veículo*?\nFormato: ABC1234 ou ABC1D23', 500);
        break;
      }
      case 'placa': {
        const clean = value.replace(/[-\s]/g, '').toUpperCase();
        const err = validatePlaca(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        const modelo = MOCK_VEHICLES[clean] || `Veículo ${clean}`;
        setState(s => ({ ...s, placa: clean, modelo, step: 'localizacao' }));
        await botSay(`🚗 Veículo identificado: *${modelo}*\nPlaca: *${clean}*`);
        await botSay('📍 Onde você está agora?\n\nInforme o *endereço completo* com rua, número e bairro.\nVocê também pode compartilhar a localização pelo WhatsApp.', 600);
        break;
      }
      case 'localizacao': {
        const err = validateLocalizacao(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        setState(s => ({ ...s, localizacao: value.trim(), step: 'motivo' }));
        await botSay(`📍 Localização registrada!`);
        await botSay('🔧 Qual o *motivo do atendimento*?\n\nEscolha uma das opções abaixo ou digite o número:', 500, MOTIVOS);
        break;
      }
      case 'motivo': {
        let motivo = value;
        const num = parseInt(value);
        if (num >= 1 && num <= MOTIVOS.length) {
          motivo = MOTIVOS[num - 1];
        }
        if (!MOTIVOS.includes(motivo as MotivoSolicitacao)) {
          // Try fuzzy match
          const match = MOTIVOS.find(m => m.toLowerCase().includes(value.toLowerCase()));
          if (match) {
            motivo = match;
          } else {
            await botSay(`⚠️ Não identifiquei o motivo. Escolha uma das opções:\n\n${MOTIVOS.map((m, i) => `${i + 1}. ${m}`).join('\n')}`, 600, MOTIVOS);
            return;
          }
        }
        setState(s => ({ ...s, motivo: motivo as MotivoSolicitacao, step: 'destino' }));
        await botSay(`🔧 Motivo registrado: *${motivo}*`);
        await botSay('🏁 Para onde o veículo deve ser levado?\n\nInforme o *endereço de destino* (oficina, residência, concessionária, etc.):', 500);
        break;
      }
      case 'destino': {
        const err = validateDestino(value);
        if (err) { await botSay(`⚠️ ${err}`); return; }
        setState(s => ({ ...s, destino: value.trim(), step: 'observacoes' }));
        await botSay(`🏁 Destino: *${value.trim()}*`);
        await botSay('📝 Tem alguma *observação importante* sobre o veículo ou local?\n\nExemplos: veículo rebaixado, roda travada, garagem subterrânea, sem chave.\n\nOu digite *"sem observações"* para continuar.', 500, OBSERVACOES_SUGESTOES);
        break;
      }
      case 'observacoes': {
        const semObs = ['sem observações', 'sem observacoes', 'não', 'nao', 'nenhuma', 'sem obs', 'sem'].includes(value.toLowerCase().trim());
        const obs = semObs ? '' : value.trim();
        setState(s => ({ ...s, observacoes: obs }));

        // Calculate and show summary
        const dist = Math.floor(Math.random() * 25) + 5;
        const valorBase = 120;
        const valorKm = dist * 4.5;
        const valorTotal = Math.round(valorBase + valorKm);
        setState(s => ({ ...s, distanciaKm: dist, valorEstimado: valorTotal, step: 'resumo' }));

        await botSay('📋 *Resumo do seu atendimento:*', 600);

        const summary =
          `👤 Cliente: *${state.nome}*\n` +
          `📱 Telefone: ${state.telefone}\n` +
          `🚗 Veículo: ${state.modelo} (${state.placa})\n` +
          `📍 Origem: ${state.localizacao}\n` +
          `🏁 Destino: ${value.trim()}\n` +
          `🔧 Motivo: ${state.motivo}\n` +
          (obs ? `📝 Observações: ${obs}\n` : '') +
          `📏 Distância estimada: ${dist} km`;
        await botSay(summary, 500);

        systemSay('Calculando valor estimado...');
        await botSay('⏳ Calculando valor do serviço...', 1000);

        setState(s => ({ ...s, step: 'proposta' }));
        await botSay(
          `💰 *Valor estimado do serviço:*\n\n` +
          `  • Taxa de saída: R$ ${valorBase.toFixed(2)}\n` +
          `  • Quilometragem (${dist} km × R$ 4,50): R$ ${valorKm.toFixed(2)}\n\n` +
          `  💵 *Total: R$ ${valorTotal.toFixed(2)}*`,
          800
        );
        await botSay(
          'Deseja *prosseguir* com o atendimento?\n\n' +
          '✅ *Aceitar* — confirmar e acionar prestador\n' +
          '❌ *Cancelar* — encerrar solicitação\n' +
          '🧑‍💼 *Central* — falar com um atendente',
          500,
          ['Aceitar ✅', 'Cancelar ❌', 'Falar com central 🧑‍💼']
        );
        setState(s => ({ ...s, step: 'aceite' }));
        break;
      }
      case 'aceite': {
        const resp = value.toLowerCase().replace(/[^a-záéíóúãõâêîôûç\s]/g, '').trim();
        const isAccept = ['sim', 'aceitar', 'confirmar', 'aceito', 'confirmo', 'prosseguir', 's'].includes(resp);
        const isCancel = ['não', 'nao', 'cancelar', 'recusar', 'n', 'recuso'].includes(resp);
        const isHuman = ['central', 'falar com central', 'atendente', 'humano'].includes(resp);

        if (isHuman) {
          setState(s => ({ ...s, step: 'encaminhado_humano' }));
          await botSay('Entendi. Vou encaminhar seu atendimento para a *central de operações*. 🧑‍💼', 600);
          await botSay('Um de nossos operadores vai assumir a conversa em instantes. Por favor, aguarde.', 500);
          systemSay('Conversa encaminhada para atendimento humano');
          return;
        }

        if (isAccept) {
          setState(s => ({ ...s, step: 'gerando_os' }));
          await botSay('✅ *Perfeito! Seu atendimento foi confirmado.*', 600);
          await botSay('Estamos gerando sua ordem de serviço e acionando os prestadores mais próximos da sua localização.', 500);
          systemSay('Gerando Ordem de Serviço...');
          await botSay('⏳ Criando OS e iniciando despacho...', 1000);

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
              { descricao: `Quilometragem (${state.distanciaKm} km)`, valor: state.distanciaKm * 4.5, tipo: 'km' },
            ],
            status: 'Convertida em OS', statusProposta: 'Aceita',
            propostaEnviadaEm: now, propostaRespondidaEm: now,
            atendimentoId: atId, despachoId: despId,
            linkAcompanhamento: `/acompanhar/${atId}`,
            timeline: [
              { data: now, descricao: 'Solicitação recebida via WhatsApp', tipo: 'sistema' },
              { data: now, descricao: 'Proposta enviada e aceita pelo cliente', tipo: 'cliente' },
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
            timeline: [{ data: now, descricao: 'OS gerada via simulador WhatsApp' }],
            solicitacaoId: solId, despachoId: despId,
            linkCliente: `/acompanhar/${atId}`,
          };

          addSolicitacao(solicitacao);
          addAtendimento(atendimento);

          const prestadores = getPrestadores().filter(p => p.status === 'Ativo' && p.homologacao === 'Homologado');
          const top2 = prestadores.slice(0, 2);

          const ofertas: OfertaPrestador[] = top2.map((p, i) => ({
            id: `of-${Date.now()}-${i}`,
            despachoId: despId, prestadorId: p.id, rodada: 1,
            status: 'Pendente' as const, enviadaEm: now,
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
            solicitacaoId: solId,
          });

          setState(s => ({
            ...s,
            protocolo, solicitacaoId: solId, atendimentoId: atId, despachoId: despId,
            prestadorNome: top2[0]?.nomeFantasia || 'Prestador',
            step: 'despacho',
          }));

          await botSay(`📄 *Ordem de Serviço criada!*\n\nProtocolo: *${protocolo}*`, 800);
          systemSay('Despacho automático iniciado');
          await botSay(
            `🚀 Despacho iniciado!\n\n` +
            `${top2.length} prestador(es) notificado(s):\n` +
            top2.map(p => `  • ${p.nomeFantasia} — ${p.cidade}/${p.uf}`).join('\n'),
            800
          );
          await botSay('⏳ Aguardando aceite do prestador. Você receberá atualizações em tempo real.', 600);

          // Simulate provider lifecycle
          setTimeout(async () => {
            const provName = top2[0]?.nomeFantasia || 'Auto Socorro';
            setState(s => ({ ...s, prestadorNome: provName, step: 'prestador_confirmado' }));
            addMsg('system', 'Prestador aceitou a oferta!');
            await botSay(`🎉 *Ótima notícia, ${state.nome.split(' ')[0]}!*\n\nO prestador *${provName}* aceitou seu chamado!`);
            await botSay(`🚛 Previsão de chegada: *15-25 minutos*\n\n🔗 Acompanhe em tempo real:\n${window.location.origin}/acompanhar/${atId}`, 600);

            setTimeout(async () => {
              setState(s => ({ ...s, step: 'prestador_caminho' }));
              addMsg('system', 'Prestador a caminho');
              await botSay(`🚛 *${provName}* está *a caminho*!\n📍 Chegada estimada em 12 minutos.`, 600);

              setTimeout(async () => {
                setState(s => ({ ...s, step: 'prestador_chegou' }));
                addMsg('system', 'Prestador chegou ao local');
                await botSay(`📍 *${provName}* chegou ao local!\nO prestador está se identificando.`, 600);

                setTimeout(async () => {
                  setState(s => ({ ...s, step: 'em_atendimento' }));
                  addMsg('system', 'Serviço em andamento');
                  await botSay('🔧 O serviço está sendo realizado. Aguarde a finalização.', 600);

                  setTimeout(async () => {
                    setState(s => ({ ...s, step: 'concluido' }));
                    addMsg('system', 'Atendimento concluído');
                    await botSay(
                      `✅ *Atendimento concluído com sucesso!*\n\n` +
                      `📄 Protocolo: *${protocolo}*\n` +
                      `💰 Valor: *R$ ${state.valorEstimado.toFixed(2)}*\n` +
                      `🚛 Prestador: *${provName}*\n\n` +
                      `Obrigado por confiar na *OpGrid*! 💙\nSe precisar novamente, é só chamar.`,
                      800
                    );
                  }, 6000);
                }, 5000);
              }, 5000);
            }, 5000);
          }, 4000);

        } else if (isCancel) {
          setState(s => ({ ...s, step: 'cancelado' }));
          await botSay('Solicitação cancelada com sucesso. ✅\nSe precisar novamente, é só chamar. Estamos sempre por aqui! 👋', 600);
        } else {
          await botSay('⚠️ Não entendi sua resposta.\n\nDigite *Aceitar* para confirmar, *Cancelar* para encerrar, ou *Central* para falar com um atendente.', 600, ['Aceitar ✅', 'Cancelar ❌', 'Falar com central 🧑‍💼']);
        }
        break;
      }
      default:
        await botSay('Obrigado pela mensagem! Se precisar de algo mais, inicie uma nova simulação.', 600);
    }
  }, [input, isTyping, state, addMsg, botSay, systemSay]);

  const handleReset = () => {
    setMessages([]);
    setState({
      step: 'greeting', nome: '', telefone: '', placa: '', modelo: '', localizacao: '',
      motivo: '', destino: '', observacoes: '', valorEstimado: 0, distanciaKm: 0,
      solicitacaoId: '', atendimentoId: '', despachoId: '', prestadorNome: '', protocolo: '',
    });
    setTimeout(async () => {
      await botSay('👋 Olá! Que bom ter você aqui.');
      await botSay('Sou o assistente da *OpGrid Assistência Veicular* e vou te guiar para solicitar um atendimento de forma rápida e segura.', 700);
      await botSay('Para começar, me diga seu *nome completo*:', 500);
      setState(s => ({ ...s, step: 'nome' }));
    }, 300);
  };

  const stepProgress: Record<string, number> = {
    greeting: 0, nome: 8, telefone: 16, placa: 24, localizacao: 32, motivo: 40,
    destino: 48, observacoes: 56, resumo: 60, calculando: 64, proposta: 68,
    aceite: 75, gerando_os: 82, despacho: 86, aguardando_prestador: 90,
    prestador_confirmado: 92, prestador_caminho: 94, prestador_chegou: 96,
    em_atendimento: 98, concluido: 100, cancelado: 100, encaminhado_humano: 100,
  };

  const stepLabels: Record<string, string> = {
    greeting: 'Início', nome: 'Nome', telefone: 'Telefone', placa: 'Veículo',
    localizacao: 'Localização', motivo: 'Motivo', destino: 'Destino',
    observacoes: 'Observações', resumo: 'Resumo', calculando: 'Calculando',
    proposta: 'Proposta', aceite: 'Aceite do cliente', gerando_os: 'Gerando OS',
    despacho: 'Despacho', aguardando_prestador: 'Aguardando prestador',
    prestador_confirmado: 'Prestador confirmado', prestador_caminho: 'A caminho',
    prestador_chegou: 'No local', em_atendimento: 'Em atendimento',
    concluido: 'Concluído', cancelado: 'Cancelado',
    encaminhado_humano: 'Atendimento humano',
  };

  const isFinished = ['concluido', 'cancelado', 'encaminhado_humano'].includes(state.step);
  const isWaiting = ['gerando_os', 'despacho', 'aguardando_prestador', 'prestador_confirmado', 'prestador_caminho', 'prestador_chegou', 'em_atendimento', 'concluido'].includes(state.step);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Simulador WhatsApp</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Jornada conversacional completa — do primeiro contato à conclusão do atendimento.
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
                  {isTyping ? 'digitando...' : 'online'}
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
                      {msg.options && msg.sender === 'bot' && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
                          {msg.options.map(opt => (
                            <button key={opt}
                              onClick={() => {
                                const cleanVal = opt.replace(/[✅❌🧑‍💼]/gu, '').trim();
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
                placeholder={isWaiting ? 'Aguarde as atualizações...' : isFinished ? 'Simulação finalizada' : 'Digite sua mensagem...'}
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

          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Estados da Conversa</p>
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
                  { key: 'encaminhado_humano', icon: Headphones, label: 'Central', steps: ['encaminhado_humano'] },
                ].map(stage => {
                  const allSteps = Object.keys(stepProgress);
                  const currentIdx = allSteps.indexOf(state.step);
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
                    onClick={() => window.open('/app/operacao/solicitacoes', '_self')}>
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
