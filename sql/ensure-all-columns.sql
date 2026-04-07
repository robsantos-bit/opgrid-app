-- Garantir que TODAS as colunas usadas pelo webhook existem nas tabelas
-- Execute este SQL no Dashboard do Supabase antes de redeployar as Edge Functions

-- solicitacoes: colunas de localização
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS origem_latitude double precision;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS origem_longitude double precision;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS destino_latitude double precision;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS destino_longitude double precision;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS distancia_estimada_km numeric;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS cliente_whatsapp text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS data_hora timestamptz;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS status_proposta text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS canal text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS prioridade text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS protocolo text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS motivo text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS valor_estimado numeric;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS valor numeric;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS marca_veiculo text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS modelo_veiculo text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS atendimento_id uuid REFERENCES public.atendimentos(id) ON DELETE SET NULL;

-- dispatch_offers: coluna offer_token (usada pelo dispatch-start)
ALTER TABLE public.dispatch_offers ADD COLUMN IF NOT EXISTS offer_token text;

-- atendimentos: garantir solicitacao_id
ALTER TABLE public.atendimentos ADD COLUMN IF NOT EXISTS solicitacao_id uuid REFERENCES public.solicitacoes(id);
ALTER TABLE public.atendimentos ADD COLUMN IF NOT EXISTS prestador_id uuid REFERENCES public.prestadores(id);
ALTER TABLE public.atendimentos ADD COLUMN IF NOT EXISTS notas text;

-- Garantir enum values para conversation_state
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'prestador_aceito' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'prestador_aceito';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'em_deslocamento' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'em_deslocamento';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'no_local' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'no_local';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'em_transito' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'em_transito';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'finalizado' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'finalizado';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'concluido' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'concluido';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'em_andamento' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'em_andamento';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;