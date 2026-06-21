import { nudgeBodyFor, NUDGE_COPY } from '../src/constants/copy';
import type { RecoverySignal } from '../src/domain/behavioral/types';

describe('nudgeBodyFor', () => {
  const signals: RecoverySignal[] = ['collapse', 'spiral', 'burnout_risk', 'returning', 'stable', 'thriving'];

  test('returns the mapped, non-empty body for every recovery signal', () => {
    for (const s of signals) {
      expect(nudgeBodyFor(s)).toBe(NUDGE_COPY[s]);
      expect(nudgeBodyFor(s).length).toBeGreaterThan(0);
    }
  });

  test('returns a neutral default (distinct from every signal body) for null', () => {
    const body = nudgeBodyFor(null);
    expect(body.length).toBeGreaterThan(0);
    expect(Object.values(NUDGE_COPY)).not.toContain(body);
  });
});
