import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCepLookup } from '@/hooks/useCepLookup';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, CheckCircle2, Building2, MapPin, Wrench, Settings, FileText, Shield } from 'lucide-react';

const TIPOS_SERVICO_PRINCIPAL = [
  'Guincho', 'Plataforma', 'Apoio', 'Munck', 'Borracharia', 'Chaveiro', 'Socorro mecânico', 'Socorro elétrico', 'Outro',
];

const SERVICOS_PRESTADOS = [
  'Reboque leve', 'Reboque pesado', 'Plataforma', 'Pane elétrica', 'Pane mecânica',
  'Troca de pneu', 'Carga de bateria', 'Chaveiro', 'Munck', 'Borracharia', 'Apoio operacional', 'Outro',
];

const TIPOS_VEICULO = [
  'Moto', 'Passeio', 'Utilitário', 'SUV', 'Caminhonete', 'Van',
  'Caminhão leve', 'Caminhão pesado', 'Ônibus', 'Máquina / equipamento',
];

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const formSchema = z.object({
  razao_social: z.string().min(3, 'Razão social é obrigatória').max(200),
  nome_fantasia: z.string().max(200).optional().or(z.literal('')),
  documento: z.string().min(11, 'CPF ou CNPJ é obrigatório').max(18),
  responsavel: z.string().min(3, 'Nome do responsável é obrigatório').max(100),
  telefone: z.string().min(10, 'Telefone é obrigatório').max(20),
  whatsapp: z.string().min(10, 'WhatsApp é obrigatório').max(20),
  email: z.string().email('Email inválido'),
  cep: z.string().max(10).optional().or(z.literal('')),
  endereco: z.string().max(300).optional().or(z.literal('')),
  numero: z.string().max(20).optional().or(z.literal('')),
  bairro: z.string().max(100).optional().or(z.literal('')),
  cidade: z.string().min(2, 'Cidade é obrigatória').max(100),
  estado: z.string().min(2, 'Estado é obrigatório'),
  cobertura_texto: z.string().min(3, 'Área de cobertura é obrigatória').max(500),
  tipo_principal: z.string().min(1, 'Tipo principal é obrigatório'),
  servicos: z.array(z.string()).min(1, 'Selecione ao menos um serviço'),
  tipos_veiculo: z.array(z.string()).min(1, 'Selecione ao menos um tipo de veículo'),
  atendimento_24h: z.boolean(),
  possui_plataforma: z.boolean(),
  possui_patins: z.boolean(),
  possui_patio: z.boolean(),
  possui_rastreador: z.boolean(),
  atende_rodovia: z.boolean(),
  atende_noturno: z.boolean(),
  qtd_veiculos: z.string().max(50).optional().or(z.literal('')),
  observacoes: z.string().max(1000).optional().or(z.literal('')),
  aceite_contato: z.boolean().refine(v => v, 'Você precisa autorizar o contato'),
  aceite_dados: z.boolean().refine(v => v, 'Você precisa aceitar os termos'),
});

type FormData = z.infer<typeof formSchema>;

