import { playNote, playSound } from '@/services/sound';

/**
 * The games' sounds: a pentatonic step for each right answer (any run of these notes sounds
 * pleasant together) and a low, soft tone for a miss. Plays on phones and the web through
 * `services/sound.ts`, so the "Sounds" switch in You covers it too.
 */
export const chime = {
  note: (index = 0) => playNote(index),
  soft: () => playSound('soft'),
};
