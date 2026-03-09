export type UserRole = 'admin' | 'operador' | 'financeiro' | 'prestador';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  prestadorId?: string;
}

export type PlanoType = 'Básico' | 'Pró' | 'Enterprise';
export type StatusType = 'Ativo' | 'Inativo' | 'Bloqueado';
export type UnidadeMedida = 'Quilometragem' | 'Hora' | 'Unidade' | 'Dia';
export type FormaCobranca = 'Valor unitário' | 'Valor final' | 'Limite de valor';
export type NivelTarifa = 'Sistema' | 'Usuário';
export type CategoriaTarifa = 'Deslocamento' | 'Tempo' | 'Adicional' | 'Equipamento' | 'Desconto' | 'Ajuste';
export type StatusAtendimento = 'Aberto' | 'Em andamento' | 'Concluído' | 'Cancelado' | 'Faturado';
export type StatusTabela = 'Rascunho' | 'Vigente' | 'Expirada' | 'Em revisão';
export type StatusContrato = 'Ativo' | 'Suspenso' | 'Encerrado' | 'Em negociação';
export type HomologacaoStatus = 'Homologado' | 'Pendente' | 'Crítico';
export type PrioridadeAtendimento = 'Normal' | 'Urgente' | 'Crítico';

export interface Prestador {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  documento: string;
  inscricaoEstadual: string;
  telefone: string;
  telefone2: string;
  email: string;
  responsavel: string;
  cidade: string;
  uf: string;
  endereco: string;
  cep: string;
  status: StatusType;
  plano: PlanoType;
  observacoes: string;
  tiposServico: string[];
  areaCobertura: string;
  aceitaNoturno: boolean;
  aceitaRodoviario: boolean;
  tipoParceiro: string;
  cidadesCobertas: string[];
  disponibilidade24h: boolean;
  documentosObrigatorios: string[];
  validadeDocumental: string;
  homologacao: HomologacaoStatus;
  scoreOperacional: number;
  observacoesInternas: string;
}

export interface Tarifa {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  unidadeMedida: UnidadeMedida;
  formaCobranca: FormaCobranca;
  situacao: 'Ativo' | 'Inativo';
  permiteRepetir: boolean;
  nivel: NivelTarifa;
  categoria: CategoriaTarifa;
}

export interface TabelaPrecoItem {
  id: string;
  prestadorId: string;
  tarifaId: string;
  valor: number;
  franquia: number;
  valorExcedente: number;
  minimo: number;
  observacao: string;
  ativo: boolean;
}

export interface TabelaPrecoVigencia {
  id: string;
  prestadorId: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: StatusTabela;
  itens: TabelaPrecoItem[];
}

export interface AtendimentoTarifa {
  tarifaId: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Atendimento {
  id: string;
  protocolo: string;
  dataHora: string;
  prestadorId: string;
  clienteNome: string;
  solicitante: string;
  origem: string;
  destino: string;
  tipoAtendimento: string;
  veiculo: string;
  placa: string;
  kmPrevisto: number;
  km: number;
  horasTrabalhadas: number;
  horasParadas: number;
  status: StatusAtendimento;
  prioridade: PrioridadeAtendimento;
  observacoes: string;
  tarifas: AtendimentoTarifa[];
  valorTotal: number;
  timeline: { data: string; descricao: string }[];
}

export interface Contrato {
  id: string;
  prestadorId: string;
  numero: string;
  descricao: string;
  plano: PlanoType;
  tabelaVinculada: string;
  dataInicio: string;
  dataFim: string;
  status: StatusContrato;
  observacoes: string;
  custoMedioEstimado: number;
}

export interface AuditLog {
  id: string;
  data: string;
  usuario: string;
  acao: string;
  modulo: string;
  descricao: string;
  criticidade: 'info' | 'warning' | 'critical';
}

export interface ConfigEmpresa {
  nomeEmpresa: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  parametroKmMinimo: number;
  parametroHoraMinima: number;
  temaEscuro: boolean;
}
