// Conversation Engine — processes incoming messages and advances the conversation state machine
// Works identically in local simulation and production (Edge Function feeds data here)

import { ConversationSession, ConversationStep, IncomingMessage } from './types';
import {
  getSession,
  createSession,
  upsertSession,
  sendText,
  sendInteractiveButtons,
  addAutomationEvent,
  getWindowStatus,
  refreshWindow,
  sendTemplate,
} from './cloudApi';
import { addSolicitacao, addAtendimento, addDespacho, getPrestadores } from '@/data/store';
import { Solicitacao, Atendimento, Despacho, OfertaPrestador, MotivoSolicitacao } from '@/types';
import { enqueueMessage } from '@/services/automationEngine';
import type { TriggerEvent } from '@/types/automation';

// Helper to fire automation events without blocking the conversation flow
function fireAutomation(trigger: TriggerEvent, phone: string, payload?: Record<string, unknown>) {
  enqueueMessage({
    trigger_event: trigger,
    recipient_phone: phone,
    payload: { phone, ...payload },
  }).catch((err) => console.warn('[Automation] enqueue failed for', trigger, err));
}

const MOTIVOS_VALIDOS: MotivoSolicitacao[] = [
  'Pane elétrica', 'Pane mecânica', 'Pneu furado', 'Bateria descarregada',
  'Colisão', 'Remoção simples', 'Veículo sem partida', 'Veículo travado', 'Outro',
];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ===== MAIN HANDLER =====
export async function handleIncomingMessage(
  from: string,
  contactName: string,
  message: IncomingMessage
): Promise<void> {
  // Get or create session
  let session = getSession(from);
  const isNewSession = !session;

  if (!session) {
    session = createSession(from, contactName);
    fireAutomation('novo_contato', from, { nome: contactName });
    fireAutomation('new_conversation', from, { nome: contactName });
  }

  // Check window — if client sends message, window resets
  const windowStatus = getWindowStatus(session);
  if (windowStatus === 'closed') {
    // Client re-opened conversation — refresh window
    refreshWindow(session.id);
    session.windowStatus = 'open';
  }

  // Update last message time
  session.lastMessageAt = new Date().toISOString();

  // Extract text content
  const text = extractText(message);

  // Check for cancel
  if (text.toLowerCase().includes('cancelar') && session.currentStep !== 'greeting') {
    session.currentStep = 'cancelado';
    upsertSession(session);
    await sendText(from, '❌ Solicitação cancelada. Se precisar, é só mandar uma nova mensagem!');
    addAutomationEvent({ sessionId: session.id, step: 'cancelado', action: 'cancel', success: true });
    return;
  }

  // Process by step
  await processStep(session, from, text, message);
}

function extractText(msg: IncomingMessage): string {
  if (msg.type === 'text' && msg.text) return msg.text.body;
  if (msg.type === 'interactive') {
    if (msg.interactive?.button_reply) return msg.interactive.button_reply.title;
    if (msg.interactive?.list_reply) return msg.interactive.list_reply.title;
  }
  if (msg.type === 'button' && msg.button) return msg.button.text;
  if (msg.type === 'location' && msg.location) {
    return `${msg.location.latitude},${msg.location.longitude}`;
  }
  return '';
}

