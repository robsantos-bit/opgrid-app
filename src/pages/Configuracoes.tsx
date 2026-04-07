import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getConfig, saveConfig, resetAllData } from '@/data/store';
import { supabase } from '@/integrations/supabase/client';
import { ConfigEmpresa } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Save, RotateCcw, Loader2, Webhook, Copy, CheckCircle2, Send, Zap, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const roleLabels: Record<string, string> = { admin: 'Admin Master', operador: 'Operações', financeiro: 'Financeiro', prestador: 'Prestador' };


export default function Configuracoes() {
  const { user, isAdmin } = useAuth();
  const [config, setConfig] = useState<ConfigEmpresa>(getConfig);
  const { lookupCnpj, loading: cnpjLoading } = useCnpjLookup();
  const [profileName, setProfileName] = useState(user?.nome || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  const updateField = (field: keyof ConfigEmpresa, value: any) => setConfig(prev => ({ ...prev, [field]: value }));
  const handleSave = () => { saveConfig(config); toast.success('Configurações salvas!'); };
  const handleReset = () => { resetAllData(); toast.success('Dados resetados. Recarregando...'); setTimeout(() => window.location.reload(), 1000); };
  const handleProfileSave = () => {
    toast.info('Edição de perfil via Supabase em breve.');
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

const PROJECT_ID = 'dnzsmogsqctscfqulffr';
const WEBHOOK_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/whatsapp-webhook`;
const SEND_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/whatsapp-send`;
const STATUS_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/whatsapp-status`;

function CopyField({ label, value, description }: { label: string; value: string; description?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      <div className="flex gap-2">
        <Input value={value} readOnly className="bg-muted font-mono text-xs" />
        <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy}>
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function WapiTestCard() {
  const [testPhone, setTestPhone] = useState('5512992184913');
  const [testMessage, setTestMessage] = useState('🧪 Teste de integração W-API via OpGrid!');
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; details: string } | null>(null);

  const handleTest = async () => {
    if (!testPhone.replace(/\D/g, '')) {
      toast.error('Informe um número de telefone válido');
      return;
    }
    setSending(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          provider: 'wapi',
          to: testPhone.replace(/\D/g, ''),
          type: 'text',
          text: { body: testMessage },
        },
      });
      if (error) {
        setTestResult({ ok: false, details: error.message || JSON.stringify(error) });
        toast.error('Erro no teste: ' + (error.message || 'Falha'));
      } else {
        setTestResult({ ok: true, details: JSON.stringify(data, null, 2) });
        toast.success('Mensagem de teste enviada com sucesso!');
      }
    } catch (err: any) {
      setTestResult({ ok: false, details: String(err) });
      toast.error('Erro ao enviar teste');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Teste de Envio (W-API)</CardTitle>
        </div>
        <p className="text-[11px] text-muted-foreground">Envie uma mensagem de teste para validar a integração</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Número de destino (com DDD + DDI)</Label>
          <Input
            placeholder="5511999999999"
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mensagem</Label>
          <Input
            value={testMessage}
            onChange={e => setTestMessage(e.target.value)}
            className="text-xs"
          />
        </div>
        <Button onClick={handleTest} disabled={sending} size="sm" className="w-full">
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
          {sending ? 'Enviando...' : 'Enviar Teste'}
        </Button>
        {testResult && (
          <div className={`rounded-md border p-3 text-xs font-mono ${testResult.ok ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <p className={`font-semibold mb-1 ${testResult.ok ? 'text-green-600' : 'text-destructive'}`}>
              {testResult.ok ? '✅ Sucesso' : '❌ Erro'}
            </p>
            <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground max-h-32 overflow-auto">{testResult.details}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WebhookConfigPanel() {
  const [activeProvider, setActiveProvider] = useState<'meta' | 'wapi'>('wapi');

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex gap-2 mb-2">
        <Button
          variant={activeProvider === 'wapi' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveProvider('wapi')}
        >
          W-API
        </Button>
        <Button
          variant={activeProvider === 'meta' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveProvider('meta')}
        >
          Meta (Cloud API)
        </Button>
      </div>

      {activeProvider === 'wapi' && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">WhatsApp via W-API</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">Configure estas URLs no painel da W-API → Instância → Webhooks</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyField
                label="Webhook de Mensagens Recebidas"
                value={WEBHOOK_URL}
                description="Cole em 'URL de Webhook' na W-API para receber mensagens (onMessage)"
              />
              <CopyField
                label="Webhook de Status"
                value={STATUS_URL}
                description="Cole em 'URL de Status' na W-API para receber atualizações (onMessageStatus)"
              />
              <div className="rounded-md bg-muted/50 border border-border p-3 space-y-2">
                <p className="text-xs font-medium">Eventos recomendados na W-API:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['onMessage', 'onMessageStatus', 'onDisconnect', 'onConnecting'].map(f => (
                    <Badge key={f} variant="secondary" className="text-[10px] font-mono">{f}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Endpoint de Envio (W-API)</CardTitle>
              <p className="text-[11px] text-muted-foreground">Use a Edge Function como proxy ou chame a W-API diretamente</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CopyField label="Via Edge Function (recomendado)" value={SEND_URL} description="POST — proxy seguro que mantém o token no servidor" />
              <CopyField label="API Direta W-API" value="https://api.w-api.app/v2/{instance_id}/messages/send-text" description="Substitua {instance_id} pelo ID da sua instância" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Secrets Necessários (W-API)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-[13px]">
                {[
                  { name: 'WAPI_INSTANCE_ID', desc: 'ID da instância na W-API' },
                  { name: 'WAPI_TOKEN', desc: 'Token de autenticação da W-API' },
                  { name: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', desc: 'Token de verificação do webhook (opcional)' },
                ].map(s => (
                  <div key={s.name} className="flex items-start justify-between py-1.5 border-b border-dashed border-border/60">
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{s.name}</code>
                    <span className="text-muted-foreground text-xs text-right ml-3">{s.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Encontre esses valores no painel W-API → Sua Instância → Configurações.
              </p>
            </CardContent>
          </Card>

          <WapiTestCard />
        </>
      )}

      {activeProvider === 'meta' && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">WhatsApp Webhook (Meta)</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground">Configure estas URLs no painel do Meta Developers → WhatsApp → Configuration</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <CopyField
                label="Callback URL (Webhook)"
                value={WEBHOOK_URL}
                description="Cole em 'Callback URL' no Meta Developers para receber mensagens"
              />
              <CopyField
                label="Verify Token"
                value="(definido no secret WHATSAPP_WEBHOOK_VERIFY_TOKEN)"
                description="Use o mesmo token configurado nos secrets do projeto"
              />
              <div className="rounded-md bg-muted/50 border border-border p-3 space-y-2">
                <p className="text-xs font-medium">Campos obrigatórios no Meta:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['messages', 'message_deliveries', 'message_reads', 'messaging_postbacks'].map(f => (
                    <Badge key={f} variant="secondary" className="text-[10px] font-mono">{f}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Edge Functions</CardTitle>
              <p className="text-[11px] text-muted-foreground">URLs das funções serverless para integração</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CopyField label="Enviar Mensagem" value={SEND_URL} description="POST — envia mensagens via Cloud API" />
              <CopyField label="Status Callback" value={STATUS_URL} description="POST — recebe atualizações de status (delivered, read, failed)" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Secrets Necessários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-[13px]">
                {[
                  { name: 'WHATSAPP_ACCESS_TOKEN', desc: 'Token permanente da API do WhatsApp Business' },
                  { name: 'WHATSAPP_PHONE_NUMBER_ID', desc: 'ID do número de telefone no Meta' },
                  { name: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', desc: 'Token de verificação do webhook' },
                ].map(s => (
                  <div key={s.name} className="flex items-start justify-between py-1.5 border-b border-dashed border-border/60">
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{s.name}</code>
                    <span className="text-muted-foreground text-xs text-right ml-3">{s.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Gerencie os secrets na aba Cloud → Secrets do Lovable.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
// ====== PRICING CONFIG PANEL ======
interface PricingRow {
  id: string;
  chave: string;
  valor: number;
  porcentagem: number;
  descricao: string | null;
  unidade: string | null;
  ativo: boolean;
}

const PRICING_LABELS: Record<string, string> = {
  taxa_base: 'Taxa Base',
  custo_km_padrao: 'Custo Km (Leve)',
  custo_km_utilitario: 'Custo Km (Utilitário)',
  custo_km_pesado: 'Custo Km (Pesado)',
  fator_ida_volta: 'Fator Ida+Volta',
  fator_correcao_rodoviario: 'Correção Rodoviária',
  distancia_fallback_parcial: 'Distância Fallback (parcial)',
  distancia_fallback_total: 'Distância Fallback (sem GPS)',
  valor_minimo: 'Valor Mínimo',
  adicional_noturno: 'Adicional Noturno (%)',
  adicional_utilitario: 'Adicional Utilitário',
  adicional_pesado: 'Adicional Pesado',
  adicional_patins: 'Adicional Patins',
  multiplicador_eixo_caminhao: 'Eixos Caminhão (pedágio)',
  repasse_pedagio_ativo: 'Repasse Pedágio (1=sim)',
};

function PricingConfigPanel() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .order('chave');
    if (error) {
      toast.error('Erro ao carregar tarifas: ' + error.message);
    } else {
      setRows(data || []);
      const vals: Record<string, string> = {};
      (data || []).forEach((r: PricingRow) => { vals[r.chave] = String(r.valor); });
      setEditValues(vals);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;
    for (const row of rows) {
      const newVal = parseFloat(editValues[row.chave] || '0');
      if (newVal !== row.valor) {
        const { error } = await supabase
          .from('pricing_config')
          .update({ valor: newVal })
          .eq('id', row.id);
        if (error) {
          toast.error(`Erro ao salvar ${row.chave}: ${error.message}`);
          hasError = true;
        }
      }
    }
    if (!hasError) {
      toast.success('Tarifas atualizadas com sucesso!');
      fetchPricing();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="max-w-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Tarifas de Precificação</CardTitle>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Valores utilizados automaticamente pelo motor de orçamento do WhatsApp
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma configuração encontrada. Execute o SQL de criação da tabela <code className="text-xs bg-muted px-1 rounded">pricing_config</code>.
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3 py-2 border-b border-dashed border-border/60 last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{PRICING_LABELS[row.chave] || row.chave}</p>
                <p className="text-[11px] text-muted-foreground">{row.descricao} <span className="text-[10px] opacity-60">({row.unidade})</span></p>
              </div>
              <Input
                type="number"
                step="0.01"
                value={editValues[row.chave] || ''}
                onChange={(e) => setEditValues((prev) => ({ ...prev, [row.chave]: e.target.value }))}
                className="w-24 h-8 text-sm text-right font-mono"
              />
            </div>
          ))
        )}
        {rows.length > 0 && (
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Salvar Tarifas
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header"><div className="page-header-text"><h1>Configurações</h1><p>Dados da empresa e preferências do sistema</p></div></div>

      <Tabs defaultValue="empresa">
        <TabsList className="h-9">
          <TabsTrigger value="empresa" className="text-xs">Empresa</TabsTrigger>
          <TabsTrigger value="parametros" className="text-xs">Parâmetros</TabsTrigger>
          <TabsTrigger value="perfil" className="text-xs">Meu Perfil</TabsTrigger>
          
          {isAdmin && <TabsTrigger value="tarifas" className="text-xs">Tarifas</TabsTrigger>}
          {isAdmin && <TabsTrigger value="webhooks" className="text-xs">Webhooks</TabsTrigger>}
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

        {isAdmin && <TabsContent value="tarifas" className="mt-4">
          <PricingConfigPanel />
        </TabsContent>}

        {isAdmin && <TabsContent value="webhooks" className="mt-4">
          <WebhookConfigPanel />
        </TabsContent>}

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
