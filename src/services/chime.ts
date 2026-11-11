/**
 * Soft game sounds, made on the spot (no audio files). Uses the browser's Web Audio when
 * it exists, so it plays on the web build; on a phone it is silent until a native audio
 * module is added. Never throws: a game must not break because a sound could not play.
 */

/** A pentatonic scale: any run of these notes sounds pleasant together. */
const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

interface MinimalAudioContext {
  currentTime: number;
  state: string;
  destination: unknown;
  resume(): Promise<void>;
  createOscillator(): {
    type: string;
    frequency: { setValueAtTime(v: number, t: number): void; exponentialRampToValueAtTime(v: number, t: number): void };
    connect(node: unknown): void;
    start(): void;
    stop(t: number): void;
  };
  createGain(): {
    gain: { setValueAtTime(v: number, t: number): void; exponentialRampToValueAtTime(v: number, t: number): void };
    connect(node: unknown): void;
  };
}

let ctx: MinimalAudioContext | null = null;

function context(): MinimalAudioContext | null {
  try {
    const g = globalThis as unknown as { AudioContext?: new () => MinimalAudioContext; webkitAudioContext?: new () => MinimalAudioContext };
    const Ctor = g.AudioContext ?? g.webkitAudioContext;
    if (!Ctor) return null;
    ctx = ctx ?? new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(type: string, from: number, to: number | null, volume: number, seconds: number): void {
  const c = context();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, c.currentTime);
    if (to != null) osc.frequency.exponentialRampToValueAtTime(to, c.currentTime + seconds);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + seconds);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + seconds + 0.01);
  } catch {
    // silent
  }
}

export const chime = {
  /** A rising note: the further along, the higher. */
  note: (index = 0) => tone('sine', NOTES[Math.abs(index) % NOTES.length], null, 0.18, 0.35),
  /** A low, soft tone for a miss. Never harsh. */
  soft: () => tone('triangle', 160, 110, 0.1, 0.25),
};
