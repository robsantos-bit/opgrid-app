import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getConfig, saveConfig, resetAllData } from '@/data/store';
import { ConfigEmpresa } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const roleLabels: Record<string, string> = { admin: 'Admin Master', operador: 'Operações', financeiro: 'Financeiro', prestador: 'Prestador' };

export default function Configuracoes() {
  const { user, isAdmin, updateUser } = useAuth();
  const [config, setConfig] = useState<ConfigEmpresa>(getConfig);
  const { lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const [profileName, setProfileName] = useState(user?.nome || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  const updateField = (field: keyof ConfigEmpresa, value: any) => setConfig(prev => ({ ...prev, [field]: value }));
  const handleSave = () => { saveConfig(config); toast.success('Configurações salvas!'); };
  const handleReset = () => { resetAllData(); toast.success('Dados resetados. Recarregando...'); setTimeout(() => window.location.reload(), 1000); };
  const handleProfileSave = () => {
    if (user) {
      updateUser({ nome: profileName, email: profileEmail });
      toast.success('Perfil atualizado!');
    }
  };

  const handleCnpjChange = async (value: string) => {
    updateField('cnpj', value);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 14) {
      const result = await lookupCnpj(value);
      if (result) {
        if (result.razao_social) updateField('nomeEmpresa', result.razao_social);
        if (result.telefone) updateField('telefone', result.telefone);
        if (result.email) updateField('email', result.email);
        if (result.logradouro) updateField('endereco', [result.logradouro, result.numero, result.bairro, result.municipio, result.uf].filter(Boolean).join(', '));
        toast.success('Dados do CNPJ preenchidos automaticamente!');
      }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header"><div className="page-header-text"><h1>Configurações</h1><p>Dados da empresa e preferências do sistema</p></div></div>

      <Tabs defaultValue="empresa">
        <TabsList className="h-9">
          <TabsTrigger value="empresa" className="text-xs">Empresa</TabsTrigger>
          <TabsTrigger value="parametros" className="text-xs">Parâmetros</TabsTrigger>
          <TabsTrigger value="perfil" className="text-xs">Meu Perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="permissoes" className="text-xs">Permissões</TabsTrigger>}
          {isAdmin && <TabsTrigger value="sistema" className="text-xs">Sistema</TabsTrigger>}
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Card className="max-w-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Dados da Empresa</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={config.nomeEmpresa} onChange={e => updateField('nomeEmpresa', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label className="text-xs">CNPJ</Label><div className="relative"><Input value={config.cnpj} onChange={e => handleCnpjChange(e.target.value)} />{cnpjLoading && <Loader2 className="h-3.5 w-3.5 animate-spin absolute right-3 top-2.5 text-muted-foreground" />}</div></div><div className="space-y-1"><Label className="text-xs">Telefone</Label><Input value={config.telefone} onChange={e => updateField('telefone', e.target.value)} /></div></div>
            <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input type="email" value={config.email} onChange={e => updateField('email', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input value={config.endereco} onChange={e => updateField('endereco', e.target.value)} /></div>
            <Button onClick={handleSave} className="mt-2"><Save className="h-4 w-4 mr-1.5" />Salvar</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="parametros" className="mt-4">
          <Card className="max-w-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Parâmetros de Cálculo</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label className="text-xs">Km Mínimo</Label><Input type="number" value={config.parametroKmMinimo} onChange={e => updateField('parametroKmMinimo', parseInt(e.target.value) || 0)} /></div><div className="space-y-1"><Label className="text-xs">Hora Mínima</Label><Input type="number" step="0.5" value={config.parametroHoraMinima} onChange={e => updateField('parametroHoraMinima', parseFloat(e.target.value) || 0)} /></div></div>
            <Button onClick={handleSave} className="mt-2"><Save className="h-4 w-4 mr-1.5" />Salvar</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="perfil" className="mt-4">
          <Card className="max-w-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Meu Perfil</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={profileName} onChange={e => setProfileName(e.target.value)} readOnly={!isAdmin} className={!isAdmin ? 'bg-muted' : ''} /></div>
              <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} readOnly={!isAdmin} className={!isAdmin ? 'bg-muted' : ''} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Perfil</Label><Input value={roleLabels[user?.role || ''] || ''} readOnly className="bg-muted" /></div>
            {isAdmin ? (
              <Button onClick={handleProfileSave} className="mt-2"><Save className="h-4 w-4 mr-1.5" />Salvar</Button>
            ) : (
              <p className="text-[11px] text-muted-foreground">Para alterar dados de perfil, contate o administrador.</p>
            )}
          </CardContent></Card>
        </TabsContent>

        {isAdmin && <TabsContent value="permissoes" className="mt-4">
          <Card className="max-w-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Permissões por Perfil</CardTitle></CardHeader><CardContent>
            <div className="space-y-4 text-[13px]">
              {[
                { role: 'Administrador', access: 'Acesso completo a todos os módulos' },
                { role: 'Operador', access: 'Dashboard, Prestadores, Atendimentos, Tarifas, Tabelas de Preço' },
                { role: 'Financeiro', access: 'Dashboard, Faturamento, Relatórios, Atendimentos, Contratos' },
                { role: 'Prestador', access: 'Dashboard, Atendimentos próprios, Faturamento próprio, Tarifas' },
              ].map(p => (
                <div key={p.role} className="flex justify-between items-start py-2 border-b border-dashed border-border/60">
                  <span className="font-medium">{p.role}</span>
                  <span className="text-muted-foreground text-right max-w-[300px]">{p.access}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>}

        {isAdmin && <TabsContent value="sistema" className="mt-4">
          <Card className="max-w-xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Manutenção</CardTitle></CardHeader><CardContent>
            <div className="flex items-center justify-between">
              <div><p className="text-[13px] font-medium">Resetar Dados</p><p className="text-[11px] text-muted-foreground">Restaurar dados de demonstração</p></div>
              <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Resetar</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Resetar dados?</AlertDialogTitle><AlertDialogDescription>Todos os dados serão restaurados. Ação irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleReset}>Resetar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            </div>
          </CardContent></Card>
        </TabsContent>}
      </Tabs>
    </div>
  );
}
