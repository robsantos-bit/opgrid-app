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
export function playCentralSiren(duration = 2): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Soft chime: three ascending tones
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteLen = 0.25;
    const gap = 0.08;

    notes.forEach((freq, i) => {
      const t = now + i * (noteLen + gap);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteLen);
    });

    // Repeat the chord once after a short pause
    const repeatStart = now + notes.length * (noteLen + gap) + 0.3;
    notes.forEach((freq, i) => {
      const t = repeatStart + i * (noteLen + gap);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteLen);
    });
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
