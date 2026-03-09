import { Prestador, Tarifa, TabelaPrecoItem, Atendimento, ConfigEmpresa } from '@/types';
import { mockPrestadores, mockTarifas, mockTabelaPrecos, mockAtendimentos, mockConfig } from './mockData';

const KEYS = {
  prestadores: 'gtp_prestadores',
  tarifas: 'gtp_tarifas',
  tabelaPrecos: 'gtp_tabela_precos',
  atendimentos: 'gtp_atendimentos',
  config: 'gtp_config',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Prestadores
export function getPrestadores(): Prestador[] { return load(KEYS.prestadores, mockPrestadores); }
export function savePrestadores(data: Prestador[]) { save(KEYS.prestadores, data); }
export function addPrestador(p: Prestador) { const all = getPrestadores(); all.push(p); savePrestadores(all); }
export function updatePrestador(p: Prestador) { const all = getPrestadores().map(x => x.id === p.id ? p : x); savePrestadores(all); }
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
export function getTabelaPrecoPrestador(prestadorId: string): TabelaPrecoItem[] {
  return getTabelaPrecos().filter(x => x.prestadorId === prestadorId);
}
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

// Config
export function getConfig(): ConfigEmpresa { return load(KEYS.config, mockConfig); }
export function saveConfig(data: ConfigEmpresa) { save(KEYS.config, data); }
