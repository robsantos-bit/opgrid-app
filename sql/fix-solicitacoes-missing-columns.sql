-- ============================================================
-- Adicionar colunas faltantes à tabela solicitacoes
-- Executar no Supabase SQL Editor
-- ============================================================

-- Protocolo: identificador único legível (ex: OS-20250916-001)
ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS protocolo text;

-- Motivo: razão do serviço solicitado
ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS motivo text;

-- Valor estimado: valor calculado automaticamente
ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS valor_estimado numeric;

-- Gerar protocolo automaticamente para novos registros
CREATE OR REPLACE FUNCTION public.generate_protocolo()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.protocolo IS NULL THEN
    NEW.protocolo := 'OS-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('solicitacoes_protocolo_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Sequência para protocolo
CREATE SEQUENCE IF NOT EXISTS public.solicitacoes_protocolo_seq START 1;

-- Trigger para auto-gerar protocolo
DROP TRIGGER IF EXISTS trg_generate_protocolo ON public.solicitacoes;
CREATE TRIGGER trg_generate_protocolo
  BEFORE INSERT ON public.solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_protocolo();

-- Atualizar registros existentes sem protocolo
UPDATE public.solicitacoes
SET protocolo = 'OS-' || to_char(created_at, 'YYYYMMDD') || '-' || lpad(id::text, 4, '0')
WHERE protocolo IS NULL;
