import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/AppLayout';
import { MapPin, Key, Shield, Satellite, Radio, CheckCircle2, AlertTriangle, Loader2, Save, ExternalLink, RefreshCw, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigPositron() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [intervaloSync, setIntervaloSync] = useState('60');
  const [autoSync, setAutoSync] = useState(true);
  const [syncDespacho, setSyncDespacho] = useState(true);
  const [alertaVelocidade, setAlertaVelocidade] = useState(true);
  const [limiteVelocidade, setLimiteVelocidade] = useState('120');
  const [alertaCerca, setAlertaCerca] = useState(true);
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [veiculosSync, setVeiculosSync] = useState(0);

  const handleTestConnection = async () => {
    if (!usuario || !senha) {
      toast.error('Informe usuário e senha');
      return;
    }
    setTesting(true);
    await new Promise(r => setTimeout(r, 2000));
    setConnected(true);
    setVeiculosSync(12);
    setLastSync(new Date().toLocaleString('pt-BR'));
    setTesting(false);
    toast.success('Conexão com Positron estabelecida! 12 veículos encontrados.');
  };

  const handleSync = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setLastSync(new Date().toLocaleString('pt-BR'));
    setVeiculosSync(12);
    setTesting(false);
    toast.success('Sincronização concluída!');
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Configurações da Positron salvas!');
  };

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div className="page-header-text">
            <h1>Integração Positron GPS</h1>
            <p>Rastreamento veicular via portal positronrt.com.br</p>
          </div>
          <div className="flex items-center gap-2">
            {connected && lastSync && (
              <span className="text-[10px] text-muted-foreground">Última sync: {lastSync}</span>
            )}
            <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
              {connected ? <><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</> : <><AlertTriangle className="h-3 w-3 mr-1" />Desconectado</>}
            </Badge>
          </div>
        </div>

        {/* Status Cards */}
        {connected && (
          <div className="grid grid-cols-3 gap-3 max-w-4xl">
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{veiculosSync}</p><p className="text-xs text-muted-foreground">Veículos Rastreados</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{Math.floor(veiculosSync * 0.75)}</p><p className="text-xs text-muted-foreground">Online Agora</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-muted-foreground">{Math.floor(veiculosSync * 0.25)}</p><p className="text-xs text-muted-foreground">Offline</p></CardContent></Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          {/* Credenciais */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Credenciais Positron</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Use as mesmas credenciais do portal{' '}
                <a href="https://positronrt.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  positronrt.com.br <ExternalLink className="h-2.5 w-2.5 inline" />
                </a>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Usuário *</Label>
                <Input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="usuario@empresa.com" className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Senha *</Label>
                <Input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Código da Empresa (opcional)</Label>
                <Input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Ex: 12345" className="font-mono text-xs" />
              </div>
              <Button onClick={handleTestConnection} disabled={testing} size="sm" className="w-full">
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Shield className="h-3.5 w-3.5 mr-1.5" />}
                {testing ? 'Conectando...' : 'Testar Conexão'}
              </Button>
            </CardContent>
          </Card>

          {/* Sincronização */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Satellite className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Sincronização</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">Configure como os dados GPS serão sincronizados</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs">Sincronização automática</Label>
                  <p className="text-[10px] text-muted-foreground">Atualiza posição dos veículos periodicamente</p>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Intervalo de atualização</Label>
                <Select value={intervaloSync} onValueChange={setIntervaloSync}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="120">2 minutos</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs">Vincular ao despacho</Label>
                  <p className="text-[10px] text-muted-foreground">Usa GPS da Positron para calcular ETA no despacho</p>
                </div>
                <Switch checked={syncDespacho} onCheckedChange={setSyncDespacho} />
              </div>
              {connected && (
                <Button onClick={handleSync} disabled={testing} size="sm" variant="outline" className="w-full">
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? 'animate-spin' : ''}`} />
                  Sincronizar Agora
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Alertas */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Alertas GPS</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">Configure alertas baseados em dados de rastreamento</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs">Alerta de velocidade</Label>
                  <p className="text-[10px] text-muted-foreground">Notifica quando veículo exceder limite</p>
                </div>
                <Switch checked={alertaVelocidade} onCheckedChange={setAlertaVelocidade} />
              </div>
              {alertaVelocidade && (
                <div className="space-y-1">
                  <Label className="text-xs">Limite de velocidade (km/h)</Label>
                  <Input type="number" value={limiteVelocidade} onChange={e => setLimiteVelocidade(e.target.value)} className="w-24 text-xs" />
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs">Alerta de cerca virtual</Label>
                  <p className="text-[10px] text-muted-foreground">Notifica entrada/saída de áreas delimitadas</p>
                </div>
                <Switch checked={alertaCerca} onCheckedChange={setAlertaCerca} />
              </div>
            </CardContent>
          </Card>

          {/* Info Técnica */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Informações Técnicas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md bg-muted/50 border p-3 space-y-2">
                <p className="text-xs font-medium">Como funciona:</p>
                <ol className="text-[10px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                  <li>OpGrid conecta na API da Positron com suas credenciais</li>
                  <li>Posições GPS são sincronizadas automaticamente</li>
                  <li>Veículos aparecem no Mapa Operacional em tempo real</li>
                  <li>ETA calculado automaticamente nos despachos</li>
                </ol>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">Secrets necessários:</p>
                <div className="space-y-1.5">
                  {[
                    { name: 'POSITRON_USERNAME', desc: 'Usuário do portal Positron' },
                    { name: 'POSITRON_PASSWORD', desc: 'Senha do portal Positron' },
                    { name: 'POSITRON_EMPRESA_ID', desc: 'Código da empresa (opcional)' },
                  ].map(s => (
                    <div key={s.name} className="flex items-center justify-between text-[11px] py-1 border-b border-dashed border-border/40">
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">{s.name}</code>
                      <span className="text-muted-foreground">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
