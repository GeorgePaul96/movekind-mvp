import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { VOICE_CLIPS } from '@/data/voiceClips.generated';

/**
 * The guide's voice. Plays the pre-recorded Kokoro clips (scripts/voice/generate.ts) in
 * order; any line without a clip — or whose clip fails — is spoken by the phone's own voice,
 * so guidance never goes silent. One sequence at a time: starting a new one, or calling
 * stopSpeaking(), cancels whatever is playing.
 */

export interface SpeakOptions {
  /** Playback speed for recorded clips (clipPlaybackRate). */
  rate: number;
  /** Phone-voice settings for the fallback (speechParamsForState). */
  fallback: { rate: number; pitch: number };
}

let generation = 0;
let current: AudioPlayer | null = null;
/** Settles the in-flight clip's promise: pausing/removing a player never reports "finished". */
let settleCurrent: (() => void) | null = null;
let audioModeSet = false;

function release() {
  if (settleCurrent) {
    const settle = settleCurrent;
    settleCurrent = null;
    settle(); // frees the player and lets the cancelled sequence end now, not at the watchdog
    return;
  }
  if (!current) return;
  const p = current;
  current = null;
  try {
    p.pause();
  } catch {
    /* already stopped */
  }
  p.remove();
}

/** Plays one clip to the end. Resolves false if it could not be played (caller falls back). */
function playClip(source: number, rate: number, cancelled: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    let player: AudioPlayer;
    try {
      player = createAudioPlayer(source);
    } catch {
      resolve(false);
      return;
    }
    current = player;
    // A clip that never reports finishing must not stall the session.
    const watchdog = setTimeout(() => settle(true), 30_000);
    let settled = false;
    function settle(ok: boolean) {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      sub.remove();
      if (settleCurrent === onRelease) settleCurrent = null;
      if (current === player) {
        current = null;
        try {
          player.pause();
        } catch {
          /* already stopped */
        }
        player.remove();
      }
      resolve(ok);
    }
    const onRelease = () => settle(true);
    settleCurrent = onRelease;
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish || cancelled()) settle(true);
    });
    try {
      player.setPlaybackRate(rate, 'high');
      player.play();
    } catch {
      settle(false);
    }
  });
}

function speakWithPhoneVoice(text: string, o: SpeakOptions['fallback']): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, { rate: o.rate, pitch: o.pitch, onDone: resolve, onStopped: resolve, onError: () => resolve() });
  });
}

export async function speakLines(lines: string[], options: SpeakOptions): Promise<void> {
  const mine = ++generation;
  const cancelled = () => mine !== generation;
  release();
  Speech.stop();

  if (!audioModeSet) {
    audioModeSet = true;
    // Guidance should be heard even with the ringer switch on silent (iOS).
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }

  for (const line of lines) {
    if (cancelled()) return;
    const clip = VOICE_CLIPS[line];
    const played = clip != null && (await playClip(clip, options.rate, cancelled));
    if (cancelled()) return;
    if (!played) await speakWithPhoneVoice(line, options.fallback);
  }
}

export function stopSpeaking(): void {
  generation++;
  release();
  Speech.stop();
}
