import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/AppLayout';
import { Check, X, Crown, Zap, Building2, Star, CreditCard, Calendar, Users, Truck, CheckSquare, MessageCircle, Map, BarChart3, Shield, Headphones, Pencil, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PlanoFeature {
  label: string;
  basico: boolean | string;
  profissional: boolean | string;
  empresarial: boolean | string;
}

const INITIAL_FEATURES: PlanoFeature[] = [
  { label: 'Usuários inclusos', basico: '1', profissional: '5', empresarial: 'Ilimitado' },
  { label: 'Guincheiros / Motoristas', basico: '3', profissional: '15', empresarial: 'Ilimitado' },
  { label: 'Checklists por mês', basico: '50', profissional: '500', empresarial: 'Ilimitado' },
  { label: 'Acionamentos por mês', basico: '30', profissional: '300', empresarial: 'Ilimitado' },
  { label: 'Modelos de Checklist', basico: '3', profissional: '10', empresarial: 'Ilimitado' },
  { label: 'Fotos por checklist', basico: '5', profissional: '20', empresarial: 'Ilimitado' },
  { label: 'Assinatura digital', basico: true, profissional: true, empresarial: true },
  { label: 'App Mobile (PWA)', basico: true, profissional: true, empresarial: true },
  { label: 'Despacho automático', basico: false, profissional: true, empresarial: true },
  { label: 'Notificações WhatsApp', basico: false, profissional: true, empresarial: true },
  { label: 'Rastreamento GPS', basico: false, profissional: true, empresarial: true },
  { label: 'Mapa operacional', basico: false, profissional: true, empresarial: true },
  { label: 'Relatórios avançados', basico: false, profissional: true, empresarial: true },
  { label: 'Cobrança automática', basico: false, profissional: false, empresarial: true },
  { label: 'Integração Mercado Pago', basico: false, profissional: false, empresarial: true },
  { label: 'Integração Positron GPS', basico: false, profissional: false, empresarial: true },
  { label: 'API de integração', basico: false, profissional: false, empresarial: true },
  { label: 'Multi-empresa', basico: false, profissional: false, empresarial: true },
  { label: 'Suporte prioritário', basico: false, profissional: true, empresarial: true },
  { label: 'Gerente de conta dedicado', basico: false, profissional: false, empresarial: true },
  { label: 'SLA garantido', basico: false, profissional: false, empresarial: true },
];

const INITIAL_PLANOS = [
  {
    id: 'basico',
    nome: 'Básico',
    descricao: 'Ideal para guincheiros autônomos e pequenos prestadores',
    precoMensal: 49.90,
    precoAnual: 478.80,
    icon: Zap,
    cor: 'border-muted',
    popular: false,
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    descricao: 'Para empresas em crescimento com equipe operacional',
    precoMensal: 149.90,
    precoAnual: 1438.80,
    icon: Star,
    cor: 'border-primary',
    popular: true,
  },
  {
    id: 'empresarial',
    nome: 'Empresarial',
    descricao: 'Para centrais de assistência 24h e grandes operações',
    precoMensal: 349.90,
    precoAnual: 3358.80,
    icon: Crown,
    cor: 'border-primary',
    popular: false,
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-xs font-semibold">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-primary" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/30" />
  );
}

export default function Assinatura() {
  const [anual, setAnual] = useState(false);
  const [planoAtual] = useState('profissional');
  const [editMode, setEditMode] = useState(false);
  const [planos, setPlanos] = useState(INITIAL_PLANOS);
  const [features, setFeatures] = useState<PlanoFeature[]>(INITIAL_FEATURES);

  const handleAssinar = (planoId: string) => {
    if (planoId === planoAtual) {
      toast.info('Você já está neste plano.');
      return;
    }
    toast.success(`Solicitação de upgrade para o plano ${planos.find(p => p.id === planoId)?.nome} enviada!`);
  };

  const updatePlano = (id: string, field: 'precoMensal' | 'precoAnual' | 'nome' | 'descricao', value: string) => {
    setPlanos(prev => prev.map(p => p.id === id ? { ...p, [field]: field.startsWith('preco') ? (parseFloat(value) || 0) : value } : p));
  };

  const updateFeature = (idx: number, field: keyof PlanoFeature, value: string | boolean) => {
    setFeatures(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };

  const addFeature = () => {
    setFeatures(prev => [...prev, { label: 'Nova funcionalidade', basico: false, profissional: false, empresarial: false }]);
  };

  const removeFeature = (idx: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setEditMode(false);
    toast.success('Alterações salvas com sucesso!');
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <div className="page-header-text">
            <h1>Plano de Assinatura</h1>
            <p>Gerencie seu plano e funcionalidades disponíveis</p>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setPlanos(INITIAL_PLANOS); setFeatures(INITIAL_FEATURES); }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Salvar Alterações
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar Planos
              </Button>
            )}
          </div>
        </div>

        {/* Status atual */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Plano Atual: <span className="text-primary">Profissional</span></p>
                <p className="text-xs text-muted-foreground">Vigência: 01/01/2025 até 01/01/2026 • Pagamento mensal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">Ativo</Badge>
              <Button variant="outline" size="sm">
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Gerenciar Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Toggle mensal/anual */}
        <div className="flex items-center justify-center gap-3">
          <Label className={cn("text-sm transition-colors", !anual && "font-semibold text-foreground")}>Mensal</Label>
          <Switch checked={anual} onCheckedChange={setAnual} />
          <Label className={cn("text-sm transition-colors", anual && "font-semibold text-foreground")}>
            Anual <Badge variant="secondary" className="ml-1 text-[10px]">20% OFF</Badge>
          </Label>
        </div>

        {/* Cards de planos */}
        <div className="grid md:grid-cols-3 gap-4">
          {planos.map(plano => {
            const isAtual = plano.id === planoAtual;
            const preco = anual ? plano.precoAnual / 12 : plano.precoMensal;
            const precoTotal = anual ? plano.precoAnual : plano.precoMensal;

            return (
              <Card key={plano.id} className={cn(
                "relative transition-all hover:shadow-md",
                plano.popular && "border-primary shadow-primary/10 shadow-md",
                isAtual && "ring-2 ring-primary/30"
              )}>
                {plano.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="text-[10px] px-3 bg-primary">Mais Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2 pt-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <plano.icon className="h-6 w-6 text-primary" />
                  </div>
                  {editMode ? (
                    <>
                      <Input value={plano.nome} onChange={e => updatePlano(plano.id, 'nome', e.target.value)} className="text-center h-8 text-sm font-semibold" />
                      <Input value={plano.descricao} onChange={e => updatePlano(plano.id, 'descricao', e.target.value)} className="text-center h-7 text-[11px] mt-1" />
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-lg">{plano.nome}</CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-1">{plano.descricao}</p>
                    </>
                  )}
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {editMode ? (
                    <div className="space-y-2 text-left">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Preço Mensal (R$)</Label>
                        <Input type="number" step="0.01" value={plano.precoMensal} onChange={e => updatePlano(plano.id, 'precoMensal', e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Preço Anual (R$)</Label>
                        <Input type="number" step="0.01" value={plano.precoAnual} onChange={e => updatePlano(plano.id, 'precoAnual', e.target.value)} className="h-8 text-sm" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">R$ {preco.toFixed(2).replace('.', ',')}</span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </div>
                      {anual && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Total: R$ {precoTotal.toFixed(2).replace('.', ',')} /ano
                        </p>
                      )}
                    </div>
                  )}

                  {isAtual ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="h-4 w-4 mr-1.5" />
                      Plano Atual
                    </Button>
                  ) : (
                    <Button className="w-full" variant={plano.popular ? 'default' : 'outline'} onClick={() => handleAssinar(plano.id)}>
                      {plano.id === 'empresarial' ? 'Falar com Vendas' : 'Assinar Agora'}
                    </Button>
                  )}

                  <div className="border-t pt-3 space-y-2 text-left">
                    {features.slice(0, 8).map(f => {
                      const val = f[plano.id as keyof PlanoFeature];
                      return (
                        <div key={f.label} className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{f.label}</span>
                          <FeatureValue value={val as boolean | string} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabela comparativa completa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Comparativo Completo de Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-[40%]">Funcionalidade</th>
                    <th className="text-center p-3 text-xs font-medium w-[20%]">Básico</th>
                    <th className="text-center p-3 text-xs font-medium text-primary w-[20%]">Profissional</th>
                    <th className="text-center p-3 text-xs font-medium w-[20%]">Empresarial</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f, i) => (
                    <tr key={f.label} className={cn("border-b border-dashed", i % 2 === 0 && "bg-muted/10")}>
                      <td className="p-3 text-xs">{f.label}</td>
                      <td className="p-3 text-center"><div className="flex justify-center"><FeatureValue value={f.basico} /></div></td>
                      <td className="p-3 text-center bg-primary/5"><div className="flex justify-center"><FeatureValue value={f.profissional} /></div></td>
                      <td className="p-3 text-center"><div className="flex justify-center"><FeatureValue value={f.empresarial} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { q: 'Posso trocar de plano a qualquer momento?', a: 'Sim. O upgrade é imediato e o valor é ajustado proporcionalmente. O downgrade entra em vigor no próximo ciclo.' },
              { q: 'Como funciona o período de teste?', a: 'Todos os novos cadastros recebem 7 dias gratuitos no plano Profissional para testar todas as funcionalidades.' },
              { q: 'Quais formas de pagamento são aceitas?', a: 'PIX (desconto de 5%), Cartão de Crédito (parcelamento até 12x) e Boleto Bancário.' },
              { q: 'Preciso de contrato de fidelidade?', a: 'Não. Todos os planos são sem fidelidade. Cancele quando quiser sem multa.' },
              { q: 'O que acontece se eu exceder os limites do meu plano?', a: 'Você recebe um alerta e pode contratar pacotes adicionais ou fazer upgrade de plano.' },
            ].map(item => (
              <div key={item.q} className="py-2 border-b border-dashed border-border/60 last:border-0">
                <p className="text-xs font-medium">{item.q}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
