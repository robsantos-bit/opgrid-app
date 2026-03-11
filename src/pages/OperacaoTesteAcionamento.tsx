import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Radio, Send, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface TesteLog {
  id: string;
  canal: string;
  destino: string;
  status: 'Enviado' | 'Entregue' | 'Falhou';
  dataHora: string;
  latencia: string;
}

export default function OperacaoTesteAcionamento() {
  const [canal, setCanal] = useState('whatsapp');
  const [destino, setDestino] = useState('');
  const [logs, setLogs] = useState<TesteLog[]>([]);

  const handleTeste = () => {
    if (!destino) { toast.error('Informe o destino do teste.'); return; }
    const novo: TesteLog = {
      id: `t${Date.now()}`,
      canal: canal === 'whatsapp' ? 'WhatsApp' : canal === 'sms' ? 'SMS' : 'Push',
      destino,
      status: Math.random() > 0.2 ? 'Entregue' : 'Falhou',
      dataHora: new Date().toLocaleString('pt-BR'),
      latencia: `${(Math.random() * 3 + 0.5).toFixed(1)}s`,
    };
    setLogs(prev => [novo, ...prev]);
    toast.success(`Teste de acionamento enviado via ${novo.canal}.`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Teste de Acionamento</h1>
          <p>Simule envios para validar canais de comunicação e latência</p>
        </div>
      </div>

      <Card><CardContent className="p-5">
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Canal</Label>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="push">Push Notification</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Destino (telefone ou ID)</Label>
            <Input value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ex: 11999999999" />
          </div>
          <Button onClick={handleTeste}><Send className="h-4 w-4 mr-1.5" />Enviar Teste</Button>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="kpi-card"><div className="kpi-icon bg-success/10 text-success"><CheckCircle2 className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Entregues</p><p className="kpi-value">{logs.filter(l => l.status === 'Entregue').length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-destructive/10 text-destructive"><AlertTriangle className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Falharam</p><p className="kpi-value">{logs.filter(l => l.status === 'Falhou').length}</p></div></div>
        <div className="kpi-card"><div className="kpi-icon bg-info/10 text-info"><Clock className="h-4.5 w-4.5" /></div><div><p className="kpi-label">Total testes</p><p className="kpi-value">{logs.length}</p></div></div>
      </div>

      {logs.length > 0 && (
        <Card><CardContent className="p-0">
          <div className="divide-y">
            {logs.map(l => (
              <div key={l.id} className="flex items-center gap-4 px-4 py-3">
                <Badge variant="outline" className="font-semibold text-[11px]">{l.canal}</Badge>
                <span className="text-[13px] font-medium flex-1">{l.destino}</span>
                <span className="text-[11px] text-muted-foreground">{l.latencia}</span>
                <Badge variant={l.status === 'Entregue' ? 'success' : 'destructive'} className="font-semibold text-[11px]">{l.status}</Badge>
                <span className="text-[11px] text-muted-foreground">{l.dataHora}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {logs.length === 0 && (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <div className="empty-state"><div className="empty-state-icon"><Radio className="h-5 w-5 text-muted-foreground" /></div><p className="empty-state-title">Nenhum teste realizado</p><p className="empty-state-description">Envie um teste acima para validar os canais de acionamento</p></div>
        </CardContent></Card>
      )}
    </div>
  );
}
