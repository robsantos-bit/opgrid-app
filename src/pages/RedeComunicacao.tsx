import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageCircle, Send, Search, Clock, CheckCircle2 } from 'lucide-react';

interface Mensagem {
  id: string;
  destinatario: string;
  canal: string;
  assunto: string;
  status: 'Enviada' | 'Entregue' | 'Lida';
  dataHora: string;
}

const MOCK: Mensagem[] = [
  { id: '1', destinatario: 'Auto Socorro SP', canal: 'WhatsApp', assunto: 'Atualização de contrato', status: 'Lida', dataHora: '2025-03-10T14:30:00' },
  { id: '2', destinatario: 'Guincho Express', canal: 'WhatsApp', assunto: 'Nova tarifa vigente', status: 'Entregue', dataHora: '2025-03-10T10:00:00' },
  { id: '3', destinatario: 'Reboque Rápido', canal: 'E-mail', assunto: 'Documentação pendente', status: 'Enviada', dataHora: '2025-03-09T16:00:00' },
];

export default function RedeComunicacao() {
  const [mensagens, setMensagens] = useState(MOCK);
  const [canal, setCanal] = useState('whatsapp');
  const [destinatario, setDestinatario] = useState('');
  const [assunto, setAssunto] = useState('');
  const [conteudo, setConteudo] = useState('');

  const handleEnviar = () => {
    if (!destinatario || !assunto) { toast.error('Preencha destinatário e assunto.'); return; }
    setMensagens(prev => [{ id: `m${Date.now()}`, destinatario, canal: canal === 'whatsapp' ? 'WhatsApp' : 'E-mail', assunto, status: 'Enviada', dataHora: new Date().toISOString() }, ...prev]);
    setDestinatario(''); setAssunto(''); setConteudo('');
    toast.success('Mensagem enviada.');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Comunicação com Prestadores</h1>
          <p>Envie mensagens individuais e acompanhe o histórico de comunicações</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Lidas</p><p className="kpi-value">{mensagens.filter(m => m.status === 'Lida').length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Send className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Enviadas</p><p className="kpi-value">{mensagens.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-warning/10 text-warning"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Pendentes</p><p className="kpi-value">{mensagens.filter(m => m.status === 'Enviada').length}</p></div></div>
      </div>

      <Card><CardContent className="p-5 space-y-4">
        <p className="text-[13px] font-semibold">Nova mensagem</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Canal</Label><Select value={canal} onValueChange={setCanal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">E-mail</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label className="text-xs">Destinatário</Label><Input value={destinatario} onChange={e => setDestinatario(e.target.value)} placeholder="Nome do prestador" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Assunto</Label><Input value={assunto} onChange={e => setAssunto(e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Mensagem</Label><Textarea value={conteudo} onChange={e => setConteudo(e.target.value)} rows={3} /></div>
        <Button onClick={handleEnviar}><Send className="h-4 w-4 mr-1.5" />Enviar</Button>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <div className="divide-y">
          {mensagens.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3">
              <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[13px]">{m.destinatario}</span>
                  <Badge variant="outline" className="text-[10px]">{m.canal}</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground truncate">{m.assunto}</p>
              </div>
              <Badge variant={m.status === 'Lida' ? 'success' : m.status === 'Entregue' ? 'info' : 'secondary'} className="font-semibold text-[11px]">{m.status}</Badge>
              <span className="text-[11px] text-muted-foreground shrink-0">{new Date(m.dataHora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
