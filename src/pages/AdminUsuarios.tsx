import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProfiles } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Users, Plus, Search, MoreHorizontal, Pencil, Eye, Trash2, Mail, Phone, User, ShieldCheck } from 'lucide-react';

const roleLabels: Record<string, string> = { admin: 'Administrador', operador: 'Operador', financeiro: 'Financeiro', comercial: 'Comercial', prestador: 'Motorista' };
const roleColors: Record<string, string> = { admin: 'bg-primary/15 text-primary border-primary/20', operador: 'bg-info/15 text-info border-info/20', financeiro: 'bg-warning/15 text-warning border-warning/20', comercial: 'bg-accent/15 text-accent border-accent/20', prestador: 'bg-success/15 text-success border-success/20' };

const MENU_PERMISSIONS = [
  { group: 'Geral', items: ['Dashboard', 'Solicitações', 'Despacho', 'Usuários', 'Checklists'] },
  { group: 'Operacional', items: ['Atendimentos', 'Mapa Operacional', 'Teste Acionamento', 'Acompanhamento', 'Conversas WhatsApp'] },
  { group: 'Rede', items: ['Prestadores', 'Cobertura', 'Disponibilidade', 'Homologação', 'Performance', 'Comunicação'] },
  { group: 'Financeiro', items: ['Faturamento', 'Conferência', 'Divergências', 'Glosas', 'Tarifas', 'Tabelas Comerciais', 'Relatórios'] },
  { group: 'Configurações', items: ['Templates', 'Automações', 'Auditoria', 'Permissões', 'Configurações', 'Suporte'] },
];

interface UserForm {
  nome: string;
  email: string;
  whatsapp: string;
  usuario: string;
  senha: string;
  funcao: string;
  status: string;
  dataAdmissao: string;
  tipoChavePix: string;
  chavePix: string;
  permissoes: string[];
  desabilitarFaturamento: boolean;
  permitirCadastrarServicos: boolean;
}

const emptyForm: UserForm = {
  nome: '', email: '', whatsapp: '', usuario: '', senha: '',
  funcao: 'operador', status: 'Ativo', dataAdmissao: '',
  tipoChavePix: '', chavePix: '', permissoes: [],
  desabilitarFaturamento: false, permitirCadastrarServicos: true,
};

