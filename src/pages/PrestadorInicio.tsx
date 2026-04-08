import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePrestadorById, useAtendimentosByPrestador } from '@/hooks/useSupabaseData';
import { usePrestadorOnline } from '@/hooks/usePrestadorOnline';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { toast } from 'sonner';
import { Loader2, User, Building2, Headphones, Activity, CheckCircle2, Wifi, WifiOff, Bell, BellRing, TestTube } from 'lucide-react';

export default function PrestadorInicio() {
  const { user } = useAuth();
  const { data: prestador, isLoading } = usePrestadorById(user?.provider_id);
  const { data: atendimentos = [] } = useAtendimentosByPrestador(user?.provider_id);
  const { isOnline, goOnline, goOffline, playSirene } = usePrestadorOnline(user?.provider_id ?? undefined);
  const { isSubscribed, isSupported, subscribe } = usePushSubscription(user?.provider_id ?? undefined);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const emAndamento = atendimentos.filter((a: any) => a.status === 'em_andamento').length;
  const finalizados = atendimentos.filter((a: any) => a.status === 'finalizado').length;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1>Portal do Prestador</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Bem-vindo, {user?.nome}</p>
        </div>
        <Button
          size="lg"
          variant={isOnline ? 'destructive' : 'default'}
          onClick={isOnline ? goOffline : goOnline}
          className={`gap-2 font-bold ${isOnline ? 'animate-pulse' : ''}`}
        >
          {isOnline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
          {isOnline ? 'Ficar Offline' : 'Ficar Online'}
        </Button>
      </div>

      {isOnline && (
        <div className="space-y-2">
          <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-sm font-medium text-success">Online — Aguardando novas ofertas...</span>
          </div>
          {isSupported && !isSubscribed && (
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={subscribe}>
              <Bell className="h-4 w-4" />
              Ativar notificações push (tela bloqueada)
            </Button>
          )}
          {isSubscribed && (
            <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Bell className="h-3 w-3" /> Push ativo — alertas mesmo com tela bloqueada
            </div>
          )}
          {/* Test buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => {
                playSirene();
                toast.success('🚨 TESTE: NOVO SERVIÇO NA REGIÃO!', {
                  description: 'Simulação de oferta recebida via realtime.',
                  duration: 10000,
                });
              }}
            >
              <TestTube className="h-4 w-4" />
              Testar Sirene
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={async () => {
                if (!('serviceWorker' in navigator)) {
                  toast.error('Service Worker não suportado neste navegador.');
                  return;
                }
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification('🚨 NOVO SERVIÇO NA REGIÃO!', {
                  body: 'Teste local — Veículo leve - Av. Paulista, 1000',
                  icon: '/icon-192x192.png',
                  badge: '/icon-192x192.png',
                  vibrate: [500, 200, 500, 200, 500],
                  tag: 'oferta-teste',
                  renotify: true,
                  requireInteraction: true,
                  data: { url: '/prestador' },
                });
                toast.info('Notificação push local enviada!');
              }}
            >
              <BellRing className="h-4 w-4" />
              Testar Push
            </Button>
          </div>
        </div>
      )}

      {prestador ? (
        <>
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{prestador.nome}</p>
                  <div className="flex gap-2 mt-0.5">
                    <Badge variant={prestador.status === 'ativo' ? 'success' : 'secondary'} className="capitalize">{prestador.status}</Badge>
                    <Badge variant="outline" className="capitalize text-[10px]">{prestador.tipo}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ['CNPJ', prestador.cnpj],
                  ['Telefone', prestador.telefone],
                  ['Tipo', prestador.tipo],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex justify-between py-2 border-b border-dashed border-border/60">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize">{val || '—'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: atendimentos.length, icon: Headphones, bg: 'bg-primary/10', color: 'text-primary' },
              { label: 'Em andamento', value: emAndamento, icon: Activity, bg: 'bg-info/10', color: 'text-info' },
              { label: 'Finalizados', value: finalizados, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success' },
            ].map(k => (
              <Card key={k.label}>
                <CardContent className="p-4 text-center">
                  <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center mx-auto mb-2`}>
                    <k.icon className={`h-4.5 w-4.5 ${k.color}`} />
                  </div>
                  <p className="text-xl font-bold tabular-nums">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{k.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum prestador vinculado ao seu perfil.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
