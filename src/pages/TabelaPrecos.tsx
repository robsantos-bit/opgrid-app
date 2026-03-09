import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getPrestadores, getTarifas, getTabelaPrecoPrestador, saveTabelaPrecoPrestador } from '@/data/store';
import { TabelaPrecoItem } from '@/types';
import { Save, AlertTriangle, Copy } from 'lucide-react';

export default function TabelaPrecos() {
  const prestadores = useMemo(() => getPrestadores().filter(p => p.status === 'Ativo'), []);
  const tarifas = useMemo(() => getTarifas().filter(t => t.situacao === 'Ativo'), []);
  const [selectedPrestador, setSelectedPrestador] = useState('');
  const [cloneSource, setCloneSource] = useState('');
  const [items, setItems] = useState<Record<string, { valor: number; franquia: number; valorExcedente: number; minimo: number; observacao: string; ativo: boolean }>>({});

  const loadPrestador = (prestadorId: string) => {
    setSelectedPrestador(prestadorId);
    const existing = getTabelaPrecoPrestador(prestadorId);
    const map: typeof items = {};
    tarifas.forEach(t => {
      const found = existing.find(e => e.tarifaId === t.id);
      map[t.id] = found
        ? { valor: found.valor, franquia: found.franquia, valorExcedente: found.valorExcedente, minimo: found.minimo, observacao: found.observacao, ativo: found.ativo }
        : { valor: 0, franquia: 0, valorExcedente: 0, minimo: 0, observacao: '', ativo: true };
    });
    setItems(map);
  };

  const handleClone = () => {
    if (!cloneSource || !selectedPrestador) return;
    const source = getTabelaPrecoPrestador(cloneSource);
    const map: typeof items = {};
    tarifas.forEach(t => {
      const found = source.find(e => e.tarifaId === t.id);
      map[t.id] = found
        ? { valor: found.valor, franquia: found.franquia, valorExcedente: found.valorExcedente, minimo: found.minimo, observacao: found.observacao, ativo: found.ativo }
        : { valor: 0, franquia: 0, valorExcedente: 0, minimo: 0, observacao: '', ativo: true };
    });
    setItems(map);
    toast.success('Valores copiados! Ajuste e salve.');
  };

  const updateItem = (tarifaId: string, field: string, value: string | number | boolean) => {
    setItems(prev => ({ ...prev, [tarifaId]: { ...prev[tarifaId], [field]: value } }));
  };

  const handleSave = () => {
    if (!selectedPrestador) return;
    const tabelaItems: TabelaPrecoItem[] = tarifas.map(t => ({
      id: `tp${Date.now()}_${t.id}`,
      prestadorId: selectedPrestador,
      tarifaId: t.id,
      valor: items[t.id]?.valor || 0,
      franquia: items[t.id]?.franquia || 0,
      valorExcedente: items[t.id]?.valorExcedente || 0,
      minimo: items[t.id]?.minimo || 0,
      observacao: items[t.id]?.observacao || '',
      ativo: items[t.id]?.ativo ?? true,
    }));
    saveTabelaPrecoPrestador(selectedPrestador, tabelaItems);
    toast.success('Tabela de preços salva com sucesso!');
  };

  const prestador = prestadores.find(p => p.id === selectedPrestador);
  const withoutValue = selectedPrestador ? tarifas.filter(t => !items[t.id]?.valor || items[t.id].valor === 0).length : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tabelas de Preço</h1>
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
                    <SelectItem key={p.id} value={p.id}>{p.nomeFantasia} — {p.cidade}/{p.uf} ({p.plano})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPrestador && (
              <>
                <div className="space-y-1.5 min-w-[200px]">
                  <Label>Copiar de</Label>
                  <div className="flex gap-2">
                    <Select value={cloneSource} onValueChange={setCloneSource}>
                      <SelectTrigger className="w-[200px]"><SelectValue placeholder="Outro prestador..." /></SelectTrigger>
                      <SelectContent>
                        {prestadores.filter(p => p.id !== selectedPrestador).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={handleClone} disabled={!cloneSource}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Salvar Tabela</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPrestador && withoutValue > 0 && (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm bg-warning/5 border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span>{withoutValue} tarifa(s) sem valor definido</span>
        </div>
      )}

      {selectedPrestador && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Tarifas de {prestador?.nomeFantasia}
              <Badge variant="outline">{prestador?.plano}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Tarifa</TableHead>
                    <TableHead className="min-w-[80px]">Cat.</TableHead>
                    <TableHead className="min-w-[110px]">Valor (R$)</TableHead>
                    <TableHead className="min-w-[100px]">Franquia</TableHead>
                    <TableHead className="min-w-[110px]">Excedente</TableHead>
                    <TableHead className="min-w-[110px]">Mínimo (R$)</TableHead>
                    <TableHead className="min-w-[160px]">Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarifas.map(t => {
                    const hasValue = items[t.id]?.valor > 0;
                    return (
                      <TableRow key={t.id} className={`table-row-hover ${!hasValue ? 'bg-warning/5' : ''}`}>
                        <TableCell className="font-medium text-sm">{t.nome}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{t.categoria}</Badge></TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" min="0" className="w-24 h-8 text-sm"
                            value={items[t.id]?.valor || ''} onChange={e => updateItem(t.id, 'valor', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="1" min="0" className="w-20 h-8 text-sm"
                            value={items[t.id]?.franquia || ''} onChange={e => updateItem(t.id, 'franquia', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" min="0" className="w-24 h-8 text-sm"
                            value={items[t.id]?.valorExcedente || ''} onChange={e => updateItem(t.id, 'valorExcedente', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" min="0" className="w-24 h-8 text-sm"
                            value={items[t.id]?.minimo || ''} onChange={e => updateItem(t.id, 'minimo', parseFloat(e.target.value) || 0)} />
                        </TableCell>
                        <TableCell>
                          <Input className="w-36 h-8 text-sm" value={items[t.id]?.observacao || ''}
                            onChange={e => updateItem(t.id, 'observacao', e.target.value)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