export default function AdminUsuarios() {
  const { user: currentUser } = useAuth();
  const { data: profiles = [], isLoading } = useProfiles();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<any>(null);
  const [form, setForm] = useState<UserForm>({ ...emptyForm });

  const filtered = profiles.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (p.nome || '').toLowerCase().includes(s) || (p.email || '').toLowerCase().includes(s);
  });

  const togglePermission = (item: string) => {
    setForm(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(item)
        ? prev.permissoes.filter(p => p !== item)
        : [...prev.permissoes, item],
    }));
  };

  const handleCreate = () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios.');
      return;
    }
    toast.success(`Usuário ${form.nome} criado com sucesso.`);
    setModalOpen(false);
    setForm({ ...emptyForm });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Usuários</h1>
          <p>Gerencie os usuários da sua empresa</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" />Novo Usuário</Button>
      </div>

      {/* Search */}
      <Card><CardContent className="p-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>

      {/* User Cards */}
      {filtered.length === 0 ? (
        <Card><CardContent className="p-16 text-center">
          <div className="flex flex-col items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p></div>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p: any) => {
            const role = p.user_roles?.[0]?.role || p.user_roles?.role || 'operador';
            const isCurrentUser = p.id === currentUser?.id;
            return (
              <Card key={p.id} className={`hover:border-primary/20 transition-colors ${isCurrentUser ? 'border-primary/30 bg-primary/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[14px]">{p.nome || '—'}</h3>
                          {isCurrentUser && <Badge variant="outline" className="text-[9px]">Você</Badge>}
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-semibold mt-0.5 ${roleColors[role] || ''}`}>
                          {roleLabels[role] || role}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewUser(p)}><Eye className="h-3.5 w-3.5 mr-2" />Visualizar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Editar ' + p.nome)}><Pencil className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => toast.info('Excluir ' + p.nome)}><Trash2 className="h-3.5 w-3.5 mr-2" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1.5 text-[12px] text-muted-foreground">
                    <div className="flex items-center gap-2"><Mail className="h-3 w-3" /><span>{p.email || '—'}</span></div>
                    {p.provider_id && <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /><span className="font-mono text-[11px]">@{p.provider_id}</span></div>}
                  </div>
                  <div className="mt-2">
                    <Badge variant="success" className="text-[10px] font-semibold">Ativo</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={open => { if (!open) setViewUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Usuário</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><User className="h-6 w-6 text-muted-foreground" /></div>
                <div>
                  <p className="font-bold text-[15px]">{viewUser.nome || '—'}</p>
                  <Badge variant="outline" className={`text-[10px] ${roleColors[viewUser.user_roles?.[0]?.role || 'operador'] || ''}`}>
                    {roleLabels[viewUser.user_roles?.[0]?.role || 'operador'] || '—'}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <div><p className="text-[10px] text-muted-foreground">E-mail</p><p className="text-[13px] font-medium">{viewUser.email || '—'}</p></div>
                {viewUser.provider_id && <div><p className="text-[10px] text-muted-foreground">Provider ID</p><p className="text-[13px] font-mono">{viewUser.provider_id}</p></div>}
                <div><p className="text-[10px] text-muted-foreground">Status</p><Badge variant="success" className="text-[10px]">Ativo</Badge></div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setViewUser(null)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle>Novo Usuário</DialogTitle>
            <p className="text-[12px] text-muted-foreground">Cadastre um novo usuário</p>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="space-y-4 p-5 pt-3">
              {/* Basic Info */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome Completo</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="JOÃO SILVA" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="joao@empresa.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Usuário</Label>
                <Input value={form.usuario} onChange={e => setForm(p => ({ ...p, usuario: e.target.value }))} placeholder="joaosilva" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Senha</Label>
                <Input type="password" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} placeholder="••••••••" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Função</Label>
                  <Select value={form.funcao} onValueChange={v => setForm(p => ({ ...p, funcao: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="prestador">Motorista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Data de Admissão</Label>
                <Input type="date" value={form.dataAdmissao} onChange={e => setForm(p => ({ ...p, dataAdmissao: e.target.value }))} />
                <p className="text-[10px] text-muted-foreground">Data de início do colaborador</p>
              </div>

              {/* Menu Permissions */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-[13px]">Menus Permitidos</h3>
                  <p className="text-[11px] text-muted-foreground">Selecione quais menus este usuário poderá acessar</p>
                </div>
                {MENU_PERMISSIONS.map(group => (
                  <div key={group.group}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{group.group}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map(item => (
                        <label key={item} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={form.permissoes.includes(item)}
                            onCheckedChange={() => togglePermission(item)}
                          />
                          <span className="text-[12px]">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* PIX */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tipo PIX</Label>
                  <Select value={form.tipoChavePix} onValueChange={v => setForm(p => ({ ...p, tipoChavePix: v }))}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="aleatoria">Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Chave PIX</Label>
                  <Input value={form.chavePix} onChange={e => setForm(p => ({ ...p, chavePix: e.target.value }))} placeholder="Chave PIX" />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <p className="text-[13px] font-semibold">Desabilitar Faturamento</p>
                    <p className="text-[10px] text-muted-foreground">Quando habilitado, o motorista não tem nenhuma informação de valores no aplicativo.</p>
                  </div>
                  <Switch checked={form.desabilitarFaturamento} onCheckedChange={v => setForm(p => ({ ...p, desabilitarFaturamento: v }))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <p className="text-[13px] font-semibold">Permitir Cadastrar Serviços</p>
                    <p className="text-[10px] text-muted-foreground">Quando desativado, o botão "Registrar Serviço" ficará oculto no aplicativo</p>
                  </div>
                  <Switch checked={form.permitirCadastrarServicos} onCheckedChange={v => setForm(p => ({ ...p, permitirCadastrarServicos: v }))} />
                </div>
              </div>

              {/* Submit */}
              <Button className="w-full" onClick={handleCreate}>Criar Usuário</Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
