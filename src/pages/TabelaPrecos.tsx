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
import { Save, AlertTriangle, Copy, TableProperties } from 'lucide-react';

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
    toast.success('Valores importados! Ajuste conforme necessário e salve.');
  };

  const updateItem = (tarifaId: string, field: string, value: string | number | boolean) => {
    setItems(prev => ({ ...prev, [tarifaId]: { ...prev[tarifaId], [field]: value } }));
  };

  const handleSave = () => {
    if (!selectedPrestador) return;
    const tabelaItems: TabelaPrecoItem[] = tarifas.map(t => ({
      id: `tp${Date.now()}_${t.id}`, prestadorId: selectedPrestador, tarifaId: t.id,
      valor: items[t.id]?.valor || 0, franquia: items[t.id]?.franquia || 0,
      valorExcedente: items[t.id]?.valorExcedente || 0, minimo: items[t.id]?.minimo || 0,
      observacao: items[t.id]?.observacao || '', ativo: items[t.id]?.ativo ?? true,
    }));
    saveTabelaPrecoPrestador(selectedPrestador, tabelaItems);
    toast.success('Tabela de preços salva com sucesso!');
  };

  const prestador = prestadores.find(p => p.id === selectedPrestador);
  const withoutValue = selectedPrestador ? tarifas.filter(t => !items[t.id]?.valor).length : 0;
  const configuredCount = selectedPrestador ? tarifas.filter(t => items[t.id]?.valor > 0).length : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Tabelas Comerciais</h1>
          <p>Parametrize valores por prestador — padronize custos e garanta cobertura tarifária completa</p>
        </div>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5 flex-1 min-w-[250px]">
            <Label className="text-xs font-medium">Prestador</Label>
            <Select value={selectedPrestador} onValueChange={loadPrestador}>
              <SelectTrigger><SelectValue placeholder="Escolha um prestador para configurar..." /></SelectTrigger>
              <SelectContent>{prestadores.map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia} — {p.cidade}/{p.uf}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {selectedPrestador && (
            <>
              <div className="space-y-1.5 min-w-[180px]">
                <Label className="text-xs font-medium">Importar valores de</Label>
                <div className="flex gap-1.5">
                  <Select value={cloneSource} onValueChange={setCloneSource}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Outro prestador..." /></SelectTrigger>
                    <SelectContent>{prestadores.filter(p => p.id !== selectedPrestador).map(p => <SelectItem key={p.id} value={p.id}>{p.nomeFantasia}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={handleClone} disabled={!cloneSource}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-1.5" />Salvar Tabela</Button>
            </>
          )}
        </div>
      </CardContent></Card>

      {selectedPrestador && withoutValue > 0 && (
        <div className="alert-banner alert-banner-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{withoutValue} tarifa(s) sem valor definido — configure para garantir cobertura tarifária completa</span>
        </div>
      )}

      {selectedPrestador && (
        <Card>
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-[14px] font-bold">{prestador?.nomeFantasia}</CardTitle>
                <Badge variant="outline" className="font-semibold">{prestador?.plano}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Badge variant="success" className="font-semibold">{configuredCount} configuradas</Badge>
                {withoutValue > 0 && <Badge variant="warning" className="font-semibold">{withoutValue} pendentes</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider min-w-[160px] font-semibold">Tarifa</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider min-w-[70px] font-semibold">Cat.</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider min-w-[100px] font-semibold">Valor (R$)</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider min-w-[90px] font-semibold">Franquia</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider min-w-[100px] font-semibold">Excedente</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider min-w-[100px] font-semibold">Mínimo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider min-w-[140px] font-semibold">Observação</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {tarifas.map(t => {
                    const hasValue = items[t.id]?.valor > 0;
                    return (
                      <TableRow key={t.id} className={`table-row-hover ${!hasValue ? 'bg-warning/[0.03]' : ''}`}>
                        <TableCell className="font-semibold text-[13px]">{t.nome}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-semibold">{t.categoria}</Badge></TableCell>
                        <TableCell><Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums" value={items[t.id]?.valor || ''} onChange={e => updateItem(t.id, 'valor', parseFloat(e.target.value) || 0)} /></TableCell>
                        <TableCell><Input type="number" step="1" min="0" className="w-20 h-8 text-xs tabular-nums" value={items[t.id]?.franquia || ''} onChange={e => updateItem(t.id, 'franquia', parseFloat(e.target.value) || 0)} /></TableCell>
                        <TableCell><Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums" value={items[t.id]?.valorExcedente || ''} onChange={e => updateItem(t.id, 'valorExcedente', parseFloat(e.target.value) || 0)} /></TableCell>
                        <TableCell><Input type="number" step="0.01" min="0" className="w-24 h-8 text-xs tabular-nums" value={items[t.id]?.minimo || ''} onChange={e => updateItem(t.id, 'minimo', parseFloat(e.target.value) || 0)} /></TableCell>
                        <TableCell><Input className="w-32 h-8 text-xs" value={items[t.id]?.observacao || ''} onChange={e => updateItem(t.id, 'observacao', e.target.value)} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedPrestador && (
        <Card><CardContent className="py-16">
          <div className="empty-state">
            <div className="empty-state-icon"><TableProperties className="h-6 w-6 text-muted-foreground" /></div>
            <p className="empty-state-title">Selecione um prestador</p>
            <p className="empty-state-description">Escolha um prestador ativo para configurar sua tabela de preços e garantir cobertura tarifária completa</p>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
