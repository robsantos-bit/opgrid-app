-- ============================================================
-- OpGrid — Tabela de Tarifas Dinâmicas (CORRIGIDA E AMPLIADA)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor numeric NOT NULL,
  porcentagem numeric DEFAULT 0,
  descricao text,
  unidade text DEFAULT 'BRL',
  ativo boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "pricing_config_select" ON public.pricing_config;
CREATE POLICY "pricing_config_select" ON public.pricing_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "pricing_config_update" ON public.pricing_config;
CREATE POLICY "pricing_config_update" ON public.pricing_config FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "pricing_config_insert" ON public.pricing_config;
CREATE POLICY "pricing_config_insert" ON public.pricing_config FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger para atualizar o timestamp
CREATE OR REPLACE FUNCTION public.update_pricing_config_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pricing_config_updated ON public.pricing_config;
CREATE TRIGGER trg_pricing_config_updated
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_pricing_config_timestamp();

-- SEED: Valores padrão com suporte a Eixos e Pedágio
INSERT INTO public.pricing_config (chave, valor, porcentagem, descricao, unidade) VALUES
  ('taxa_base', 180, 0, 'Taxa base fixa por acionamento', 'BRL'),
  ('custo_km_padrao', 4.50, 0, 'Custo por km para veículos leves', 'BRL/km'),
  ('custo_km_utilitario', 5.50, 0, 'Custo por km para caminhonete/suv', 'BRL/km'),
  ('custo_km_pesado', 7.00, 0, 'Custo por km para caminhão/ônibus', 'BRL/km'),
  ('fator_ida_volta', 2, 0, 'Multiplicador de ida e volta do prestador', 'x'),
  ('fator_correcao_rodoviario', 1.3, 0, 'Fator de correção Haversine → estrada real', 'x'),
  ('distancia_fallback_parcial', 20, 0, 'Km padrão quando só uma coordenada disponível', 'km'),
  ('distancia_fallback_total', 20, 0, 'Km padrão sem coordenadas', 'km'),
  ('valor_minimo', 180, 0, 'Valor mínimo do serviço', 'BRL'),
  ('adicional_noturno', 0, 0.40, 'Adicional para serviços noturnos (40%)', '%'),
  ('adicional_utilitario', 300, 0, 'Adicional para veículos utilitários', 'BRL'),
  ('adicional_pesado', 600, 0, 'Adicional para veículos pesados', 'BRL'),
  ('adicional_patins', 300, 0, 'Adicional para equipamento patins', 'BRL'),
  ('multiplicador_eixo_caminhao', 2, 0, 'Quantidade de eixos para cálculo de pedágio pesado', 'eixos'),
  ('repasse_pedagio_ativo', 1, 0, 'Ativa (1) ou desativa (0) o repasse de pedágio', 'bool')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  porcentagem = EXCLUDED.porcentagem,
  descricao = EXCLUDED.descricao,
  updated_at = now();
