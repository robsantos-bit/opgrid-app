-- Tabela para registrar notas fiscais emitidas
CREATE TABLE IF NOT EXISTS public.nfse_emitidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id uuid REFERENCES public.atendimentos(id) ON DELETE SET NULL,
  prestador_cnpj text NOT NULL,
  tomador_doc text NOT NULL,
  tomador_nome text NOT NULL,
  valor numeric(12,2) NOT NULL,
  aliquota_iss numeric(5,2) DEFAULT 5.00,
  codigo_servico text DEFAULT '14.01',
  discriminacao text,
  numero_rps bigint,
  numero_nfse text,
  protocolo text,
  status text DEFAULT 'processando', -- processando, emitida, cancelada, erro
  ambiente text DEFAULT 'homologacao',
  provedor text DEFAULT 'enotas', -- enotas, abrasf_taubate
  resposta_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.nfse_emitidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read nfse"
  ON public.nfse_emitidas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Service role can insert nfse"
  ON public.nfse_emitidas FOR INSERT
  TO service_role WITH CHECK (true);
