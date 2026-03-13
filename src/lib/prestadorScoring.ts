/**
 * Motor de Score de Prestadores para Despacho Inteligente
 * 
 * Calcula uma pontuação composta (0–100) para cada prestador elegível
 * baseada em múltiplos fatores ponderados. Transparente e explicável.
 */

import { Prestador, Solicitacao, Atendimento, StatusRastreamento } from '@/types';

// ─── Pesos ────────────────────────────────────────────────────────────────────
export const SCORE_WEIGHTS = {
  eta: 0.35,
  disponibilidade: 0.20,
  compatibilidade: 0.20,
  cobertura: 0.10,
  performance: 0.10,
  confiabilidade: 0.05,
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ScoreFactor {
  fator: string;
  peso: number;
  nota: number;        // 0–100
  contribuicao: number; // nota * peso
  justificativa: string;
}

export interface PrestadorScored {
  prestador: Prestador;
  distKm: number;
  tempoMin: number;
  scoreTotal: number;
  confianca: 'alta' | 'media' | 'baixa';
  fatores: ScoreFactor[];
  eliminado: boolean;
  motivoEliminacao?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

// ─── Fatores individuais ──────────────────────────────────────────────────────

function calcETA(p: Prestador, sol: Solicitacao | undefined): { nota: number; distKm: number; tempoMin: number; justificativa: string } {
  if (!p.localizacao || !sol?.origemCoord) {
    return { nota: 10, distKm: 999, tempoMin: 999, justificativa: 'Sem localização — nota mínima' };
  }
  const dist = haversineKm(p.localizacao.lat, p.localizacao.lng, sol.origemCoord.lat, sol.origemCoord.lng);
  const tempo = Math.round(dist * 2.5); // ~2.5 min/km urbano
  // 0-5km = 100, 5-15km = 90-70, 15-30km = 70-40, 30-60km = 40-10, >60km = 10
  let nota: number;
  if (dist <= 5) nota = 100;
  else if (dist <= 15) nota = 100 - ((dist - 5) / 10) * 30;
  else if (dist <= 30) nota = 70 - ((dist - 15) / 15) * 30;
  else if (dist <= 60) nota = 40 - ((dist - 30) / 30) * 30;
  else nota = 10;

  const justificativa = dist <= 10
    ? `Muito próximo (${dist.toFixed(1)} km, ~${tempo} min)`
    : dist <= 30
      ? `Distância moderada (${dist.toFixed(1)} km, ~${tempo} min)`
      : `Distante (${dist.toFixed(1)} km, ~${tempo} min)`;

  return { nota: clamp(Math.round(nota)), distKm: Math.round(dist * 10) / 10, tempoMin: tempo, justificativa };
}

function calcDisponibilidade(p: Prestador): { nota: number; justificativa: string } {
  const status = p.localizacao?.statusRastreamento;
  if (!status || status === 'Offline' || status === 'Sem sinal') {
    return { nota: 0, justificativa: 'Offline ou sem sinal' };
  }
  if (status === 'Indisponível') {
    return { nota: 0, justificativa: 'Marcado como indisponível' };
  }
  if (status === 'Online') {
    return { nota: 100, justificativa: 'Online e disponível' };
  }
  if (status === 'A caminho') {
    return { nota: 40, justificativa: 'Em deslocamento — pode não estar livre' };
  }
  if (status === 'Em atendimento') {
    return { nota: 20, justificativa: 'Em atendimento — baixa disponibilidade' };
  }
  return { nota: 30, justificativa: `Status: ${status}` };
}

function calcCompatibilidade(p: Prestador, sol: Solicitacao | undefined): { nota: number; justificativa: string } {
  if (!sol) return { nota: 50, justificativa: 'Sem dados da solicitação' };

  // Map motivo to required service types
  const servicosNecessarios = mapMotivoToServicos(sol.motivo);
  if (servicosNecessarios.length === 0) {
    return { nota: 80, justificativa: 'Tipo de serviço genérico — compatível' };
  }

  const match = servicosNecessarios.filter(s =>
    p.tiposServico.some(t => t.toLowerCase().includes(s.toLowerCase()))
  );

  if (match.length === servicosNecessarios.length) {
    return { nota: 100, justificativa: `Compatibilidade total: ${match.join(', ')}` };
  }
  if (match.length > 0) {
    return { nota: 60, justificativa: `Compatibilidade parcial: ${match.join(', ')} de ${servicosNecessarios.join(', ')}` };
  }
  return { nota: 0, justificativa: `Incompatível — necessário: ${servicosNecessarios.join(', ')}` };
}

function mapMotivoToServicos(motivo: string): string[] {
  const m = motivo.toLowerCase();
  if (m.includes('remoção') || m.includes('colisão')) return ['Guincho', 'Reboque'];
  if (m.includes('pneu') || m.includes('bateria') || m.includes('partida')) return ['Resgate'];
  if (m.includes('pane')) return ['Guincho', 'Resgate'];
  if (m.includes('travado')) return ['Guincho', 'Patins'];
  return ['Guincho'];
}

function calcCobertura(p: Prestador, sol: Solicitacao | undefined): { nota: number; justificativa: string } {
  if (!sol) return { nota: 50, justificativa: 'Sem dados de localização' };

  const enderecoLower = (sol.origemEndereco || '').toLowerCase();

  // Check if provider covers the city
  const cidadeMatch = p.cidadesCobertas.some(c => enderecoLower.includes(c.toLowerCase()));
  if (cidadeMatch) {
    return { nota: 100, justificativa: `Atende a região de ${sol.origemEndereco.split(',')[0]}` };
  }

  // Check UF match
  const ufMatch = enderecoLower.includes(p.uf.toLowerCase());
  if (ufMatch) {
    return { nota: 60, justificativa: `Mesmo estado (${p.uf}) — região próxima` };
  }

  return { nota: 20, justificativa: `Fora da área principal (${p.cidade}/${p.uf})` };
}

function calcPerformance(p: Prestador, atendimentos: Atendimento[]): { nota: number; justificativa: string } {
  const historico = atendimentos.filter(a => a.prestadorId === p.id);
  if (historico.length === 0) {
    return { nota: 50, justificativa: 'Sem histórico — nota neutra' };
  }

  const concluidos = historico.filter(a => a.status === 'Concluído' || a.status === 'Faturado').length;
  const cancelados = historico.filter(a => a.status === 'Cancelado').length;
  const total = historico.length;

  const taxaConclusao = total > 0 ? (concluidos / total) * 100 : 50;
  const taxaCancelamento = total > 0 ? (cancelados / total) * 100 : 0;

  // Score base from scoreOperacional + history adjustments
  let nota = p.scoreOperacional;
  if (taxaConclusao >= 90) nota = Math.min(100, nota + 5);
  if (taxaCancelamento > 20) nota = Math.max(0, nota - 15);

  const justificativa = `${concluidos}/${total} concluídos (${Math.round(taxaConclusao)}%), score op. ${p.scoreOperacional}`;
  return { nota: clamp(Math.round(nota)), justificativa };
}

function calcConfiabilidade(p: Prestador): { nota: number; justificativa: string } {
  let nota = 50;
  const detalhes: string[] = [];

  if (p.homologacao === 'Homologado') { nota += 30; detalhes.push('Homologado'); }
  else if (p.homologacao === 'Pendente') { nota += 10; detalhes.push('Homologação pendente'); }
  else { nota -= 20; detalhes.push('Homologação crítica'); }

  // Validade documental
  if (p.validadeDocumental) {
    const validade = new Date(p.validadeDocumental);
    const hoje = new Date();
    const diasRestantes = Math.round((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diasRestantes > 180) { nota += 20; detalhes.push('Docs em dia'); }
    else if (diasRestantes > 30) { nota += 10; detalhes.push('Docs próximos do vencimento'); }
    else if (diasRestantes <= 0) { nota -= 10; detalhes.push('Docs vencidos'); }
  }

  return { nota: clamp(Math.round(nota)), justificativa: detalhes.join(' · ') };
}

// ─── Regras Eliminatórias ─────────────────────────────────────────────────────

function checkEliminacao(p: Prestador, sol: Solicitacao | undefined): string | null {
  if (p.status === 'Inativo') return 'Prestador inativo';
  if (p.status === 'Bloqueado') return 'Prestador bloqueado';

  const tracking = p.localizacao?.statusRastreamento;
  if (tracking === 'Offline' || tracking === 'Sem sinal' || tracking === 'Indisponível') {
    return `Indisponível (${tracking})`;
  }

  if (p.homologacao === 'Crítico') return 'Homologação crítica';

  // Service type compatibility
  if (sol) {
    const servicosNecessarios = mapMotivoToServicos(sol.motivo);
    const temServico = servicosNecessarios.some(s =>
      p.tiposServico.some(t => t.toLowerCase().includes(s.toLowerCase()))
    );
    if (!temServico) return `Sem serviço compatível (necessário: ${servicosNecessarios.join(', ')})`;
  }

  return null;
}

// ─── Cálculo Principal ───────────────────────────────────────────────────────

export function calcularScorePrestadores(
  prestadores: Prestador[],
  solicitacao: Solicitacao | undefined,
  atendimentos: Atendimento[] = [],
): PrestadorScored[] {
  return prestadores.map(p => {
    const motivoEliminacao = checkEliminacao(p, solicitacao);
    if (motivoEliminacao) {
      return {
        prestador: p,
        distKm: 999,
        tempoMin: 999,
        scoreTotal: 0,
        confianca: 'baixa' as const,
        fatores: [],
        eliminado: true,
        motivoEliminacao,
      };
    }

    const eta = calcETA(p, solicitacao);
    const disp = calcDisponibilidade(p);
    const compat = calcCompatibilidade(p, solicitacao);
    const cob = calcCobertura(p, solicitacao);
    const perf = calcPerformance(p, atendimentos);
    const conf = calcConfiabilidade(p);

    const fatores: ScoreFactor[] = [
      { fator: 'Proximidade / ETA', peso: SCORE_WEIGHTS.eta, nota: eta.nota, contribuicao: eta.nota * SCORE_WEIGHTS.eta, justificativa: eta.justificativa },
      { fator: 'Disponibilidade', peso: SCORE_WEIGHTS.disponibilidade, nota: disp.nota, contribuicao: disp.nota * SCORE_WEIGHTS.disponibilidade, justificativa: disp.justificativa },
      { fator: 'Compatibilidade', peso: SCORE_WEIGHTS.compatibilidade, nota: compat.nota, contribuicao: compat.nota * SCORE_WEIGHTS.compatibilidade, justificativa: compat.justificativa },
      { fator: 'Cobertura', peso: SCORE_WEIGHTS.cobertura, nota: cob.nota, contribuicao: cob.nota * SCORE_WEIGHTS.cobertura, justificativa: cob.justificativa },
      { fator: 'Performance', peso: SCORE_WEIGHTS.performance, nota: perf.nota, contribuicao: perf.nota * SCORE_WEIGHTS.performance, justificativa: perf.justificativa },
      { fator: 'Confiabilidade', peso: SCORE_WEIGHTS.confiabilidade, nota: conf.nota, contribuicao: conf.nota * SCORE_WEIGHTS.confiabilidade, justificativa: conf.justificativa },
    ];

    const scoreTotal = Math.round(fatores.reduce((sum, f) => sum + f.contribuicao, 0));
    const confianca: 'alta' | 'media' | 'baixa' = scoreTotal >= 70 ? 'alta' : scoreTotal >= 45 ? 'media' : 'baixa';

    return {
      prestador: p,
      distKm: eta.distKm,
      tempoMin: eta.tempoMin,
      scoreTotal,
      confianca,
      fatores,
      eliminado: false,
    };
  })
    .sort((a, b) => {
      // Eliminados por último
      if (a.eliminado && !b.eliminado) return 1;
      if (!a.eliminado && b.eliminado) return -1;
      return b.scoreTotal - a.scoreTotal;
    });
}

export function getTopPrestadores(scored: PrestadorScored[], limit = 5): PrestadorScored[] {
  return scored.filter(s => !s.eliminado).slice(0, limit);
}
