import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/components/AppLayout';
import {
  FileText, Settings, Search, Download, Eye, Send, Loader2, Save, CheckCircle2, AlertTriangle, XCircle,
  Building2, Key, RefreshCw, Filter, Calendar, CreditCard, Printer, ExternalLink, ReceiptText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ===== CONFIG TAB =====
function ConfigNfseTab() {
  const [provedor, setProvedor] = useState('enotas');
  const [apiKey, setApiKey] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [ambiente, setAmbiente] = useState<'homologacao' | 'producao'>('homologacao');
  const [autoEmissao, setAutoEmissao] = useState(true);
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dados fiscais
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [inscMunicipal, setInscMunicipal] = useState('');
  const [regimeTributario, setRegimeTributario] = useState('simples');
  const [codigoServico, setCodigoServico] = useState('14.01');
  const [descricaoServico, setDescricaoServico] = useState('Serviço de guincho e reboque de veículos');
  const [aliquotaIss, setAliquotaIss] = useState('5');
  const [codigoMunicipio, setCodigoMunicipio] = useState('');
  const [optanteSimplesNacional, setOptanteSimplesNacional] = useState(true);

  const handleTest = async () => {
    if (!apiKey) { toast.error('Informe a API Key'); return; }
    setTesting(true);
    await new Promise(r => setTimeout(r, 2000));
    setConnected(true);
    setTesting(false);
    toast.success('Conexão com o provedor de NFS-e estabelecida!');
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Configurações fiscais salvas!');
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-5xl">
      {/* Provedor */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Provedor NFS-e</CardTitle>
          </div>
          <p className="text-[11px] text-muted-foreground">Configure o serviço de emissão de notas fiscais</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Provedor</Label>
            <Select value={provedor} onValueChange={setProvedor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="enotas">eNotas</SelectItem>
                <SelectItem value="nfse_io">NFSe.io</SelectItem>
                <SelectItem value="tecnospeed">TecnoSpeed</SelectItem>
                <SelectItem value="focusnfe">Focus NFe</SelectItem>
                <SelectItem value="webmania">WebmaniaBR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">API Key *</Label>
            <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Sua chave de API" className="font-mono text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ID da Empresa (no provedor)</Label>
            <Input value={empresaId} onChange={e => setEmpresaId(e.target.value)} placeholder="Ex: abc123" className="font-mono text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ambiente</Label>
            <Select value={ambiente} onValueChange={(v: any) => setAmbiente(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação (Teste)</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-xs">Emissão automática</Label>
              <p className="text-[10px] text-muted-foreground">Emite NFS-e ao finalizar atendimento</p>
            </div>
            <Switch checked={autoEmissao} onCheckedChange={setAutoEmissao} />
          </div>
          <Button onClick={handleTest} disabled={testing} size="sm" className="w-full">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>
          {connected && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Conectado ao provedor
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados Fiscais */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Dados Fiscais do Emitente</CardTitle>
          </div>
          <p className="text-[11px] text-muted-foreground">Dados da empresa para emissão da NFS-e</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Razão Social</Label><Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} className="text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">CNPJ</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="text-xs font-mono" /></div>
            <div className="space-y-1"><Label className="text-xs">Inscrição Municipal</Label><Input value={inscMunicipal} onChange={e => setInscMunicipal(e.target.value)} className="text-xs font-mono" /></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Regime Tributário</Label>
            <Select value={regimeTributario} onValueChange={setRegimeTributario}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                <SelectItem value="real">Lucro Real</SelectItem>
                <SelectItem value="mei">MEI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between py-1">
            <Label className="text-xs">Optante Simples Nacional</Label>
            <Switch checked={optanteSimplesNacional} onCheckedChange={setOptanteSimplesNacional} />
          </div>
        </CardContent>
      </Card>

      {/* Configuração do Serviço */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Configuração do Serviço</CardTitle>
          </div>
          <p className="text-[11px] text-muted-foreground">Dados padrão para emissão de notas de serviço de guincho</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Código do Serviço (LC 116)</Label>
              <Input value={codigoServico} onChange={e => setCodigoServico(e.target.value)} className="text-xs font-mono" />
              <p className="text-[10px] text-muted-foreground">14.01 - Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas, veículos...</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alíquota ISS (%)</Label>
              <Input type="number" step="0.01" value={aliquotaIss} onChange={e => setAliquotaIss(e.target.value)} className="text-xs w-20" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Código do Município (IBGE)</Label>
              <Input value={codigoMunicipio} onChange={e => setCodigoMunicipio(e.target.value)} placeholder="3550308" className="text-xs font-mono" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição padrão do serviço</Label>
            <Textarea value={descricaoServico} onChange={e => setDescricaoServico(e.target.value)} rows={2} className="text-xs" />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== NOTAS EMITIDAS TAB =====
interface NotaFiscal {
  id: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  tomadorNome: string;
  tomadorCnpjCpf: string;
  descricao: string;
  valorServico: number;
  valorIss: number;
  status: 'Emitida' | 'Cancelada' | 'Pendente' | 'Erro' | 'Processando';
  protocolo: string;
  linkPdf?: string;
  linkXml?: string;
}

const MOCK_NOTAS: NotaFiscal[] = [
  { id: '1', numero: '000001', serie: '1', dataEmissao: '2025-04-08', tomadorNome: 'João Silva', tomadorCnpjCpf: '123.456.789-00', descricao: 'Serviço de guincho - OS-20250408-0001', valorServico: 350.00, valorIss: 17.50, status: 'Emitida', protocolo: 'OS-20250408-0001', linkPdf: '#', linkXml: '#' },
  { id: '2', numero: '000002', serie: '1', dataEmissao: '2025-04-07', tomadorNome: 'Transportes Rápido LTDA', tomadorCnpjCpf: '12.345.678/0001-99', descricao: 'Serviço de guincho - OS-20250407-0003', valorServico: 580.00, valorIss: 29.00, status: 'Emitida', protocolo: 'OS-20250407-0003', linkPdf: '#', linkXml: '#' },
  { id: '3', numero: '000003', serie: '1', dataEmissao: '2025-04-07', tomadorNome: 'Maria Oliveira', tomadorCnpjCpf: '987.654.321-00', descricao: 'Serviço de guincho - OS-20250407-0005', valorServico: 270.00, valorIss: 13.50, status: 'Cancelada', protocolo: 'OS-20250407-0005' },
  { id: '4', numero: '', serie: '', dataEmissao: '2025-04-09', tomadorNome: 'Carlos Souza', tomadorCnpjCpf: '111.222.333-44', descricao: 'Serviço de guincho - OS-20250409-0001', valorServico: 420.00, valorIss: 21.00, status: 'Pendente', protocolo: 'OS-20250409-0001' },
  { id: '5', numero: '', serie: '', dataEmissao: '2025-04-09', tomadorNome: 'Auto Peças Central', tomadorCnpjCpf: '55.666.777/0001-88', descricao: 'Serviço de guincho - OS-20250409-0002', valorServico: 890.00, valorIss: 44.50, status: 'Erro', protocolo: 'OS-20250409-0002' },
];

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  Emitida: { color: 'bg-primary/10 text-primary', icon: CheckCircle2 },
  Cancelada: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  Pendente: { color: 'bg-warning/10 text-warning', icon: AlertTriangle },
  Erro: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  Processando: { color: 'bg-accent/10 text-accent', icon: Loader2 },
};

function NotasEmitidasTab() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  const filtered = MOCK_NOTAS.filter(n => {
    const matchSearch = !search || n.tomadorNome.toLowerCase().includes(search.toLowerCase()) || n.protocolo.includes(search) || n.numero.includes(search);
    const matchStatus = filterStatus === 'todos' || n.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalEmitidas = MOCK_NOTAS.filter(n => n.status === 'Emitida').length;
  const totalValor = MOCK_NOTAS.filter(n => n.status === 'Emitida').reduce((s, n) => s + n.valorServico, 0);
  const totalIss = MOCK_NOTAS.filter(n => n.status === 'Emitida').reduce((s, n) => s + n.valorIss, 0);

  return (
    <div className="space-y-4 max-w-5xl">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{MOCK_NOTAS.length}</p><p className="text-xs text-muted-foreground">Total Notas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{totalEmitidas}</p><p className="text-xs text-muted-foreground">Emitidas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">R$ {totalValor.toFixed(2).replace('.', ',')}</p><p className="text-xs text-muted-foreground">Valor Total</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-muted-foreground">R$ {totalIss.toFixed(2).replace('.', ',')}</p><p className="text-xs text-muted-foreground">ISS Retido</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tomador, protocolo, número..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Emitida">Emitidas</SelectItem>
            <SelectItem value="Pendente">Pendentes</SelectItem>
            <SelectItem value="Cancelada">Canceladas</SelectItem>
            <SelectItem value="Erro">Com Erro</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />Exportar</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Número</TableHead>
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs">Tomador</TableHead>
                <TableHead className="text-xs">Protocolo OS</TableHead>
                <TableHead className="text-xs text-right">Valor</TableHead>
                <TableHead className="text-xs text-right">ISS</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma nota encontrada</TableCell></TableRow>
              ) : filtered.map(n => {
                const sc = statusConfig[n.status];
                return (
                  <TableRow key={n.id}>
                    <TableCell className="text-xs font-mono">{n.numero || '—'}</TableCell>
                    <TableCell className="text-xs">{new Date(n.dataEmissao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <p className="text-xs font-medium">{n.tomadorNome}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{n.tomadorCnpjCpf}</p>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{n.protocolo}</TableCell>
                    <TableCell className="text-xs text-right font-mono">R$ {n.valorServico.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-muted-foreground">R$ {n.valorIss.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", sc.color)}>
                        <sc.icon className={cn("h-3 w-3 mr-1", n.status === 'Processando' && "animate-spin")} />
                        {n.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar"><Eye className="h-3.5 w-3.5" /></Button>
                        {n.linkPdf && <Button variant="ghost" size="icon" className="h-7 w-7" title="PDF"><Download className="h-3.5 w-3.5" /></Button>}
                        {n.status === 'Pendente' && <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Emitir" onClick={() => toast.success('NFS-e emitida!')}><Send className="h-3.5 w-3.5" /></Button>}
                        {n.status === 'Erro' && <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Reenviar" onClick={() => toast.info('Reenviando...')}><RefreshCw className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== EMISSÃO MANUAL TAB =====
function EmissaoManualTab() {
  const [tomadorNome, setTomadorNome] = useState('');
  const [tomadorDoc, setTomadorDoc] = useState('');
  const [tomadorEmail, setTomadorEmail] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('Serviço de guincho e reboque de veículos');
  const [protocolo, setProtocolo] = useState('');
  const [emitindo, setEmitindo] = useState(false);

  const handleEmitir = async () => {
    if (!tomadorNome || !tomadorDoc || !valor) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setEmitindo(true);
    try {
      const { data, error } = await supabase.functions.invoke('nfse-emit', {
        body: {
          prestador: {
            cnpj: '', // Será preenchido das configurações salvas
            inscricao_municipal: '',
            razao_social: '',
            codigo_municipio: '3554102', // Taubaté
            regime_tributario: 'simples',
          },
          tomador: {
            cpf_cnpj: tomadorDoc,
            razao_social: tomadorNome,
            email: tomadorEmail || undefined,
          },
          servico: {
            codigo_servico: '14.01',
            discriminacao: descricao,
            valor: parseFloat(valor),
            aliquota_iss: 5,
          },
          atendimento_id: protocolo || undefined,
          ambiente: 'homologacao',
        },
      });
      if (error) throw error;
      toast.success(`NFS-e emitida! ${data?.data?.numero_nfse ? 'Nº ' + data.data.numero_nfse : 'Protocolo: ' + (data?.data?.protocolo || 'processando')}`);
      setTomadorNome(''); setTomadorDoc(''); setTomadorEmail(''); setValor(''); setProtocolo('');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao emitir NFS-e');
    } finally {
      setEmitindo(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Emissão Manual de NFS-e</CardTitle>
        </div>
        <p className="text-[11px] text-muted-foreground">Emita uma nota fiscal avulsa para um serviço específico</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1"><Label className="text-xs">Nome do Tomador *</Label><Input value={tomadorNome} onChange={e => setTomadorNome(e.target.value)} className="text-xs" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">CPF/CNPJ *</Label><Input value={tomadorDoc} onChange={e => setTomadorDoc(e.target.value)} className="text-xs font-mono" /></div>
          <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input type="email" value={tomadorEmail} onChange={e => setTomadorEmail(e.target.value)} className="text-xs" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Valor do Serviço (R$) *</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="text-xs font-mono" /></div>
          <div className="space-y-1"><Label className="text-xs">Protocolo OS (opcional)</Label><Input value={protocolo} onChange={e => setProtocolo(e.target.value)} placeholder="OS-20250409-0001" className="text-xs font-mono" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Descrição do Serviço</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} className="text-xs" /></div>
        <Button onClick={handleEmitir} disabled={emitindo} className="w-full">
          {emitindo ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
          {emitindo ? 'Emitindo NFS-e...' : 'Emitir NFS-e'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ===== MAIN PAGE =====
export default function FinanceiroNfse() {
  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div className="page-header-text">
            <h1>Notas Fiscais (NFS-e)</h1>
            <p>Emissão, gestão e configuração de notas fiscais de serviço</p>
          </div>
        </div>

        <Tabs defaultValue="notas">
          <TabsList className="h-9">
            <TabsTrigger value="notas" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1.5" />Notas Emitidas</TabsTrigger>
            <TabsTrigger value="emissao" className="text-xs"><Send className="h-3.5 w-3.5 mr-1.5" />Emissão Manual</TabsTrigger>
            <TabsTrigger value="config" className="text-xs"><Settings className="h-3.5 w-3.5 mr-1.5" />Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="notas" className="mt-4">
            <NotasEmitidasTab />
          </TabsContent>

          <TabsContent value="emissao" className="mt-4">
            <EmissaoManualTab />
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <ConfigNfseTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