async function processStep(
  session: ConversationSession,
  from: string,
  text: string,
  rawMessage: IncomingMessage
): Promise<void> {
  const step = session.currentStep;

  switch (step) {
    case 'greeting':
      await sendText(from,
        `Olá${session.data.nome ? ', ' + session.data.nome.split(' ')[0] : ''}! 👋\n\n` +
        `Sou o assistente da *OpGrid Assistência Veicular*.\n\n` +
        `Vou te ajudar a solicitar um guincho/reboque de forma rápida.\n\n` +
        `Para começar, me diga seu *nome completo*:`
      );
      session.currentStep = 'collect_nome';
      break;

    case 'collect_nome':
      if (text.length < 3) {
        await sendText(from, 'Por favor, informe seu nome completo (mínimo 3 caracteres):');
        break;
      }
      session.data.nome = text.trim();
      session.currentStep = 'collect_placa';
      await sendText(from,
        `Obrigado, *${session.data.nome.split(' ')[0]}*! ✅\n\n` +
        `Agora informe a *placa do veículo*:\n` +
        `_(Ex: ABC1D23 ou ABC-1234)_`
      );
      break;

    case 'collect_placa':
      const placaClean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (placaClean.length < 7) {
        await sendText(from, '⚠️ Placa inválida. Informe no formato *ABC1D23* ou *ABC-1234*:');
        break;
      }
      session.data.placa = placaClean;
      session.data.modelo = 'Veículo'; // Will be enriched by API lookup
      session.currentStep = 'collect_localizacao';
      await sendText(from,
        `🚗 Placa registrada: *${placaClean}*\n\n` +
        `Agora envie sua *localização atual* 📍\n\n` +
        `Você pode:\n` +
        `• Compartilhar localização pelo WhatsApp\n` +
        `• Digitar o endereço completo`
      );
      break;

    case 'collect_localizacao':
      if (rawMessage.type === 'location' && rawMessage.location) {
        session.data.localizacao = rawMessage.location.address || `${rawMessage.location.latitude}, ${rawMessage.location.longitude}`;
        session.data.coordenadas = { lat: rawMessage.location.latitude, lng: rawMessage.location.longitude };
      } else {
        if (text.length < 5) {
          await sendText(from, '📍 Por favor, envie um endereço mais detalhado ou compartilhe sua localização:');
          break;
        }
        session.data.localizacao = text.trim();
      }
      session.currentStep = 'collect_motivo';
      await sendInteractiveButtons(from,
        '🔧 Qual o *motivo do atendimento*?',
        [
          { id: 'pane_mecanica', title: 'Pane mecânica' },
          { id: 'pneu_furado', title: 'Pneu furado' },
          { id: 'outro_motivo', title: 'Outro motivo' },
        ],
        'Motivo do atendimento'
      );
      break;

    case 'collect_motivo': {
      const motivoMap: Record<string, MotivoSolicitacao> = {
        'pane_mecanica': 'Pane mecânica',
        'pneu_furado': 'Pneu furado',
        'outro_motivo': 'Outro',
      };
      const buttonId = rawMessage.interactive?.button_reply?.id;
      const motivo = buttonId ? motivoMap[buttonId] : (MOTIVOS_VALIDOS.find(m => text.toLowerCase().includes(m.toLowerCase())) || 'Outro');
      session.data.motivo = motivo;
      session.currentStep = 'collect_destino';
      await sendText(from,
        `✅ Motivo: *${motivo}*\n\n` +
        `Agora informe o *endereço de destino*:\n` +
        `_(Para onde o veículo deve ser levado)_`
      );
      break;
    }

    case 'collect_destino':
      if (text.length < 5) {
        await sendText(from, '🏁 Por favor, informe o endereço de destino com mais detalhes:');
        break;
      }
      session.data.destino = text.trim();
      session.currentStep = 'collect_observacoes';
      await sendInteractiveButtons(from,
        '📝 Deseja adicionar alguma *observação*?\n_(Ex: veículo rebaixado, rua estreita, etc.)_',
        [
          { id: 'sem_obs', title: 'Sem observações' },
          { id: 'com_obs', title: 'Sim, quero informar' },
        ]
      );
      break;

    case 'collect_observacoes': {
      const buttonId = rawMessage.interactive?.button_reply?.id;
      if (buttonId === 'sem_obs') {
        session.data.observacoes = '';
      } else if (buttonId === 'com_obs') {
        await sendText(from, 'Digite suas observações:');
        session.currentStep = 'collect_observacoes'; // stay for free text
        // Mark we're waiting for text
        upsertSession(session);
        return;
      } else {
        session.data.observacoes = text.trim();
      }
      session.currentStep = 'orcamento';
      await generateAndSendQuote(session, from);
      break;
    }

    case 'aguardando_aceite': {
      const buttonId = rawMessage.interactive?.button_reply?.id;
      const aceite = buttonId === 'aceitar' || text.toLowerCase().includes('sim') || text.toLowerCase().includes('aceito') || text.toLowerCase().includes('confirmo');
      const recusa = buttonId === 'recusar' || text.toLowerCase().includes('não') || text.toLowerCase().includes('recuso') || text.toLowerCase().includes('cancelar');

      if (aceite) {
        session.currentStep = 'aceite_confirmado';
        upsertSession(session);
        await sendText(from, '✅ *Solicitação confirmada!*\n\nEstamos criando sua OS e localizando o prestador mais próximo...');
        addAutomationEvent({ sessionId: session.id, step: 'aceite_confirmado', action: 'client_accepted', success: true });
        await createOsAndDispatch(session, from);
      } else if (recusa) {
        session.currentStep = 'cancelado';
        upsertSession(session);
        await sendText(from, '❌ Orçamento recusado. Se mudar de ideia, é só enviar uma nova mensagem!');
        addAutomationEvent({ sessionId: session.id, step: 'cancelado', action: 'client_refused', success: true });
      } else {
        await sendText(from, 'Por favor, responda *SIM* para aceitar ou *NÃO* para recusar o orçamento.');
      }
      break;
    }

    case 'prestador_confirmado':
    case 'em_atendimento':
      await sendText(from,
        `Seu atendimento está em andamento! 🚛\n\n` +
        `Para acompanhar em tempo real, acesse:\n` +
        `${window.location.origin}/acompanhar/${session.atendimentoId || session.solicitacaoId}`
      );
      break;

    case 'concluido':
      await sendText(from, '✅ Seu atendimento já foi concluído! Se precisar de outro serviço, é só enviar uma mensagem.');
      break;

    case 'cancelado':
      // Start new conversation
      session.currentStep = 'greeting';
      session.data = { nome: '', telefone: from, placa: '', modelo: '', localizacao: '', motivo: '', destino: '', observacoes: '', valorEstimado: 0, distanciaKm: 0 };
      await processStep(session, from, text, rawMessage);
      return;

    default:
      await sendText(from, 'Desculpe, não entendi. Pode repetir?');
  }

  upsertSession(session);
  addAutomationEvent({
    sessionId: session.id,
    step: session.currentStep,
    action: `step_${step}_to_${session.currentStep}`,
    success: true,
  });
}

