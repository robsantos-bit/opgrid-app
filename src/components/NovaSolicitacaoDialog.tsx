import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { addSolicitacao, getPrestadores, addDespacho, saveSolicitacoes, getSolicitacoes } from '@/data/store';
import { Solicitacao, MotivoSolicitacao, Despacho, OfertaPrestador } from '@/types';
import { MessageCircle, MapPin, Car, User, Phone, FileText, Zap, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { playCentralSiren } from '@/lib/sirenSound';
import { toast } from 'sonner';
import { useCepLookup } from '@/hooks/useCepLookup';
import { usePlacaLookup } from '@/hooks/usePlacaLookup';

const motivos: MotivoSolicitacao[] = [
  'Pane elétrica', 'Pane mecânica', 'Pneu furado', 'Bateria descarregada',
  'Colisão', 'Remoção simples', 'Veículo sem partida', 'Veículo travado', 'Outro',
];

const initialForm = {
  clienteNome: '',
  clienteTelefone: '',
  clienteWhatsApp: '',
  veiculoPlaca: '',
  veiculoModelo: '',
  origemCep: '',
  origemEndereco: '',
  destinoCep: '',
  destinoEndereco: '',
  motivo: '' as MotivoSolicitacao | '',
  observacoes: '',
  canal: 'WhatsApp' as 'WhatsApp' | 'Telefone' | 'Web',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NovaSolicitacaoDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { lookupCep, loading: cepLoading } = useCepLookup();
  const { lookupPlaca } = usePlacaLookup();

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleCepChange = async (field: 'origemCep' | 'destinoCep', value: string) => {
    set(field, value);
    const clean = value.replace(/\D/g, '');
    if (clean.length === 8) {
      const result = await lookupCep(value);
      if (result) {
        const addr = [result.logradouro, result.bairro, `${result.localidade}/${result.uf}`].filter(Boolean).join(', ');
        const endField = field === 'origemCep' ? 'origemEndereco' : 'destinoEndereco';
        set(endField, addr);
        toast.success('Endereço preenchido automaticamente!');
      }
    }
  };

  const handlePlacaChange = (value: string) => {
    const upper = value.toUpperCase();
    set('veiculoPlaca', upper);
    const result = lookupPlaca(upper);
    if (result) {
      set('veiculoModelo', result.modelo);
      toast.success(`Veículo encontrado: ${result.modelo}`);
    }
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.clienteNome.trim()) e.clienteNome = 'Nome obrigatório';
    if (!form.clienteTelefone.trim()) e.clienteTelefone = 'Telefone obrigatório';
    if (form.clienteTelefone.trim() && form.clienteTelefone.replace(/\D/g, '').length < 10) e.clienteTelefone = 'Telefone inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.veiculoPlaca.trim()) e.veiculoPlaca = 'Placa obrigatória';
    if (!form.veiculoModelo.trim()) e.veiculoModelo = 'Modelo obrigatório';
    if (!form.motivo) e.motivo = 'Selecione o problema';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.origemEndereco.trim()) e.origemEndereco = 'Origem obrigatória';
    if (!form.destinoEndereco.trim()) e.destinoEndereco = 'Destino obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) handleSubmit();
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const id = `sol-${Date.now()}`;
    const distancia = Math.round(5 + Math.random() * 30);
    const valorBase = 120;
    const valorKm = distancia * 4.5;
    const valorTotal = valorBase + valorKm;

    const solicitacao: Solicitacao = {
      id,
      protocolo: `SOL-${String(Date.now()).slice(-6)}`,
      dataHora: now,
      canal: form.canal,
      clienteNome: form.clienteNome.trim(),
      clienteTelefone: form.clienteTelefone.trim(),
      clienteWhatsApp: form.clienteWhatsApp.trim() || form.clienteTelefone.trim(),
      veiculoPlaca: form.veiculoPlaca.trim().toUpperCase(),
      veiculoModelo: form.veiculoModelo.trim(),
      origemEndereco: form.origemEndereco.trim(),
      origemCoord: { lat: -23.55 + (Math.random() - 0.5) * 0.1, lng: -46.65 + (Math.random() - 0.5) * 0.1 },
      destinoEndereco: form.destinoEndereco.trim(),
      destinoCoord: { lat: -23.55 + (Math.random() - 0.5) * 0.1, lng: -46.65 + (Math.random() - 0.5) * 0.1 },
      motivo: form.motivo as MotivoSolicitacao,
      observacoes: form.observacoes.trim(),
      fotos: [],
      distanciaEstimadaKm: distancia,
      valorEstimado: Math.round(valorTotal),
      composicaoCusto: [
        { descricao: 'Taxa base (acionamento)', valor: valorBase, tipo: 'base' },
        { descricao: `Quilometragem (${distancia} km × R$ 4,50)`, valor: Math.round(valorKm), tipo: 'km' },
      ],
      status: 'Recebida',
      statusProposta: 'Aguardando aceite',
      linkAcompanhamento: `/acompanhar/${id}`,
      timeline: [
        { data: now, descricao: `Solicitação recebida via ${form.canal}`, tipo: 'sistema' },
        { data: now, descricao: `Cliente ${form.clienteNome.trim()} enviou pedido de guincho`, tipo: 'cliente' },
        { data: now, descricao: 'Cotação automática gerada', tipo: 'sistema' },
      ],
    };

    addSolicitacao(solicitacao);

    // === AUTO-DISPATCH: select 2 closest active providers ===
    const prestadores = getPrestadores();
    const origemCoord = solicitacao.origemCoord!;
    const activePrestadores = prestadores
      .filter(p => p.status === 'Ativo' && p.localizacao?.compartilhamentoAtivo)
      .map(p => {
        const loc = p.localizacao!;
        const dist = Math.sqrt(Math.pow(loc.lat - origemCoord.lat, 2) + Math.pow(loc.lng - origemCoord.lng, 2)) * 111;
        return { ...p, distKm: Math.round(dist * 10) / 10 };
      })
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 2);

    const despachoId = `desp-${Date.now()}`;
    const ofertas: OfertaPrestador[] = activePrestadores.map((p, i) => ({
      id: `of-${Date.now()}-${i}`,
      despachoId,
      prestadorId: p.id,
      rodada: 1,
      status: 'Pendente' as const,
      enviadaEm: now,
      tempoLimiteMinutos: 5,
      distanciaEstimadaKm: p.distKm,
      tempoEstimadoMinutos: Math.round(p.distKm * 2.5),
      valorServico: Math.round(valorTotal),
      linkOferta: `/prestador/oferta/of-${Date.now()}-${i}`,
    }));

    const despacho: Despacho = {
      id: despachoId,
      solicitacaoId: id,
      rodadaAtual: 1,
      status: 'Ofertas enviadas',
      criadoEm: now,
      atualizadoEm: now,
      ofertas,
      observacoes: `Despacho automático — ${activePrestadores.length} prestadores selecionados`,
    };

    addDespacho(despacho);

    // Update solicitacao status
    solicitacao.status = 'Despachada';
    solicitacao.despachoId = despachoId;
    solicitacao.timeline.push(
      { data: now, descricao: `Despacho automático para ${activePrestadores.map(p => p.nomeFantasia).join(' e ')}`, tipo: 'sistema' },
    );
    // Re-save with updated status
    saveSolicitacoes(getSolicitacoes().map(s => s.id === id ? solicitacao : s));

    // Play siren to simulate real-time alert
    const sirenMuted = localStorage.getItem('opgrid-siren-muted') === 'true';
    if (!sirenMuted) {
      playCentralSiren(2);
    }

    // === SEND WHATSAPP TEST MESSAGE ===
    const testPhone = '5512992184913';
    const baseUrl = window.location.origin;
    const ofertaLink = `${baseUrl}/prestador/oferta/${ofertas[0]?.id || ''}`;
    const whatsMessage = `🚨 *OPGRID — Nova OS!*\n\n📋 *${solicitacao.protocolo}*\n🚗 ${form.veiculoModelo} • ${form.veiculoPlaca}\n📍 ${form.origemEndereco}\n➡️ ${form.destinoEndereco}\n💰 R$ ${Math.round(valorTotal)}\n\n🔗 Aceitar oferta:\n${ofertaLink}\n\n⏱ Expira em 5 minutos!`;
    const waUrl = `https://wa.me/${testPhone}?text=${encodeURIComponent(whatsMessage)}`;
    window.open(waUrl, '_blank');

    toast.success('🔔 Solicitação criada + Despacho automático!', {
      description: `${solicitacao.protocolo} — Ofertas enviadas para ${activePrestadores.map(p => p.nomeFantasia).join(' e ')}. WhatsApp aberto para teste.`,
      duration: 6000,
    });

    // Reset
    setForm(initialForm);
    setStep(1);
    setErrors({});
    onOpenChange(false);
    onCreated();
  };

  const handleClose = () => {
    setForm(initialForm);
    setStep(1);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-success" />
            </div>
            Nova Solicitação
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Simulando entrada de dados via WhatsApp — sem app necessário
          </p>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                step === s ? 'bg-primary text-primary-foreground' :
                step > s ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <CheckCircle2 className="h-3.5 w-3.5" /> : s}
              </div>
              <span className={`text-[11px] font-medium hidden sm:block ${step === s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Cliente' : s === 2 ? 'Veículo' : 'Trajeto'}
              </span>
              {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-success' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <Separator />

        {/* WhatsApp simulation badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/5 border border-success/20">
          <Zap className="h-3.5 w-3.5 text-success shrink-0" />
          <p className="text-[11px] text-success font-medium">
            {step === 1 ? '📱 Cliente enviou dados pelo WhatsApp' :
             step === 2 ? '🚗 Cliente informou dados do veículo' :
             '📍 Cliente compartilhou localização'}
          </p>
        </div>

        <div className="space-y-4 py-2">
          {/* Step 1: Client */}
          {step === 1 && (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />Nome do cliente
                  </Label>
                  <Input
                    placeholder="Ex: João da Silva"
                    value={form.clienteNome}
                    onChange={e => set('clienteNome', e.target.value)}
                    className={`text-sm ${errors.clienteNome ? 'border-destructive' : ''}`}
                    maxLength={100}
                  />
                  {errors.clienteNome && <p className="text-[11px] text-destructive mt-1">{errors.clienteNome}</p>}
                </div>
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />Telefone
                  </Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={form.clienteTelefone}
                    onChange={e => set('clienteTelefone', e.target.value)}
                    className={`text-sm ${errors.clienteTelefone ? 'border-destructive' : ''}`}
                    maxLength={20}
                  />
                  {errors.clienteTelefone && <p className="text-[11px] text-destructive mt-1">{errors.clienteTelefone}</p>}
                </div>
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <MessageCircle className="h-3 w-3 text-muted-foreground" />WhatsApp (opcional)
                  </Label>
                  <Input
                    placeholder="Mesmo número ou outro"
                    value={form.clienteWhatsApp}
                    onChange={e => set('clienteWhatsApp', e.target.value)}
                    className="text-sm"
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Canal de entrada</Label>
                  <div className="flex gap-2">
                    {(['WhatsApp', 'Telefone', 'Web'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => set('canal', c)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          form.canal === c ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted/30'
                        }`}
                      >
                        {c === 'WhatsApp' && <MessageCircle className="h-3 w-3 inline mr-1" />}
                        {c === 'Telefone' && <Phone className="h-3 w-3 inline mr-1" />}
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <Car className="h-3 w-3 text-muted-foreground" />Modelo do veículo
                  </Label>
                  <Input
                    placeholder="Ex: Honda Civic 2022"
                    value={form.veiculoModelo}
                    onChange={e => set('veiculoModelo', e.target.value)}
                    className={`text-sm ${errors.veiculoModelo ? 'border-destructive' : ''}`}
                    maxLength={100}
                  />
                  {errors.veiculoModelo && <p className="text-[11px] text-destructive mt-1">{errors.veiculoModelo}</p>}
                </div>
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground" />Placa
                  </Label>
                  <Input
                    placeholder="Ex: ABC1234"
                    value={form.veiculoPlaca}
                    onChange={e => handlePlacaChange(e.target.value)}
                    className={`text-sm font-mono ${errors.veiculoPlaca ? 'border-destructive' : ''}`}
                    maxLength={8}
                  />
                  {errors.veiculoPlaca && <p className="text-[11px] text-destructive mt-1">{errors.veiculoPlaca}</p>}
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Problema relatado</Label>
                  <Select value={form.motivo} onValueChange={v => set('motivo', v)}>
                    <SelectTrigger className={`text-sm ${errors.motivo ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Selecione o problema" />
                    </SelectTrigger>
                    <SelectContent>
                      {motivos.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.motivo && <p className="text-[11px] text-destructive mt-1">{errors.motivo}</p>}
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Observações do cliente</Label>
                  <Textarea
                    placeholder="Detalhes adicionais..."
                    value={form.observacoes}
                    onChange={e => set('observacoes', e.target.value)}
                    className="text-sm min-h-[70px]"
                    maxLength={500}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Route */}
          {step === 3 && (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <MapPin className="h-3 w-3 text-success" />CEP de origem
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: 01310-100"
                      value={form.origemCep}
                      onChange={e => handleCepChange('origemCep', e.target.value)}
                      className="text-sm font-mono"
                      maxLength={9}
                    />
                    {cepLoading && <Loader2 className="h-3.5 w-3.5 animate-spin absolute right-3 top-2.5 text-muted-foreground" />}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <MapPin className="h-3 w-3 text-success" />Endereço de origem
                  </Label>
                  <Input
                    placeholder="Preenchido automaticamente pelo CEP"
                    value={form.origemEndereco}
                    onChange={e => set('origemEndereco', e.target.value)}
                    className={`text-sm ${errors.origemEndereco ? 'border-destructive' : ''}`}
                    maxLength={200}
                  />
                  {errors.origemEndereco && <p className="text-[11px] text-destructive mt-1">{errors.origemEndereco}</p>}
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <MapPin className="h-3 w-3 text-destructive" />CEP de destino
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: 01413-000"
                      value={form.destinoCep}
                      onChange={e => handleCepChange('destinoCep', e.target.value)}
                      className="text-sm font-mono"
                      maxLength={9}
                    />
                    {cepLoading && <Loader2 className="h-3.5 w-3.5 animate-spin absolute right-3 top-2.5 text-muted-foreground" />}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                    <MapPin className="h-3 w-3 text-destructive" />Endereço de destino
                  </Label>
                  <Input
                    placeholder="Preenchido automaticamente pelo CEP"
                    value={form.destinoEndereco}
                    onChange={e => set('destinoEndereco', e.target.value)}
                    className={`text-sm ${errors.destinoEndereco ? 'border-destructive' : ''}`}
                    maxLength={200}
                  />
                  {errors.destinoEndereco && <p className="text-[11px] text-destructive mt-1">{errors.destinoEndereco}</p>}
                </div>

                {/* Preview summary */}
                <div className="p-3 rounded-lg bg-muted/20 border space-y-2 mt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resumo da solicitação</p>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{form.clienteNome}</span></div>
                    <div><span className="text-muted-foreground">Canal:</span> <Badge variant="outline" className="text-[10px] ml-1">{form.canal}</Badge></div>
                    <div><span className="text-muted-foreground">Veículo:</span> <span className="font-medium">{form.veiculoModelo}</span></div>
                    <div><span className="text-muted-foreground">Placa:</span> <span className="font-mono font-medium">{form.veiculoPlaca}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Problema:</span> <span className="font-medium">{form.motivo}</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2)} className="text-xs">
              Voltar
            </Button>
          )}
          <Button onClick={handleNext} className="text-xs gap-1.5">
            {step < 3 ? (
              <>Próximo<ArrowRight className="h-3 w-3" /></>
            ) : (
              <>
                <MessageCircle className="h-3 w-3" />
                Registrar solicitação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
