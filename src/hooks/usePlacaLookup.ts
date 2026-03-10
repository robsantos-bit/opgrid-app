import { useCallback } from 'react';

// Mock vehicle database for plate auto-fill simulation
const MOCK_VEHICLES: Record<string, { modelo: string; cor?: string }> = {
  'ABC1234': { modelo: 'Honda Civic 2022', cor: 'Prata' },
  'DEF5678': { modelo: 'Toyota Corolla 2023', cor: 'Branco' },
  'GHI9012': { modelo: 'Fiat Uno 2020', cor: 'Vermelho' },
  'JKL3456': { modelo: 'Volkswagen Gol 2021', cor: 'Preto' },
  'MNO7890': { modelo: 'Chevrolet Onix 2023', cor: 'Cinza' },
  'PQR1234': { modelo: 'Hyundai HB20 2022', cor: 'Azul' },
  'STU5678': { modelo: 'Renault Kwid 2021', cor: 'Branco' },
  'BRA2E19': { modelo: 'Fiat Argo 2024', cor: 'Prata' },
  'RIO3A45': { modelo: 'Jeep Compass 2023', cor: 'Preto' },
  'SAO1B23': { modelo: 'Nissan Kicks 2022', cor: 'Vermelho' },
};

export function usePlacaLookup() {
  const lookupPlaca = useCallback((placa: string): { modelo: string; cor?: string } | null => {
    const clean = placa.replace(/[-\s]/g, '').toUpperCase();
    if (clean.length < 7) return null;
    return MOCK_VEHICLES[clean] || null;
  }, []);

  return { lookupPlaca };
}
