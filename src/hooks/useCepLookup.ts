import { useState, useCallback } from 'react';

interface CepResult {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
}

export function useCepLookup() {
  const [loading, setLoading] = useState(false);

  const lookupCep = useCallback(async (cep: string): Promise<CepResult | null> => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return null;

    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) return null;
      return data as CepResult;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupCep, loading };
}
