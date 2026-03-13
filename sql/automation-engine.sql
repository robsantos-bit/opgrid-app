-- ============================================================
-- OpGrid — Motor de Automação de Mensagens
-- Executar no Supabase SQL Editor do projeto externo
-- ============================================================

-- 1. ENUMS
CREATE TYPE public.automation_channel AS ENUM ('whatsapp', 'email', 'sms', 'push', 'internal');
CREATE TYPE public.automation_audience AS ENUM ('cliente', 'prestador', 'interno');
CREATE TYPE public.queue_status AS ENUM ('pending', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');

-- ============================================================
-- MESSAGE_TEMPLATES
-- ============================================================
CREATE TABLE public.message_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text UNIQUE NOT NULL,
  name            text NOT NULL,
  channel         automation_channel NOT NULL DEFAULT 'whatsapp',
  audience        automation_audience NOT NULL DEFAULT 'cliente',
  trigger_event   text NOT NULL,
  content         text NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_templates_key ON public.message_templates(key);
CREATE INDEX idx_message_templates_trigger ON public.message_templates(trigger_event);
CREATE INDEX idx_message_templates_active ON public.message_templates(is_active);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_message_templates" ON public.message_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_message_templates" ON public.message_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_message_templates" ON public.message_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_message_templates" ON public.message_templates FOR DELETE TO authenticated USING (true);, 

CREATE TRIGGER trg_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- AUTOMATIONS
-- ============================================================
CREATE TABLE public.automations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  trigger_event   text NOT NULL,
  channel         automation_channel NOT NULL DEFAULT 'whatsapp',
  template_key    text REFERENCES public.message_templates(key),
  is_active       boolean NOT NULL DEFAULT true,
  delay_seconds   int NOT NULL DEFAULT 0,
  executions      int NOT NULL DEFAULT 0,
  last_executed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automations_trigger ON public.automations(trigger_event);
CREATE INDEX idx_automations_active ON public.automations(is_active);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_automations" ON public.automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_automations" ON public.automations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_automations" ON public.automations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_automations" ON public.automations FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- MESSAGE_QUEUE
-- ============================================================
CREATE TABLE public.message_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id),
  automation_id   uuid REFERENCES public.automations(id),
  recipient_phone text,
  channel         automation_channel NOT NULL DEFAULT 'whatsapp',
  template_key    text REFERENCES public.message_templates(key),
  payload_json    jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          queue_status NOT NULL DEFAULT 'pending',
  scheduled_at    timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_queue_status ON public.message_queue(status);
CREATE INDEX idx_message_queue_scheduled ON public.message_queue(scheduled_at);
CREATE INDEX idx_message_queue_conversation ON public.message_queue(conversation_id);

ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_message_queue" ON public.message_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_message_queue" ON public.message_queue FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_message_queue" ON public.message_queue FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- MESSAGE_SEND_LOGS
-- ============================================================
CREATE TABLE public.message_send_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id            uuid REFERENCES public.message_queue(id),
  conversation_id     uuid REFERENCES public.conversations(id),
  provider_message_id text,
  direction           message_direction NOT NULL DEFAULT 'outbound',
  status              text NOT NULL DEFAULT 'pending',
  response_json       jsonb DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_send_logs_queue ON public.message_send_logs(queue_id);
CREATE INDEX idx_message_send_logs_conversation ON public.message_send_logs(conversation_id);
CREATE INDEX idx_message_send_logs_status ON public.message_send_logs(status);

