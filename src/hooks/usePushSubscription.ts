import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BAuWteC8RRHZME7QUJeREVq4n3px13BS87UBAgBVFfFbZN1Bvin5mOaOz62it6txMUMWyXvSETKbkc_plNFtxi0';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription(prestadorId: string | undefined) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!prestadorId || !isSupported) return;

    try {
      // Register SW only in production (not inside iframes/preview)
      const isInIframe = (() => {
        try { return window.self !== window.top; } catch { return true; }
      })();
      const isPreview = window.location.hostname.includes('id-preview--');

      if (isInIframe || isPreview) {
        toast.info('Push notifications só funcionam no app publicado.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permissão de notificação negada.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();

      // Store subscription in Supabase
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          prestador_id: prestadorId,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'prestador_id,endpoint' }
      );

      if (error) {
        console.error('[PUSH] Error saving subscription:', error);
        toast.error('Erro ao salvar inscrição push.');
        return;
      }

      setIsSubscribed(true);
      toast.success('Notificações push ativadas!', {
        description: 'Você receberá alertas mesmo com a tela bloqueada.',
      });
    } catch (err) {
      console.error('[PUSH] Subscribe error:', err);
      toast.error('Erro ao ativar notificações push.');
    }
  }, [prestadorId, isSupported]);

  return { isSubscribed, isSupported, subscribe };
}
