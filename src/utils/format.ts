/** Countdown display for a timer given in SECONDS: 180 → "3:00", 65 → "1:05". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Rounded length for a duration given in SECONDS: 180 → "3 min". Never "0 min". */
export function formatSecondsAsMinutes(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

/** Takes MINUTES (not seconds). For seconds use formatClock / formatSecondsAsMinutes. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function pickRandom<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pickRandom: empty array');
  const i = Math.floor(Math.random() * arr.length);
  return arr[i] as T;
}
