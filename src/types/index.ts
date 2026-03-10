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
export type StatusRastreamento = 'Online' | 'A caminho' | 'Em atendimento' | 'Offline' | 'Indisponível' | 'Sem sinal';

// ===== NOVOS TIPOS: Solicitação via WhatsApp =====

export type MotivoSolicitacao =
  | 'Pane elétrica'
  | 'Pane mecânica'
  | 'Pneu furado'
  | 'Bateria descarregada'
  | 'Colisão'
  | 'Remoção simples'
  | 'Veículo sem partida'
  | 'Veículo travado'
  | 'Outro';

export type StatusSolicitacao =
  | 'Recebida'
  | 'Em cotação'
  | 'Aguardando aceite'
  | 'Convertida em OS'
  | 'Despachada'
  | 'Em atendimento'
  | 'Finalizada'
  | 'Cancelada';

export type StatusProposta = 'Aguardando aceite' | 'Aceita' | 'Recusada' | 'Expirada';

export interface Solicitacao {
  id: string;
  protocolo: string;
  dataHora: string;
  canal: 'WhatsApp' | 'Telefone' | 'Web';
  // Dados do cliente
  clienteNome: string;
  clienteTelefone: string;
  clienteWhatsApp: string;
  // Veículo
  veiculoPlaca: string;
  veiculoModelo: string;
  // Localização
  origemEndereco: string;
  origemCoord?: { lat: number; lng: number };
  destinoEndereco: string;
  destinoCoord?: { lat: number; lng: number };
  // Problema
  motivo: MotivoSolicitacao;
  observacoes: string;
  fotos: string[];
  // Cotação
  distanciaEstimadaKm: number;
  valorEstimado: number;
  composicaoCusto: CotacaoItem[];
  // Status
  status: StatusSolicitacao;
  statusProposta: StatusProposta;
  propostaEnviadaEm?: string;
  propostaRespondidaEm?: string;
  // Vinculações
  atendimentoId?: string;
  despachoId?: string;
  // Link do cliente
  linkAcompanhamento: string;
  // Timeline
  timeline: { data: string; descricao: string; tipo: 'sistema' | 'cliente' | 'operador' }[];
}

export interface CotacaoItem {
  descricao: string;
  valor: number;
  tipo: 'base' | 'km' | 'adicional' | 'desconto';
}

// ===== NOVOS TIPOS: Despacho Automático =====

export type StatusDespacho = 'Aguardando' | 'Ofertas enviadas' | 'Aceito' | 'Sem prestador' | 'Expirado' | 'Cancelado';

export type MotivoRecusaOferta =
  | 'Muito longe'
  | 'Indisponível'
  | 'Valor insuficiente'
  | 'Sem equipamento adequado'
  | 'Fora da área'
  | 'Problema operacional'
  | 'Outro';

export type StatusOferta = 'Pendente' | 'Aceita' | 'Recusada' | 'Expirada' | 'Encerrada';

export interface OfertaPrestador {
  id: string;
  despachoId: string;
  prestadorId: string;
  rodada: number;
  status: StatusOferta;
  enviadaEm: string;
  respondidaEm?: string;
  motivoRecusa?: MotivoRecusaOferta;
  tempoLimiteMinutos: number;
  distanciaEstimadaKm: number;
  tempoEstimadoMinutos: number;
  valorServico: number;
  linkOferta: string;
}

export interface Despacho {
  id: string;
  solicitacaoId: string;
  atendimentoId?: string;
  rodadaAtual: number;
  status: StatusDespacho;
  criadoEm: string;
  atualizadoEm: string;
  ofertas: OfertaPrestador[];
  prestadorAceitoId?: string;
  tempoMedioAceiteMinutos?: number;
  observacoes: string;
}

// ===== NOVOS TIPOS: Portal do Prestador =====

export type StatusOsPrestador = 'Aceito' | 'A caminho' | 'Cheguei ao local' | 'Em remoção' | 'Concluído' | 'Cancelado';

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export const CHECKLIST_PADRAO: Omit<ChecklistItem, 'id'>[] = [
  { label: 'Veículo acessível', checked: false },
  { label: 'Roda travada', checked: false },
  { label: 'Veículo rebaixado', checked: false },
  { label: 'Documentos no local', checked: false },
  { label: 'Chave em mãos', checked: false },
  { label: 'Acompanhará remoção', checked: false },
  { label: 'Itens pessoais retirados', checked: false },
];

// ===== NOVOS TIPOS: Link de Acompanhamento do Cliente =====

export type StatusAcompanhamentoCliente =
  | 'Solicitação recebida'
  | 'Aguardando prestador'
  | 'Prestador confirmado'
  | 'Prestador a caminho'
  | 'Prestador chegou ao local'
  | 'Atendimento em andamento'
  | 'Atendimento concluído'
  | 'Atendimento cancelado';

// ===== TIPOS EXISTENTES (mantidos) =====

export interface PrestadorLocalizacao {
  lat: number;
  lng: number;
  ultimaAtualizacao: string;
  precisao: 'Alta' | 'Média' | 'Baixa';
  compartilhamentoAtivo: boolean;
  statusRastreamento: StatusRastreamento;
  velocidade?: number;
  direcao?: string;
}

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
  localizacao?: PrestadorLocalizacao;
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
  origemCoord?: { lat: number; lng: number };
  destinoCoord?: { lat: number; lng: number };
  // Novos campos de vinculação
  solicitacaoId?: string;
  despachoId?: string;
  statusPrestador?: StatusOsPrestador;
  checklist?: ChecklistItem[];
  fotosAnexos?: string[];
  horaChegada?: string;
  horaConclusao?: string;
  linkPrestador?: string;
  linkCliente?: string;
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
