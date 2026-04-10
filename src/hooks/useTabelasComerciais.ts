import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTarifas } from '@/data/store';

export interface TabelaItem {
  id?: string;
  tarifaId: string;
  tarifaNome: string;
  categoria: string;
  valor: number;
  franquia: number;
  valorExcedente: number;
  minimo: number;
  observacao: string;
}

export interface TabelaComercial {
  id: string;
  nome: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: 'Vigente' | 'Expirada' | 'Rascunho' | 'Em revisão';
  prestadorVinculado: string;
  regioes: string[];
  prioridade: number;
  itens: TabelaItem[];
}

const buildDefaultItems = (): TabelaItem[] => {
  const tarifas = getTarifas().filter(t => t.situacao === 'Ativo');
  return tarifas.map(t => ({
    tarifaId: t.id,
    tarifaNome: t.nome,
    categoria: t.categoria,
    valor: 0,
    franquia: 0,
    valorExcedente: 0,
    minimo: 0,
    observacao: '',
  }));
};

export function useTabelasComerciais() {
  const [tabelas, setTabelas] = useState<TabelaComercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load all tabelas + itens from Supabase
  const fetchTabelas = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('tabelas_comerciais')
        .select('*')
        .order('prioridade', { ascending: false });

      if (error) throw error;

      if (!rows || rows.length === 0) {
        setTabelas([]);
        setLoading(false);
        return;
      }

      // Fetch all itens in one go
      const ids = rows.map((r: any) => r.id);
      const { data: allItens, error: itensErr } = await supabase
        .from('tabelas_comerciais_itens')
        .select('*')
        .in('tabela_id', ids);

      if (itensErr) console.error('Erro ao buscar itens:', itensErr);

      const tabelasList: TabelaComercial[] = rows.map((r: any) => {
        const itensDb = (allItens || []).filter((i: any) => i.tabela_id === r.id);
        // Build full items list: merge DB itens with default template
        const defaults = buildDefaultItems();
        const itens = defaults.map(d => {
          const found = itensDb.find((i: any) => i.tarifa_nome === d.tarifaNome);
          if (found) {
            return {
              id: found.id,
              tarifaId: d.tarifaId,
              tarifaNome: d.tarifaNome,
              categoria: found.categoria || d.categoria,
              valor: Number(found.valor) || 0,
              franquia: Number(found.franquia) || 0,
              valorExcedente: Number(found.valor_excedente) || 0,
              minimo: Number(found.minimo) || 0,
              observacao: found.observacao || '',
            };
          }
          return d;
        });

        return {
          id: r.id,
          nome: r.nome,
          vigenciaInicio: r.vigencia_inicio || '',
          vigenciaFim: r.vigencia_fim || '',
          status: r.status as TabelaComercial['status'],
          prestadorVinculado: r.prestador_vinculado || 'Todos',
          regioes: r.regioes || [],
          prioridade: r.prioridade || 0,
          itens,
        };
      });

      setTabelas(tabelasList);
    } catch (err: any) {
      console.error('Erro ao carregar tabelas:', err);
      toast.error('Erro ao carregar tabelas comerciais. Verifique se as tabelas existem no banco.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTabelas(); }, [fetchTabelas]);

  // Create new tabela
  const createTabela = useCallback(async (data: {
    nome: string;
    vigenciaInicio: string;
    vigenciaFim: string;
    prestadorVinculado: string;
    regioes: string[];
    prioridade: number;
  }) => {
    setSaving(true);
    try {
      const { data: row, error } = await supabase
        .from('tabelas_comerciais')
        .insert({
          nome: data.nome,
          vigencia_inicio: data.vigenciaInicio || null,
          vigencia_fim: data.vigenciaFim || null,
          status: 'Rascunho',
          prestador_vinculado: data.prestadorVinculado || 'Todos',
          regioes: data.regioes,
          prioridade: data.prioridade,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert default items
      const defaults = buildDefaultItems();
      const itensToInsert = defaults.map(d => ({
        tabela_id: row.id,
        tarifa_nome: d.tarifaNome,
        categoria: d.categoria,
        valor: 0,
        franquia: 0,
        valor_excedente: 0,
        minimo: 0,
        observacao: '',
      }));

      await supabase.from('tabelas_comerciais_itens').insert(itensToInsert);

      toast.success('Tabela comercial criada!');
      await fetchTabelas();
      return row.id;
    } catch (err: any) {
      console.error('Erro ao criar tabela:', err);
      toast.error('Erro ao criar tabela: ' + (err.message || 'desconhecido'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchTabelas]);

  // Save tabela metadata + all items
  const saveTabela = useCallback(async (tabela: TabelaComercial) => {
    setSaving(true);
    try {
      // Update metadata
      const { error: metaErr } = await supabase
        .from('tabelas_comerciais')
        .update({
          nome: tabela.nome,
          vigencia_inicio: tabela.vigenciaInicio || null,
          vigencia_fim: tabela.vigenciaFim || null,
          status: tabela.status,
          prestador_vinculado: tabela.prestadorVinculado,
          regioes: tabela.regioes,
          prioridade: tabela.prioridade,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tabela.id);

      if (metaErr) throw metaErr;

      // Upsert all items (delete + re-insert for simplicity)
      await supabase.from('tabelas_comerciais_itens').delete().eq('tabela_id', tabela.id);

      const itensToInsert = tabela.itens.map(i => ({
        tabela_id: tabela.id,
        tarifa_nome: i.tarifaNome,
        categoria: i.categoria,
        valor: i.valor,
        franquia: i.franquia,
        valor_excedente: i.valorExcedente,
        minimo: i.minimo,
        observacao: i.observacao,
      }));

      const { error: itensErr } = await supabase
        .from('tabelas_comerciais_itens')
        .insert(itensToInsert);

      if (itensErr) throw itensErr;

      toast.success('Tabela salva com sucesso!');
      await fetchTabelas();
    } catch (err: any) {
      console.error('Erro ao salvar tabela:', err);
      toast.error('Erro ao salvar: ' + (err.message || 'desconhecido'));
    } finally {
      setSaving(false);
    }
  }, [fetchTabelas]);

  // Clone items from one tabela to another (local only, save separately)
  const cloneItens = useCallback((sourceId: string, targetId: string) => {
    setTabelas(prev => {
      const source = prev.find(t => t.id === sourceId);
      if (!source) return prev;
      return prev.map(t => t.id === targetId ? { ...t, itens: source.itens.map(i => ({ ...i })) } : t);
    });
    const source = tabelas.find(t => t.id === sourceId);
    if (source) toast.success(`Valores importados de "${source.nome}". Clique em Salvar.`);
  }, [tabelas]);

  // Update local item field (no DB save until explicit save)
  const updateItemLocal = useCallback((tabelaId: string, tarifaId: string, field: keyof TabelaItem, value: string | number) => {
    setTabelas(prev => prev.map(tab => {
      if (tab.id !== tabelaId) return tab;
      return {
        ...tab,
        itens: tab.itens.map(item =>
          item.tarifaId === tarifaId ? { ...item, [field]: value } : item
        ),
      };
    }));
  }, []);

  return {
    tabelas,
    loading,
    saving,
    fetchTabelas,
    createTabela,
    saveTabela,
    cloneItens,
    updateItemLocal,
    setTabelas,
  };
}
