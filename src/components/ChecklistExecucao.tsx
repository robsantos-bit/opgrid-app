import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import SignaturePad from './SignaturePad';
import {
  Camera, Trash2, FileDown, CheckCircle2, AlertTriangle, Car,
  ClipboardCheck, MapPin, User, FileText, ArrowLeft
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type ChecklistTipo = 'coleta' | 'entrega';

interface ItemVistoria {
  id: string;
  label: string;
  checked: boolean;
  obs: string;
}

interface AvariaPonto {
  id: string;
  local: string;
  descricao: string;
  gravidade: 'Leve' | 'Moderado' | 'Grave';
}

const ITENS_COLETA: Omit<ItemVistoria, 'checked' | 'obs'>[] = [
  { id: 'c1', label: 'Veículo destravado / chave entregue' },
  { id: 'c2', label: 'Documentos do veículo conferidos (CRLV)' },
  { id: 'c3', label: 'Pneus em condições visuais (sem furos visíveis)' },
  { id: 'c4', label: 'Painel sem luzes de alerta ativas' },
  { id: 'c5', label: 'Nível de combustível registrado' },
  { id: 'c6', label: 'Retrovisores e vidros íntegros' },
  { id: 'c7', label: 'Pintura e lataria inspecionadas' },
  { id: 'c8', label: 'Estofamento e interior sem danos' },
  { id: 'c9', label: 'Estepe e macaco presentes' },
  { id: 'c10', label: 'Quilometragem registrada' },
  { id: 'c11', label: 'Pertences pessoais retirados pelo cliente' },
  { id: 'c12', label: 'Fotos da vistoria capturadas' },
];

const ITENS_ENTREGA: Omit<ItemVistoria, 'checked' | 'obs'>[] = [
  { id: 'e1', label: 'Veículo entregue no local correto' },
  { id: 'e2', label: 'Conferência visual da lataria na entrega' },
  { id: 'e3', label: 'Documentos devolvidos ao recebedor' },
  { id: 'e4', label: 'Chaves entregues ao responsável' },
  { id: 'e5', label: 'Quilometragem conferida na entrega' },
  { id: 'e6', label: 'Nível de combustível conferido' },
  { id: 'e7', label: 'Sem avarias adicionais identificadas' },
  { id: 'e8', label: 'Pertences conferidos (se aplicável)' },
  { id: 'e9', label: 'Fotos de entrega capturadas' },
  { id: 'e10', label: 'Assinatura do recebedor coletada' },
];

const LOCAIS_AVARIA = [
  'Parachoque dianteiro', 'Parachoque traseiro', 'Porta dianteira esquerda',
  'Porta dianteira direita', 'Porta traseira esquerda', 'Porta traseira direita',
  'Capô', 'Teto', 'Para-lama dianteiro esquerdo', 'Para-lama dianteiro direito',
  'Para-lama traseiro esquerdo', 'Para-lama traseiro direito', 'Para-brisa',
  'Vidro traseiro', 'Retrovisor esquerdo', 'Retrovisor direito', 'Farol dianteiro',
  'Lanterna traseira', 'Roda / Pneu', 'Outro'
];

interface ChecklistExecucaoProps {
  tipo: ChecklistTipo;
  protocolo?: string;
  placa?: string;
  prestador?: string;
  onVoltar?: () => void;
}

export default function ChecklistExecucao({ tipo, protocolo = 'SOL-DEMO01', placa = 'ABC1D23', prestador = 'Prestador Demo', onVoltar }: ChecklistExecucaoProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templateItens = tipo === 'coleta' ? ITENS_COLETA : ITENS_ENTREGA;
  const [itens, setItens] = useState<ItemVistoria[]>(templateItens.map(i => ({ ...i, checked: false, obs: '' })));
  const [avarias, setAvarias] = useState<AvariaPonto[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [km, setKm] = useState('');
  const [combustivel, setCombustivel] = useState('');
  const [obsGeral, setObsGeral] = useState('');
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [gerando, setGerando] = useState(false);

  const toggleItem = (id: string) => setItens(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const setItemObs = (id: string, obs: string) => setItens(prev => prev.map(i => i.id === id ? { ...i, obs } : i));

  const addAvaria = () => setAvarias(prev => [...prev, { id: `av${Date.now()}`, local: '', descricao: '', gravidade: 'Leve' }]);
  const removeAvaria = (id: string) => setAvarias(prev => prev.filter(a => a.id !== id));
  const updateAvaria = (id: string, field: keyof AvariaPonto, value: string) =>
    setAvarias(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  const capturePhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setFotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx: number) => setFotos(prev => prev.filter((_, i) => i !== idx));

  const completados = itens.filter(i => i.checked).length;
  const progresso = Math.round((completados / itens.length) * 100);

  const handleFinalizar = () => {
    if (!assinatura) { toast.error('Colete a assinatura antes de finalizar.'); return; }
    if (completados < itens.length * 0.5) { toast.error('Complete pelo menos 50% dos itens do checklist.'); return; }
    setFinalizado(true);
    toast.success('Checklist finalizado com sucesso!');
  };

  const gerarPDF = async () => {
    if (!contentRef.current) return;
    setGerando(true);
    try {
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/png');

      let yOffset = 0;
      let pageNum = 0;
      while (yOffset < imgH) {
        if (pageNum > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, margin - yOffset, imgW, imgH);
        yOffset += pageH - margin * 2;
        pageNum++;
      }

      const filename = `checklist-${tipo}-${protocolo}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      toast.success('PDF gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar PDF.');
    } finally {
      setGerando(false);
    }
  };

  const titulo = tipo === 'coleta' ? 'Checklist de Coleta' : 'Checklist de Entrega';
  const subtitulo = tipo === 'coleta'
    ? 'Vistoria do veículo na origem — estado, avarias, fotos e assinatura do cliente'
    : 'Vistoria na entrega — conferência, estado final e assinatura do recebedor';

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
      {/* Hidden file input for photo capture */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex items-center gap-3">
        {onVoltar && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onVoltar}><ArrowLeft className="h-4 w-4" /></Button>}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{titulo}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>
        </div>
        {finalizado && (
          <Button onClick={gerarPDF} disabled={gerando} className="gap-1.5">
            <FileDown className="h-4 w-4" />{gerando ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        )}
      </div>

      {/* Printable content */}
      <div ref={contentRef} className="space-y-4">
        {/* Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Protocolo</p><p className="text-sm font-bold font-mono">{protocolo}</p></div></div>
              <div className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Placa</p><p className="text-sm font-bold">{placa}</p></div></div>
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Prestador</p><p className="text-sm font-semibold">{prestador}</p></div></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase">Data/Hora</p><p className="text-sm font-semibold">{new Date().toLocaleString('pt-BR')}</p></div></div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">Progresso: {completados}/{itens.length} itens</p>
              <Badge variant={progresso === 100 ? 'success' : progresso >= 50 ? 'warning' : 'destructive'} className="font-bold">{progresso}%</Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4" /> Dados do Veículo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Quilometragem</Label><Input placeholder="Ex: 45.230" value={km} onChange={e => setKm(e.target.value)} disabled={finalizado} /></div>
              <div className="space-y-1"><Label className="text-xs">Nível de Combustível</Label>
                <Select value={combustivel} onValueChange={setCombustivel} disabled={finalizado}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vazio">Reserva / Vazio</SelectItem>
                    <SelectItem value="1/4">1/4</SelectItem>
                    <SelectItem value="1/2">1/2</SelectItem>
                    <SelectItem value="3/4">3/4</SelectItem>
                    <SelectItem value="cheio">Cheio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Itens de Verificação</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {itens.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                <Checkbox checked={item.checked} onCheckedChange={() => !finalizado && toggleItem(item.id)} disabled={finalizado} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : 'font-medium'}`}>{item.label}</p>
                  {(item.checked || item.obs) && (
                    <Input placeholder="Observação (opcional)" className="mt-1.5 h-7 text-xs" value={item.obs} onChange={e => setItemObs(item.id, e.target.value)} disabled={finalizado} />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Avarias */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Registro de Avarias</CardTitle>
              {!finalizado && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addAvaria}>+ Avaria</Button>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {avarias.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma avaria registrada. Clique em "+ Avaria" para adicionar.</p>
            ) : avarias.map(av => (
              <div key={av.id} className="p-3 border border-border rounded-lg space-y-2.5 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Avaria</p>
                  {!finalizado && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAvaria(av.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={av.local} onValueChange={v => updateAvaria(av.id, 'local', v)} disabled={finalizado}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Local da avaria" /></SelectTrigger>
                    <SelectContent>{LOCAIS_AVARIA.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={av.gravidade} onValueChange={v => updateAvaria(av.id, 'gravidade', v)} disabled={finalizado}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leve">Leve</SelectItem>
                      <SelectItem value="Moderado">Moderado</SelectItem>
                      <SelectItem value="Grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Descrição da avaria" className="h-8 text-xs" value={av.descricao} onChange={e => updateAvaria(av.id, 'descricao', e.target.value)} disabled={finalizado} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Camera className="h-4 w-4" /> Fotos da Vistoria</CardTitle>
              {!finalizado && <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={capturePhoto}><Camera className="h-3 w-3" /> Capturar</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {fotos.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma foto capturada</p>
                {!finalizado && <Button variant="link" size="sm" className="text-xs mt-1" onClick={capturePhoto}>Tirar foto agora</Button>}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, idx) => (
                  <div key={idx} className="relative group">
                    <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-border" />
                    {!finalizado && (
                      <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removePhoto(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Observações Gerais</CardTitle></CardHeader>
          <CardContent>
            <Textarea placeholder="Registre aqui qualquer observação relevante sobre a vistoria..." className="text-sm" rows={3} value={obsGeral} onChange={e => setObsGeral(e.target.value)} disabled={finalizado} />
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{tipo === 'coleta' ? 'Assinatura do Cliente' : 'Assinatura do Recebedor'}</CardTitle></CardHeader>
          <CardContent>
            {finalizado && assinatura ? (
              <div className="border border-border rounded-lg p-2">
                <img src={assinatura} alt="Assinatura" className="w-full h-32 object-contain" />
              </div>
            ) : (
              <SignaturePad
                label={tipo === 'coleta' ? 'Assinatura do Cliente' : 'Assinatura do Recebedor'}
                onSignatureChange={setAssinatura}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Separator />
      <div className="flex justify-between items-center pb-6">
        {finalizado ? (
          <>
            <Badge variant="success" className="text-sm py-1.5 px-3"><CheckCircle2 className="h-4 w-4 mr-1.5" />Checklist Finalizado</Badge>
            <Button onClick={gerarPDF} disabled={gerando} className="gap-1.5"><FileDown className="h-4 w-4" />{gerando ? 'Gerando PDF...' : 'Baixar PDF'}</Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{completados}/{itens.length} verificados • {avarias.length} avaria(s) • {fotos.length} foto(s)</p>
            <Button onClick={handleFinalizar} className="gap-1.5"><CheckCircle2 className="h-4 w-4" />Finalizar Checklist</Button>
          </>
        )}
      </div>
    </div>
  );
}
