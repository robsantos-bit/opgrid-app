import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAtendimentos, useSolicitacoes } from '@/hooks/useSupabaseData';
import { useAllDispatchOffers } from '@/hooks/useWhatsAppData';
import { Loader2, Radar, Clock, CheckCircle2, AlertTriangle, Eye, ArrowRight, Truck, Plus, Users, Volume2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import NovoAcionamentoDialog from '@/components/NovoAcionamentoDialog';
import { useQueryClient } from '@tanstack/react-query';

type QueueStatus = 'Aguardando' | 'Ofertas enviadas' | 'Aceito' | 'Sem prestador';

const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('pt-BR') : '—');
const fmtMoney = (v?: number | null) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const getPlaca = (s: any) => s?.placa || s?.veiculo_placa || '—';
const getValor = (s: any) => Number(s?.valor ?? s?.valor_estimado ?? 0);

const statusVariant: Record<QueueStatus, 'warning' | 'info' | 'success' | 'destructive'> = {
  Aguardando: 'warning',
  'Ofertas enviadas': 'info',
  Aceito: 'success',
  'Sem prestador': 'destructive',
};

function getQueueStatus(solicitacao: any, offers: any[], atendimento: any): QueueStatus {
  const hasAcceptedOffer = offers.some((offer) => offer.status === 'accepted');
  const hasPendingOffer = offers.some((offer) => offer.status === 'pending');
  const hasClosedOffers = offers.length > 0 && offers.every((offer) => offer.status !== 'pending');
  const normalizedSolicitacaoStatus = String(solicitacao?.status || '').toLowerCase();
  const normalizedAtendimentoStatus = String(atendimento?.status || '').toLowerCase();

  if (hasAcceptedOffer || normalizedSolicitacaoStatus.includes('os') || normalizedAtendimentoStatus === 'em_andamento') {
    return 'Aceito';
  }
  if (hasPendingOffer) {
    return 'Ofertas enviadas';
  }
  if (hasClosedOffers) {
    return 'Sem prestador';
  }
  return 'Aguardando';
}