ALTER TABLE public.message_send_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_message_send_logs" ON public.message_send_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_message_send_logs" ON public.message_send_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- SEED: Templates iniciais
-- ============================================================
INSERT INTO public.message_templates (key, name, channel, audience, trigger_event, content) VALUES
  ('welcome_client', 'Boas-vindas do cliente', 'whatsapp', 'cliente', 'novo_contato', 'Olá! 👋 Bem-vindo à OpGrid. Sou o assistente virtual e vou te ajudar a solicitar um guincho. Qual o seu nome completo?'),
  ('ask_name', 'Pedir nome', 'whatsapp', 'cliente', 'novo_contato', 'Para começarmos, qual o seu nome completo?'),
  ('ask_phone', 'Pedir telefone', 'whatsapp', 'cliente', 'nome_recebido', 'Obrigado, {{nome}}! Qual o melhor telefone para contato?'),
  ('ask_vehicle', 'Pedir veículo', 'whatsapp', 'cliente', 'telefone_recebido', 'Agora preciso dos dados do veículo. Qual a placa?'),
  ('ask_origin', 'Pedir origem', 'whatsapp', 'cliente', 'veiculo_recebido', 'Onde está o veículo agora? Envie o endereço completo ou localização.'),
  ('ask_reason', 'Pedir motivo', 'whatsapp', 'cliente', 'origem_recebida', 'Qual o motivo da solicitação? (Pane, colisão, remoção, etc.)'),
  ('ask_destination', 'Pedir destino', 'whatsapp', 'cliente', 'motivo_recebido', 'Para onde deseja levar o veículo?'),
  ('ask_notes', 'Pedir observações', 'whatsapp', 'cliente', 'destino_recebido', 'Alguma observação importante? (Ex: veículo rebaixado, garagem estreita, etc.) Se não houver, responda "não".'),
  ('quote_summary', 'Resumo com orçamento', 'whatsapp', 'cliente', 'quote_generated', '📋 *Resumo da sua solicitação:*\n\n👤 {{nome}}\n🚗 {{veiculo}}\n📍 De: {{origem}}\n📍 Para: {{destino}}\n💰 Valor estimado: R$ {{valor}}\n\nDeseja confirmar? Responda *SIM* ou *NÃO*.'),
  ('order_confirmed', 'OS confirmada', 'whatsapp', 'cliente', 'order_created', '✅ Sua solicitação foi confirmada!\n\nProtocolo: {{protocolo}}\nEstamos buscando o prestador mais próximo. Acompanhe pelo link:\n{{link_acompanhamento}}'),
  ('provider_assigned_client', 'Prestador confirmado', 'whatsapp', 'cliente', 'provider_assigned', '🚛 Boas notícias! O prestador *{{prestador}}* está a caminho.\n\nPrevisão: {{eta}} minutos\nTelefone: {{telefone_prestador}}\n\nAcompanhe: {{link_acompanhamento}}'),
  ('service_completed_client', 'Atendimento concluído', 'whatsapp', 'cliente', 'service_completed', '✅ Atendimento concluído!\n\nProtocolo: {{protocolo}}\nPrestador: {{prestador}}\n\nComo foi sua experiência? Avalie de 1 a 5.'),
  ('new_offer_provider', 'Nova oferta ao prestador', 'whatsapp', 'prestador', 'new_dispatch_offer', '🔔 *Nova solicitação disponível!*\n\n📍 {{origem}} → {{destino}}\n🚗 {{veiculo}}\n💰 Valor: R$ {{valor}}\n📏 Distância: {{distancia}}km\n\nAceitar? {{link_oferta}}'),
  ('order_assigned_provider', 'OS atribuída ao prestador', 'whatsapp', 'prestador', 'order_assigned', '✅ OS atribuída a você!\n\nProtocolo: {{protocolo}}\nCliente: {{cliente}}\nEndereço: {{endereco}}\nTelefone: {{telefone_cliente}}\n\nDetalhes: {{link_os}}'),
  ('checklist_pending_provider', 'Checklist pendente', 'whatsapp', 'prestador', 'checklist_pending', '⚠️ Checklist pendente para o atendimento {{protocolo}}.\n\nPreencha antes de iniciar: {{link_checklist}}');

-- ============================================================
-- SEED: Automações iniciais
-- ============================================================
INSERT INTO public.automations (name, trigger_event, channel, template_key, is_active, delay_seconds) VALUES
  ('Boas-vindas ao cliente', 'novo_contato', 'whatsapp', 'welcome_client', true, 0),
  ('Pedir telefone após nome', 'nome_recebido', 'whatsapp', 'ask_phone', true, 0),
  ('Pedir veículo após telefone', 'telefone_recebido', 'whatsapp', 'ask_vehicle', true, 0),
  ('Pedir origem após veículo', 'veiculo_recebido', 'whatsapp', 'ask_origin', true, 0),
  ('Pedir motivo após origem', 'origem_recebida', 'whatsapp', 'ask_reason', true, 0),
  ('Pedir destino após motivo', 'motivo_recebido', 'whatsapp', 'ask_destination', true, 0),
  ('Pedir observações após destino', 'destino_recebido', 'whatsapp', 'ask_notes', true, 0),
  ('Enviar orçamento', 'quote_generated', 'whatsapp', 'quote_summary', true, 0),
  ('Confirmar OS ao cliente', 'order_created', 'whatsapp', 'order_confirmed', true, 0),
  ('Notificar prestador atribuído', 'provider_assigned', 'whatsapp', 'provider_assigned_client', true, 0),
  ('Pesquisa satisfação', 'service_completed', 'whatsapp', 'service_completed_client', true, 30),
  ('Oferta para prestador', 'new_dispatch_offer', 'whatsapp', 'new_offer_provider', true, 0),
  ('OS atribuída ao prestador', 'order_assigned', 'whatsapp', 'order_assigned_provider', true, 0),
  ('Lembrete checklist', 'checklist_pending', 'whatsapp', 'checklist_pending_provider', true, 60);
