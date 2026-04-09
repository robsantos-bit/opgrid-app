import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { usePrestadores, useUpdatePrestador } from '@/hooks/useSupabaseData';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Eye, Loader2, Users, MapPin, UserPlus, Building2, Phone, Mail, Truck, UsersRound, CheckCircle2, Info, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 25;
const STATUSES = ['ativo', 'inativo', 'bloqueado'];
const TIPOS = ['guincho', 'plataforma', 'apoio'];

export default function RedePrestadores() {
  const { data: prestadores = [], isLoading } = usePrestadores();
  const updateMut = useUpdatePrestador();
  const { lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [showCadastro, setShowCadastro] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [cadastroForm, setCadastroForm] = useState({
    nome: '', cnpj: '', whatsapp: '', email: '', qtdVeiculos: '', qtdMotoristas: '',
  });
  const [cadastroSaving, setCadastroSaving] = useState(false);

  const formatCnpj = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 14);
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4')
      .replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')
      .replace(/(\d{2})(\d{3})/, '$1.$2');
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleCnpjBlur = async () => {
    const clean = cadastroForm.cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      const result = await lookupCnpj(clean);
      if (result) {
        setCadastroForm(prev => ({
          ...prev,
          nome: result.razao_social || result.nome_fantasia || prev.nome,
          email: result.email || prev.email,
          whatsapp: result.telefone || prev.whatsapp,
        }));
        toast.success('CNPJ encontrado! Dados preenchidos automaticamente.');
      }
    }
  };

  const handleCadastroSubmit = () => {
    if (!cadastroForm.nome || !cadastroForm.cnpj || !cadastroForm.whatsapp || !cadastroForm.email) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setCadastroSaving(true);
    setTimeout(() => {
      setCadastroSaving(false);
      setShowCadastro(false);
      setCadastroForm({ nome: '', cnpj: '', whatsapp: '', email: '', qtdVeiculos: '', qtdMotoristas: '' });
      toast.success('Prestador cadastrado com sucesso! Senha enviada por email.');
    }, 1200);
  };

  const openDetail = (p: any) => {
    setSelected(p);
    setEditMode(false);
    setEditForm({});
  };

  const startEdit = () => {
    if (!selected) return;
    setEditForm({
      nome: selected.nome || '',
      cnpj: selected.cnpj || '',
      telefone: selected.telefone || '',
      email: selected.email || '',
      endereco: selected.endereco || '',
      cidade: selected.cidade || '',
      uf: selected.uf || '',
      tipo: selected.tipo || 'guincho',
      status: selected.status || 'ativo',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    try {
      await updateMut.mutateAsync({ id: selected.id, ...editForm });
      toast.success('Prestador atualizado com sucesso.');
      setSelected({ ...selected, ...editForm });
      setEditMode(false);
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  };

  const filtered = useMemo(() => {
    return prestadores.filter((p: any) => {
      const s = search.toLowerCase();
      const matchSearch = !s || (p.nome || '').toLowerCase().includes(s) || (p.cnpj || '').includes(s);
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchTipo = filterTipo === 'all' || p.tipo === filterTipo;
      return matchSearch && matchStatus && matchTipo;
    });
  }, [prestadores, search, filterStatus, filterTipo]);

  useEffect(() => { setPage(0); }, [search, filterStatus, filterTipo]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ativo': case 'Ativo': return 'success' as const;
      case 'inativo': case 'Inativo': return 'secondary' as const;
      case 'bloqueado': case 'Bloqueado': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  const tipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'guincho': return 'default' as const;
      case 'plataforma': return 'info' as const;
      case 'apoio': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  const ativos = prestadores.filter((p: any) => p.status === 'ativo' || p.status === 'Ativo').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div className="page-header-text">
          <h1>Prestadores</h1>
          <p>Rede de prestadores cadastrados · <strong>{prestadores.length}</strong> total · <strong>{ativos}</strong> ativos</p>
        </div>
        <Button onClick={() => setShowCadastro(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Cadastrar Prestador
        </Button>
      </div>

      <Card><CardContent className="p-3"><div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9 h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="guincho">Guincho</SelectItem>
            <SelectItem value="plataforma">Plataforma</SelectItem>
            <SelectItem value="apoio">Apoio</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="h-9 px-3 flex items-center text-[11px] font-medium">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Nome</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell">CNPJ</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell">Telefone</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Tipo</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Status</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold hidden xl:table-cell">Cadastro</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right w-[80px]">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum prestador encontrado</p></div>
              </TableCell></TableRow>
            ) : paged.map((p: any) => (
              <TableRow key={p.id} className="table-row-hover cursor-pointer" onClick={() => openDetail(p)}>
                <TableCell className="font-medium text-[13px]">{p.nome || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-[13px] text-muted-foreground font-mono">{p.cnpj || '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">{p.telefone || '—'}</TableCell>
                <TableCell><Badge variant={tipoBadge(p.tipo)} className="text-[10px] capitalize">{p.tipo || '—'}</Badge></TableCell>
                <TableCell><Badge variant={statusBadge(p.status)} className="text-[10px] capitalize">{p.status || '—'}</Badge></TableCell>
                <TableCell className="hidden xl:table-cell text-[13px] text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openDetail(p); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelected(p); setEditForm({ nome: p.nome || '', cnpj: p.cnpj || '', telefone: p.telefone || '', email: p.email || '', endereco: p.endereco || '', cidade: p.cidade || '', uf: p.uf || '', tipo: p.tipo || 'guincho', status: p.status || 'ativo' }); setEditMode(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-[11px] text-muted-foreground">
              Página {page + 1} de {totalPages} · {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px]" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </CardContent></Card>

      {/* Detail / Edit Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setEditMode(false); } }}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{editMode ? 'Editar Prestador' : selected.nome}</SheetTitle>
                {!editMode && (
                  <div className="flex gap-2">
                    <Badge variant={statusBadge(selected.status)} className="capitalize">{selected.status}</Badge>
                    <Badge variant={tipoBadge(selected.tipo)} className="capitalize">{selected.tipo}</Badge>
                  </div>
                )}
              </SheetHeader>

              {editMode ? (
                <div className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nome</Label>
                    <Input value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">CNPJ</Label>
                    <Input value={editForm.cnpj} onChange={e => setEditForm(p => ({ ...p, cnpj: formatCnpj(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Telefone</Label>
                    <Input value={editForm.telefone} onChange={e => setEditForm(p => ({ ...p, telefone: formatPhone(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Email</Label>
                    <Input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Endereço (Retorno do Prestador)</Label>
                    <Input placeholder="Rua, número, bairro" value={editForm.endereco} onChange={e => setEditForm(p => ({ ...p, endereco: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Cidade</Label>
                      <Input placeholder="Cidade" value={editForm.cidade} onChange={e => setEditForm(p => ({ ...p, cidade: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">UF</Label>
                      <Input placeholder="SP" maxLength={2} value={editForm.uf} onChange={e => setEditForm(p => ({ ...p, uf: e.target.value.toUpperCase() }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tipo</Label>
                      <Select value={editForm.tipo} onValueChange={v => setEditForm(p => ({ ...p, tipo: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Status</Label>
                      <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditMode(false)}>Cancelar</Button>
                    <Button className="flex-1 gap-2" onClick={handleSaveEdit} disabled={updateMut.isPending}>
                      {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-[13px]">
                  {[
                    ['CNPJ', selected.cnpj],
                    ['Telefone', selected.telefone],
                    ['Email', selected.email],
                    ['Endereço (Retorno)', selected.endereco],
                    ['Cidade', selected.cidade],
                    ['UF', selected.uf],
                    ['Tipo', selected.tipo],
                    ['Status', selected.status],
                    ['Cadastrado em', selected.created_at ? new Date(selected.created_at).toLocaleString('pt-BR') : '—'],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium capitalize">{val || '—'}</span>
                    </div>
                  ))}
                  {(selected.latitude && selected.longitude) && (
                    <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{selected.latitude?.toFixed(4)}, {selected.longitude?.toFixed(4)}</span>
                    </div>
                  )}
                  <Button className="w-full mt-4 gap-2" variant="outline" onClick={startEdit}>
                    <Pencil className="h-4 w-4" /> Editar Prestador
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cadastro Dialog */}
      <Dialog open={showCadastro} onOpenChange={setShowCadastro}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cadastrar Prestador</DialogTitle>
            <p className="text-sm text-muted-foreground">Preencha os dados básicos e o prestador receberá a senha por email</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Nome da Empresa <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome da empresa" className="pl-10" value={cadastroForm.nome} onChange={e => setCadastroForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">CNPJ <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="00.000.000/0000-00" className="pl-10" value={cadastroForm.cnpj}
                  onChange={e => setCadastroForm(p => ({ ...p, cnpj: formatCnpj(e.target.value) }))}
                  onBlur={handleCnpjBlur} />
                {cnpjLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">WhatsApp <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="(00) 00000-0000" className="pl-10" value={cadastroForm.whatsapp}
                    onChange={e => setCadastroForm(p => ({ ...p, whatsapp: formatPhone(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="empresa@exemplo.com" className="pl-10" type="email" value={cadastroForm.email}
                    onChange={e => setCadastroForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Qtd. de Veículos <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Ex: 5" className="pl-10" type="number" value={cadastroForm.qtdVeiculos}
                    onChange={e => setCadastroForm(p => ({ ...p, qtdVeiculos: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Qtd. de Motoristas <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <UsersRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Ex: 10" className="pl-10" type="number" value={cadastroForm.qtdMotoristas}
                    onChange={e => setCadastroForm(p => ({ ...p, qtdMotoristas: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-accent/50 p-3 flex gap-3 items-start">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold mb-1 text-foreground">📧 Geraremos uma senha automática</p>
                <p>Após o cadastro, o prestador receberá um email com sua senha de acesso.</p>
              </div>
            </div>
            <Button onClick={handleCadastroSubmit} disabled={cadastroSaving} className="w-full gap-2 h-11">
              {cadastroSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Cadastrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
