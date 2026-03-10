import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getPrestadores, addPrestador, updatePrestador, deletePrestador, getAtendimentos, getTabelaPrecoPrestador, getTarifas } from '@/data/store';
import { Prestador, StatusType, HomologacaoStatus } from '@/types';
import { Plus, Pencil, Trash2, Search, Eye, LayoutGrid, List, ChevronLeft, MapPin, Phone, Shield, Star, Award, AlertTriangle, Tag, ClipboardList, Users, Loader2 } from 'lucide-react';
import { useCepLookup } from '@/hooks/useCepLookup';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const TIPOS_SERVICO = ['Guincho', 'Reboque', 'Resgate', 'Patins', 'Munck', 'Guindaste', 'Carga Especial'];
const TIPOS_PARCEIRO = ['Credenciado', 'Estratégico', 'Exclusivo', 'Franqueado'];

const emptyPrestador = (): Partial<Prestador> => ({
  nomeFantasia: '', razaoSocial: '', documento: '', inscricaoEstadual: '', telefone: '', telefone2: '',
  email: '', responsavel: '', cidade: '', uf: 'SP', endereco: '', cep: '', status: 'Ativo', plano: 'Básico',
  observacoes: '', tiposServico: [], areaCobertura: '', aceitaNoturno: false, aceitaRodoviario: false,
  tipoParceiro: 'Credenciado', cidadesCobertas: [], disponibilidade24h: false, documentosObrigatorios: [],
  validadeDocumental: '', homologacao: 'Pendente', scoreOperacional: 50, observacoesInternas: '',
});

const statusBadge = (status: StatusType) => {
  switch (status) { case 'Ativo': return 'success' as const; case 'Inativo': return 'secondary' as const; case 'Bloqueado': return 'destructive' as const; default: return 'secondary' as const; }
};

const homologBadge = (h: HomologacaoStatus) => {
  switch (h) { case 'Homologado': return 'success' as const; case 'Pendente': return 'warning' as const; case 'Crítico': return 'destructive' as const; }
};

