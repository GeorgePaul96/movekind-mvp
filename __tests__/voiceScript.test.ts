import { allSpokenLines, spokenLinesFor, TAKE_CARE } from '../src/domain/sessions/voiceScript';
import { clipPlaybackRate } from '../src/domain/sessions/voice';
import { ACTIVE_EXERCISES, exerciseById } from '../src/data/exercises';

describe('spokenLinesFor (what the guide says for one exercise)', () => {
  it('announces the exercise, then warnings, then cues', () => {
    const e = exerciseById('ex-downshift-4')!; // knee-to-chest, has a caution
    expect(spokenLinesFor(e, Infinity)).toEqual([
      'Next exercise: Knee-to-chest stretch.',
      TAKE_CARE,
      ...e.cautions!,
      ...e.cues,
    ]);
  });

  it('trims cues on low-energy days but NEVER the warnings', () => {
    const e = exerciseById('ex-downshift-1')!; // legs up the wall, two cautions
    const lines = spokenLinesFor(e, 1);
    expect(lines).toEqual(['Next exercise: Legs up the wall.', TAKE_CARE, ...e.cautions!, e.cues[0]]);
  });

  it('says no "Take care" when the source gives no warning', () => {
    const e = exerciseById('ex-move-1')!;
    expect(spokenLinesFor(e, Infinity)).not.toContain(TAKE_CARE);
  });
});

describe('allSpokenLines (what the generator must record)', () => {
  it('covers every line any shown exercise can speak, without duplicates', () => {
    const all = allSpokenLines(ACTIVE_EXERCISES);
    expect(new Set(all).size).toBe(all.length);
    for (const e of ACTIVE_EXERCISES) {
      for (const line of spokenLinesFor(e, Infinity)) expect(all).toContain(line);
    }
  });

  it('does not record hidden (pending-review) exercises', () => {
    expect(allSpokenLines(ACTIVE_EXERCISES)).not.toContain('Next exercise: Cardio step-back.');
  });
});

describe('clipPlaybackRate (recorded voice speed per energy state)', () => {
  it('is slowest when running on empty and never speeds the voice up past normal', () => {
    expect(clipPlaybackRate('overloaded')).toBeLessThan(clipPlaybackRate('recovering'));
    expect(clipPlaybackRate('recovering')).toBeLessThan(clipPlaybackRate('regulated'));
    for (const s of ['overloaded', 'recovering', 'regulated', 'activated'] as const) {
      expect(clipPlaybackRate(s)).toBeGreaterThanOrEqual(0.85); // stays natural-sounding
      expect(clipPlaybackRate(s)).toBeLessThanOrEqual(1);
    }
  });
});
