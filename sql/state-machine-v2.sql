-- =====================================================
-- State Machine V2: Novos estados para ciclo completo
-- Executar no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar novos estados ao enum conversation_state
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

-- 2. Atualizar trigger de sincronização para os novos estados
CREATE OR REPLACE FUNCTION public.sync_conversation_from_atendimento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv_id uuid;
  _new_state text;
  _notify_msg text;
  _client_phone text;
BEGIN
  -- Mapeia status do atendimento para estado da conversa
  CASE
    WHEN NEW.status IN ('aceito_prestador', 'accepted', 'provider_accepted') THEN
      _new_state := 'prestador_aceito';
    WHEN NEW.status IN ('em_deslocamento', 'dispatched', 'en_route') THEN
      _new_state := 'em_deslocamento';
    WHEN NEW.status IN ('no_local', 'on_site', 'arrived') THEN
      _new_state := 'no_local';
    WHEN NEW.status IN ('em_transito', 'in_transit', 'transporting') THEN
      _new_state := 'em_transito';
    WHEN NEW.status IN ('finalizado', 'concluido', 'completed', 'finished') THEN
      _new_state := 'finalizado';
    WHEN NEW.status IN ('cancelado', 'canceled') THEN
      _new_state := 'cancelado';
    ELSE
      RETURN NEW;
  END CASE;

  -- Busca conversation vinculada
  SELECT c.id INTO _conv_id
  FROM public.conversations c
  WHERE c.solicitacao_id = NEW.solicitacao_id
    AND c.state NOT IN ('cancelado', 'finalizado', 'concluido')
  ORDER BY c.updated_at DESC
  LIMIT 1;

  IF _conv_id IS NULL THEN
    SELECT c.id INTO _conv_id
    FROM public.conversations c
    WHERE c.atendimento_id = NEW.id
      AND c.state NOT IN ('cancelado', 'finalizado', 'concluido')
    ORDER BY c.updated_at DESC
    LIMIT 1;
  END IF;

  IF _conv_id IS NOT NULL THEN
    UPDATE public.conversations
    SET state = _new_state::conversation_state,
        updated_at = NOW()
    WHERE id = _conv_id;
    
    RAISE LOG '[SYNC] Conversation % → %', _conv_id, _new_state;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Recriar trigger
DROP TRIGGER IF EXISTS trg_sync_conversation_from_atendimento ON public.atendimentos;
CREATE TRIGGER trg_sync_conversation_from_atendimento
  AFTER INSERT OR UPDATE OF status
  ON public.atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_conversation_from_atendimento();
