-- Add nota_satisfacao as a top-level column on conversations
-- so the dashboard can query it directly
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS nota_satisfacao smallint;

-- Backfill from data jsonb for any existing ratings
UPDATE public.conversations
SET nota_satisfacao = (data->>'nota_satisfacao')::smallint
WHERE data->>'nota_satisfacao' IS NOT NULL
  AND nota_satisfacao IS NULL;
