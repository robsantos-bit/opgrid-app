import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAtendimentos, getPrestadores } from '@/data/store';
import { CheckSquare, CheckCircle2, Clock, AlertTriangle, Plus, ClipboardList, Truck } from 'lucide-react';
import ChecklistExecucao from '@/components/ChecklistExecucao';

type ViewMode = 'lista' | 'execucao-coleta' | 'execucao-entrega';

export default function OperacaoChecklists() {
  const atendimentos = useMemo(() => getAtendimentos(), []);
  const prestadores = useMemo(() => getPrestadores(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [selectedProtocolo, setSelectedProtocolo] = useState('');
  const [selectedPlaca, setSelectedPlaca] = useState('');
  const [selectedPrestador, setSelectedPrestador] = useState('');

  const checklistsExecutados = useMemo(() =>
    atendimentos.filter(a => a.status === 'Concluído' || a.status === 'Faturado').map(a => ({
      id: a.id,
      protocolo: a.protocolo,
      prestador: prestadores.find(p => p.id === a.prestadorId)?.nomeFantasia || '—',
      tipo: a.tipoAtendimento,
      data: new Date(a.dataHora).toLocaleDateString('pt-BR'),
      itensTotal: Math.floor(Math.random() * 8) + 6,
      itensOk: Math.floor(Math.random() * 6) + 5,
      status: Math.random() > 0.3 ? 'Completo' as const : 'Incompleto' as const,
      tipoChecklist: Math.random() > 0.5 ? 'Coleta' as const : 'Entrega' as const,
    })),
  [atendimentos, prestadores]);

  const completos = checklistsExecutados.filter(c => c.status === 'Completo').length;
  const incompletos = checklistsExecutados.filter(c => c.status === 'Incompleto').length;

  const iniciarChecklist = (tipo: 'coleta' | 'entrega', protocolo = 'NOVO', placa = '—', prestador = '—') => {
    setSelectedProtocolo(protocolo);
    setSelectedPlaca(placa);
    setSelectedPrestador(prestador);
    setViewMode(tipo === 'coleta' ? 'execucao-coleta' : 'execucao-entrega');
  };

  if (viewMode === 'execucao-coleta' || viewMode === 'execucao-entrega') {
    return (
      <ChecklistExecucao
        tipo={viewMode === 'execucao-coleta' ? 'coleta' : 'entrega'}
        protocolo={selectedProtocolo}
        placa={selectedPlaca}
        prestador={selectedPrestador}
        onVoltar={() => setViewMode('lista')}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Checklists Digitais</h1>
          <p>Execute e visualize checklists de coleta e entrega com fotos, avarias e assinatura</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => iniciarChecklist('entrega')} className="gap-1.5">
            <Truck className="h-4 w-4" /> Nova Entrega
          </Button>
          <Button onClick={() => iniciarChecklist('coleta')} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Coleta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Completos</p><p className="kpi-value">{completos}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><AlertTriangle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Incompletos</p><p className="kpi-value">{incompletos}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Taxa de conclusão</p><p className="kpi-value">{checklistsExecutados.length > 0 ? Math.round((completos / checklistsExecutados.length) * 100) : 0}%</p></div></div>
      </div>

      <Tabs defaultValue="todos" className="space-y-3">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="coleta">Coleta</TabsTrigger>
          <TabsTrigger value="entrega">Entrega</TabsTrigger>
        </TabsList>

        {['todos', 'coleta', 'entrega'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tipo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Checklist</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Itens</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Data</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(() => {
                    const dados = tab === 'todos' ? checklistsExecutados
                      : checklistsExecutados.filter(c => c.tipoChecklist === (tab === 'coleta' ? 'Coleta' : 'Entrega'));
                    return dados.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-16">
                        <div className="empty-state"><div className="empty-state-icon"><CheckSquare className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum checklist</p><p className="empty-state-description">Checklists preenchidos em campo aparecerão aqui</p></div>
                      </TableCell></TableRow>
                    ) : dados.map(c => (
                      <TableRow key={c.id} className="table-row-hover cursor-pointer" onClick={() => iniciarChecklist(c.tipoChecklist === 'Coleta' ? 'coleta' : 'entrega', c.protocolo, '—', c.prestador)}>
                        <TableCell className="font-mono text-[11px] font-semibold">{c.protocolo}</TableCell>
                        <TableCell className="text-[13px] font-semibold">{c.prestador}</TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{c.tipo}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={c.tipoChecklist === 'Coleta' ? 'default' : 'secondary'} className="font-semibold text-[11px]">
                            {c.tipoChecklist === 'Coleta' ? <ClipboardList className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                            {c.tipoChecklist}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[13px]"><span className="font-semibold">{c.itensOk}</span><span className="text-muted-foreground">/{c.itensTotal}</span></TableCell>
                        <TableCell><Badge variant={c.status === 'Completo' ? 'success' : 'warning'} className="font-semibold">{c.status}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{c.data}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
