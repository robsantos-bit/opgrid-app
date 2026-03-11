import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, XCircle, Plus, CheckCircle2, Clock } from 'lucide-react';

interface Glosa {
  id: string;
  protocolo: string;
  prestador: string;
  motivo: string;
  valor: number;
  status: 'Pendente' | 'Aceita' | 'Contestada' | 'Resolvida';
  criadaEm: string;
}

const MOCK: Glosa[] = [
  { id: '1', protocolo: 'ATD-2025-001', prestador: 'Auto Socorro SP', motivo: 'KM excedente não autorizado', valor: 85.00, status: 'Pendente', criadaEm: '2025-03-10' },
  { id: '2', protocolo: 'ATD-2025-003', prestador: 'Reboque Rápido', motivo: 'Tempo de espera acima do SLA', valor: 120.00, status: 'Contestada', criadaEm: '2025-03-08' },
  { id: '3', protocolo: 'ATD-2025-005', prestador: 'Guincho Express', motivo: 'Cobrança duplicada', valor: 250.00, status: 'Resolvida', criadaEm: '2025-03-05' },
];

export default function FinanceiroGlosas() {
  const [glosas, setGlosas] = useState(MOCK);
  const [search, setSearch] = useState('');

  const filtered = glosas.filter(g => !search || g.protocolo.toLowerCase().includes(search.toLowerCase()) || g.prestador.toLowerCase().includes(search.toLowerCase()));
  const totalGlosado = glosas.filter(g => g.status !== 'Resolvida').reduce((s, g) => s + g.valor, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Glosas</h1>
          <p>Gerencie glosas, contestações e ajustes financeiros de atendimentos</p>
        </div>
        <Button onClick={() => toast.info('Funcionalidade de nova glosa disponível em breve.')}><Plus className="h-4 w-4 mr-1.5" />Nova Glosa</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pendentes</p><p className="kpi-value">{glosas.filter(g => g.status === 'Pendente').length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-destructive/10 text-destructive"><XCircle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Contestadas</p><p className="kpi-value">{glosas.filter(g => g.status === 'Contestada').length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Resolvidas</p><p className="kpi-value">{glosas.filter(g => g.status === 'Resolvida').length}</p></div></div>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold tabular-nums text-destructive">R$ {totalGlosado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-[11px] text-muted-foreground mt-1">Total glosado</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por protocolo ou prestador..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Motivo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">Data</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Valor</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <div className="empty-state"><div className="empty-state-icon"><XCircle className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhuma glosa registrada</p><p className="empty-state-description">Glosas serão exibidas aqui quando identificadas divergências</p></div>
              </TableCell></TableRow>
            ) : filtered.map(g => (
              <TableRow key={g.id} className="table-row-hover">
                <TableCell className="font-mono text-[11px] font-semibold">{g.protocolo}</TableCell>
                <TableCell className="text-[13px] font-semibold">{g.prestador}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground max-w-[200px] truncate">{g.motivo}</TableCell>
                <TableCell><Badge variant={g.status === 'Pendente' ? 'warning' : g.status === 'Contestada' ? 'destructive' : g.status === 'Resolvida' ? 'success' : 'secondary'} className="font-semibold">{g.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">{new Date(g.criadaEm).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right font-medium tabular-nums text-[13px] text-destructive">R$ {g.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
