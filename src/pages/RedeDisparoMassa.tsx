import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPrestadores } from '@/data/store';
import { toast } from 'sonner';
import { Megaphone, Send, Users, CheckCircle2, Clock } from 'lucide-react';

interface Campanha {
  id: string;
  titulo: string;
  canal: string;
  destinatarios: number;
  entregues: number;
  status: 'Enviada' | 'Agendada' | 'Rascunho';
  dataHora: string;
}

const MOCK: Campanha[] = [
  { id: '1', titulo: 'Atualização de tabela de preços', canal: 'WhatsApp', destinatarios: 45, entregues: 42, status: 'Enviada', dataHora: '2025-03-10T09:00:00' },
  { id: '2', titulo: 'Treinamento obrigatório - Março', canal: 'E-mail', destinatarios: 38, entregues: 35, status: 'Enviada', dataHora: '2025-03-08T14:00:00' },
  { id: '3', titulo: 'Pesquisa de satisfação Q1', canal: 'WhatsApp', destinatarios: 50, entregues: 0, status: 'Agendada', dataHora: '2025-03-15T10:00:00' },
];

export default function RedeDisparoMassa() {
  const prestadores = useMemo(() => getPrestadores().filter(p => p.status === 'Ativo'), []);
  const [campanhas, setCampanhas] = useState(MOCK);
  const [titulo, setTitulo] = useState('');
  const [canal, setCanal] = useState('whatsapp');
  const [filtroUf, setFiltroUf] = useState('all');
  const [mensagem, setMensagem] = useState('');

  const ufs = useMemo(() => [...new Set(prestadores.map(p => p.uf))].sort(), [prestadores]);
  const destinatarios = filtroUf === 'all' ? prestadores.length : prestadores.filter(p => p.uf === filtroUf).length;

  const handleEnviar = () => {
    if (!titulo || !mensagem) { toast.error('Preencha título e mensagem.'); return; }
    setCampanhas(prev => [{ id: `c${Date.now()}`, titulo, canal: canal === 'whatsapp' ? 'WhatsApp' : 'E-mail', destinatarios, entregues: 0, status: 'Enviada', dataHora: new Date().toISOString() }, ...prev]);
    setTitulo(''); setMensagem('');
    toast.success(`Disparo enviado para ${destinatarios} prestadores.`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Disparo em Massa</h1>
          <p>Envie comunicações em larga escala para a rede de prestadores</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-primary/10 text-primary"><Megaphone className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Campanhas</p><p className="kpi-value">{campanhas.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><Users className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Prestadores ativos</p><p className="kpi-value">{prestadores.length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total entregues</p><p className="kpi-value">{campanhas.reduce((s, c) => s + c.entregues, 0)}</p></div></div>
      </div>

      <Card><CardContent className="p-5 space-y-4">
        <p className="text-[13px] font-semibold">Novo Disparo</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Título</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Atualização de tabela" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Canal</Label><Select value={canal} onValueChange={setCanal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">E-mail</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label className="text-xs">Filtrar por UF</Label><Select value={filtroUf} onValueChange={setFiltroUf}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos ({prestadores.length})</SelectItem>{ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Mensagem</Label><Textarea value={mensagem} onChange={e => setMensagem(e.target.value)} rows={3} placeholder="Conteúdo da mensagem..." /></div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-semibold">{destinatarios} destinatário(s)</Badge>
          <Button onClick={handleEnviar}><Send className="h-4 w-4 mr-1.5" />Enviar Disparo</Button>
        </div>
      </CardContent></Card>

      <div className="space-y-2.5">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Histórico de Disparos</p>
        {campanhas.map(c => (
          <Card key={c.id} className="card-hover">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-5 w-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[13px]">{c.titulo}</span>
                  <Badge variant="outline" className="text-[10px]">{c.canal}</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground">{c.destinatarios} destinatários • {c.entregues} entregues • {new Date(c.dataHora).toLocaleDateString('pt-BR')}</p>
              </div>
              <Badge variant={c.status === 'Enviada' ? 'success' : c.status === 'Agendada' ? 'info' : 'secondary'} className="font-semibold">{c.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
