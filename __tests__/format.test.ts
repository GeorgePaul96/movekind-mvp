import { clamp, formatDuration } from '../src/utils/format';

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-1, 0, 10)).toBe(0));
  it('clamps above max', () => expect(clamp(99, 0, 10)).toBe(10));
  it('keeps in-range', () => expect(clamp(5, 0, 10)).toBe(5));
});

describe('formatDuration', () => {
  it('formats <60 as minutes', () => expect(formatDuration(45)).toBe('45 min'));
  it('formats exact hours', () => expect(formatDuration(60)).toBe('1h'));
  it('formats mixed', () => expect(formatDuration(95)).toBe('1h 35m'));
});
