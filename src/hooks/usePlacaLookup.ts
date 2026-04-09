import { useState, useCallback } from 'react';

// Expanded mock vehicle database for plate auto-fill simulation
const MOCK_VEHICLES: Record<string, { modelo: string; marca: string; cor: string }> = {
  'ABC1234': { marca: 'Honda', modelo: 'Civic 2022', cor: 'Prata' },
  'DEF5678': { marca: 'Toyota', modelo: 'Corolla 2023', cor: 'Branco' },
  'GHI9012': { marca: 'Fiat', modelo: 'Uno 2020', cor: 'Vermelho' },
  'JKL3456': { marca: 'Volkswagen', modelo: 'Gol 2021', cor: 'Preto' },
  'MNO7890': { marca: 'Chevrolet', modelo: 'Onix 2023', cor: 'Cinza' },
  'PQR1234': { marca: 'Hyundai', modelo: 'HB20 2022', cor: 'Azul' },
  'STU5678': { marca: 'Renault', modelo: 'Kwid 2021', cor: 'Branco' },
  'BRA2E19': { marca: 'Fiat', modelo: 'Argo 2024', cor: 'Prata' },
  'RIO3A45': { marca: 'Jeep', modelo: 'Compass 2023', cor: 'Preto' },
  'SAO1B23': { marca: 'Nissan', modelo: 'Kicks 2022', cor: 'Vermelho' },
  'ABC1D23': { marca: 'Chevrolet', modelo: 'Tracker 2024', cor: 'Branco' },
  'XYZ9876': { marca: 'Ford', modelo: 'Ka 2020', cor: 'Prata' },
  'QWE4567': { marca: 'Volkswagen', modelo: 'Polo 2023', cor: 'Cinza' },
  'ASD7890': { marca: 'Fiat', modelo: 'Mobi 2022', cor: 'Vermelho' },
  'ZXC3210': { marca: 'Hyundai', modelo: 'Creta 2024', cor: 'Preto' },
  'RTY6543': { marca: 'Toyota', modelo: 'Hilux 2023', cor: 'Branco' },
  'FGH1098': { marca: 'Chevrolet', modelo: 'S10 2022', cor: 'Prata' },
  'VBN4321': { marca: 'Fiat', modelo: 'Toro 2024', cor: 'Cinza' },
  'UIO7654': { marca: 'Volkswagen', modelo: 'T-Cross 2023', cor: 'Azul' },
  'PLK0987': { marca: 'Honda', modelo: 'HR-V 2024', cor: 'Branco' },
  'MNB6789': { marca: 'Jeep', modelo: 'Renegade 2023', cor: 'Preto' },
  'LKJ3456': { marca: 'Renault', modelo: 'Duster 2022', cor: 'Prata' },
  'OIU2345': { marca: 'Nissan', modelo: 'Versa 2023', cor: 'Branco' },
  'WER8901': { marca: 'Fiat', modelo: 'Strada 2024', cor: 'Vermelho' },
  'TYU5432': { marca: 'Chevrolet', modelo: 'Spin 2022', cor: 'Prata' },
};

export interface PlacaResult {
  modelo: string;
  marca: string;
  cor: string;
}

export function usePlacaLookup() {
  const [loading, setLoading] = useState(false);

  const lookupPlaca = useCallback((placa: string): PlacaResult | null => {
    const clean = placa.replace(/[-\s]/g, '').toUpperCase();
    if (clean.length < 7) return null;
    setLoading(true);
    // Simulate async delay for realism
    const result = MOCK_VEHICLES[clean] || null;
    setTimeout(() => setLoading(false), 300);
    return result;
  }, []);

  return { lookupPlaca, loading };
}
