import { clamp, formatClock, formatDuration, formatSecondsAsMinutes } from '../src/utils/format';

describe('formatClock (seconds → m:ss countdown)', () => {
  it('shows a 3-minute block as 3:00, not hours', () => expect(formatClock(180)).toBe('3:00'));
  it('pads seconds', () => expect(formatClock(65)).toBe('1:05'));
  it('handles the last seconds and zero', () => {
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(0)).toBe('0:00');
  });
  it('never shows negative time', () => expect(formatClock(-3)).toBe('0:00'));
});

describe('formatSecondsAsMinutes (seconds → "3 min")', () => {
  it('rounds to whole minutes', () => {
    expect(formatSecondsAsMinutes(180)).toBe('3 min');
    expect(formatSecondsAsMinutes(1140)).toBe('19 min');
  });
  it('never says 0 min for a short block', () => expect(formatSecondsAsMinutes(20)).toBe('1 min'));
});

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
