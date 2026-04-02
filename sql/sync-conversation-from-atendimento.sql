-- =====================================================
-- Trigger: Sincroniza conversation.state automaticamente
-- quando o status do atendimento muda.
--
-- Garante continuidade do fluxo WhatsApp:
--   aceito/em_andamento → conversation em_andamento
--   concluido/finalizado → conversation concluido
--   cancelado → conversation cancelado
-- =====================================================

-- 1. Garantir que os enum values existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'prestador_aceito' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'prestador_aceito';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'em_andamento' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'em_andamento';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'concluido' AND enumtypid = 'public.conversation_state'::regtype) THEN
    ALTER TYPE public.conversation_state ADD VALUE 'concluido';
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. Criar a função de sincronização
CREATE OR REPLACE FUNCTION public.sync_conversation_from_atendimento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conv_id uuid;
  _new_state text;
BEGIN
  -- Determina o novo estado da conversa baseado no status do atendimento
  CASE
    WHEN NEW.status IN ('aceito_prestador', 'accepted', 'em_andamento', 'in_progress', 'provider_accepted') THEN
      _new_state := 'em_andamento';
    WHEN NEW.status IN ('concluido', 'completed', 'finalizado', 'finished') THEN
      _new_state := 'concluido';
    WHEN NEW.status IN ('cancelado', 'canceled') THEN
      _new_state := 'cancelado';
    ELSE
      -- Status não mapeado, não faz nada
      RETURN NEW;
  END CASE;

  -- Busca a conversation vinculada via solicitacao_id do atendimento
  SELECT c.id INTO _conv_id
  FROM public.conversations c
  WHERE c.solicitacao_id = NEW.solicitacao_id
    AND c.state NOT IN ('cancelado', 'concluido')
  ORDER BY c.updated_at DESC
  LIMIT 1;

  -- Se não achou por solicitacao_id, tenta por atendimento_id
  IF _conv_id IS NULL THEN
    SELECT c.id INTO _conv_id
    FROM public.conversations c
    WHERE c.atendimento_id = NEW.id
      AND c.state NOT IN ('cancelado', 'concluido')
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

-- 3. Criar o trigger
DROP TRIGGER IF EXISTS trg_sync_conversation_from_atendimento ON public.atendimentos;
CREATE TRIGGER trg_sync_conversation_from_atendimento
  AFTER INSERT OR UPDATE OF status
  ON public.atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_conversation_from_atendimento();