// ===== QUOTE GENERATION =====
async function generateAndSendQuote(session: ConversationSession, from: string) {
  // Simulated distance & pricing
  const distanciaKm = Math.floor(Math.random() * 30) + 5;
  const valorBase = 120;
  const valorKm = distanciaKm * 4.5;
  const valorTotal = Math.round((valorBase + valorKm) * 100) / 100;

  session.data.distanciaKm = distanciaKm;
  session.data.valorEstimado = valorTotal;

  const resumo =
    `📋 *Resumo do Orçamento*\n\n` +
    `👤 ${session.data.nome}\n` +
    `🚗 Placa: ${session.data.placa}\n` +
    `🔧 ${session.data.motivo}\n` +
    `📍 ${session.data.localizacao}\n` +
    `🏁 ${session.data.destino}\n` +
    `📏 Distância: ~${distanciaKm} km\n` +
    (session.data.observacoes ? `📝 Obs: ${session.data.observacoes}\n` : '') +
    `\n` +
    `💰 *Valor estimado: R$ ${valorTotal.toFixed(2)}*\n` +
    `  ├ Taxa base: R$ ${valorBase.toFixed(2)}\n` +
    `  └ Km (${distanciaKm} × R$ 4,50): R$ ${valorKm.toFixed(2)}`;

  await sendText(from, resumo);

  session.currentStep = 'aguardando_aceite';
  upsertSession(session);

  // Send accept/reject buttons
  await sendInteractiveButtons(from,
    'Deseja *confirmar* este atendimento?',
    [
      { id: 'aceitar', title: '✅ Aceitar' },
      { id: 'recusar', title: '❌ Recusar' },
    ],
    'Confirmar orçamento',
    'OpGrid — Assistência sem app'
  );
}

