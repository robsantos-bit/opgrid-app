-- Tabela de pré-cadastro de prestadores (leads)
CREATE TYPE public.status_lead AS ENUM (
  'novo',
  'em_analise',
  'pendente_documentos',
  'aprovado',
  'reprovado',
  'convertido_em_prestador'
);

CREATE TABLE public.prestador_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  documento TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  telefone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cobertura_texto TEXT NOT NULL,
  tipo_principal TEXT NOT NULL,
  servicos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  tipos_veiculo_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  atendimento_24h BOOLEAN DEFAULT false,
  possui_plataforma BOOLEAN DEFAULT false,
  possui_patins BOOLEAN DEFAULT false,
  possui_patio BOOLEAN DEFAULT false,
  possui_rastreador BOOLEAN DEFAULT false,
  atende_rodovia BOOLEAN DEFAULT false,
  atende_noturno BOOLEAN DEFAULT false,
  qtd_veiculos TEXT,
  observacoes TEXT,
  status_lead status_lead NOT NULL DEFAULT 'novo',
  origem TEXT DEFAULT 'site',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.prestador_leads ENABLE ROW LEVEL SECURITY;

-- Política para inserção pública (qualquer visitante pode enviar pré-cadastro)
CREATE POLICY "Qualquer um pode inserir lead"
  ON public.prestador_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para leitura interna (apenas autenticados)
CREATE POLICY "Autenticados podem ler leads"
  ON public.prestador_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para atualização interna (apenas autenticados)
CREATE POLICY "Autenticados podem atualizar leads"
  ON public.prestador_leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