export default function Despacho() {
  const { data: solicitacoes = [], isLoading: loadingSolicitacoes } = useSolicitacoes();
  const { data: atendimentos = [], isLoading: loadingAtendimentos } = useAtendimentos();
  const { data: offers = [], isLoading: loadingOffers } = useAllDispatchOffers();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queue = useMemo(() => {
    const activeSolicitacoes = solicitacoes.filter((s: any) => !['cancelada', 'concluida', 'finalizada'].includes(String(s.status || '').toLowerCase()));

    return activeSolicitacoes
      .map((solicitacao: any) => {
        const solicitacaoOffers = offers.filter((offer: any) => offer.solicitacao_id === solicitacao.id);
        const atendimento = atendimentos.find((item: any) => item.solicitacao_id === solicitacao.id);
        const acceptedOffer = solicitacaoOffers.find((offer: any) => offer.status === 'accepted') || null;
        const status = getQueueStatus(solicitacao, solicitacaoOffers, atendimento);

        return {
          id: solicitacao.id,
          solicitacao,
          offers: solicitacaoOffers,
          atendimento,
          acceptedOffer,
          currentRound: Math.max(...solicitacaoOffers.map((offer: any) => offer.round || 1), 0),
          status,
        };
      })
      .filter((item) => item.status === 'Aguardando' || item.status === 'Ofertas enviadas' || item.status === 'Aceito' || item.status === 'Sem prestador')
      .sort((a, b) => new Date(b.solicitacao.created_at || b.solicitacao.data_hora || 0).getTime() - new Date(a.solicitacao.created_at || a.solicitacao.data_hora || 0).getTime());
  }, [atendimentos, offers, solicitacoes]);

  const selected = queue.find((item) => item.id === selectedId) || null;

  const isLoading = loadingSolicitacoes || loadingAtendimentos || loadingOffers;
  const aguardando = queue.filter((item) => item.status === 'Aguardando').length;
  const emOferta = queue.filter((item) => item.status === 'Ofertas enviadas').length;
  const aceitos = queue.filter((item) => item.status === 'Aceito').length;
  const criticos = queue.filter((item) => item.status === 'Sem prestador').length;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Central de Despacho</h1>
          <p>Fila operacional em tempo real das solicitações que precisam de prestador.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { label: 'Aguardando', value: aguardando, icon: Clock, variant: 'warning' },
          { label: 'Em oferta', value: emOferta, icon: Radar, variant: 'info' },
          { label: 'Aceitos', value: aceitos, icon: CheckCircle2, variant: 'success' },
          { label: 'Críticos', value: criticos, icon: AlertTriangle, variant: 'destructive' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="kpi-icon"><item.icon className="h-4.5 w-4.5 text-primary" /></div>
              <div>
                <p className="kpi-label">{item.label}</p>
                <p className="kpi-value">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Fila de despacho</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] uppercase">Protocolo</TableHead>
                <TableHead className="text-[11px] uppercase">Cliente</TableHead>
                <TableHead className="text-[11px] uppercase hidden lg:table-cell">Rota</TableHead>
                <TableHead className="text-[11px] uppercase">Status</TableHead>
                <TableHead className="text-[11px] uppercase hidden md:table-cell">Rodada</TableHead>
                <TableHead className="text-[11px] uppercase hidden md:table-cell">Ofertas</TableHead>
                <TableHead className="text-[11px] uppercase hidden xl:table-cell">Prestador</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhuma solicitação disponível na fila de despacho</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : queue.map((item) => (
                <TableRow key={item.id} className="table-row-hover cursor-pointer" onClick={() => setSelectedId(item.id)}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{item.solicitacao.protocolo || '—'}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-[13px] font-medium">{item.solicitacao.cliente_nome || '—'}</p>
                      <p className="text-[11px] text-muted-foreground md:hidden">{getPlaca(item.solicitacao)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[11px] text-muted-foreground">
                    <div className="flex max-w-[220px] items-center gap-1">
                      <span className="truncate">{item.solicitacao.origem_endereco || '—'}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                      <span className="truncate">{item.solicitacao.destino_endereco || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusVariant[item.status]} className="text-[10px]">{item.status}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-[12px]">{item.currentRound ? `R${item.currentRound}` : '—'}</TableCell>
                  <TableCell className="hidden md:table-cell text-[12px]">{item.offers.length}</TableCell>
                  <TableCell className="hidden xl:table-cell text-[12px]">
                    {item.atendimento?.prestadores?.nome || item.acceptedOffer?.prestadores?.nome || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[420px] overflow-y-auto sm:w-[520px]">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Despacho {selected.solicitacao.protocolo || ''}</SheetTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant[selected.status]}>{selected.status}</Badge>
                  <Badge variant="outline">{selected.offers.length} oferta(s)</Badge>
                </div>
              </SheetHeader>

              <div className="mt-5 space-y-5 text-[13px]">
                <div className="space-y-0">
                  {[
                    ['Cliente', selected.solicitacao.cliente_nome],
                    ['Telefone', selected.solicitacao.cliente_telefone || selected.solicitacao.cliente_whatsapp],
                    ['Placa', getPlaca(selected.solicitacao)],
                    ['Tipo veículo', selected.solicitacao.tipo_veiculo],
                    ['Origem', selected.solicitacao.origem_endereco],
                    ['Destino', selected.solicitacao.destino_endereco],
                    ['Valor', getValor(selected.solicitacao) ? fmtMoney(getValor(selected.solicitacao)) : '—'],
                    ['Atendimento', selected.solicitacao.atendimento_id || selected.atendimento?.id || '—'],
                    ['Criado em', fmtDateTime(selected.solicitacao.created_at || selected.solicitacao.data_hora)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between border-b border-dashed border-border/60 py-2 gap-3">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="max-w-[60%] text-right font-medium break-words">{value || '—'}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ofertas de despacho</p>
                  <div className="space-y-2">
                    {selected.offers.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Nenhuma oferta registrada ainda para esta solicitação.
                      </div>
                    ) : selected.offers
                      .slice()
                      .sort((a: any, b: any) => (b.round || 0) - (a.round || 0))
                      .map((offer: any) => (
                        <div key={offer.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{offer.prestadores?.nome || 'Prestador'}</p>
                              <p className="text-[11px] text-muted-foreground">{offer.prestadores?.telefone || 'Sem telefone'} • Rodada {offer.round || 1}</p>
                            </div>
                            <Badge variant={offer.status === 'accepted' ? 'success' : offer.status === 'pending' ? 'info' : offer.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                              {offer.status}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                            <span>ETA: {offer.estimated_time_min ? `~${offer.estimated_time_min} min` : '—'}</span>
                            <span>Distância: {offer.estimated_distance_km ? `${offer.estimated_distance_km} km` : '—'}</span>
                            <span>Enviado: {fmtDateTime(offer.sent_at)}</span>
                            <span>Resposta: {fmtDateTime(offer.responded_at)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}