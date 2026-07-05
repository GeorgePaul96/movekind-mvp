import { sanitizeProperties, BLOCKED_PROPERTY_KEYS } from '../src/services/telemetryPrivacy';

describe('sanitizeProperties', () => {
  it('strips raw body/health signals', () => {
    const clean = sanitizeProperties({
      sessionId: 's1',
      energyScore: 2,
      sleepQuality: 'poor',
      ratingDelta: 1,
      state: 'recovering',
    });
    expect(clean).toEqual({ sessionId: 's1', state: 'recovering' });
  });

  it('strips PII', () => {
    const clean = sanitizeProperties({ userId: 'u1', email: 'a@b.com', name: 'Ada' });
    expect(clean).toEqual({ userId: 'u1' });
  });

  it('keeps rhythm/completion structural props intact', () => {
    // Engagement signals (block counts/indexes, states) ARE completion & rhythm —
    // the contract wants these; only raw body/health data and PII are stripped.
    const props = { sessionId: 's1', state: 'regulated', blockCount: 4, blockIndex: 2 };
    expect(sanitizeProperties(props)).toEqual(props);
  });

  it('passes through undefined', () => {
    expect(sanitizeProperties(undefined)).toBeUndefined();
  });

  it('never leaks a blocked key', () => {
    const kitchenSink: Record<string, unknown> = {};
    BLOCKED_PROPERTY_KEYS.forEach((k) => (kitchenSink[k] = 'x'));
    kitchenSink.sessionId = 'ok';
    expect(sanitizeProperties(kitchenSink)).toEqual({ sessionId: 'ok' });
  });
});
