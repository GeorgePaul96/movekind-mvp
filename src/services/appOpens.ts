import { telemetry } from '@/services/telemetry';
import { startOfLocalDay } from '@/domain/garden/days';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Counts an app open for the tester week ("did people come back daily?"). Sends only how
 * many local days have passed since install: no health data, no values, no identity.
 */
export function trackAppOpened(profileCreatedAt: string, now: Date = new Date()): void {
  const installDay = startOfLocalDay(new Date(profileCreatedAt));
  const day_index = Math.round((startOfLocalDay(now).getTime() - installDay.getTime()) / DAY_MS);
  telemetry.capture('app_opened', { day_index });
}
