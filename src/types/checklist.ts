export type ChecklistFieldType = 'texto' | 'foto' | 'assinatura' | 'escolha_unica' | 'multipla_escolha';
export type ChecklistFase = 'coleta' | 'entrega' | 'ambos';
export type ChecklistStatus = 'Ativo' | 'Inativo' | 'Rascunho';

export interface ChecklistFieldOption {
  id: string;
  label: string;
}

export interface ChecklistField {
  id: string;
  tipo: ChecklistFieldType;
  titulo: string;
  descricao: string;
  fase: ChecklistFase;
  obrigatorio: boolean;
  opcoes?: ChecklistFieldOption[];
}

export interface ChecklistModelo {
  id: string;
  nome: string;
  descricao: string;
  status: ChecklistStatus;
  ativo: boolean;
  fasePadrao: ChecklistFase;
  campos: ChecklistField[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface ChecklistRealizado {
  id: string;
  modeloId: string;
  modeloNome: string;
  protocolo: string;
  cliente: string;
  executante: string;
  placa: string;
  modeloVeiculo: string;
  dataHora: string;
  status: 'Em andamento' | 'Pendente Entrega' | 'Concluído';
  fase: ChecklistFase;
  respostas: Record<string, any>;
}

// Helper
const f = (id: string, tipo: ChecklistFieldType, titulo: string, descricao: string, fase: ChecklistFase, obrigatorio: boolean, opcoes?: string[]): ChecklistField => ({
  id, tipo, titulo, descricao, fase, obrigatorio,
  ...(opcoes ? { opcoes: opcoes.map((l, i) => ({ id: `${id}-opt${i}`, label: l })) } : {}),
});

export const MODELOS_PADRAO: ChecklistModelo[] = [
  {
    id: 'modelo-moto',
    nome: 'MOTO',
    descricao: 'Checklist para Motos',
    status: 'Ativo',
    ativo: true,
    fasePadrao: 'ambos',
    criadoEm: '2025-12-09',
    atualizadoEm: '2026-02-27',
    campos: [
      f('m1', 'escolha_unica', 'Tipo de Serviço', 'Selecione o tipo do serviço', 'coleta', true, ['Guincho', 'Capotamento', 'Troca de Oficina', 'Outros']),
      f('m2', 'texto', 'Km do Veículo', 'Informe o KM do veículo', 'coleta', false),
      f('m3', 'escolha_unica', 'Nível de Combustível', 'Nível atual do tanque', 'coleta', true, ['Reserva', '1/4', '1/2', '3/4', 'Tanque cheio']),
      f('m4', 'multipla_escolha', 'Acessórios existentes', 'Marque os itens presentes', 'coleta', true, ['Documentos', 'Chave reserva', 'Capacete', 'Baú', 'Protetor de pernas']),
      f('m5', 'foto', 'Foto Frontal', 'Tire uma foto da frente da moto', 'coleta', true),
      f('m6', 'foto', 'Foto Lateral Direita', 'Tire uma foto do lado direito', 'coleta', true),
      f('m7', 'foto', 'Foto Lateral Esquerda', 'Tire uma foto do lado esquerdo', 'coleta', true),
      f('m8', 'foto', 'Foto Traseira', 'Tire uma foto da traseira', 'coleta', true),
      f('m9', 'foto', 'Foto do Painel/Km', 'Tire uma foto do painel mostrando o KM', 'coleta', false),
      f('m10', 'texto', 'Observações de Avarias', 'Descreva avarias encontradas no veículo', 'coleta', false),
      f('m11', 'foto', 'Foto de Avarias', 'Registre fotos de avarias se houver', 'coleta', false),
      f('m12', 'assinatura', 'Assinatura do Responsável pela Coleta', '', 'coleta', true),
      f('m13', 'foto', 'Foto Encima da Prancha', 'Tire uma foto pegando a traseira do seu caminhão com a moto na prancha', 'coleta', false),
      f('m14', 'assinatura', 'Assinatura de Quem está recebendo', '', 'entrega', true),
    ],
  },
  {
    id: 'modelo-carro',
    nome: 'CARRO',
    descricao: 'Checklist para veículos LEVES e UTILITÁRIOS.',
    status: 'Ativo',
    ativo: true,
    fasePadrao: 'ambos',
    criadoEm: '2025-12-16',
    atualizadoEm: '2025-12-16',
    campos: [
      f('c1', 'escolha_unica', 'Tipo de Serviço', 'Selecione o tipo do serviço', 'coleta', true, ['Guincho', 'Capotamento', 'Troca de Oficina', 'Outros']),
      f('c2', 'texto', 'Km do Veículo', 'Informe o KM do Veículo', 'coleta', false),
      f('c3', 'escolha_unica', 'Nível de Combustível', 'Nível atual do tanque', 'coleta', true, ['Reserva', '1/4', '1/2', '3/4', 'Tanque cheio']),
      f('c4', 'multipla_escolha', 'Acessórios / Equipamentos existentes', 'Marque os itens presentes', 'coleta', true, ['Documentos', 'Rádio', 'Macaco', 'Chave de roda', 'Triângulo', 'Estepe', 'Tapetes', 'Calota', 'Antena']),
      f('c5', 'foto', 'Foto Frontal', 'Tire uma foto da frente do veículo', 'coleta', true),
      f('c6', 'foto', 'Foto Lateral Direita', 'Tire uma foto do lado direito', 'coleta', true),
      f('c7', 'foto', 'Foto Lateral Esquerda', 'Tire uma foto do lado esquerdo', 'coleta', true),
      f('c8', 'foto', 'Foto Traseira', 'Tire uma foto da traseira', 'coleta', true),
      f('c9', 'foto', 'Foto do Painel/Km', 'Tire uma foto do painel mostrando o KM', 'coleta', false),
      f('c10', 'texto', 'Observações de Avarias', 'Descreva avarias encontradas no veículo', 'coleta', false),
      f('c11', 'foto', 'Foto de Avarias', 'Registre fotos de avarias se houver', 'coleta', false),
      f('c12', 'assinatura', 'Assinatura do Responsável pela Coleta', '', 'coleta', true),
      f('c13', 'foto', 'Foto Encima da Prancha', 'Tire uma foto pegando a traseira do seu caminhão com o veículo na prancha', 'coleta', false),
      f('c14', 'assinatura', 'Assinatura de Quem está recebendo', '', 'entrega', true),
      f('c15', 'foto', 'Foto na Entrega', 'Tire uma foto do veículo no local de entrega', 'entrega', false),
    ],
  },
  {
    id: 'modelo-caminhao',
    nome: 'CAMINHÃO',
    descricao: 'Checklist para caminhões.',
    status: 'Ativo',
    ativo: true,
    fasePadrao: 'ambos',
    criadoEm: '2025-12-09',
    atualizadoEm: '2025-12-09',
    campos: [
      f('t1', 'escolha_unica', 'Tipo de Serviço', 'Selecione o tipo do serviço', 'coleta', true, ['Guincho', 'Capotamento', 'Troca de Oficina', 'Tombamento', 'Outros']),
      f('t2', 'texto', 'Km do Veículo', 'Informe o KM do veículo', 'coleta', false),
      f('t3', 'escolha_unica', 'Nível de Combustível', 'Nível atual do tanque', 'coleta', true, ['Reserva', '1/4', '1/2', '3/4', 'Tanque cheio']),
      f('t4', 'multipla_escolha', 'Equipamentos existentes', 'Marque os itens presentes', 'coleta', true, ['Documentos', 'Macaco', 'Chave de roda', 'Triângulo', 'Estepe', 'Extintor', 'Lona', 'Corda/Cinta']),
      f('t5', 'foto', 'Foto Frontal', 'Tire uma foto da frente do caminhão', 'coleta', true),
      f('t6', 'foto', 'Foto Lateral Direita', 'Tire uma foto do lado direito', 'coleta', true),
      f('t7', 'foto', 'Foto Lateral Esquerda', 'Tire uma foto do lado esquerdo', 'coleta', true),
      f('t8', 'foto', 'Foto Traseira', 'Tire uma foto da traseira', 'coleta', true),
      f('t9', 'foto', 'Foto do Painel/Km', 'Tire uma foto do painel mostrando o KM', 'coleta', false),
      f('t10', 'texto', 'Observações de Avarias', 'Descreva avarias encontradas', 'coleta', false),
      f('t11', 'foto', 'Foto de Avarias', 'Registre fotos de avarias se houver', 'coleta', false),
      f('t12', 'assinatura', 'Assinatura do Responsável pela Coleta', '', 'coleta', true),
      f('t13', 'foto', 'Foto no Guincho', 'Tire uma foto do caminhão carregado', 'coleta', false),
      f('t14', 'assinatura', 'Assinatura de Quem está recebendo', '', 'entrega', true),
    ],
  },
];

export const CHECKLISTS_REALIZADOS_MOCK: ChecklistRealizado[] = [
  { id: 'cr1', modeloId: 'modelo-carro', modeloNome: 'CARRO', protocolo: 'OS-20260409-0001', cliente: 'Consumidor Final', executante: 'ROBSON DOS SANTOS', placa: 'ABC-1D23', modeloVeiculo: 'CIVIC', dataHora: '2026-04-09T12:48:02', status: 'Pendente Entrega', fase: 'coleta', respostas: {} },
  { id: 'cr2', modeloId: 'modelo-moto', modeloNome: 'MOTO', protocolo: 'OS-20260408-0015', cliente: 'Maria Silva', executante: 'JOÃO PRESTADOR', placa: 'XYZ-9K88', modeloVeiculo: 'CG 160', dataHora: '2026-04-08T09:15:00', status: 'Concluído', fase: 'ambos', respostas: {} },
  { id: 'cr3', modeloId: 'modelo-caminhao', modeloNome: 'CAMINHÃO', protocolo: 'OS-20260407-0003', cliente: 'Transportes ABC', executante: 'CARLOS GUINCHO', placa: 'DEF-5G67', modeloVeiculo: 'SCANIA R450', dataHora: '2026-04-07T16:30:00', status: 'Concluído', fase: 'ambos', respostas: {} },
  { id: 'cr4', modeloId: 'modelo-carro', modeloNome: 'CARRO', protocolo: 'OS-20260406-0022', cliente: 'José Pereira', executante: 'ROBSON DOS SANTOS', placa: 'GHI-2J34', modeloVeiculo: 'GOL', dataHora: '2026-04-06T08:00:00', status: 'Em andamento', fase: 'coleta', respostas: {} },
];

export const FIELD_TYPE_LABELS: Record<ChecklistFieldType, string> = {
  texto: 'Texto',
  foto: 'Foto',
  assinatura: 'Assinatura',
  escolha_unica: 'Escolha Única',
  multipla_escolha: 'Múltipla Escolha',
};

export const FASE_LABELS: Record<ChecklistFase, string> = {
  coleta: 'Somente na Coleta',
  entrega: 'Somente na Entrega',
  ambos: 'Ambos (Coleta e Entrega)',
};