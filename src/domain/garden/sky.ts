/** Time of day from the phone's clock. Only the light changes; what has grown stays grown. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

export function skyPhase(now: Date): SkyPhase {
  const h = now.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}
