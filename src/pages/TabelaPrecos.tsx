import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getPrestadores, getTarifas, getTabelaPrecoPrestador, saveTabelaPrecoPrestador } from '@/data/store';
import { TabelaPrecoItem } from '@/types';
import { Save } from 'lucide-react';

export default function TabelaPrecos() {
  const prestadores = useMemo(() => getPrestadores().filter(p => p.status === 'Ativo'), []);
  const tarifas = useMemo(() => getTarifas().filter(t => t.situacao === 'Ativo'), []);
  const [selectedPrestador, setSelectedPrestador] = useState('');
  const [items, setItems] = useState<Record<string, { valor: number; franquia: number; minimo: number; observacao: string }>>({});

  const loadPrestador = (prestadorId: string) => {
    setSelectedPrestador(prestadorId);
    const existing = getTabelaPrecoPrestador(prestadorId);
    const map: typeof items = {};
    tarifas.forEach(t => {
      const found = existing.find(e => e.tarifaId === t.id);
      map[t.id] = found
        ? { valor: found.valor, franquia: found.franquia, minimo: found.minimo, observacao: found.observacao }
        : { valor: 0, franquia: 0, minimo: 0, observacao: '' };
    });
    setItems(map);
  };

  const updateItem = (tarifaId: string, field: string, value: string | number) => {
    setItems(prev => ({ ...prev, [tarifaId]: { ...prev[tarifaId], [field]: value } }));
  };

  const handleSave = () => {
    if (!selectedPrestador) return;
    const tabelaItems: TabelaPrecoItem[] = tarifas
      .filter(t => items[t.id] && items[t.id].valor > 0)
      .map(t => ({
        id: `tp${Date.now()}_${t.id}`,
        prestadorId: selectedPrestador,
        tarifaId: t.id,
        ...items[t.id],
      }));
    saveTabelaPrecoPrestador(selectedPrestador, tabelaItems);
    toast.success('Tabela de preços salva com sucesso!');
  };

  const prestador = prestadores.find(p => p.id === selectedPrestador);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tabela de Preços</h1>
        <p className="text-sm text-muted-foreground">Configure os valores de tarifa por prestador</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[250px]">
              <Label>Selecione o Prestador</Label>
              <Select value={selectedPrestador} onValueChange={loadPrestador}>
                <SelectTrigger><SelectValue placeholder="Escolha um prestador..." /></SelectTrigger>
                <SelectContent>
                  {prestadores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nomeFantasia} - {p.cidade}/{p.uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPrestador && (
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Salvar Tabela</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPrestador && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tarifas de {prestador?.nomeFantasia} ({prestador?.plano})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Tarifa</TableHead>
                    <TableHead className="min-w-[100px]">Unidade</TableHead>
                    <TableHead className="min-w-[120px]">Valor (R$)</TableHead>
                    <TableHead className="min-w-[120px]">Franquia</TableHead>
                    <TableHead className="min-w-[120px]">Mínimo (R$)</TableHead>
                    <TableHead className="min-w-[180px]">Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarifas.map(t => (
                    <TableRow key={t.id} className="table-row-hover">
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.unidadeMedida}</TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min="0" className="w-28"
                          value={items[t.id]?.valor || ''} onChange={e => updateItem(t.id, 'valor', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min="0" className="w-28"
                          value={items[t.id]?.franquia || ''} onChange={e => updateItem(t.id, 'franquia', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" min="0" className="w-28"
                          value={items[t.id]?.minimo || ''} onChange={e => updateItem(t.id, 'minimo', parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-44" value={items[t.id]?.observacao || ''}
                          onChange={e => updateItem(t.id, 'observacao', e.target.value)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
