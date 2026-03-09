import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getConfig, saveConfig } from '@/data/store';
import { ConfigEmpresa } from '@/types';
import { Save } from 'lucide-react';

export default function Configuracoes() {
  const [config, setConfig] = useState<ConfigEmpresa>(getConfig);

  const updateField = (field: keyof ConfigEmpresa, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveConfig(config);
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados da empresa e preferências</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome da Empresa</Label>
            <Input value={config.nomeEmpresa} onChange={e => updateField('nomeEmpresa', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input value={config.cnpj} onChange={e => updateField('cnpj', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={config.telefone} onChange={e => updateField('telefone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={config.email} onChange={e => updateField('email', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Endereço</Label>
            <Input value={config.endereco} onChange={e => updateField('endereco', e.target.value)} />
          </div>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Salvar Configurações</Button>
        </CardContent>
      </Card>
    </div>
  );
}
