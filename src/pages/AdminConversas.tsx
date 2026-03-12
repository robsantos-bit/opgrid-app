import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  MessageCircle, Phone, User, Clock, Search, RefreshCw, Headphones,
  CheckCircle2, AlertTriangle, Loader2, Ban, ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationEntry {
  id: string;
  nome: string;
  telefone: string;
  etapa: string;
  status: string;
  ultimaInteracao: string;
  origem: string;
  protocolo?: string;
  atendimentoId?: string;
}

const STEP_LABELS: Record<string, string> = {
  greeting: 'Início', nome: 'Nome', telefone: 'Telefone', placa: 'Veículo',
  localizacao: 'Localização', motivo: 'Motivo', destino: 'Destino',
  observacoes: 'Observações', resumo: 'Resumo', calculando: 'Calculando',
  proposta: 'Proposta', aceite: 'Aceite', gerando_os: 'Gerando OS',
  despacho: 'Despacho', aguardando_prestador: 'Aguardando prestador',
  prestador_confirmado: 'Prestador confirmado', prestador_caminho: 'A caminho',
  prestador_chegou: 'No local', em_atendimento: 'Em atendimento',
  concluido: 'Concluído', cancelado: 'Cancelado',
  encaminhado_humano: 'Encaminhado p/ central',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'Coletando dados':
      return <Badge variant="outline" className="gap-1 text-[10px]"><Loader2 className="h-3 w-3 animate-spin" />{status}</Badge>;
    case 'Proposta enviada':
    case 'Aguardando aceite':
      return <Badge className="bg-warning/10 text-warning border-warning/20 gap-1 text-[10px]"><Clock className="h-3 w-3" />{status}</Badge>;
    case 'OS em andamento':
    case 'Em atendimento':
      return <Badge className="bg-info/10 text-info border-info/20 gap-1 text-[10px]"><ArrowRight className="h-3 w-3" />{status}</Badge>;
    case 'Concluído':
      return <Badge className="bg-success/10 text-success border-success/20 gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" />{status}</Badge>;
    case 'Cancelado':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-[10px]"><Ban className="h-3 w-3" />{status}</Badge>;
    case 'Encaminhado p/ central':
      return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]"><Headphones className="h-3 w-3" />{status}</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

export default function AdminConversas() {
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [search, setSearch] = useState('');

  const loadConversations = () => {
    try {
      const data = JSON.parse(localStorage.getItem('opgrid_wa_conversations') || '[]');
      setConversations(data);
    } catch {
      setConversations([]);
    }
  };

  useEffect(() => {
    loadConversations();
    const handler = () => loadConversations();
    window.addEventListener('opgrid-conversation-update', handler);
    const interval = setInterval(loadConversations, 3000);
    return () => {
      window.removeEventListener('opgrid-conversation-update', handler);
      clearInterval(interval);
    };
  }, []);

  const filtered = conversations.filter(c =>
    !search || c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone?.includes(search) || c.protocolo?.includes(search)
  );

  const stats = {
    total: conversations.length,
    emAndamento: conversations.filter(c => !['Concluído', 'Cancelado', 'Encaminhado p/ central'].includes(c.status)).length,
    concluidas: conversations.filter(c => c.status === 'Concluído').length,
    humano: conversations.filter(c => c.status === 'Encaminhado p/ central').length,
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Conversas WhatsApp</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Acompanhe em tempo real todas as jornadas conversacionais em andamento.
          </p>
        </div>
        <Button onClick={loadConversations} variant="outline" size="sm" className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: MessageCircle, color: 'text-primary' },
          { label: 'Em andamento', value: stats.emAndamento, icon: Loader2, color: 'text-info' },
          { label: 'Concluídas', value: stats.concluidas, icon: CheckCircle2, color: 'text-success' },
          { label: 'Encaminhadas', value: stats.humano, icon: Headphones, color: 'text-warning' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou protocolo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhuma conversa registrada</p>
              <p className="text-xs mt-1">Inicie uma simulação no Simulador WhatsApp para ver as conversas aqui.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px]">Contato</TableHead>
                    <TableHead className="text-[11px]">Telefone</TableHead>
                    <TableHead className="text-[11px]">Etapa</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px]">Última interação</TableHead>
                    <TableHead className="text-[11px]">Protocolo</TableHead>
                    <TableHead className="text-[11px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(conv => (
                    <TableRow key={conv.id}>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {conv.nome || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {conv.telefone || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {STEP_LABELS[conv.etapa] || conv.etapa}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(conv.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {conv.ultimaInteracao
                            ? formatDistanceToNow(new Date(conv.ultimaInteracao), { addSuffix: true, locale: ptBR })
                            : '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {conv.protocolo || '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                          <Headphones className="h-3 w-3" />
                          Assumir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
