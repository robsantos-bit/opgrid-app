-- Tabela de tabelas comerciais (pricing tables por região)
CREATE TABLE IF NOT EXISTS public.tabelas_comerciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  vigencia_inicio date,
  vigencia_fim date,
  status text NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Vigente', 'Expirada', 'Rascunho', 'Em revisão')),
  prestador_vinculado text DEFAULT 'Todos',
  regioes text[] NOT NULL DEFAULT '{}',
  prioridade integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Itens de cada tabela comercial
CREATE TABLE IF NOT EXISTS public.tabelas_comerciais_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_id uuid NOT NULL REFERENCES public.tabelas_comerciais(id) ON DELETE CASCADE,
  tarifa_nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'Base',
  valor numeric(12,2) NOT NULL DEFAULT 0,
  franquia numeric(12,2) NOT NULL DEFAULT 0,
  valor_excedente numeric(12,2) NOT NULL DEFAULT 0,
  minimo numeric(12,2) NOT NULL DEFAULT 0,
  observacao text DEFAULT '',
  UNIQUE(tabela_id, tarifa_nome)
);

-- Índices para busca rápida por região + status
CREATE INDEX IF NOT EXISTS idx_tabelas_comerciais_status ON public.tabelas_comerciais(status);
CREATE INDEX IF NOT EXISTS idx_tabelas_comerciais_regioes ON public.tabelas_comerciais USING GIN(regioes);
CREATE INDEX IF NOT EXISTS idx_tabelas_comerciais_itens_tabela ON public.tabelas_comerciais_itens(tabela_id);

-- RLS: leitura pública para o motor de preços, escrita para admins
ALTER TABLE public.tabelas_comerciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabelas_comerciais_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública tabelas comerciais" ON public.tabelas_comerciais FOR SELECT USING (true);
CREATE POLICY "Leitura pública itens tabelas" ON public.tabelas_comerciais_itens FOR SELECT USING (true);
CREATE POLICY "Admin insere tabelas" ON public.tabelas_comerciais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin atualiza tabelas" ON public.tabelas_comerciais FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin insere itens" ON public.tabelas_comerciais_itens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin atualiza itens" ON public.tabelas_comerciais_itens FOR UPDATE TO authenticated USING (true);

-- Seed: Tabela Padrão Nacional
INSERT INTO public.tabelas_comerciais (nome, vigencia_inicio, vigencia_fim, status, regioes, prioridade) VALUES
  ('Tabela Padrão Nacional', '2025-01-01', '2025-12-31', 'Vigente', ARRAY['Nacional (Padrão)'], 0),
  ('Tabela Premium SP Capital', '2025-03-01', '2025-12-31', 'Vigente', ARRAY['São Paulo Capital', 'Grande São Paulo (ABCD)'], 10),
  ('Tabela Interior SP', '2025-01-01', '2025-12-31', 'Vigente', ARRAY['Interior SP - Campinas', 'Interior SP - Ribeirão Preto', 'Interior SP - Sorocaba', 'Interior SP - São José dos Campos'], 5),
  ('Tabela Emergencial Noturna', '2025-06-01', '2026-05-31', 'Vigente', ARRAY['São Paulo Capital'], 20);