export default function QueroSerPrestador() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { lookupCep, loading: cepLoading } = useCepLookup();
  const { lookupCnpj, loading: cnpjLoading } = useCnpjLookup();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razao_social: '', nome_fantasia: '', documento: '', responsavel: '',
      telefone: '', whatsapp: '', email: '', cep: '', endereco: '', numero: '',
      bairro: '', cidade: '', estado: '', cobertura_texto: '', tipo_principal: '',
      servicos: [], tipos_veiculo: [],
      atendimento_24h: false, possui_plataforma: false, possui_patins: false,
      possui_patio: false, possui_rastreador: false, atende_rodovia: false, atende_noturno: false,
      qtd_veiculos: '', observacoes: '',
      aceite_contato: false, aceite_dados: false,
    },
  });

  const servicos = watch('servicos');
  const tipos_veiculo = watch('tipos_veiculo');

  const handleDocumentoBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const doc = e.target.value.replace(/\D/g, '');
    if (doc.length === 14) {
      const result = await lookupCnpj(e.target.value);
      if (result) {
        if (result.razao_social) setValue('razao_social', result.razao_social);
        if (result.nome_fantasia) setValue('nome_fantasia', result.nome_fantasia);
        if (result.telefone) setValue('telefone', result.telefone);
        if (result.email) setValue('email', result.email);
        if (result.cep) setValue('cep', result.cep);
        if (result.logradouro) setValue('endereco', result.logradouro);
        if (result.numero) setValue('numero', result.numero);
        if (result.bairro) setValue('bairro', result.bairro);
        if (result.municipio) setValue('cidade', result.municipio);
        if (result.uf) setValue('estado', result.uf, { shouldValidate: true });
        toast.success('Dados do CNPJ preenchidos automaticamente');
      }
    }
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const result = await lookupCep(e.target.value);
    if (result) {
      if (result.logradouro) setValue('endereco', result.logradouro);
      if (result.bairro) setValue('bairro', result.bairro);
      if (result.localidade) setValue('cidade', result.localidade);
      if (result.uf) setValue('estado', result.uf, { shouldValidate: true });
      toast.success('Endereço preenchido automaticamente');
    }
  };

  const toggleArray = (field: 'servicos' | 'tipos_veiculo', value: string) => {
    const current = field === 'servicos' ? servicos : tipos_veiculo;
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setValue(field, next, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('prestador_leads').insert({
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || null,
        documento: data.documento,
        responsavel: data.responsavel,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,
        cep: data.cep || null,
        endereco: data.endereco || null,
        numero: data.numero || null,
        bairro: data.bairro || null,
        cidade: data.cidade,
        estado: data.estado,
        cobertura_texto: data.cobertura_texto,
        tipo_principal: data.tipo_principal,
        servicos_json: data.servicos,
        tipos_veiculo_json: data.tipos_veiculo,
        atendimento_24h: data.atendimento_24h,
        possui_plataforma: data.possui_plataforma,
        possui_patins: data.possui_patins,
        possui_patio: data.possui_patio,
        possui_rastreador: data.possui_rastreador,
        atende_rodovia: data.atende_rodovia,
        atende_noturno: data.atende_noturno,
        qtd_veiculos: data.qtd_veiculos || null,
        observacoes: data.observacoes || null,
        origem: 'site',
      } as any);

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error('Erro ao enviar pré-cadastro. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center border-0 shadow-2xl">
          <CardContent className="pt-12 pb-10 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Pré-cadastro enviado!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Recebemos seus dados com sucesso. Nossa equipe fará a análise e entrará em contato em breve pelo WhatsApp ou e-mail informado.
            </p>
            <Badge variant="outline" className="text-accent border-accent/30">Em análise</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, step }: { icon: any; title: string; step: number }) => (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">{step}</div>
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  );

  const FieldError = ({ msg }: { msg?: string }) => msg ? <p className="text-sm text-destructive mt-1">{msg}</p> : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-sm">
            Faça parte da rede
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Quero ser prestador
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Preencha o formulário abaixo para iniciar seu processo de credenciamento. É rápido, seguro e sem compromisso.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 pb-16">
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* 1. Dados da empresa */}
              <SectionHeader icon={Building2} title="Dados da empresa" step={1} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Razão Social / Nome Completo *</Label>
                  <Input {...register('razao_social')} placeholder="Nome completo ou razão social" />
                  <FieldError msg={errors.razao_social?.message} />
                </div>
                <div>
                  <Label>Nome Fantasia</Label>
                  <Input {...register('nome_fantasia')} placeholder="Nome fantasia (opcional)" />
                </div>
                <div>
                  <Label>CNPJ / CPF *</Label>
                  <Input {...register('documento')} placeholder="00.000.000/0000-00" onBlur={handleDocumentoBlur} />
                  {cnpjLoading && <p className="text-xs text-muted-foreground mt-1">Buscando dados do CNPJ...</p>}
                  <FieldError msg={errors.documento?.message} />
                </div>
                <div>
                  <Label>Nome do Responsável *</Label>
                  <Input {...register('responsavel')} placeholder="Nome completo" />
                  <FieldError msg={errors.responsavel?.message} />
                </div>
                <div>
                  <Label>Telefone *</Label>
                  <Input {...register('telefone')} placeholder="(00) 0000-0000" />
                  <FieldError msg={errors.telefone?.message} />
                </div>
                <div>
                  <Label>WhatsApp *</Label>
                  <Input {...register('whatsapp')} placeholder="(00) 00000-0000" />
                  <FieldError msg={errors.whatsapp?.message} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input {...register('email')} type="email" placeholder="email@empresa.com" />
                  <FieldError msg={errors.email?.message} />
                </div>
              </div>

              <Separator />

              {/* 2. Localização */}
              <SectionHeader icon={MapPin} title="Localização e cobertura" step={2} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input {...register('cep')} placeholder="00000-000" onBlur={handleCepBlur} />
                  {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>}
                </div>
                <div className="md:col-span-2">
                  <Label>Endereço</Label>
                  <Input {...register('endereco')} placeholder="Rua, avenida..." />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input {...register('numero')} placeholder="Nº" />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input {...register('bairro')} placeholder="Bairro" />
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <Input {...register('cidade')} placeholder="Cidade" />
                  <FieldError msg={errors.cidade?.message} />
                </div>
                <div>
                  <Label>Estado *</Label>
                  <Select onValueChange={v => setValue('estado', v, { shouldValidate: true })} value={watch('estado')}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError msg={errors.estado?.message} />
                </div>
                <div className="md:col-span-3">
                  <Label>Área de cobertura *</Label>
                  <Textarea {...register('cobertura_texto')} placeholder="Descreva as cidades, regiões ou rodovias atendidas" rows={3} />
                  <FieldError msg={errors.cobertura_texto?.message} />
                </div>
              </div>

              <Separator />

              {/* 3. Capacidade operacional */}
              <SectionHeader icon={Wrench} title="Capacidade operacional" step={3} />
              <div className="space-y-5">
                <div>
                  <Label>Tipo principal de serviço *</Label>
                  <Select onValueChange={v => setValue('tipo_principal', v, { shouldValidate: true })} value={watch('tipo_principal')}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_SERVICO_PRINCIPAL.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError msg={errors.tipo_principal?.message} />
                </div>

                <div>
                  <Label className="mb-3 block">Serviços prestados *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SERVICOS_PRESTADOS.map(s => (
                      <label key={s} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${servicos.includes(s) ? 'border-primary bg-primary/5 text-foreground' : 'border-border hover:border-primary/40 text-muted-foreground'}`}>
                        <Checkbox checked={servicos.includes(s)} onCheckedChange={() => toggleArray('servicos', s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                  <FieldError msg={errors.servicos?.message} />
                </div>

                <div>
                  <Label className="mb-3 block">Tipos de veículos atendidos *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TIPOS_VEICULO.map(v => (
                      <label key={v} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${tipos_veiculo.includes(v) ? 'border-primary bg-primary/5 text-foreground' : 'border-border hover:border-primary/40 text-muted-foreground'}`}>
                        <Checkbox checked={tipos_veiculo.includes(v)} onCheckedChange={() => toggleArray('tipos_veiculo', v)} />
                        {v}
                      </label>
                    ))}
                  </div>
                  <FieldError msg={errors.tipos_veiculo?.message} />
                </div>
              </div>

              <Separator />

              {/* 4. Estrutura */}
              <SectionHeader icon={Settings} title="Estrutura" step={4} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['atendimento_24h', 'Atendimento 24 horas'],
                  ['possui_plataforma', 'Possui plataforma'],
                  ['possui_patins', 'Possui patins'],
                  ['possui_patio', 'Possui pátio'],
                  ['possui_rastreador', 'Possui veículo rastreado'],
                  ['atende_rodovia', 'Atende rodovias'],
                  ['atende_noturno', 'Atende período noturno'],
                ] as const).map(([field, label]) => (
                  <div key={field} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <Label className="cursor-pointer">{label}</Label>
                    <Switch checked={watch(field)} onCheckedChange={v => setValue(field, v)} />
                  </div>
                ))}
              </div>

              <Separator />

              {/* 5. Informações adicionais */}
              <SectionHeader icon={FileText} title="Informações adicionais" step={5} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade de veículos/equipamentos</Label>
                  <Input {...register('qtd_veiculos')} placeholder="Ex: 3 guinchos, 1 plataforma" />
                </div>
                <div className="md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea {...register('observacoes')} placeholder="Algo mais que deseja informar?" rows={3} />
                </div>
              </div>

              <Separator />

              {/* 6. Aceites */}
              <SectionHeader icon={Shield} title="Termos e autorizações" step={6} />
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={watch('aceite_contato')} onCheckedChange={v => setValue('aceite_contato', !!v, { shouldValidate: true })} className="mt-0.5" />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    Autorizo o contato da equipe para análise do cadastro e envio de oportunidades operacionais.
                  </span>
                </label>
                <FieldError msg={errors.aceite_contato?.message} />

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={watch('aceite_dados')} onCheckedChange={v => setValue('aceite_dados', !!v, { shouldValidate: true })} className="mt-0.5" />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    Declaro que as informações prestadas são verdadeiras e autorizo o tratamento dos dados para fins de cadastro e análise operacional.
                  </span>
                </label>
                <FieldError msg={errors.aceite_dados?.message} />
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" className="w-full text-base font-semibold h-12" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...</> : 'Enviar pré-cadastro'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Seus dados estão protegidos e serão utilizados exclusivamente para fins de credenciamento.
        </p>
      </div>
    </div>
  );
}