// ===== OS CREATION & DISPATCH =====
async function createOsAndDispatch(session: ConversationSession, from: string) {
  const now = new Date().toISOString();
  const protocolo = `OS-${Date.now().toString(36).toUpperCase()}`;

  // Create Solicitacao
  const solicitacao: Solicitacao = {
    id: `sol-${uid()}`,
    protocolo,
    dataHora: now,
    canal: 'WhatsApp',
    clienteNome: session.data.nome,
    clienteTelefone: session.data.telefone,
    clienteWhatsApp: from,
    veiculoPlaca: session.data.placa,
    veiculoModelo: session.data.modelo,
    origemEndereco: session.data.localizacao,
    origemCoord: session.data.coordenadas,
    destinoEndereco: session.data.destino,
    motivo: (session.data.motivo as any) || 'Outro',
    observacoes: session.data.observacoes,
    fotos: [],
    distanciaEstimadaKm: session.data.distanciaKm,
    valorEstimado: session.data.valorEstimado,
    composicaoCusto: [
      { descricao: 'Taxa base', valor: 120, tipo: 'base' },
      { descricao: `Km (${session.data.distanciaKm})`, valor: session.data.distanciaKm * 4.5, tipo: 'km' },
    ],
    status: 'Convertida em OS',
    statusProposta: 'Aceita',
    propostaEnviadaEm: now,
    propostaRespondidaEm: now,
    linkAcompanhamento: `/acompanhar/`,
    timeline: [
      { data: now, descricao: 'Solicitação recebida via WhatsApp Cloud API', tipo: 'sistema' },
      { data: now, descricao: 'Orçamento aceito pelo cliente', tipo: 'cliente' },
    ],
  };

  // Find 2 nearest active providers
  const prestadores = getPrestadores()
    .filter(p => p.status === 'Ativo' && p.homologacao === 'Homologado')
    .sort((a, b) => (b.scoreOperacional || 0) - (a.scoreOperacional || 0))
    .slice(0, 2);

  // Create Atendimento
  const atendimento: Atendimento = {
    id: `atd-${uid()}`,
    protocolo,
    dataHora: now,
    prestadorId: '',
    clienteNome: session.data.nome,
    solicitante: session.data.nome,
    origem: session.data.localizacao,
    destino: session.data.destino,
    tipoAtendimento: session.data.motivo || 'Guincho',
    veiculo: session.data.modelo,
    placa: session.data.placa,
    kmPrevisto: session.data.distanciaKm,
    km: 0,
    horasTrabalhadas: 0,
    horasParadas: 0,
    status: 'Aberto',
    prioridade: 'Normal',
    observacoes: session.data.observacoes,
    tarifas: [],
    valorTotal: session.data.valorEstimado,
    timeline: [{ data: now, descricao: 'OS criada automaticamente via WhatsApp Cloud API' }],
    origemCoord: session.data.coordenadas,
    solicitacaoId: solicitacao.id,
    linkCliente: `/acompanhar/`,
  };

  // Create Despacho
  const ofertas: OfertaPrestador[] = prestadores.map((p, i) => ({
    id: `oferta-${uid()}`,
    despachoId: '',
    prestadorId: p.id,
    rodada: 1,
    status: 'Pendente' as const,
    enviadaEm: now,
    tempoLimiteMinutos: 5,
    distanciaEstimadaKm: Math.floor(Math.random() * 15) + 3,
    tempoEstimadoMinutos: Math.floor(Math.random() * 25) + 10,
    valorServico: session.data.valorEstimado,
    linkOferta: `/prestador/oferta/`,
  }));

  const despacho: Despacho = {
    id: `desp-${uid()}`,
    solicitacaoId: solicitacao.id,
    atendimentoId: atendimento.id,
    rodadaAtual: 1,
    modoDespacho: 'automatico',
    status: 'Ofertas enviadas',
    criadoEm: now,
    atualizadoEm: now,
    ofertas: ofertas.map(o => ({ ...o, despachoId: '' })),
    observacoes: `Despacho automático para ${prestadores.length} prestadores via WhatsApp Cloud API`,
  };

  // Update IDs
  solicitacao.linkAcompanhamento = `/acompanhar/${atendimento.id}`;
  atendimento.linkCliente = `/acompanhar/${atendimento.id}`;
  atendimento.despachoId = despacho.id;
  despacho.ofertas = despacho.ofertas.map(o => ({ ...o, despachoId: despacho.id }));

  // Save
  addSolicitacao(solicitacao);
  addAtendimento(atendimento);
  addDespacho(despacho);

  // Update session
  session.solicitacaoId = solicitacao.id;
  session.atendimentoId = atendimento.id;
  session.despachoId = despacho.id;
  session.currentStep = 'despacho';
  upsertSession(session);

  // Send confirmation + tracking link
  await sendText(from,
    `🎉 *OS criada com sucesso!*\n\n` +
    `Protocolo: *${protocolo}*\n` +
    `Prestadores notificados: ${prestadores.length}\n\n` +
    `📍 Acompanhe em tempo real:\n${window.location.origin}/acompanhar/${atendimento.id}\n\n` +
    `Você receberá atualizações automáticas.`
  );

  // Notify providers (would send via WhatsApp in production)
  for (const p of prestadores) {
    await sendText(p.telefone.replace(/\D/g, ''),
      `🔔 *Nova oferta — OpGrid*\n\n` +
      `🚗 ${session.data.modelo} (${session.data.placa})\n` +
      `🔧 ${session.data.motivo}\n` +
      `📍 ${session.data.localizacao}\n` +
      `🏁 ${session.data.destino}\n` +
      `💰 R$ ${session.data.valorEstimado.toFixed(2)}\n\n` +
      `🔗 Aceitar: ${window.location.origin}/prestador/oferta/${despacho.ofertas.find(o => o.prestadorId === p.id)?.id}\n\n` +
      `⏱ Primeiro que aceitar, ganha!`
    );
  }

  addAutomationEvent({
    sessionId: session.id,
    step: 'despacho',
    action: 'os_created_dispatch_sent',
    success: true,
    details: `OS ${protocolo}, ${prestadores.length} prestadores notificados`,
  });
}
