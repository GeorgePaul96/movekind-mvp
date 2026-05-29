import { addDays } from 'date-fns';
import type { Activity } from '@/types';

export interface PersonalBests {
  longestSessionMinutes: number;
  mostSessionsIn7Days: number;
}

export interface PersonalBestEvent {
  type: 'longest_session' | 'most_weekly_sessions';
  newValue: number;
  message: string;
}

export function computePersonalBests(activities: Activity[]): PersonalBests {
  if (activities.length === 0) {
    return { longestSessionMinutes: 0, mostSessionsIn7Days: 0 };
  }

  const longestSessionMinutes = Math.max(...activities.map((a) => a.duration_minutes));

  let mostSessionsIn7Days = 0;
  for (const anchor of activities) {
    const windowStart = new Date(anchor.performed_at);
    const windowEnd = addDays(windowStart, 7);
    const count = activities.filter((a) => {
      const t = new Date(a.performed_at);
      return t >= windowStart && t < windowEnd;
    }).length;
    if (count > mostSessionsIn7Days) mostSessionsIn7Days = count;
  }

  return { longestSessionMinutes, mostSessionsIn7Days };
}

export function detectPersonalBestEvents(
  newActivity: Activity,
  existingActivities: Activity[],
): PersonalBestEvent[] {
  // Never fire on the very first logged session — no baseline exists yet.
  if (existingActivities.length === 0) return [];

  const oldBests = computePersonalBests(existingActivities);
  const allActivities = [newActivity, ...existingActivities];
  const newBests = computePersonalBests(allActivities);

  const events: PersonalBestEvent[] = [];

  if (newActivity.duration_minutes > oldBests.longestSessionMinutes) {
    events.push({
      type: 'longest_session',
      newValue: newActivity.duration_minutes,
      message: `Longest session — ${newActivity.duration_minutes} min.`,
    });
  }

  if (
    newBests.mostSessionsIn7Days > oldBests.mostSessionsIn7Days &&
    oldBests.mostSessionsIn7Days >= 2
  ) {
    events.push({
      type: 'most_weekly_sessions',
      newValue: newBests.mostSessionsIn7Days,
      message: `${newBests.mostSessionsIn7Days} sessions in 7 days — your most active week.`,
    });
  }

  return events;
}
