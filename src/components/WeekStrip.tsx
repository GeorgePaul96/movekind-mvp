import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { WEEK_OPTIONS } from '@/utils/date';
import type { Activity } from '@/types';

interface Props {
  activities: Activity[];
  now?: Date;
}

type DayState = 'done' | 'partial' | 'rest' | 'empty' | 'today';

function classify(date: Date, activities: Activity[], today: Date): DayState {
  if (isSameDay(date, today)) return 'today';
  const sameDay = activities.filter((a) =>
    isSameDay(new Date(a.performed_at), date),
  );
  if (sameDay.length === 0) return date < today ? 'rest' : 'empty';
  const totalMinutes = sameDay.reduce((s, a) => s + a.duration_minutes, 0);
  return totalMinutes >= 20 ? 'done' : 'partial';
}

export function WeekStrip({ activities, now = new Date() }: Props) {
  const start = startOfWeek(now, WEEK_OPTIONS);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <View style={styles.strip}>
      {days.map((d) => {
        const state = classify(d, activities, now);
        return (
          <View key={d.toISOString()} style={styles.col}>
            <Text style={styles.label}>{format(d, 'EEEEE')}</Text>
            <View
              style={[
                styles.ring,
                state === 'done' && { backgroundColor: colors.sage },
                state === 'partial' && { backgroundColor: colors.sageLight },
                state === 'rest' && { backgroundColor: colors.skyLight },
                state === 'empty' && { backgroundColor: colors.bg },
                state === 'today' && styles.today,
              ]}
            >
              <Text
                style={[
                  styles.ringText,
                  state === 'done' && { color: '#fff' },
                  state === 'partial' && { color: colors.sage },
                  state === 'rest' && { color: colors.skyAccent },
                  (state === 'empty' || state === 'today') && {
                    color: colors.hint,
                  },
                ]}
              >
                {state === 'done'
                  ? '✓'
                  : state === 'partial'
                    ? '−'
                    : state === 'rest'
                      ? 'rest'
                      : '·'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  col: { flex: 1, alignItems: 'center', gap: 5 },
  label: {
    fontSize: 10,
    color: colors.hint,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  ring: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 2,
    borderColor: colors.sage,
    backgroundColor: 'transparent',
  },
  ringText: { fontSize: 11, fontWeight: '500' },
});
