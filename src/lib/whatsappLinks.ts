// WhatsApp "Click to Chat" — generates wa.me links with pre-filled messages
// No API integration, no automatic sending. Operator sends manually.

import { Solicitacao, Atendimento, Despacho, Prestador } from '@/types';

function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Ensure country code
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function waLink(phone: string, text: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(text)}`;
}

// ===== CLIENT MESSAGES =====

export function waClientePropostaLink(sol: Solicitacao): string {
  const text = `Olá, ${sol.clienteNome.split(' ')[0]}! 👋\n\n` +
    `Aqui é a *OpGrid Assistência Veicular*.\n\n` +
    `Recebemos sua solicitação:\n` +
    `🚗 ${sol.veiculoModelo} (${sol.veiculoPlaca})\n` +
    `🔧 ${sol.motivo}\n` +
    `📍 ${sol.origemEndereco}\n` +
    `🏁 ${sol.destinoEndereco}\n\n` +
    `💰 *Valor estimado: R$ ${sol.valorEstimado.toFixed(2)}*\n` +
    `📏 Distância: ${sol.distanciaEstimadaKm} km\n\n` +
    `Deseja confirmar o atendimento? Responda *SIM* para aceitar.\n\n` +
    `Protocolo: ${sol.protocolo}`;
  return waLink(sol.clienteWhatsApp || sol.clienteTelefone, text);
}

export function waClienteConfirmacaoLink(sol: Solicitacao): string {
  const text = `✅ *Solicitação confirmada!*\n\n` +
    `Protocolo: *${sol.protocolo}*\n` +
    `🚗 ${sol.veiculoModelo} (${sol.veiculoPlaca})\n\n` +
    `Estamos localizando o prestador mais próximo.\n` +
    `Você receberá um link de acompanhamento em instantes.\n\n` +
    `_OpGrid — Assistência sem app_`;
  return waLink(sol.clienteWhatsApp || sol.clienteTelefone, text);
}

export function waClienteAcompanhamentoLink(sol: Solicitacao, baseUrl: string): string {
  const trackingUrl = `${baseUrl}/acompanhar/${sol.atendimentoId || sol.id}`;
  const text = `🎉 *Prestador confirmado!*\n\n` +
    `Protocolo: *${sol.protocolo}*\n` +
    `🚛 Previsão de chegada: 15-25 min\n\n` +
    `📍 Acompanhe em tempo real:\n${trackingUrl}\n\n` +
    `Você não precisa baixar nenhum app.\n\n` +
    `_Powered by OpGrid_`;
  return waLink(sol.clienteWhatsApp || sol.clienteTelefone, text);
}

export function waClienteConclusaoLink(sol: Solicitacao): string {
  const text = `✅ *Atendimento concluído!*\n\n` +
    `Protocolo: *${sol.protocolo}*\n` +
    `🚗 ${sol.veiculoModelo} (${sol.veiculoPlaca})\n` +
    `💰 Valor: R$ ${sol.valorEstimado.toFixed(2)}\n\n` +
    `Obrigado por utilizar a OpGrid! 💙\n` +
    `Se precisar novamente, é só nos chamar.`;
  return waLink(sol.clienteWhatsApp || sol.clienteTelefone, text);
}

// ===== PROVIDER MESSAGES =====

export function waPrestadorOfertaLink(
  prestador: Prestador,
  sol: Solicitacao,
  ofertaLink: string,
  valor: number,
  baseUrl: string
): string {
  const text = `🔔 *Nova oferta de serviço — OpGrid*\n\n` +
    `🚗 ${sol.veiculoModelo} (${sol.veiculoPlaca})\n` +
    `🔧 ${sol.motivo}\n` +
    `📍 ${sol.origemEndereco}\n` +
    `🏁 ${sol.destinoEndereco}\n` +
    `💰 *Valor: R$ ${valor.toFixed(2)}*\n\n` +
    `⏱ Primeiro que aceitar, ganha a OS!\n\n` +
    `🔗 Aceitar ou recusar:\n${baseUrl}${ofertaLink}\n\n` +
    `_Sem app necessário — tudo pelo link_`;
  return waLink(prestador.telefone, text);
}

export function waPrestadorOsLink(
  prestador: Prestador,
  atd: Atendimento,
  baseUrl: string
): string {
  const text = `✅ *OS confirmada — OpGrid*\n\n` +
    `Protocolo: *${atd.protocolo}*\n` +
    `👤 ${atd.clienteNome}\n` +
    `🚗 ${atd.veiculo} (${atd.placa})\n` +
    `📍 ${atd.origem}\n` +
    `🏁 ${atd.destino}\n` +
    `💰 R$ ${atd.valorTotal.toFixed(2)}\n\n` +
    `🔗 Portal operacional:\n${baseUrl}/prestador/os/${atd.id}\n\n` +
    `_Acesse pelo link — sem app_`;
  return waLink(prestador.telefone, text);
}

// ===== GENERIC =====

export function waGenericLink(phone: string, text: string): string {
  return waLink(phone, text);
}

export function waOsResumoLink(phone: string, atd: Atendimento, prestadorNome?: string): string {
  const text = `📋 *Resumo da OS — OpGrid*\n\n` +
    `Protocolo: *${atd.protocolo}*\n` +
    `👤 Cliente: ${atd.clienteNome}\n` +
    `🚗 ${atd.veiculo} (${atd.placa})\n` +
    `📍 ${atd.origem} → ${atd.destino}\n` +
    `📏 ${atd.kmPrevisto} km previsto\n` +
    `💰 R$ ${atd.valorTotal.toFixed(2)}\n` +
    `📊 Status: ${atd.status}\n` +
    (prestadorNome ? `🚛 Prestador: ${prestadorNome}\n` : '') +
    `\n_OpGrid — Inteligência Operacional_`;
  return waLink(phone, text);
}
