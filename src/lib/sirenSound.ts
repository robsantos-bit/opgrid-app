// Web Audio API siren sounds for OpGrid
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Central siren — plays when a new WhatsApp request arrives.
 * Two-tone ascending alert, professional and urgent.
 */
export function playCentralSiren(duration = 2.5): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, now);
    masterGain.gain.linearRampToValueAtTime(0, now + duration);
    masterGain.connect(ctx.destination);

    // Two-tone siren oscillating between frequencies
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    const cycles = 4;
    for (let i = 0; i < cycles; i++) {
      const t = now + (i * duration) / cycles;
      const half = duration / cycles / 2;
      osc1.frequency.setValueAtTime(880, t);
      osc1.frequency.linearRampToValueAtTime(1320, t + half);
      osc1.frequency.linearRampToValueAtTime(880, t + half * 2);
    }

    // Harmonic layer for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    for (let i = 0; i < cycles; i++) {
      const t = now + (i * duration) / cycles;
      const half = duration / cycles / 2;
      osc2.frequency.setValueAtTime(440, t);
      osc2.frequency.linearRampToValueAtTime(660, t + half);
      osc2.frequency.linearRampToValueAtTime(440, t + half * 2);
    }

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.linearRampToValueAtTime(0, now + duration);

    osc1.connect(masterGain);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + duration);
    osc2.start(now);
    osc2.stop(now + duration);
  } catch (e) {
    console.warn('Siren audio not available:', e);
  }
}

/**
 * Provider siren — plays when a new offer arrives on the provider's phone.
 * More urgent, higher-pitched, attention-grabbing pulse.
 */
export function playProviderSiren(duration = 3): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.22, now);
    masterGain.gain.linearRampToValueAtTime(0, now + duration);
    masterGain.connect(ctx.destination);

    // Urgent pulsing tone
    const osc = ctx.createOscillator();
    osc.type = 'square';

    const pulses = 6;
    const pulseGain = ctx.createGain();
    for (let i = 0; i < pulses; i++) {
      const t = now + (i * duration) / pulses;
      const pulseDur = duration / pulses;
      pulseGain.gain.setValueAtTime(0.15, t);
      pulseGain.gain.linearRampToValueAtTime(0, t + pulseDur * 0.8);
      pulseGain.gain.setValueAtTime(0, t + pulseDur * 0.8);
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.linearRampToValueAtTime(1600, t + pulseDur * 0.5);
      osc.frequency.linearRampToValueAtTime(1200, t + pulseDur);
    }

    // Sub-bass urgency layer
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, now);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.1, now);
    subGain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(pulseGain);
    pulseGain.connect(masterGain);
    sub.connect(subGain);
    subGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
    sub.start(now);
    sub.stop(now + duration);
  } catch (e) {
    console.warn('Siren audio not available:', e);
  }
}

/**
 * Short notification beep for UI feedback.
 */
export function playNotificationBeep(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1000, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {
    console.warn('Beep audio not available:', e);
  }
}
