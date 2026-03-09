import { Prestador, Tarifa, TabelaPrecoItem, Atendimento, ConfigEmpresa, User } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', nome: 'Admin Demo', email: 'admin@demo.com', role: 'admin' },
  { id: 'u2', nome: 'Prestador Demo', email: 'prestador@demo.com', role: 'prestador', prestadorId: 'p1' },
];

export const mockPrestadores: Prestador[] = [
  { id: 'p1', nomeFantasia: 'Auto Socorro Veloz', razaoSocial: 'Veloz Transportes LTDA', documento: '12.345.678/0001-90', telefone: '(11) 99999-1234', email: 'contato@veloz.com', cidade: 'São Paulo', uf: 'SP', status: 'Ativo', plano: 'Pró', observacoes: 'Prestador desde 2020' },
  { id: 'p2', nomeFantasia: 'Reboque Express', razaoSocial: 'Express Guincho ME', documento: '98.765.432/0001-10', telefone: '(21) 98888-5678', email: 'contato@express.com', cidade: 'Rio de Janeiro', uf: 'RJ', status: 'Ativo', plano: 'Básico', observacoes: '' },
  { id: 'p3', nomeFantasia: 'Sul Guinchos', razaoSocial: 'Sul Guinchos EIRELI', documento: '11.222.333/0001-44', telefone: '(51) 97777-9012', email: 'contato@sulguinchos.com', cidade: 'Porto Alegre', uf: 'RS', status: 'Ativo', plano: 'Pró', observacoes: 'Especialista em pesados' },
  { id: 'p4', nomeFantasia: 'Central Reboque MG', razaoSocial: 'Central Reboque LTDA', documento: '44.555.666/0001-77', telefone: '(31) 96666-3456', email: 'contato@centralmg.com', cidade: 'Belo Horizonte', uf: 'MG', status: 'Inativo', plano: 'Básico', observacoes: 'Contrato encerrado' },
  { id: 'p5', nomeFantasia: 'Norte Assistência', razaoSocial: 'Norte Assist. Veicular SA', documento: '77.888.999/0001-55', telefone: '(92) 95555-7890', email: 'contato@norte.com', cidade: 'Manaus', uf: 'AM', status: 'Ativo', plano: 'Pró', observacoes: '' },
];

export const mockTarifas: Tarifa[] = [
  { id: 't1', nome: 'Saída', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't2', nome: 'Km Excedente', unidadeMedida: 'Quilometragem', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't3', nome: 'Hora Trabalhada', unidadeMedida: 'Hora', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't4', nome: 'Hora Parada', unidadeMedida: 'Hora', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't5', nome: 'Diária Base', unidadeMedida: 'Dia', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't6', nome: 'Pedágio', unidadeMedida: 'Unidade', formaCobranca: 'Valor final', situacao: 'Ativo', permiteRepetir: true, nivel: 'Sistema' },
  { id: 't7', nome: 'Desconto', unidadeMedida: 'Unidade', formaCobranca: 'Valor final', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't8', nome: 'Adicional', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: true, nivel: 'Sistema' },
  { id: 't9', nome: 'Adicional noturno', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't10', nome: 'Segunda saída', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't11', nome: 'Saída de base', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't12', nome: 'Km retorno', unidadeMedida: 'Quilometragem', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't13', nome: 'Km cidade', unidadeMedida: 'Quilometragem', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't14', nome: 'Km viagem', unidadeMedida: 'Quilometragem', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't15', nome: 'Km deslocamento', unidadeMedida: 'Quilometragem', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't16', nome: 'Resgate', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't17', nome: 'Patins', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't18', nome: 'Macaco jacaré', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't19', nome: 'Guindaste', unidadeMedida: 'Hora', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't20', nome: 'Munck', unidadeMedida: 'Hora', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: false, nivel: 'Sistema' },
  { id: 't21', nome: 'Equipamento especial', unidadeMedida: 'Unidade', formaCobranca: 'Valor unitário', situacao: 'Ativo', permiteRepetir: true, nivel: 'Sistema' },
  { id: 't22', nome: 'Ajuste', unidadeMedida: 'Unidade', formaCobranca: 'Valor final', situacao: 'Ativo', permiteRepetir: true, nivel: 'Usuário' },
];

