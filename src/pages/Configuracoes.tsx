import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getConfig, saveConfig, resetAllData } from '@/data/store';
import { ConfigEmpresa } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Save, RotateCcw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Configuracoes() {
  const { user, isAdmin } = useAuth();
  const [config, setConfig] = useState<ConfigEmpresa>(getConfig);

  const updateField = (field: keyof ConfigEmpresa, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveConfig(config);
    toast.success('Configurações salvas com sucesso!');
  };

  const handleReset = () => {
    resetAllData();
    toast.success('Dados resetados para o padrão. Recarregando...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da empresa e preferências do sistema</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
          <TabsTrigger value="perfil">Meu Perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="sistema">Sistema</TabsTrigger>}
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle className="text-base">Dados da Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Nome da Empresa</Label><Input value={config.nomeEmpresa} onChange={e => updateField('nomeEmpresa', e.target.value)} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>CNPJ</Label><Input value={config.cnpj} onChange={e => updateField('cnpj', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Telefone</Label><Input value={config.telefone} onChange={e => updateField('telefone', e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={config.email} onChange={e => updateField('email', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Endereço</Label><Input value={config.endereco} onChange={e => updateField('endereco', e.target.value)} /></div>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametros" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle className="text-base">Parâmetros de Cálculo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Km Mínimo por Atendimento</Label><Input type="number" value={config.parametroKmMinimo} onChange={e => updateField('parametroKmMinimo', parseInt(e.target.value) || 0)} /></div>
                <div className="space-y-1.5"><Label>Hora Mínima por Atendimento</Label><Input type="number" step="0.5" value={config.parametroHoraMinima} onChange={e => updateField('parametroHoraMinima', parseFloat(e.target.value) || 0)} /></div>
              </div>
              <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle className="text-base">Meu Perfil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Nome</Label><Input value={user?.nome || ''} readOnly className="bg-muted" /></div>
                <div className="space-y-1.5"><Label>E-mail</Label><Input value={user?.email || ''} readOnly className="bg-muted" /></div>
              </div>
              <div className="space-y-1.5"><Label>Perfil</Label><Input value={user?.role === 'admin' ? 'Administrador' : 'Prestador'} readOnly className="bg-muted" /></div>
              <p className="text-xs text-muted-foreground">Para alterar dados de perfil, entre em contato com o administrador do sistema.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="sistema" className="mt-4">
            <Card className="max-w-2xl">
              <CardHeader><CardTitle className="text-base">Manutenção do Sistema</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Resetar Dados</p>
                    <p className="text-xs text-muted-foreground">Restaurar todos os dados para os valores de demonstração</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm"><RotateCcw className="h-4 w-4 mr-2" />Resetar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Resetar dados?</AlertDialogTitle>
                        <AlertDialogDescription>Todos os dados serão restaurados para os valores de demonstração. Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>Resetar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
