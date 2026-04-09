import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCepLookup } from '@/hooks/useCepLookup';
import { toast } from 'sonner';
import {
  Loader2, MapPin, Car, User, Phone, FileText, Clock, Link2,
  DollarSign, Route, Eye, EyeOff, Send, Zap
} from 'lucide-react';

const TIPOS_SERVICO = [
  'Guincho Leve', 'Guincho Pesado', 'Guincho Moto',
  'Socorro Mecânico', 'Troca de Pneu', 'Carga de Bateria',
  'Chaveiro', 'Transporte', 'Remoção', 'Outro'
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function NovoAcionamentoDialog({ open, onOpenChange, onCreated }: Props) {
  const { lookupCep, loading: cepLoading } = useCepLookup();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    protocolo: '',
    dataHora: new Date().toISOString().slice(0, 16),
    previsaoChegadaMin: '60',
    servicoAgendado: false,
    clienteId: '',
    tipoServico: '',
    nomeSolicitante: '',
    whatsapp: '',
    ocultarWhatsappMotorista: false,
    placa: '',
    modelo: '',
    cor: '',
    // Origem
    origemCep: '',
    origemRua: '',
    origemNumero: '',
    origemComplemento: '',
    origemBairro: '',
    origemCidade: '',
    origemUf: '',
    origemReferencia: '',
    // Destino
    destinoCep: '',
    destinoRua: '',
    destinoNumero: '',
    destinoComplemento: '',
    destinoBairro: '',
    destinoCidade: '',
    destinoUf: '',
    destinoReferencia: '',
    // Link de localização
    linkLocalizacao: '',
    // Valores
    valorServico: '',
    kmTotal: '',
    valorDiferenteMotorista: false,
    valorMotorista: '',
    // Observações
    observacoes: '',
    cobrancaAutomatica: false,
  });

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCepLookup = async (tipo: 'origem' | 'destino') => {
    const cep = tipo === 'origem' ? form.origemCep : form.destinoCep;
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;
    const result = await lookupCep(cep);
    if (result) {
      if (tipo === 'origem') {
        setForm(prev => ({
          ...prev,
          origemRua: result.logradouro || '',
          origemBairro: result.bairro || '',
          origemCidade: result.localidade || '',
          origemUf: result.uf || '',
        }));
      } else {
        setForm(prev => ({
          ...prev,
          destinoRua: result.logradouro || '',
          destinoBairro: result.bairro || '',
          destinoCidade: result.localidade || '',
          destinoUf: result.uf || '',
        }));
      }
      toast.success('Endereço preenchido!');
    }
  };

  const buildEnderecoString = (tipo: 'origem' | 'destino') => {
    const prefix = tipo === 'origem' ? 'origem' : 'destino';
    const rua = (form as any)[`${prefix}Rua`];
    const num = (form as any)[`${prefix}Numero`];
    const bairro = (form as any)[`${prefix}Bairro`];
    const cidade = (form as any)[`${prefix}Cidade`];
    const uf = (form as any)[`${prefix}Uf`];
    return [rua, num, bairro, cidade ? `${cidade}/${uf}` : ''].filter(Boolean).join(', ');
  };

  const handleSubmit = async () => {
    if (!form.modelo.trim()) {
      toast.error('Modelo do veículo é obrigatório');
      return;
    }
    if (!form.tipoServico) {
      toast.error('Tipo de serviço é obrigatório');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const protocolo = form.protocolo.trim() || `OS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
      const origemEndereco = buildEnderecoString('origem');
      const destinoEndereco = buildEnderecoString('destino');

      const { data, error } = await supabase.from('solicitacoes').insert({
        protocolo,
        data_hora: form.dataHora ? new Date(form.dataHora).toISOString() : now,
        cliente_nome: form.nomeSolicitante.trim() || 'Cliente direto',
        cliente_telefone: form.whatsapp.trim(),
        cliente_whatsapp: form.whatsapp.trim(),
        placa: form.placa.trim().toUpperCase(),
        tipo_veiculo: form.tipoServico,
        modelo_veiculo: form.modelo.trim(),
        cor: form.cor.trim(),
        origem: origemEndereco,
        origem_endereco: origemEndereco,
        destino: destinoEndereco,
        destino_endereco: destinoEndereco,
        motivo: form.tipoServico,
        observacoes: form.observacoes.trim(),
        valor_estimado: form.valorServico ? parseFloat(form.valorServico) : null,
        distancia_km: form.kmTotal ? parseFloat(form.kmTotal) : null,
        status: 'Recebida',
        canal: 'Web',
      }).select().single();

      if (error) throw error;

      toast.success('Acionamento criado com sucesso!', {
        description: `${protocolo} — ${form.modelo} • ${form.placa}`,
      });

      // Reset form
      setForm({
        protocolo: '', dataHora: new Date().toISOString().slice(0, 16),
        previsaoChegadaMin: '60', servicoAgendado: false, clienteId: '',
        tipoServico: '', nomeSolicitante: '', whatsapp: '',
        ocultarWhatsappMotorista: false, placa: '', modelo: '', cor: '',
        origemCep: '', origemRua: '', origemNumero: '', origemComplemento: '',
        origemBairro: '', origemCidade: '', origemUf: '', origemReferencia: '',
        destinoCep: '', destinoRua: '', destinoNumero: '', destinoComplemento: '',
        destinoBairro: '', destinoCidade: '', destinoUf: '', destinoReferencia: '',
        linkLocalizacao: '', valorServico: '', kmTotal: '',
        valorDiferenteMotorista: false, valorMotorista: '',
        observacoes: '', cobrancaAutomatica: false,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast.error('Erro ao criar acionamento', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-bold">Novo Acionamento</DialogTitle>
          <p className="text-xs text-muted-foreground">Crie um novo acionamento de serviço</p>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
          <div className="space-y-5 pb-6 pt-2">

            {/* Protocolo + Data/Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Protocolo</Label>
                <Input placeholder="Número do protocolo" value={form.protocolo}
                  onChange={e => set('protocolo', e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Data/Hora do Serviço</Label>
                <Input type="datetime-local" value={form.dataHora}
                  onChange={e => set('dataHora', e.target.value)} className="text-sm" />
              </div>
            </div>

            {/* Previsão + Agendado */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />Previsão de Chegada (min)
                </Label>
                <Input type="number" value={form.previsaoChegadaMin}
                  onChange={e => set('previsaoChegadaMin', e.target.value)} className="text-sm w-40" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.servicoAgendado}
                  onCheckedChange={v => set('servicoAgendado', v)} />
                <Label className="text-xs">Serviço Agendado</Label>
              </div>
            </div>

            <Separator />

            {/* Cliente + Tipo Serviço */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />Cliente *
                </Label>
                <Input placeholder="Nome do cliente" value={form.nomeSolicitante}
                  onChange={e => set('nomeSolicitante', e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Tipo de Serviço *</Label>
                <Select value={form.tipoServico} onValueChange={v => set('tipoServico', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SERVICO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nome Solicitante + WhatsApp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Nome do Solicitante</Label>
                <Input placeholder="Se diferente do cliente" value={form.nomeSolicitante}
                  onChange={e => set('nomeSolicitante', e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />WhatsApp
                </Label>
                <Input placeholder="(11) 99999-9999" value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)} className="text-sm" />
                <div className="flex items-center gap-2 mt-1.5">
                  <Checkbox checked={form.ocultarWhatsappMotorista}
                    onCheckedChange={v => set('ocultarWhatsappMotorista', !!v)} />
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {form.ocultarWhatsappMotorista ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    Ocultar para motorista
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Placa + Modelo + Cor */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Car className="h-3 w-3 text-muted-foreground" />Placa
                </Label>
                <Input placeholder="ABC1D23" value={form.placa}
                  onChange={e => set('placa', e.target.value.toUpperCase())}
                  className="text-sm font-mono" maxLength={7} />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Modelo *</Label>
                <Input placeholder="Ex: GOL, CIVIC, HB20" value={form.modelo}
                  onChange={e => set('modelo', e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Cor</Label>
                <Input placeholder="Cor" value={form.cor}
                  onChange={e => set('cor', e.target.value)} className="text-sm" />
              </div>
            </div>

            <Separator />

            {/* Endereço de Origem */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-success" />Endereço de Origem
                </Label>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-[11px] text-muted-foreground mb-1 block">CEP</Label>
                  <div className="flex gap-1">
                    <Input placeholder="00000-000" value={form.origemCep}
                      onChange={e => set('origemCep', e.target.value)}
                      className="text-sm font-mono w-32" maxLength={9} />
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => handleCepLookup('origem')} disabled={cepLoading}>
                      {cepLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Rua/Logradouro</Label>
                <Input placeholder="Digite a rua ou preencha pelo CEP" value={form.origemRua}
                  onChange={e => set('origemRua', e.target.value)} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">Número</Label>
                  <Input placeholder="123" value={form.origemNumero}
                    onChange={e => set('origemNumero', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">Complemento</Label>
                  <Input placeholder="Apto, Sala, etc" value={form.origemComplemento}
                    onChange={e => set('origemComplemento', e.target.value)} className="text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Bairro</Label>
                <Input value={form.origemBairro}
                  onChange={e => set('origemBairro', e.target.value)} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">Cidade</Label>
                  <Input value={form.origemCidade}
                    onChange={e => set('origemCidade', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">UF</Label>
                  <Input value={form.origemUf} maxLength={2}
                    onChange={e => set('origemUf', e.target.value.toUpperCase())} className="text-sm w-20" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Ponto de referência</Label>
                <Input placeholder="Ex: portão azul" value={form.origemReferencia}
                  onChange={e => set('origemReferencia', e.target.value)} className="text-sm" />
              </div>
            </div>

            {/* Endereço de Destino */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-destructive" />Endereço de Destino
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-[11px] text-muted-foreground mb-1 block">CEP</Label>
                  <div className="flex gap-1">
                    <Input placeholder="00000-000" value={form.destinoCep}
                      onChange={e => set('destinoCep', e.target.value)}
                      className="text-sm font-mono w-32" maxLength={9} />
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => handleCepLookup('destino')} disabled={cepLoading}>
                      {cepLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Rua/Logradouro</Label>
                <Input placeholder="Digite a rua ou preencha pelo CEP" value={form.destinoRua}
                  onChange={e => set('destinoRua', e.target.value)} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">Número</Label>
                  <Input placeholder="123" value={form.destinoNumero}
                    onChange={e => set('destinoNumero', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">Complemento</Label>
                  <Input placeholder="Apto, Sala, etc" value={form.destinoComplemento}
                    onChange={e => set('destinoComplemento', e.target.value)} className="text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Bairro</Label>
                <Input value={form.destinoBairro}
                  onChange={e => set('destinoBairro', e.target.value)} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">Cidade</Label>
                  <Input value={form.destinoCidade}
                    onChange={e => set('destinoCidade', e.target.value)} className="text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1 block">UF</Label>
                  <Input value={form.destinoUf} maxLength={2}
                    onChange={e => set('destinoUf', e.target.value.toUpperCase())} className="text-sm w-20" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Ponto de referência</Label>
                <Input placeholder="Ex: portão azul" value={form.destinoReferencia}
                  onChange={e => set('destinoReferencia', e.target.value)} className="text-sm" />
              </div>
            </div>

            {/* Link de Localização */}
            <div>
              <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <Link2 className="h-3 w-3 text-muted-foreground" />Link de Localização (WhatsApp, Google Maps)
              </Label>
              <Input placeholder="Cole o link de localização compartilhado pelo cliente..."
                value={form.linkLocalizacao} onChange={e => set('linkLocalizacao', e.target.value)} className="text-sm" />
              <p className="text-[10px] text-muted-foreground mt-1">Quando o cliente enviar sua localização, cole o link aqui</p>
            </div>

            <Separator />

            {/* Valor + KM */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />Valor do Serviço (R$)
                </Label>
                <Input type="number" step="0.01" placeholder="Ex: 150,00" value={form.valorServico}
                  onChange={e => set('valorServico', e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Route className="h-3 w-3 text-muted-foreground" />KM Total
                </Label>
                <Input type="number" step="0.1" placeholder="Ex: 25" value={form.kmTotal}
                  onChange={e => set('kmTotal', e.target.value)} className="text-sm" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Calculado automaticamente: Base → Origem → Destino → Base
                </p>
              </div>
            </div>

            {/* Valor diferente Motorista/Agregado */}
            <div className="p-4 rounded-lg border bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">Valor diferente para Motorista/Agregado</p>
                  <p className="text-[10px] text-muted-foreground">Ative para informar um valor diferente que o motorista verá</p>
                </div>
                <Switch checked={form.valorDiferenteMotorista}
                  onCheckedChange={v => set('valorDiferenteMotorista', v)} />
              </div>
              {form.valorDiferenteMotorista && (
                <div className="mt-3">
                  <Label className="text-xs font-semibold mb-1.5 block">Valor para o Motorista (R$)</Label>
                  <Input type="number" step="0.01" placeholder="Valor que o motorista verá"
                    value={form.valorMotorista} onChange={e => set('valorMotorista', e.target.value)}
                    className="text-sm" />
                  {form.valorServico && form.valorMotorista && (
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[10px]">
                        Cliente: R$ {parseFloat(form.valorServico).toFixed(2)}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Motorista: R$ {parseFloat(form.valorMotorista).toFixed(2)}
                      </Badge>
                      <Badge variant={parseFloat(form.valorServico) > parseFloat(form.valorMotorista) ? 'success' : 'destructive'}
                        className="text-[10px]">
                        Margem: R$ {(parseFloat(form.valorServico) - parseFloat(form.valorMotorista)).toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Observações</Label>
              <Textarea placeholder="Informações adicionais..." value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)} className="text-sm min-h-[80px]" />
            </div>

            {/* Cobrança automática */}
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <Checkbox checked={form.cobrancaAutomatica}
                  onCheckedChange={v => set('cobrancaAutomatica', !!v)} className="mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase">Enviar mensagem de cobrança automática no fim do atendimento</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Após o acionamento ser finalizado, aguarda 1 minuto e envia o template de cobrança com o link de pagamento para o solicitante via WhatsApp.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="text-xs gap-1.5">
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Criar Acionamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
