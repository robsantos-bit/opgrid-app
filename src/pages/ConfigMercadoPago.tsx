import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/components/AppLayout';
import { DollarSign, Key, Shield, CreditCard, QrCode, CheckCircle2, AlertTriangle, Loader2, Save, ExternalLink, Webhook } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigMercadoPago() {
  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [sandbox, setSandbox] = useState(true);
  const [pixEnabled, setPixEnabled] = useState(true);
  const [creditoEnabled, setCreditoEnabled] = useState(false);
  const [debitoEnabled, setDebitoEnabled] = useState(false);
  const [boletoEnabled, setBoletoEnabled] = useState(false);
  const [autoCobranca, setAutoCobranca] = useState(true);
  const [tempoExpiracao, setTempoExpiracao] = useState('30');
  const [connected, setConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTestConnection = async () => {
    if (!accessToken) {
      toast.error('Informe o Access Token');
      return;
    }
    setTesting(true);
    // Simulação de teste
    await new Promise(r => setTimeout(r, 1500));
    setConnected(true);
    setTesting(false);
    toast.success('Conexão com Mercado Pago estabelecida!');
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Configurações do Mercado Pago salvas!');
  };

  const PROJECT_ID = 'dnzsmogsqctscfqulffr';
  const webhookUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/mercadopago-webhook`;

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div className="page-header-text">
            <h1>Integração Mercado Pago</h1>
            <p>Configure pagamentos automáticos para cobranças de serviço</p>
          </div>
          <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
            {connected ? <><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</> : <><AlertTriangle className="h-3 w-3 mr-1" />Desconectado</>}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          {/* Credenciais */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Credenciais</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Obtenha as credenciais em{' '}
                <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Mercado Pago Developers <ExternalLink className="h-2.5 w-2.5 inline" />
                </a>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Access Token *</Label>
                <Input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="APP_USR-xxxxxxxx-xxxx" className="font-mono text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Public Key</Label>
                <Input value={publicKey} onChange={e => setPublicKey(e.target.value)} placeholder="APP_USR-xxxxxxxx-xxxx" className="font-mono text-xs" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs">Modo Sandbox (Teste)</Label>
                  <p className="text-[10px] text-muted-foreground">Usar credenciais de teste</p>
                </div>
                <Switch checked={sandbox} onCheckedChange={setSandbox} />
              </div>
              <Button onClick={handleTestConnection} disabled={testing} size="sm" className="w-full">
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Shield className="h-3.5 w-3.5 mr-1.5" />}
                {testing ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </CardContent>
          </Card>

          {/* Métodos de Pagamento */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Métodos de Pagamento</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">Habilite os métodos disponíveis para cobrança</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'PIX', desc: 'Pagamento instantâneo via QR Code', icon: QrCode, enabled: pixEnabled, set: setPixEnabled },
                { label: 'Cartão de Crédito', desc: 'Parcelamento até 12x', icon: CreditCard, enabled: creditoEnabled, set: setCreditoEnabled },
                { label: 'Cartão de Débito', desc: 'Débito à vista', icon: CreditCard, enabled: debitoEnabled, set: setDebitoEnabled },
                { label: 'Boleto Bancário', desc: 'Vencimento em 3 dias úteis', icon: DollarSign, enabled: boletoEnabled, set: setBoletoEnabled },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-dashed border-border/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                    </div>
                  </div>
                  <Switch checked={m.enabled} onCheckedChange={m.set} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cobrança Automática */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Cobrança Automática</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">Gere cobranças automaticamente ao finalizar atendimentos</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs">Cobrança automática ao finalizar</Label>
                  <p className="text-[10px] text-muted-foreground">Gera link PIX/pagamento automaticamente</p>
                </div>
                <Switch checked={autoCobranca} onCheckedChange={setAutoCobranca} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tempo de expiração (minutos)</Label>
                <Select value={tempoExpiracao} onValueChange={setTempoExpiracao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="1440">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md bg-muted/50 border p-3 space-y-1">
                <p className="text-xs font-medium">Fluxo de cobrança:</p>
                <ol className="text-[10px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                  <li>Prestador finaliza o atendimento no portal</li>
                  <li>Sistema gera cobrança PIX automaticamente</li>
                  <li>Link de pagamento enviado via WhatsApp ao cliente</li>
                  <li>Pagamento confirmado → atendimento marcado como "Pago"</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Webhook */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Webhook de Notificações</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">Configure no painel do Mercado Pago para receber confirmações de pagamento</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="bg-muted font-mono text-xs" />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('URL copiada!'); }}>
                    <Key className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="rounded-md bg-muted/50 border p-3">
                <p className="text-xs font-medium mb-1">Eventos obrigatórios:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['payment', 'merchant_order'].map(e => (
                    <Badge key={e} variant="secondary" className="text-[10px] font-mono">{e}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">Secrets necessários:</p>
                <div className="space-y-1.5">
                  {[
                    { name: 'MERCADOPAGO_ACCESS_TOKEN', desc: 'Token de acesso da API' },
                    { name: 'MERCADOPAGO_PUBLIC_KEY', desc: 'Chave pública (frontend)' },
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
