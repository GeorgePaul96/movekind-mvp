import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Short, soft sounds. Kenney's CC0 UI and impact sounds, converted to WAV so every phone can
 * play them, plus a pentatonic scale and a miss tone made for the app (assets/sounds/).
 *
 * Quiet by design: off with the "Sounds" switch in You, silent when the phone is on silent,
 * never louder than half volume, and a sound that fails to play never breaks anything.
 */
const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  select: require('../../assets/sounds/select.wav'),
  drop: require('../../assets/sounds/drop.wav'),
  set: require('../../assets/sounds/set.wav'),
  water: require('../../assets/sounds/water.wav'),
  step: require('../../assets/sounds/step.wav'),
  rest: require('../../assets/sounds/rest.wav'),
  pluck: require('../../assets/sounds/pluck.wav'),
  close: require('../../assets/sounds/close.wav'),
  soft: require('../../assets/sounds/soft.wav'),
  'note-0': require('../../assets/sounds/note-0.wav'),
  'note-1': require('../../assets/sounds/note-1.wav'),
  'note-2': require('../../assets/sounds/note-2.wav'),
  'note-3': require('../../assets/sounds/note-3.wav'),
  'note-4': require('../../assets/sounds/note-4.wav'),
  'note-5': require('../../assets/sounds/note-5.wav'),
  'note-6': require('../../assets/sounds/note-6.wav'),
  'note-7': require('../../assets/sounds/note-7.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;
export const NOTE_COUNT = 8;

const VOLUME = 0.5;
const players = new Map<SoundName, AudioPlayer>();
let modeSet = false;

function player(name: SoundName): AudioPlayer | null {
  try {
    if (!modeSet) {
      modeSet = true;
      // Respect the phone's silent switch, and never interrupt someone's music.
      void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    let p = players.get(name);
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME;
      players.set(name, p);
    }
    return p;
  } catch {
    return null;
  }
}

export function playSound(name: SoundName): void {
  if (!useSettingsStore.getState().soundsOn) return;
  const p = player(name);
  if (!p) return;
  try {
    void p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // silent
  }
}

/** A rising step through the scale: the further along, the higher. */
export function playNote(index: number): void {
  playSound(`note-${Math.abs(Math.round(index)) % NOTE_COUNT}` as SoundName);
}
