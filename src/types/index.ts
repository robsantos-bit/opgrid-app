export type UserRole = 'admin' | 'prestador';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  prestadorId?: string;
}

export type PlanoType = 'Básico' | 'Pró';
export type StatusType = 'Ativo' | 'Inativo';
export type UnidadeMedida = 'Quilometragem' | 'Hora' | 'Unidade' | 'Dia';
export type FormaCobranca = 'Valor unitário' | 'Valor final' | 'Limite de valor';
export type NivelTarifa = 'Sistema' | 'Usuário';
export type StatusAtendimento = 'Aberto' | 'Em andamento' | 'Concluído' | 'Cancelado';

export interface Prestador {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  documento: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  status: StatusType;
  plano: PlanoType;
  observacoes: string;
}

export interface Tarifa {
  id: string;
  nome: string;
  unidadeMedida: UnidadeMedida;
  formaCobranca: FormaCobranca;
  situacao: StatusType;
  permiteRepetir: boolean;
  nivel: NivelTarifa;
}

export interface TabelaPrecoItem {
  id: string;
  prestadorId: string;
  tarifaId: string;
  valor: number;
  franquia: number;
  minimo: number;
  observacao: string;
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
  origem: string;
  destino: string;
  km: number;
  horasTrabalhadas: number;
  status: StatusAtendimento;
  tarifas: AtendimentoTarifa[];
  valorTotal: number;
}

export interface ConfigEmpresa {
  nomeEmpresa: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
}
