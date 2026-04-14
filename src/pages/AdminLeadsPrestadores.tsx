import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search, Eye, CheckCircle, XCircle, Clock, UserPlus, RefreshCw, Loader2, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  documento: string;
  responsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string;
  estado: string;
  cobertura_texto: string;
  tipo_principal: string;
  servicos_json: string[];
  tipos_veiculo_json: string[];
  atendimento_24h: boolean;
  possui_plataforma: boolean;
  possui_patins: boolean;
  possui_patio: boolean;
  possui_rastreador: boolean;
  atende_rodovia: boolean;
  atende_noturno: boolean;
  qtd_veiculos: string | null;
  observacoes: string | null;
  status_lead: string;
  origem: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-info/10 text-info border-info/20' },
  em_analise: { label: 'Em análise', color: 'bg-warning/10 text-warning border-warning/20' },
  pendente_documentos: { label: 'Pendente docs', color: 'bg-warning/10 text-warning border-warning/20' },
  aprovado: { label: 'Aprovado', color: 'bg-accent/10 text-accent border-accent/20' },
  reprovado: { label: 'Reprovado', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  convertido_em_prestador: { label: 'Convertido', color: 'bg-primary/10 text-primary border-primary/20' },
};

export default function AdminLeadsPrestadores() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('prestador_leads')
      .select('*')
      .order('created_at', { ascending: false }) as { data: Lead[] | null; error: any };
    if (error) {
      toast.error('Erro ao carregar leads');
      console.error(error);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('prestador_leads')
      .update({ status_lead: status, updated_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(`Status atualizado para "${STATUS_MAP[status]?.label || status}"`);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status_lead: status } : l));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status_lead: status } : null);
    }
    setUpdating(false);
  };

  const convertToProvider = async (id: string) => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-lead', {
        body: { lead_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      const msg = data?.temp_password 
        ? `Prestador criado! Email: ${data.email} | Senha temporária: ${data.temp_password}`
        : 'Lead convertido em prestador com sucesso!';
      toast.success(msg, { duration: 15000 });
      
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status_lead: 'convertido_em_prestador' } : l));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status_lead: 'convertido_em_prestador' } : null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao converter lead em prestador');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search || [l.razao_social, l.documento, l.responsavel, l.cidade, l.email]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'todos' || l.status_lead === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: leads.length,
    novo: leads.filter(l => l.status_lead === 'novo').length,
    em_analise: leads.filter(l => l.status_lead === 'em_analise').length,
    aprovado: leads.filter(l => l.status_lead === 'aprovado').length,
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_MAP[status] || { label: status, color: 'bg-muted text-muted-foreground' };
    return <Badge variant="outline" className={s.color}>{s.label}</Badge>;
  };

  const BoolBadge = ({ value, label }: { value: boolean; label: string }) => (
    <Badge variant="outline" className={value ? 'bg-accent/10 text-accent border-accent/20' : 'bg-muted text-muted-foreground'}>
      {value ? '✓' : '✗'} {label}
    </Badge>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads de Prestadores</h1>
            <p className="text-muted-foreground text-sm">Pré-cadastros recebidos pelo site</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: counts.total, icon: UserPlus, color: 'text-foreground' },
            { label: 'Novos', value: counts.novo, icon: Clock, color: 'text-info' },
            { label: 'Em análise', value: counts.em_analise, icon: Search, color: 'text-warning' },
            { label: 'Aprovados', value: counts.aprovado, icon: CheckCircle, color: 'text-accent' },
          ].map(c => (
            <Card key={c.label} className="border">
              <CardContent className="p-4 flex items-center gap-3">
                <c.icon className={`h-5 w-5 ${c.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome, documento, cidade..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">Nenhum lead encontrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(lead => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(lead)}>
                      <TableCell className="font-medium">{lead.razao_social}</TableCell>
                      <TableCell>{lead.responsavel}</TableCell>
                      <TableCell>{lead.cidade}/{lead.estado}</TableCell>
                      <TableCell><Badge variant="outline">{lead.tipo_principal}</Badge></TableCell>
                      <TableCell><StatusBadge status={lead.status_lead} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(lead.created_at), 'dd/MM/yy')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSelected(lead); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selected.razao_social}
                  <StatusBadge status={selected.status_lead} />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus(selected.id, 'em_analise')}>
                    <Search className="h-3.5 w-3.5 mr-1" /> Em análise
                  </Button>
                  <Button size="sm" variant="outline" disabled={updating} onClick={() => updateStatus(selected.id, 'pendente_documentos')}>
                    <Clock className="h-3.5 w-3.5 mr-1" /> Pendente docs
                  </Button>
                  <Button size="sm" className="bg-accent hover:bg-accent/90" disabled={updating} onClick={() => updateStatus(selected.id, 'aprovado')}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprovar
                  </Button>
                   <Button size="sm" variant="destructive" disabled={updating} onClick={() => updateStatus(selected.id, 'reprovado')}>
                     <XCircle className="h-3.5 w-3.5 mr-1" /> Reprovar
                   </Button>
                   {selected.status_lead !== 'convertido_em_prestador' && selected.status_lead === 'aprovado' && (
                     <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={updating} onClick={() => convertToProvider(selected.id)}>
                       <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Converter em prestador
                     </Button>
                   )}
                 </div>

                <Separator />

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div><span className="text-muted-foreground">Documento:</span> <span className="font-medium">{selected.documento}</span></div>
                  <div><span className="text-muted-foreground">Responsável:</span> <span className="font-medium">{selected.responsavel}</span></div>
                  <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selected.telefone}</span></div>
                  <div><span className="text-muted-foreground">WhatsApp:</span> <span className="font-medium">{selected.whatsapp}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email}</span></div>
                </div>

                <Separator />
                <h4 className="font-semibold text-foreground">Localização</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div><span className="text-muted-foreground">Cidade/UF:</span> <span className="font-medium">{selected.cidade}/{selected.estado}</span></div>
                  {selected.endereco && <div><span className="text-muted-foreground">Endereço:</span> <span className="font-medium">{selected.endereco}, {selected.numero}</span></div>}
                  {selected.bairro && <div><span className="text-muted-foreground">Bairro:</span> <span className="font-medium">{selected.bairro}</span></div>}
                  {selected.cep && <div><span className="text-muted-foreground">CEP:</span> <span className="font-medium">{selected.cep}</span></div>}
                </div>
                <div><span className="text-muted-foreground">Cobertura:</span> <span className="font-medium">{selected.cobertura_texto}</span></div>

                <Separator />
                <h4 className="font-semibold text-foreground">Operacional</h4>
                <div><span className="text-muted-foreground">Tipo principal:</span> <Badge variant="outline" className="ml-2">{selected.tipo_principal}</Badge></div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Serviços:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(selected.servicos_json || []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Veículos:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(selected.tipos_veiculo_json || []).map((v: string) => <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>)}
                  </div>
                </div>

                <Separator />
                <h4 className="font-semibold text-foreground">Estrutura</h4>
                <div className="flex flex-wrap gap-2">
                  <BoolBadge value={selected.atendimento_24h} label="24h" />
                  <BoolBadge value={selected.possui_plataforma} label="Plataforma" />
                  <BoolBadge value={selected.possui_patins} label="Patins" />
                  <BoolBadge value={selected.possui_patio} label="Pátio" />
                  <BoolBadge value={selected.possui_rastreador} label="Rastreador" />
                  <BoolBadge value={selected.atende_rodovia} label="Rodovias" />
                  <BoolBadge value={selected.atende_noturno} label="Noturno" />
                </div>

                {(selected.qtd_veiculos || selected.observacoes) && (
                  <>
                    <Separator />
                    {selected.qtd_veiculos && <div><span className="text-muted-foreground">Qtd. veículos:</span> <span className="font-medium">{selected.qtd_veiculos}</span></div>}
                    {selected.observacoes && <div><span className="text-muted-foreground">Observações:</span> <span className="font-medium">{selected.observacoes}</span></div>}
                  </>
                )}

                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Origem: {selected.origem}</span>
                  <span>Recebido em {format(new Date(selected.created_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
