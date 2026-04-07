-- Adicionar colunas de marca e modelo do veículo na tabela solicitacoes
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS marca_veiculo text;
ALTER TABLE public.solicitacoes ADD COLUMN IF NOT EXISTS modelo_veiculo text;

-- Adicionar coluna de endereço no prestadores (se não existir)
ALTER TABLE public.prestadores ADD COLUMN IF NOT EXISTS endereco text;