export const mockTabelaPrecos: TabelaPrecoItem[] = [
  { id: 'tp1', prestadorId: 'p1', tarifaId: 't1', valor: 150, franquia: 0, minimo: 150, observacao: '' },
  { id: 'tp2', prestadorId: 'p1', tarifaId: 't2', valor: 4.50, franquia: 10, minimo: 0, observacao: 'Franquia de 10km' },
  { id: 'tp3', prestadorId: 'p1', tarifaId: 't3', valor: 80, franquia: 0, minimo: 80, observacao: '' },
  { id: 'tp4', prestadorId: 'p2', tarifaId: 't1', valor: 120, franquia: 0, minimo: 120, observacao: '' },
  { id: 'tp5', prestadorId: 'p2', tarifaId: 't2', valor: 3.80, franquia: 5, minimo: 0, observacao: '' },
];

export const mockAtendimentos: Atendimento[] = [
  {
    id: 'a1', protocolo: 'ATD-2026-0001', dataHora: '2026-03-01T08:30:00', prestadorId: 'p1',
    clienteNome: 'João Silva', origem: 'Av. Paulista, 1000', destino: 'Rua Augusta, 500',
    km: 15, horasTrabalhadas: 1.5, status: 'Concluído',
    tarifas: [
      { tarifaId: 't1', quantidade: 1, valorUnitario: 150, valorTotal: 150 },
      { tarifaId: 't2', quantidade: 5, valorUnitario: 4.50, valorTotal: 22.50 },
      { tarifaId: 't3', quantidade: 1.5, valorUnitario: 80, valorTotal: 120 },
    ],
    valorTotal: 292.50,
  },
  {
    id: 'a2', protocolo: 'ATD-2026-0002', dataHora: '2026-03-02T14:00:00', prestadorId: 'p1',
    clienteNome: 'Maria Santos', origem: 'Rua Oscar Freire, 200', destino: 'Marginal Pinheiros, km 15',
    km: 25, horasTrabalhadas: 2, status: 'Concluído',
    tarifas: [
      { tarifaId: 't1', quantidade: 1, valorUnitario: 150, valorTotal: 150 },
      { tarifaId: 't2', quantidade: 15, valorUnitario: 4.50, valorTotal: 67.50 },
    ],
    valorTotal: 217.50,
  },
  {
    id: 'a3', protocolo: 'ATD-2026-0003', dataHora: '2026-03-05T10:00:00', prestadorId: 'p2',
    clienteNome: 'Carlos Oliveira', origem: 'Copacabana', destino: 'Barra da Tijuca',
    km: 30, horasTrabalhadas: 2, status: 'Em andamento',
    tarifas: [
      { tarifaId: 't1', quantidade: 1, valorUnitario: 120, valorTotal: 120 },
      { tarifaId: 't2', quantidade: 25, valorUnitario: 3.80, valorTotal: 95 },
    ],
    valorTotal: 215,
  },
  {
    id: 'a4', protocolo: 'ATD-2026-0004', dataHora: '2026-03-08T16:30:00', prestadorId: 'p3',
    clienteNome: 'Ana Pereira', origem: 'Centro Histórico POA', destino: 'Zona Norte POA',
    km: 18, horasTrabalhadas: 1, status: 'Aberto',
    tarifas: [],
    valorTotal: 0,
  },
];

export const mockConfig: ConfigEmpresa = {
  nomeEmpresa: 'Gestor de Tarifas e Prestadores',
  cnpj: '00.000.000/0001-00',
  telefone: '(11) 3000-0000',
  email: 'contato@gestortarifas.com.br',
  endereco: 'Av. Principal, 1000 - São Paulo/SP',
};
