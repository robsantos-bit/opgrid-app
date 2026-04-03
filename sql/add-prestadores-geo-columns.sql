-- ============================================================
-- OpGrid — Adicionar colunas de geolocalização e contato a prestadores
-- Executar no Supabase SQL Editor do projeto externo
-- ============================================================

-- 1. Colunas de localização para ranking por proximidade
ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS latitude  numeric(10,7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10,7);

-- 2. Colunas extras úteis para despacho e contato
ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS email            text,
  ADD COLUMN IF NOT EXISTS cidade           text,
  ADD COLUMN IF NOT EXISTS uf               text DEFAULT 'SP',
  ADD COLUMN IF NOT EXISTS area_cobertura   text,
  ADD COLUMN IF NOT EXISTS tipos_servico    text[] DEFAULT '{Guincho,Reboque}',
  ADD COLUMN IF NOT EXISTS aceita_noturno   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS disponibilidade_24h boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS score_operacional integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS homologacao      text DEFAULT 'Pendente',
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- 3. Índice para consultas geográficas
CREATE INDEX IF NOT EXISTS idx_prestadores_geo
  ON public.prestadores (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Índice de status para filtro de ativos
CREATE INDEX IF NOT EXISTS idx_prestadores_status
  ON public.prestadores (status);

-- ============================================================
-- SEED: Prestadores de teste próximos a Taubaté/São Paulo
-- ============================================================

INSERT INTO public.prestadores (nome, telefone, status, latitude, longitude, cidade, uf, area_cobertura, tipos_servico, aceita_noturno, disponibilidade_24h, score_operacional, homologacao)
VALUES
  ('Auto Socorro Veloz',   '5511999991234', 'Ativo', -23.5505, -46.6333, 'São Paulo',      'SP', 'Grande São Paulo',           '{Guincho,Reboque,Resgate}', true,  true,  92, 'Homologado'),
  ('Taubaté Guinchos',     '5512999998888', 'Ativo', -23.0259, -45.5557, 'Taubaté',         'SP', 'Vale do Paraíba',            '{Guincho,Reboque}',         true,  true,  85, 'Homologado'),
  ('SJC Reboque Express',  '5512999997777', 'Ativo', -23.1896, -45.8841, 'São José dos Campos', 'SP', 'Vale do Paraíba e Litoral', '{Guincho,Reboque,Resgate}', true,  true,  88, 'Homologado'),
  ('Guarulhos Assistência', '5511999996666', 'Ativo', -23.4538, -46.5333, 'Guarulhos',       'SP', 'Grande São Paulo',           '{Guincho,Reboque}',         false, true,  75, 'Pendente'),
  ('Campinas Socorro 24h', '5519999995555', 'Ativo', -22.9099, -47.0626, 'Campinas',        'SP', 'RMC e Interior',             '{Guincho,Reboque,Munck}',   true,  true,  90, 'Homologado')
ON CONFLICT DO NOTHING;