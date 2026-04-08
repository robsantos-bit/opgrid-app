import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePrestadorOnline(prestadorId: string | undefined) {
  const [isOnline, setIsOnline] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSirenePlaying = useRef(false);

  const stopSirene = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    isSirenePlaying.current = false;
  }, []);

  const playSirene = useCallback(() => {
    if (isSirenePlaying.current) return;
    isSirenePlaying.current = true;

    try {
      // Use Web Audio API as fallback-proof siren
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const duration = 4;

      // Urgent pulsing siren
      for (let cycle = 0; cycle < 3; cycle++) {
        const cycleStart = now + cycle * 1.5;
        const pulses = 6;
        for (let i = 0; i < pulses; i++) {
          const t = cycleStart + (i * 1.2) / pulses;
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1200, t);
          osc.frequency.linearRampToValueAtTime(1600, t + 0.1);
          osc.frequency.linearRampToValueAtTime(1200, t + 0.2);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
          gain.gain.linearRampToValueAtTime(0, t + 0.2);

          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        }
      }

      setTimeout(() => {
        isSirenePlaying.current = false;
        ctx.close();
      }, duration * 1000);
    } catch {
      isSirenePlaying.current = false;
    }

    // Vibrate
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }
  }, []);

  const goOnline = useCallback(() => {
    if (!prestadorId || isOnline) return;

    // Initialize audio context with user gesture
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctx.resume().then(() => ctx.close());
    } catch {}

    const channel = supabase
      .channel(`ofertas-prestador-${prestadorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dispatch_offers',
          filter: `prestador_id=eq.${prestadorId}`,
        },
        (payload) => {
          console.log('Nova oferta recebida!', payload);
          playSirene();
          toast.success('🚨 NOVO SERVIÇO NA REGIÃO!', {
            description: 'Toque para ver os detalhes da oferta.',
            duration: 15000,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Prestador online - escutando ofertas');
          setIsOnline(true);
          channelRef.current = channel;
          toast.success('Você está online!', { description: 'Aguardando novas ofertas...' });
        }
      });
  }, [prestadorId, isOnline, playSirene]);

  const goOffline = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    stopSirene();
    setIsOnline(false);
    toast.info('Você está offline.');
  }, [stopSirene]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      stopSirene();
    };
  }, [stopSirene]);

  return { isOnline, goOnline, goOffline };
}
