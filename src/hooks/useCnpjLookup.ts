import { useState, useCallback } from 'react';

interface CnpjResult {
  razao_social: string;
  nome_fantasia: string;
  telefone: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

export function useCnpjLookup() {
  const [loading, setLoading] = useState(false);

  const lookupCnpj = useCallback(async (doc: string): Promise<CnpjResult | null> => {
    const clean = doc.replace(/\D/g, '');
    if (clean.length !== 14) return null;

    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        razao_social: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || '',
        telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}` : '',
        email: data.email || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep ? data.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
      };
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupCnpj, loading };
}
