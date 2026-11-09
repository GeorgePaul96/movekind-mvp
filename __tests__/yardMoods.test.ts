import { frustratedCloudOpacity, mapleMoodPose, YARD_MOODS } from '../src/domain/yard/moods';

describe('yardMoods', () => {
  it('maps null or undefined mood to neutral sitting pose', () => {
    const neutral = mapleMoodPose(null);
    expect(neutral.mood).toBeNull();
    expect(neutral.posture).toBe('sitting');
    expect(neutral.scribbleCloud).toBe(false);
    expect(neutral.twinkles).toBe(false);
    expect(neutral.tongue).toBe(false);
  });

  it('maps tired to lying down with half-closed eyelids and slow wag', () => {
    const pose = mapleMoodPose('tired');
    expect(pose.posture).toBe('lying');
    expect(pose.eyelids).toBe('half');
    expect(pose.tailPeriodSec).toBeGreaterThan(3);
  });

  it('maps low to lowered head, downward gaze, and soft ears', () => {
    const pose = mapleMoodPose('low');
    expect(pose.posture).toBe('sitting');
    expect(pose.ears).toBe('soft');
    expect(pose.pupilOffsetY).toBeGreaterThan(0);
    expect(pose.headDropY).toBeGreaterThan(0);
  });

  it('maps frustrated to worried brows, ears back, and scribble cloud', () => {
    const pose = mapleMoodPose('frustrated');
    expect(pose.brows).toBe('worried');
    expect(pose.ears).toBe('back');
    expect(pose.scribbleCloud).toBe(true);
  });

  it('maps steady to relaxed sit and smile', () => {
    const pose = mapleMoodPose('steady');
    expect(pose.posture).toBe('sitting');
    expect(pose.smile).toBe(true);
  });

  it('maps buzzing to tongue out, bounce, twinkles, and wag no faster than 0.3s', () => {
    const pose = mapleMoodPose('buzzing');
    expect(pose.tongue).toBe(true);
    expect(pose.twinkles).toBe(true);
    expect(pose.bounceAmp).toBeGreaterThan(0);
    expect(pose.tailPeriodSec).toBeGreaterThanOrEqual(0.3);
  });

  it.each(YARD_MOODS)('never wags faster than 0.3s for %s', (mood) => {
    expect(mapleMoodPose(mood).tailPeriodSec).toBeGreaterThanOrEqual(0.3);
  });

  it('softens the frustrated cloud with each pet until it fades', () => {
    expect(frustratedCloudOpacity('frustrated', 0)).toBe(1);
    expect(frustratedCloudOpacity('frustrated', 1)).toBeLessThan(1);
    expect(frustratedCloudOpacity('frustrated', 3)).toBe(0);
    expect(frustratedCloudOpacity('steady', 0)).toBe(0);
  });
});