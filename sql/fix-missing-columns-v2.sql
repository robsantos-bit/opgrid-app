-- ============================================================
-- SQL CONSOLIDADO — Execute no Supabase SQL Editor
-- Corrige colunas faltantes que causam erro 42703
-- ============================================================

-- 1. solicitacoes: adicionar observacoes (usado pelo webhook)
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS observacoes text;

-- 2. atendimentos: adicionar protocolo (útil para referência rápida)
ALTER TABLE public.atendimentos ADD COLUMN IF NOT EXISTS protocolo text;

-- 3. Garantir que solicitacoes e prestadores tenham SELECT para anon
--    (necessário para JOINs via PostgREST mesmo com service_role em Edge Functions)

-- Verifica se já existe policy anon para solicitacoes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'solicitacoes'
      AND policyname = 'Anon can read solicitacoes'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can read solicitacoes" ON public.solicitacoes FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- Verifica se já existe policy anon para prestadores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prestadores'
      AND policyname = 'Anon can read prestadores'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can read prestadores" ON public.prestadores FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- Verifica se já existe policy anon para atendimentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'atendimentos'
      AND policyname = 'Anon can read atendimentos'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can read atendimentos" ON public.atendimentos FOR SELECT TO anon USING (true)';
  END IF;
END $$;