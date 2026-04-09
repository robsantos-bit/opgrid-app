import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/components/AppLayout';
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Building2, User, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useCepLookup } from '@/hooks/useCepLookup';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';

interface Cliente {
  id: string;
  tipo: 'PF' | 'PJ';
  nome: string;
  documento: string;
  telefone: string;
  telefone2: string;
  email: string;
  cep: string;
  endereco: string;
  cidade: string;
  uf: string;
  observacoes: string;
  status: 'Ativo' | 'Inativo';
  criadoEm: string;
}

const MOCK_CLIENTES: Cliente[] = [
  { id: '1', tipo: 'PF', nome: 'João Silva', documento: '123.456.789-00', telefone: '(11) 99999-0001', telefone2: '', email: 'joao@email.com', cep: '01001-000', endereco: 'Rua A, 100 - Centro', cidade: 'São Paulo', uf: 'SP', observacoes: '', status: 'Ativo', criadoEm: '2025-01-15' },
  { id: '2', tipo: 'PJ', nome: 'Transportes Rápido LTDA', documento: '12.345.678/0001-99', telefone: '(11) 3333-4444', telefone2: '(11) 99999-0002', email: 'contato@rapido.com', cep: '04001-000', endereco: 'Av. Paulista, 500', cidade: 'São Paulo', uf: 'SP', observacoes: 'Cliente premium', status: 'Ativo', criadoEm: '2025-02-10' },
  { id: '3', tipo: 'PF', nome: 'Maria Oliveira', documento: '987.654.321-00', telefone: '(12) 99999-0003', telefone2: '', email: 'maria@email.com', cep: '12220-000', endereco: 'Rua B, 50', cidade: 'São José dos Campos', uf: 'SP', observacoes: '', status: 'Inativo', criadoEm: '2025-03-20' },
];

const emptyCliente: Omit<Cliente, 'id' | 'criadoEm'> = {
  tipo: 'PF', nome: '', documento: '', telefone: '', telefone2: '', email: '', cep: '', endereco: '', cidade: '', uf: '', observacoes: '', status: 'Ativo',
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(MOCK_CLIENTES);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'Ativo' | 'Inativo'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCliente);
  const { lookupCep, loading: cepLoading } = useCepLookup();
  const { lookupCnpj, loading: cnpjLoading } = useCnpjLookup();

  const filtered = clientes.filter(c => {
    const matchSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.documento.includes(search) || c.telefone.includes(search);
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateForm = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCepChange = async (value: string) => {
    updateForm('cep', value);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      const result = await lookupCep(value);
      if (result) {
        updateForm('endereco', [result.logradouro, result.bairro].filter(Boolean).join(', '));
        updateForm('cidade', result.localidade || '');
        updateForm('uf', result.uf || '');
      }
    }
  };

  const handleDocumentoChange = async (value: string) => {
    updateForm('documento', value);
    if (form.tipo === 'PJ') {
      const clean = value.replace(/\D/g, '');
      if (clean.length === 14) {
        const result = await lookupCnpj(value);
        if (result) {
          if (result.razao_social) updateForm('nome', result.razao_social);
          if (result.telefone) updateForm('telefone', result.telefone);
          if (result.email) updateForm('email', result.email);
          if (result.cep) {
            updateForm('cep', result.cep);
            updateForm('endereco', [result.logradouro, result.numero, result.bairro].filter(Boolean).join(', '));
            updateForm('cidade', result.municipio || '');
            updateForm('uf', result.uf || '');
          }
          toast.success('Dados do CNPJ preenchidos automaticamente!');
        }
      }
    }
  };

  const handleSave = () => {
    if (!form.nome || !form.documento || !form.telefone) {
      toast.error('Preencha os campos obrigatórios: Nome, Documento e Telefone');
      return;
    }
    if (editingId) {
      setClientes(prev => prev.map(c => c.id === editingId ? { ...c, ...form } : c));
      toast.success('Cliente atualizado!');
    } else {
      const novo: Cliente = { ...form, id: crypto.randomUUID(), criadoEm: new Date().toISOString().split('T')[0] };
      setClientes(prev => [novo, ...prev]);
      toast.success('Cliente cadastrado!');
    }
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyCliente);
  };

  const handleEdit = (c: Cliente) => {
    setEditingId(c.id);
    setForm({ tipo: c.tipo, nome: c.nome, documento: c.documento, telefone: c.telefone, telefone2: c.telefone2, email: c.email, cep: c.cep, endereco: c.endereco, cidade: c.cidade, uf: c.uf, observacoes: c.observacoes, status: c.status });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    toast.success('Cliente removido');
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyCliente);
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div className="page-header-text">
            <h1>Clientes</h1>
            <p>Cadastro e gestão de clientes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo *</Label>
                    <Select value={form.tipo} onValueChange={v => updateForm('tipo', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={v => updateForm('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{form.tipo === 'PJ' ? 'CNPJ' : 'CPF'} *</Label>
                  <Input value={form.documento} onChange={e => handleDocumentoChange(e.target.value)} placeholder={form.tipo === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'} />
                  {cnpjLoading && <p className="text-[10px] text-muted-foreground">Consultando CNPJ...</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{form.tipo === 'PJ' ? 'Razão Social' : 'Nome Completo'} *</Label>
                  <Input value={form.nome} onChange={e => updateForm('nome', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Telefone *</Label><Input value={form.telefone} onChange={e => updateForm('telefone', e.target.value)} placeholder="(00) 00000-0000" /></div>
                  <div className="space-y-1"><Label className="text-xs">Telefone 2</Label><Input value={form.telefone2} onChange={e => updateForm('telefone2', e.target.value)} /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs">CEP</Label><Input value={form.cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" />{cepLoading && <p className="text-[10px] text-muted-foreground">Buscando...</p>}</div>
                  <div className="space-y-1"><Label className="text-xs">Cidade</Label><Input value={form.cidade} onChange={e => updateForm('cidade', e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">UF</Label><Input value={form.uf} onChange={e => updateForm('uf', e.target.value)} maxLength={2} /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input value={form.endereco} onChange={e => updateForm('endereco', e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Observações</Label><Textarea value={form.observacoes} onChange={e => updateForm('observacoes', e.target.value)} rows={2} /></div>
                <Button onClick={handleSave} className="w-full">{editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{clientes.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{clientes.filter(c => c.status === 'Ativo').length}</p><p className="text-xs text-muted-foreground">Ativos</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-muted-foreground">{clientes.filter(c => c.status === 'Inativo').length}</p><p className="text-xs text-muted-foreground">Inativos</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar nome, documento, telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-32"><Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Nome / Razão Social</TableHead>
                  <TableHead className="text-xs">Documento</TableHead>
                  <TableHead className="text-xs">Telefone</TableHead>
                  <TableHead className="text-xs">Cidade/UF</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="outline" className="text-[10px]">{c.tipo}</Badge></TableCell>
                    <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                    <TableCell className="text-xs font-mono">{c.documento}</TableCell>
                    <TableCell className="text-xs">{c.telefone}</TableCell>
                    <TableCell className="text-xs">{c.cidade}/{c.uf}</TableCell>
                    <TableCell><Badge variant={c.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