export default function Prestadores() {
  const [data, setData] = useState(getPrestadores);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlano, setFilterPlano] = useState<string>('all');
  const [filterUf, setFilterUf] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Prestador> | null>(null);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [detailPrestador, setDetailPrestador] = useState<Prestador | null>(null);
  const { lookupCep, loading: cepLoading } = useCepLookup();
  const { lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const perPage = 10;

  const handleCnpjChange = async (value: string) => {
    updateField('documento', value);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 14) {
      const result = await lookupCnpj(value);
      if (result) {
        if (result.razao_social) updateField('razaoSocial', result.razao_social);
        if (result.nome_fantasia) updateField('nomeFantasia', result.nome_fantasia);
        if (result.telefone) updateField('telefone', result.telefone);
        if (result.email) updateField('email', result.email);
        if (result.logradouro) updateField('endereco', [result.logradouro, result.numero, result.bairro].filter(Boolean).join(', '));
        if (result.municipio) updateField('cidade', result.municipio);
        if (result.uf) updateField('uf', result.uf);
        if (result.cep) updateField('cep', result.cep);
        toast.success('Dados do CNPJ preenchidos automaticamente!');
      }
    }
  };

  const handlePrestadorCep = async (value: string) => {
    updateField('cep', value);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      const result = await lookupCep(value);
      if (result) {
        updateField('endereco', [result.logradouro, result.bairro].filter(Boolean).join(', '));
        updateField('cidade', result.localidade);
        updateField('uf', result.uf);
        toast.success('Endereço preenchido automaticamente!');
      }
    }
  };

  const filtered = useMemo(() => {
    return data.filter(p => {
      const s = search.toLowerCase();
      const matchSearch = !s || p.nomeFantasia.toLowerCase().includes(s) || p.razaoSocial.toLowerCase().includes(s) || p.documento.includes(s) || p.email.toLowerCase().includes(s);
      return matchSearch && (filterStatus === 'all' || p.status === filterStatus) && (filterPlano === 'all' || p.plano === filterPlano) && (filterUf === 'all' || p.uf === filterUf);
    });
  }, [data, search, filterStatus, filterPlano, filterUf]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const openNew = () => { setEditing(emptyPrestador()); setModalOpen(true); };
  const openEdit = (p: Prestador) => { setEditing({ ...p }); setModalOpen(true); };

  const handleSave = () => {
    if (!editing?.nomeFantasia || !editing.documento || !editing.email) { toast.error('Preencha os campos obrigatórios.'); return; }
    if (editing.id) { updatePrestador(editing as Prestador); toast.success('Prestador atualizado com sucesso.'); }
    else { addPrestador({ ...editing as Prestador, id: `p${Date.now()}` }); toast.success('Prestador cadastrado na rede.'); }
    setData(getPrestadores()); setModalOpen(false); setEditing(null);
  };

  const handleDelete = (id: string) => { deletePrestador(id); setData(getPrestadores()); toast.success('Prestador removido da rede.'); };
  const updateField = (field: string, value: any) => setEditing(prev => prev ? { ...prev, [field]: value } : prev);
  const toggleServico = (servico: string) => {
    setEditing(prev => {
      if (!prev) return prev;
      const current = prev.tiposServico || [];
      return { ...prev, tiposServico: current.includes(servico) ? current.filter(s => s !== servico) : [...current, servico] };
    });
  };

  if (detailPrestador) {
    const atds = getAtendimentos().filter(a => a.prestadorId === detailPrestador.id);
    const precos = getTabelaPrecoPrestador(detailPrestador.id);
    const allTarifas = getTarifas();
    const faturamento = atds.filter(a => a.status === 'Concluído' || a.status === 'Faturado').reduce((s, a) => s + a.valorTotal, 0);

    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setDetailPrestador(null)} className="h-9 w-9"><ChevronLeft className="h-4 w-4" /></Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="truncate">{detailPrestador.nomeFantasia}</h1>
              <Badge variant={statusBadge(detailPrestador.status)} className="font-semibold">{detailPrestador.status}</Badge>
              <Badge variant={homologBadge(detailPrestador.homologacao)} className="font-semibold">{detailPrestador.homologacao}</Badge>
              <Badge variant="outline" className="font-semibold">{detailPrestador.plano}</Badge>
            </div>
            <p className="text-[13px] text-muted-foreground truncate mt-0.5">{detailPrestador.razaoSocial} · {detailPrestador.tipoParceiro} · Score operacional: <span className="font-bold">{detailPrestador.scoreOperacional}/100</span></p>
          </div>
          <Button variant="outline" size="sm" onClick={() => openEdit(detailPrestador)}><Pencil className="h-3.5 w-3.5 mr-1.5" />Editar</Button>
        </div>

        {detailPrestador.homologacao === 'Crítico' && (
          <div className="alert-banner alert-banner-critical">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Este prestador está em situação crítica de homologação. Revise a documentação e conformidade.</span>
          </div>
        )}

        <Tabs defaultValue="dados">
          <TabsList className="h-10">
            <TabsTrigger value="dados" className="text-xs font-semibold">Dados Gerais</TabsTrigger>
            <TabsTrigger value="tarifas" className="text-xs font-semibold">Tarifas ({precos.length})</TabsTrigger>
            <TabsTrigger value="atendimentos" className="text-xs font-semibold">Atendimentos ({atds.length})</TabsTrigger>
            <TabsTrigger value="faturamento" className="text-xs font-semibold">Faturamento</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="mt-4">
            <Card><CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0 text-[13px]">
                {[
                  ['CNPJ/CPF', detailPrestador.documento], ['Inscrição Estadual', detailPrestador.inscricaoEstadual || '—'],
                  ['Responsável', detailPrestador.responsavel], ['E-mail', detailPrestador.email],
                  ['Telefone', detailPrestador.telefone], ['Telefone 2', detailPrestador.telefone2 || '—'],
                  ['Endereço', detailPrestador.endereco], ['Cidade/UF', `${detailPrestador.cidade}/${detailPrestador.uf}`],
                  ['CEP', detailPrestador.cep], ['Área de Cobertura', detailPrestador.areaCobertura || '—'],
                  ['Tipo Parceiro', detailPrestador.tipoParceiro || '—'],
                  ['Validade Documental', detailPrestador.validadeDocumental ? new Date(detailPrestador.validadeDocumental).toLocaleDateString('pt-BR') : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="detail-row">
                    <span className="detail-row-label">{label}</span><span className="detail-row-value">{val}</span>
                  </div>
                ))}
                <div className="detail-row">
                  <span className="detail-row-label">Disponibilidade 24h</span>
                  <Badge variant={detailPrestador.disponibilidade24h ? 'success' : 'secondary'} className="font-semibold">{detailPrestador.disponibilidade24h ? 'Sim' : 'Não'}</Badge>
                </div>
                <div className="detail-row">
                  <span className="detail-row-label">Noturno</span>
                  <Badge variant={detailPrestador.aceitaNoturno ? 'success' : 'secondary'} className="font-semibold">{detailPrestador.aceitaNoturno ? 'Sim' : 'Não'}</Badge>
                </div>
              </div>
              {detailPrestador.tiposServico.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  <span className="text-[13px] text-muted-foreground mr-1 font-medium">Serviços habilitados:</span>
                  {detailPrestador.tiposServico.map(s => <Badge key={s} variant="outline" className="font-semibold">{s}</Badge>)}
                </div>
              )}
              {detailPrestador.cidadesCobertas?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[13px] text-muted-foreground mr-1 font-medium">Cidades cobertas:</span>
                  {detailPrestador.cidadesCobertas.map(c => <Badge key={c} variant="secondary" className="text-[10px] font-semibold">{c}</Badge>)}
                </div>
              )}
              {detailPrestador.observacoesInternas && (
                <div className="mt-5 p-4 rounded-xl bg-muted/40 text-[13px] border border-dashed border-border/50"><span className="text-muted-foreground font-medium">Observações internas: </span>{detailPrestador.observacoesInternas}</div>
              )}
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="tarifas" className="mt-4">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tarifa</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold">Valor</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold">Franquia</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold">Mínimo</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {precos.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-16">
                      <div className="empty-state"><div className="empty-state-icon"><Tag className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Sem tarifas configuradas</p><p className="empty-state-description">Configure a tabela de preços para este prestador</p></div>
                    </TableCell></TableRow>
                  ) : precos.map(tp => (
                    <TableRow key={tp.id} className="table-row-hover">
                      <TableCell className="font-semibold text-[13px]">{allTarifas.find(t => t.id === tp.tarifaId)?.nome || tp.tarifaId}</TableCell>
                      <TableCell className="text-right tabular-nums text-[13px] font-medium">R$ {tp.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums text-[13px] text-muted-foreground">{tp.franquia || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-[13px] text-muted-foreground">R$ {tp.minimo.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="atendimentos" className="mt-4">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Protocolo</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Cliente</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell font-semibold">Data</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold">Valor</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {atds.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-16">
                      <div className="empty-state"><div className="empty-state-icon"><ClipboardList className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum atendimento</p><p className="empty-state-description">Os atendimentos deste prestador aparecerão aqui</p></div>
                    </TableCell></TableRow>
                  ) : atds.map(a => (
                    <TableRow key={a.id} className="table-row-hover">
                      <TableCell className="font-mono text-[11px] font-semibold text-muted-foreground">{a.protocolo}</TableCell>
                      <TableCell className="text-[13px] font-medium">{a.clienteNome}</TableCell>
                      <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground">{new Date(a.dataHora).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell><Badge variant={a.status === 'Concluído' || a.status === 'Faturado' ? 'success' : a.status === 'Cancelado' ? 'destructive' : 'secondary'} className="font-semibold">{a.status}</Badge></TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-[13px]">R$ {a.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="faturamento" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Faturado', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, bg: 'bg-success/10', color: 'text-success' },
                { label: 'Atendimentos', value: atds.length, bg: 'bg-primary/10', color: 'text-primary' },
                { label: 'Ticket Médio', value: `R$ ${atds.filter(a => a.valorTotal > 0).length > 0 ? (faturamento / atds.filter(a => a.valorTotal > 0).length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`, bg: 'bg-info/10', color: 'text-info' },
              ].map(k => <div key={k.label} className="kpi-card"><div className={`kpi-icon ${k.bg} ${k.color}`}><Award className="h-5 w-5" /></div><div><p className="kpi-label">{k.label}</p><p className="kpi-value">{k.value}</p></div></div>)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Prestadores</h1>
          <p>Gestão 360° da rede — homologação, conformidade, score operacional e cobertura geográfica</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode('cards')}><LayoutGrid className="h-4 w-4" /></Button>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Novo Prestador</Button>
        </div>
      </div>

      <Card><CardContent className="p-3.5"><div className="filter-bar">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome, documento ou e-mail..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos Status</SelectItem><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem><SelectItem value="Bloqueado">Bloqueado</SelectItem></SelectContent></Select>
        <Select value={filterPlano} onValueChange={v => { setFilterPlano(v); setPage(0); }}><SelectTrigger className="w-[130px]"><SelectValue placeholder="Plano" /></SelectTrigger><SelectContent><SelectItem value="all">Todos Planos</SelectItem><SelectItem value="Básico">Básico</SelectItem><SelectItem value="Pró">Pró</SelectItem><SelectItem value="Enterprise">Enterprise</SelectItem></SelectContent></Select>
        <Select value={filterUf} onValueChange={v => { setFilterUf(v); setPage(0); }}><SelectTrigger className="w-[90px]"><SelectValue placeholder="UF" /></SelectTrigger><SelectContent><SelectItem value="all">UF</SelectItem>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select>
      </div></CardContent></Card>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paged.map(p => (
            <Card key={p.id} className="card-hover cursor-pointer group" onClick={() => setDetailPrestador(p)}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[14px] truncate group-hover:text-primary transition-colors">{p.nomeFantasia}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.razaoSocial}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusBadge(p.status)} className="font-semibold">{p.status}</Badge>
                    <Badge variant={homologBadge(p.homologacao)} className="text-[9px] font-semibold">{p.homologacao}</Badge>
                  </div>
                </div>
                <div className="text-[12px] text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{p.cidade}/{p.uf}</div>
                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{p.telefone}</div>
                  <div className="flex items-center gap-1.5"><Star className="h-3 w-3" />Score: <span className="font-bold">{p.scoreOperacional}/100</span></div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Badge variant="outline" className="text-[10px] font-semibold">{p.plano}</Badge>
                  <div className="flex gap-1">{p.tiposServico.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>)}{p.tiposServico.length > 2 && <Badge variant="secondary" className="text-[9px]">+{p.tiposServico.length - 2}</Badge>}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Prestador</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider hidden md:table-cell font-semibold">Documento</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider hidden lg:table-cell font-semibold">Local</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Plano</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-center font-semibold">Score</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Homologação</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-right font-semibold w-[110px]">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-16">
                  <div className="empty-state"><div className="empty-state-icon"><Users className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum prestador encontrado</p><p className="empty-state-description">Ajuste os filtros ou cadastre um novo prestador</p></div>
                </TableCell></TableRow>
              ) : paged.map(p => (
                <TableRow key={p.id} className="table-row-hover cursor-pointer" onClick={() => setDetailPrestador(p)}>
                  <TableCell><p className="font-semibold text-[13px]">{p.nomeFantasia}</p><p className="text-[11px] text-muted-foreground">{p.responsavel}</p></TableCell>
                  <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground font-mono">{p.documento}</TableCell>
                  <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{p.cidade}/{p.uf}</TableCell>
                  <TableCell><Badge variant="outline" className="font-semibold">{p.plano}</Badge></TableCell>
                  <TableCell className="text-center"><Badge variant={p.scoreOperacional >= 80 ? 'success' : p.scoreOperacional >= 60 ? 'warning' : 'destructive'} className="text-[10px] font-bold">{p.scoreOperacional}</Badge></TableCell>
                  <TableCell><Badge variant={homologBadge(p.homologacao)} className="font-semibold">{p.homologacao}</Badge></TableCell>
                  <TableCell><Badge variant={statusBadge(p.status)} className="font-semibold">{p.status}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-0.5" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailPrestador(p)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover {p.nomeFantasia}?</AlertDialogTitle><AlertDialogDescription>Esta ação não poderá ser desfeita. O prestador será removido permanentemente da rede.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {totalPages > 1 && <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground font-medium">{filtered.length} prestador(es) na rede</span><div className="flex items-center gap-1.5"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button><span className="px-3 text-muted-foreground font-medium">{page + 1} de {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button></div></div>}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader><DialogTitle className="text-lg">{editing?.id ? 'Editar Prestador' : 'Novo Prestador'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Nome Fantasia *</Label><Input value={editing?.nomeFantasia || ''} onChange={e => updateField('nomeFantasia', e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Razão Social</Label><Input value={editing?.razaoSocial || ''} onChange={e => updateField('razaoSocial', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">CNPJ/CPF *</Label><Input value={editing?.documento || ''} onChange={e => updateField('documento', e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Insc. Estadual</Label><Input value={editing?.inscricaoEstadual || ''} onChange={e => updateField('inscricaoEstadual', e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Responsável</Label><Input value={editing?.responsavel || ''} onChange={e => updateField('responsavel', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">E-mail *</Label><Input type="email" value={editing?.email || ''} onChange={e => updateField('email', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs font-medium">Telefone</Label><Input value={editing?.telefone || ''} onChange={e => updateField('telefone', e.target.value)} /></div><div className="space-y-1.5"><Label className="text-xs font-medium">Tel. 2</Label><Input value={editing?.telefone2 || ''} onChange={e => updateField('telefone2', e.target.value)} /></div></div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5"><Label className="text-xs font-medium">Endereço</Label><Input value={editing?.endereco || ''} onChange={e => updateField('endereco', e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">CEP</Label><div className="relative"><Input value={editing?.cep || ''} onChange={e => handlePrestadorCep(e.target.value)} maxLength={9} />{cepLoading && <Loader2 className="h-3.5 w-3.5 animate-spin absolute right-3 top-2.5 text-muted-foreground" />}</div></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Cidade</Label><Input value={editing?.cidade || ''} onChange={e => updateField('cidade', e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">UF</Label><Select value={editing?.uf || 'SP'} onValueChange={v => updateField('uf', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Cobertura</Label><Input value={editing?.areaCobertura || ''} onChange={e => updateField('areaCobertura', e.target.value)} /></div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Plano</Label><Select value={editing?.plano || 'Básico'} onValueChange={v => updateField('plano', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Básico">Básico</SelectItem><SelectItem value="Pró">Pró</SelectItem><SelectItem value="Enterprise">Enterprise</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Status</Label><Select value={editing?.status || 'Ativo'} onValueChange={v => updateField('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem><SelectItem value="Bloqueado">Bloqueado</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Homologação</Label><Select value={editing?.homologacao || 'Pendente'} onValueChange={v => updateField('homologacao', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Homologado">Homologado</SelectItem><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Crítico">Crítico</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Tipo Parceiro</Label><Select value={editing?.tipoParceiro || 'Credenciado'} onValueChange={v => updateField('tipoParceiro', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS_PARCEIRO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Serviços habilitados</Label>
              <div className="flex flex-wrap gap-3">{TIPOS_SERVICO.map(s => (
                <label key={s} className="flex items-center gap-1.5 text-[13px] cursor-pointer"><Checkbox checked={editing?.tiposServico?.includes(s)} onCheckedChange={() => toggleServico(s)} />{s}</label>
              ))}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-[13px] cursor-pointer"><Switch checked={editing?.aceitaNoturno || false} onCheckedChange={v => updateField('aceitaNoturno', v)} />Noturno</label>
              <label className="flex items-center gap-2 text-[13px] cursor-pointer"><Switch checked={editing?.aceitaRodoviario || false} onCheckedChange={v => updateField('aceitaRodoviario', v)} />Rodoviário</label>
              <label className="flex items-center gap-2 text-[13px] cursor-pointer"><Switch checked={editing?.disponibilidade24h || false} onCheckedChange={v => updateField('disponibilidade24h', v)} />24h</label>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Observações internas</Label><Textarea rows={2} value={editing?.observacoesInternas || ''} onChange={e => updateField('observacoesInternas', e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave}>Salvar Prestador</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
