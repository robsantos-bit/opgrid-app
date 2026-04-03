-- ============================================================
-- OpGrid — Tabela de Configuração de Tarifas Dinâmicas
-- Executar no Supabase SQL Editor
-- ============================================================

-- Tabela de configuração de precificação
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor numeric NOT NULL,
  descricao text,
  unidade text DEFAULT 'BRL',
  ativo boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Política: leitura pública (Edge Functions + frontend)
CREATE POLICY "pricing_config_select" ON public.pricing_config
  FOR SELECT USING (true);

-- Política: apenas admins autenticados podem editar
CREATE POLICY "pricing_config_update" ON public.pricing_config
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pricing_config_insert" ON public.pricing_config
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
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

-- ============================================================
-- SEED: Valores padrão de precificação
-- ============================================================

INSERT INTO public.pricing_config (chave, valor, descricao, unidade) VALUES
  ('taxa_base',          120,   'Taxa base fixa por acionamento',                   'BRL'),
  ('custo_km',           4.50,  'Custo por quilômetro (aplicado sobre km total)',    'BRL/km'),
  ('fator_ida_volta',    2,     'Multiplicador de ida e volta do prestador',         'x'),
  ('fator_correcao_rodoviario', 1.3, 'Fator de correção Haversine → estrada real', 'x'),
  ('distancia_fallback_parcial', 20, 'Km padrão quando só origem OU destino tem GPS', 'km'),
  ('distancia_fallback_total',   15, 'Km padrão quando nenhuma coordenada disponível', 'km'),
  ('valor_minimo',       80,    'Valor mínimo do serviço',                          'BRL'),
  ('adicional_noturno',  0,     'Adicional para serviços noturnos (22h-6h)',        'BRL'),
  ('adicional_pesado',   0,     'Adicional para veículos pesados (caminhão/ônibus)','BRL')
ON CONFLICT (chave) DO NOTHING;
