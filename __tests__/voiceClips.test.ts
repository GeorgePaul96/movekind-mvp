import { VOICE_CLIPS, VOICE_ID } from '../src/data/voiceClips.generated';
import { allSpokenLines } from '../src/domain/sessions/voiceScript';
import { ACTIVE_EXERCISES } from '../src/data/exercises';

/**
 * If this fails: a spoken line changed (new exercise, edited cue or caution) without
 * regenerating the voice. Run `npm run voice:generate`, listen to the review file, commit.
 */
describe('recorded voice clips', () => {
  it('uses the chosen voice (Kokoro Heart, calm pace)', () => {
    expect(VOICE_ID).toBe('kokoro:af_heart@0.9');
  });

  it('has a clip for every line the guide can speak', () => {
    const missing = allSpokenLines(ACTIVE_EXERCISES).filter((line) => !(line in VOICE_CLIPS));
    expect(missing).toEqual([]);
  });

  it('carries no stale clips for lines nothing speaks any more', () => {
    const live = new Set(allSpokenLines(ACTIVE_EXERCISES));
    expect(Object.keys(VOICE_CLIPS).filter((line) => !live.has(line))).toEqual([]);
  });
});
