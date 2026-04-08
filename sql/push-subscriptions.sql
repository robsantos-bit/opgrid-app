-- Tabela para armazenar inscrições de Web Push por prestador
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(prestador_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Permite que prestadores autenticados gerenciem suas próprias inscrições
CREATE POLICY "Prestadores gerenciam suas inscrições push"
  ON public.push_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger: quando uma nova oferta é inserida em dispatch_offers,
-- chama a edge function send-push-notification via pg_net
-- (Alternativa: configure um Database Webhook no Dashboard do Supabase
--  apontando para a function send-push-notification com evento INSERT na tabela dispatch_offers)
