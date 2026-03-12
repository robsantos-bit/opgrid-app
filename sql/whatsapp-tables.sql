-- ============================================================
-- OpGrid — Tabelas para integração WhatsApp Cloud API (Meta)
-- Executar no Supabase SQL Editor do projeto externo
-- ============================================================

-- 1. Enum: estados da conversa
CREATE TYPE public.conversation_state AS ENUM (
  'novo_contato',
  'aguardando_nome',
  'aguardando_telefone',
  'aguardando_veiculo',
  'aguardando_origem',
  'aguardando_motivo',
  'aguardando_destino',
  'aguardando_observacoes',
  'resumo_pronto',
  'aguardando_aceite',
  'solicitado',
  'cancelado',
  'humano'
);

-- 2. Enum: direção da mensagem
CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');

-- 3. Enum: status da oferta de despacho
CREATE TYPE public.dispatch_offer_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'expired',
  'cancelled'
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE public.conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_contact_id text NOT NULL,                         -- WhatsApp ID do contato (e.g. 5512992184913)
  contact_name  text,
  contact_phone text NOT NULL,
  state         conversation_state NOT NULL DEFAULT 'novo_contato',

  -- Dados coletados durante a conversa
  data          jsonb NOT NULL DEFAULT '{}'::jsonb,
  /*  Exemplo de data:
      {
        "nome": "João",
        "telefone": "12992184913",
        "placa": "ABC1D23",
        "modelo": "Fiat Uno",
        "origem": "Rua X, 100",
        "motivo": "Pane mecânica",
        "destino": "Oficina Y",
        "observacoes": ""
      }
  */

  -- Janela de 24h do WhatsApp
  window_opened_at  timestamptz,
  window_expires_at timestamptz,

  -- Vinculações
  solicitacao_id uuid REFERENCES public.solicitacoes(id),
  atendimento_id uuid REFERENCES public.atendimentos(id),

  -- Operador que assumiu (handoff humano)
  assigned_operator_id uuid REFERENCES auth.users(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_conversations_wa_contact ON public.conversations(wa_contact_id);
CREATE INDEX idx_conversations_state ON public.conversations(state);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read conversations"
  ON public.conversations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert conversations"
  ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update conversations"
  ON public.conversations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Service role (Edge Functions) — acesso total via service_role key

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction           message_direction NOT NULL,
  wa_message_id       text UNIQUE,                     -- wamid.xxx para deduplicação
  message_type        text NOT NULL DEFAULT 'text',    -- text, interactive, template, image, etc.
  content             text,                            -- corpo da mensagem
  metadata            jsonb DEFAULT '{}'::jsonb,       -- payload completo, botões, etc.
  status              text DEFAULT 'sent',             -- sent, delivered, read, failed
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_wa_id ON public.messages(wa_message_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read messages"
  ON public.messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update messages"
  ON public.messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- DISPATCH_OFFERS
-- ============================================================
CREATE TABLE public.dispatch_offers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id    uuid NOT NULL REFERENCES public.solicitacoes(id),
  atendimento_id    uuid REFERENCES public.atendimentos(id),
  prestador_id      uuid NOT NULL REFERENCES public.prestadores(id),
  round             int NOT NULL DEFAULT 1,
  status            dispatch_offer_status NOT NULL DEFAULT 'pending',

  -- Dados da oferta
  estimated_distance_km numeric(10,2),
  estimated_time_min    int,
  service_value         numeric(12,2),
  offer_link            text,                          -- link público /prestador/oferta/:id

  -- Timestamps
  sent_at           timestamptz NOT NULL DEFAULT now(),
  responded_at      timestamptz,
  expires_at        timestamptz,
  rejection_reason  text,

  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispatch_offers_solicitacao ON public.dispatch_offers(solicitacao_id);
CREATE INDEX idx_dispatch_offers_prestador ON public.dispatch_offers(prestador_id);
CREATE INDEX idx_dispatch_offers_status ON public.dispatch_offers(status);

ALTER TABLE public.dispatch_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dispatch_offers"
  ON public.dispatch_offers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert dispatch_offers"
  ON public.dispatch_offers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update dispatch_offers"
  ON public.dispatch_offers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Prestador pode ver/aceitar sua própria oferta via link público (anon)
CREATE POLICY "Anon can read own offer by id"
  ON public.dispatch_offers FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can update own offer"
  ON public.dispatch_offers FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGER: updated_at automático em conversations
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
