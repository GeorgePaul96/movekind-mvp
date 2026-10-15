/**
 * The guide voice: recorded Kokoro clips played in order, with the phone's own voice as a
 * fallback so guidance never goes silent.
 */

type Listener = (s: { didJustFinish?: boolean }) => void;
const mockPlayers: {
  source: unknown;
  rate?: number;
  played: boolean;
  removed: boolean;
  paused: boolean;
  finish: () => void;
}[] = [];
const mockBroken = new Set<unknown>();

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(async () => {}),
  createAudioPlayer: jest.fn((source: unknown) => {
    if (mockBroken.has(source)) throw new Error('cannot load clip');
    let listener: Listener = () => {};
    const p = {
      source,
      rate: undefined as number | undefined,
      played: false,
      removed: false,
      paused: false,
      finish: () => listener({ didJustFinish: true }),
      setPlaybackRate(r: number) { p.rate = r; },
      play() { p.played = true; },
      pause() { p.paused = true; },
      remove() { p.removed = true; },
      addListener(_e: string, cb: Listener) { listener = cb; return { remove() {} }; },
    };
    mockPlayers.push(p);
    return p;
  }),
}));

const mockSpoken: string[] = [];
jest.mock('expo-speech', () => ({
  speak: jest.fn((text: string, opts: { onDone?: () => void }) => {
    mockSpoken.push(text);
    setTimeout(() => opts.onDone?.(), 0);
  }),
  stop: jest.fn(),
}));

jest.mock('../src/data/voiceClips.generated', () => ({
  VOICE_ID: 'kokoro:af_heart@0.9',
  VOICE_CLIPS: { 'Line one.': 101, 'Line two.': 102, 'Broken clip.': 103 },
}));

import { speakLines, stopSpeaking } from '../src/services/voicePlayer';

const flush = () => new Promise((r) => setTimeout(r, 0));
const opts = { rate: 0.94, fallback: { rate: 0.88, pitch: 0.98 } };

async function finishCurrentClip() {
  await flush();
  mockPlayers[mockPlayers.length - 1]!.finish();
  await flush();
}

beforeEach(() => {
  mockPlayers.length = 0;
  mockSpoken.length = 0;
  mockBroken.clear();
});

describe('voicePlayer', () => {
  it('plays recorded clips in order at the requested speed, freeing each one', async () => {
    const done = speakLines(['Line one.', 'Line two.'], opts);
    await finishCurrentClip();
    await finishCurrentClip();
    await done;
    expect(mockPlayers.map((p) => p.source)).toEqual([101, 102]);
    expect(mockPlayers.every((p) => p.played && p.removed && p.rate === 0.94)).toBe(true);
    expect(mockSpoken).toEqual([]);
  });

  it("falls back to the phone's voice for a line without a recording", async () => {
    const done = speakLines(['Line one.', 'Not recorded.'], opts);
    await finishCurrentClip();
    await done;
    expect(mockSpoken).toEqual(['Not recorded.']);
  });

  it("falls back to the phone's voice when a clip fails to load", async () => {
    mockBroken.add(103);
    await speakLines(['Broken clip.'], opts);
    expect(mockSpoken).toEqual(['Broken clip.']);
  });

  it('stop silences the current clip and plays nothing after it', async () => {
    const done = speakLines(['Line one.', 'Line two.'], opts);
    await flush();
    stopSpeaking();
    await done;
    expect(mockPlayers).toHaveLength(1);
    expect(mockPlayers[0]!.paused && mockPlayers[0]!.removed).toBe(true);
  });

  it('starting a new exercise cancels the previous one', async () => {
    const first = speakLines(['Line one.', 'Line two.'], opts);
    await flush();
    const second = speakLines(['Line two.'], opts);
    await finishCurrentClip();
    await Promise.all([first, second]);
    expect(mockPlayers.map((p) => p.source)).toEqual([101, 102]); // first never reaches its line two
  });
});
