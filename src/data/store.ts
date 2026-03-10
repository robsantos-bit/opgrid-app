import { Prestador, Tarifa, TabelaPrecoItem, Atendimento, ConfigEmpresa, Contrato, AuditLog, Solicitacao, Despacho, User } from '@/types';
import { mockPrestadores, mockTarifas, mockTabelaPrecos, mockAtendimentos, mockConfig, mockContratos, mockAuditLogs, mockSolicitacoes, mockDespachos, mockUsers } from './mockData';

const KEYS = {
  prestadores: 'rc_prestadores',
  tarifas: 'rc_tarifas',
  tabelaPrecos: 'rc_tabela_precos',
  atendimentos: 'rc_atendimentos',
  config: 'rc_config',
  contratos: 'rc_contratos',
  auditLogs: 'rc_audit_logs',
  solicitacoes: 'rc_solicitacoes',
  despachos: 'rc_despachos',
  users: 'rc_users',
};

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}

function save<T>(key: string, data: T) { localStorage.setItem(key, JSON.stringify(data)); }

// Prestadores
export function getPrestadores(): Prestador[] { return load(KEYS.prestadores, mockPrestadores); }
export function savePrestadores(data: Prestador[]) { save(KEYS.prestadores, data); }
export function addPrestador(p: Prestador) { const all = getPrestadores(); all.push(p); savePrestadores(all); }
export function updatePrestador(p: Prestador) { savePrestadores(getPrestadores().map(x => x.id === p.id ? p : x)); }
export function deletePrestador(id: string) { savePrestadores(getPrestadores().filter(x => x.id !== id)); }

// Tarifas
export function getTarifas(): Tarifa[] { return load(KEYS.tarifas, mockTarifas); }
export function saveTarifas(data: Tarifa[]) { save(KEYS.tarifas, data); }
export function addTarifa(t: Tarifa) { const all = getTarifas(); all.push(t); saveTarifas(all); }
export function updateTarifa(t: Tarifa) { saveTarifas(getTarifas().map(x => x.id === t.id ? t : x)); }
export function deleteTarifa(id: string) { saveTarifas(getTarifas().filter(x => x.id !== id)); }

// Tabela de Preços
export function getTabelaPrecos(): TabelaPrecoItem[] { return load(KEYS.tabelaPrecos, mockTabelaPrecos); }
export function saveTabelaPrecos(data: TabelaPrecoItem[]) { save(KEYS.tabelaPrecos, data); }
export function getTabelaPrecoPrestador(prestadorId: string): TabelaPrecoItem[] { return getTabelaPrecos().filter(x => x.prestadorId === prestadorId); }
export function saveTabelaPrecoPrestador(prestadorId: string, items: TabelaPrecoItem[]) {
  const others = getTabelaPrecos().filter(x => x.prestadorId !== prestadorId);
  saveTabelaPrecos([...others, ...items]);
}

// Atendimentos
export function getAtendimentos(): Atendimento[] { return load(KEYS.atendimentos, mockAtendimentos); }
export function saveAtendimentos(data: Atendimento[]) { save(KEYS.atendimentos, data); }
export function addAtendimento(a: Atendimento) { const all = getAtendimentos(); all.push(a); saveAtendimentos(all); }
export function updateAtendimento(a: Atendimento) { saveAtendimentos(getAtendimentos().map(x => x.id === a.id ? a : x)); }
export function deleteAtendimento(id: string) { saveAtendimentos(getAtendimentos().filter(x => x.id !== id)); }

// Contratos
export function getContratos(): Contrato[] { return load(KEYS.contratos, mockContratos); }
export function saveContratos(data: Contrato[]) { save(KEYS.contratos, data); }
export function addContrato(c: Contrato) { const all = getContratos(); all.push(c); saveContratos(all); }
export function updateContrato(c: Contrato) { saveContratos(getContratos().map(x => x.id === c.id ? c : x)); }

// Solicitações
export function getSolicitacoes(): Solicitacao[] { return load(KEYS.solicitacoes, mockSolicitacoes); }
export function saveSolicitacoes(data: Solicitacao[]) { save(KEYS.solicitacoes, data); }
export function addSolicitacao(s: Solicitacao) { const all = getSolicitacoes(); all.push(s); saveSolicitacoes(all); }
export function updateSolicitacao(s: Solicitacao) { saveSolicitacoes(getSolicitacoes().map(x => x.id === s.id ? s : x)); }

// Despachos
export function getDespachos(): Despacho[] { return load(KEYS.despachos, mockDespachos); }
export function saveDespachos(data: Despacho[]) { save(KEYS.despachos, data); }
export function addDespacho(d: Despacho) { const all = getDespachos(); all.push(d); saveDespachos(all); }
export function updateDespacho(d: Despacho) { saveDespachos(getDespachos().map(x => x.id === d.id ? d : x)); }

// Audit Logs
export function getAuditLogs(): AuditLog[] { return load(KEYS.auditLogs, mockAuditLogs); }
export function addAuditLog(log: AuditLog) { const all = getAuditLogs(); all.unshift(log); save(KEYS.auditLogs, all); }

// Config
export function getConfig(): ConfigEmpresa { return load(KEYS.config, mockConfig); }
export function saveConfig(data: ConfigEmpresa) { save(KEYS.config, data); }

// Users
export function getUsers(): User[] { return load(KEYS.users, mockUsers); }
export function saveUsers(data: User[]) { save(KEYS.users, data); }
export function updateUserInStore(u: User) { saveUsers(getUsers().map(x => x.id === u.id ? u : x)); }

// Reset
export function resetAllData() { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); }
