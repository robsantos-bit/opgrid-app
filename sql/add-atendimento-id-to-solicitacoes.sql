-- Add atendimento_id column to solicitacoes table
-- This column links a solicitacao to its resulting atendimento
ALTER TABLE public.solicitacoes
ADD COLUMN IF NOT EXISTS atendimento_id UUID REFERENCES public.atendimentos(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_solicitacoes_atendimento_id ON public.solicitacoes(atendimento_id);
