import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePrestadores() {
  return useQuery({
    queryKey: ['prestadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSolicitacoes() {
  return useQuery({
    queryKey: ['solicitacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAtendimentos() {
  return useQuery({
    queryKey: ['atendimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          prestadores ( id, nome, cnpj, telefone ),
          solicitacoes ( id, cliente_nome, cliente_telefone, placa )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAtendimentosByPrestador(prestadorId: string | null | undefined) {
  return useQuery({
    queryKey: ['atendimentos', 'prestador', prestadorId],
    enabled: !!prestadorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          solicitacoes ( id, cliente_nome, cliente_telefone, placa, origem_endereco, destino_endereco )
        `)
        .eq('prestador_id', prestadorId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles ( role )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePrestadorById(id: string | null | undefined) {
  return useQuery({
    queryKey: ['prestadores', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestadores')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [prestadores, solicitacoes, atendimentos] = await Promise.all([
        supabase.from('prestadores').select('id, status', { count: 'exact' }),
        supabase.from('solicitacoes').select('id, status', { count: 'exact' }),
        supabase.from('atendimentos').select('id, status', { count: 'exact' }),
      ]);

      const prestList = prestadores.data || [];
      const solList = solicitacoes.data || [];
      const atdList = atendimentos.data || [];

      return {
        totalPrestadores: prestList.length,
        totalSolicitacoes: solList.length,
        totalAtendimentos: atdList.length,
        atendimentosEmAndamento: atdList.filter((a: any) => a.status === 'em_andamento' || a.status === 'Em andamento').length,
        prestadoresAtivos: prestList.filter((p: any) => p.status === 'ativo' || p.status === 'Ativo').length,
      };
    },
  });
}
