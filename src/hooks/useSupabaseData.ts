import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUpdatePrestador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; [key: string]: any }) => {
      const cleanFields = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined)
      );

      console.log('[useUpdatePrestador] Updating prestador:', id, cleanFields);

      const updateWithPayload = (payload: Record<string, any>) =>
        supabase.from('prestadores').update(payload).eq('id', id).select();

      const unknownColumnRegex = /Could not find the '([^']+)' column of 'prestadores'/i;
      let payload = { ...cleanFields };
      let lastError: any = null;
      let lastStatus: number | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error, status } = await updateWithPayload(payload);
        lastStatus = status;

        if (!error) {
          console.log('[useUpdatePrestador] Response:', { data, error, status, payload });
          return data;
        }

        lastError = error;
        const unknownColumn = error.message?.match(unknownColumnRegex)?.[1];

        if (!unknownColumn || !(unknownColumn in payload)) {
          break;
        }

        const { [unknownColumn]: _removed, ...nextPayload } = payload;

        console.warn('[useUpdatePrestador] Removing unsupported column and retrying:', {
          unknownColumn,
          attempt: attempt + 1,
          nextPayload,
        });

        if (Object.keys(nextPayload).length === 0) {
          break;
        }

        payload = nextPayload;
      }

      console.log('[useUpdatePrestador] Response:', { data: null, error: lastError, status: lastStatus, payload });
      throw lastError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prestadores'] });
    },
  });
}

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
        supabase.from('prestadores').select('id, status, tipo'),
        supabase.from('solicitacoes').select('id, status'),
        supabase.from('atendimentos').select('id, status'),
      ]);

      const prestList = prestadores.data || [];
      const solList = solicitacoes.data || [];
      const atdList = atendimentos.data || [];

      const prestadoresAtivos = prestList.filter((p: any) => p.status === 'ativo' || p.status === 'Ativo').length;
      const prestadoresInativos = prestList.length - prestadoresAtivos;

      return {
        totalPrestadores: prestList.length,
        prestadoresAtivos,
        prestadoresInativos,
        prestGuincho: prestList.filter((p: any) => p.tipo === 'guincho').length,
        prestPlataforma: prestList.filter((p: any) => p.tipo === 'plataforma').length,
        prestApoio: prestList.filter((p: any) => p.tipo === 'apoio').length,

        totalSolicitacoes: solList.length,
        solPendentes: solList.filter((s: any) => s.status === 'pendente').length,
        solEmAndamento: solList.filter((s: any) => s.status === 'em_andamento').length,
        solConcluidas: solList.filter((s: any) => s.status === 'concluida').length,
        solCanceladas: solList.filter((s: any) => s.status === 'cancelada').length,

        totalAtendimentos: atdList.length,
        atendimentosEmAndamento: atdList.filter((a: any) => a.status === 'em_andamento' || a.status === 'Em andamento').length,
        atdFinalizados: atdList.filter((a: any) => a.status === 'finalizado' || a.status === 'Finalizado').length,
      };
    },
  });
}
