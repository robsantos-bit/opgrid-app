import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlacaResult {
  marca: string;
  modelo: string;
  cor: string;
  ano?: string;
  anoModelo?: string;
  municipio?: string;
  uf?: string;
}

export function usePlacaLookup() {
  const [loading, setLoading] = useState(false);

  const lookupPlaca = useCallback(async (placa: string): Promise<PlacaResult | null> => {
    const clean = placa.replace(/[-\s]/g, '').toUpperCase();
    if (clean.length < 7) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-placa', {
        body: { placa: clean },
      });

      if (error) {
        console.error('lookup-placa error:', error);
        return null;
      }

      if (!data?.encontrado) return null;

      return {
        marca: data.marca || '',
        modelo: data.modelo || '',
        cor: data.cor || '',
        ano: data.ano || '',
        anoModelo: data.anoModelo || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
      };
    } catch (err) {
      console.error('Placa lookup failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupPlaca, loading };
}
