import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Section } from '@/components/home/parts';
import { colors } from '@/constants/colors';
import { HOME_COPY, WATER_COPY, YARD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { yardMoodOf } from '@/domain/checkin/moods';
import { localDayKey, startOfLocalDay, weekBounds } from '@/domain/garden/days';
import { CARE_KINDS, careToday } from '@/domain/home/care';
import { useGardenStore } from '@/store/gardenStore';

const WEEKS = 5;

/**
 * Looking back: the last five weeks as a grid of days. A day is warmer the more kinds of
 * care were noted on it; tapping one says what they were. An empty day is just a quiet day:
 * nothing is counted as missed.
 */
export function MonthView() {
  const { checkIns, water, workouts, meals, sleep, goodThings } = useGardenStore();
  const now = useMemo(() => new Date(), []);
  const todayKey = localDayKey(now);
  const [picked, setPicked] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfLocalDay(weekBounds(now).thisStart, -7 * (WEEKS - 1));
    return Array.from({ length: WEEKS * 7 }, (_, k) => {
      const date = startOfLocalDay(start, k);
      // Midday keeps the day stable whatever the clock does at midnight.
      const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
      const done = careToday({ checkIns, water, meals, workouts, sleep }, noon);
      return { date: noon, key: localDayKey(noon), count: CARE_KINDS.filter((k2) => done[k2]).length };
    });
  }, [now, checkIns, water, meals, workouts, sleep]);

  const detail = useMemo(() => {
    if (!picked) return null;
    const date = days.find((d) => d.key === picked)?.date;
    if (!date) return null;
    const on = (iso: string) => localDayKey(new Date(iso)) === picked;
    const check = checkIns.find((c) => on(c.created_at));
    const glasses = water.filter((w) => on(w.created_at)).length;
    const eaten = meals.filter((m) => on(m.created_at)).map((m) => YARD_COPY.foodSheet.meals[m.meal]);
    const moved = workouts.filter((w) => on(w.created_at));
    const night = sleep.find((s) => s.night_of === picked);
    const good = goodThings.find((g) => g.day === picked);
    const S = HOME_COPY.summary;
    const lines = [
      check ? `${HOME_COPY.care.mood}: ${YARD_COPY.moods[yardMoodOf(check)].label}` : '',
      glasses ? `${HOME_COPY.care.water}: ${WATER_COPY.count(glasses).replace(' today', '')}` : '',
      eaten.length ? `${HOME_COPY.care.food}: ${S.meals(eaten)}` : '',
      moved.length ? `${HOME_COPY.care.movement}: ${S.movement(moved.length, moved.reduce((m, w) => m + w.minutes, 0))}` : '',
      night ? `${HOME_COPY.care.sleep}: ${S.sleep(night.hours)}` : '',
      good ? `${HOME_COPY.goodTitle}: ${good.text}` : '',
    ].filter(Boolean);
    return { date, lines };
  }, [picked, days, checkIns, water, meals, workouts, sleep, goodThings]);

  return (
    <Section icon="calendar-heart" title={HOME_COPY.monthTitle}>
      <Text style={styles.body}>{HOME_COPY.monthBody}</Text>
      <View style={styles.week}>
        {HOME_COPY.weekdays.map((d, k) => (
          <Text key={k} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((d) => {
          const future = d.key > todayKey;
          const selected = picked === d.key;
          return (
            <View key={d.key} style={styles.cell}>
              {future ? (
                <View style={styles.day} />
              ) : (
                <Pressable
                  onPress={() => setPicked(selected ? null : d.key)}
                  accessibilityRole="button"
                  accessibilityLabel={HOME_COPY.monthDayA11y(HOME_COPY.monthDay(d.date), d.count)}
                  accessibilityState={{ selected }}
                  style={[
                    styles.day,
                    styles.dayPast,
                    d.count > 0 && { borderColor: colors.warmInk },
                    selected && styles.daySelected,
                  ]}
                >
                  {/* The fill deepens with the day; the number above it stays fully readable. */}
                  {d.count > 0 ? (
                    <View style={[StyleSheet.absoluteFill, styles.fill, { opacity: 0.3 + 0.14 * d.count }]} />
                  ) : null}
                  <Text style={[styles.dayText, d.key === todayKey && styles.dayToday]}>{d.date.getDate()}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {detail ? (
        <View style={styles.detail} accessibilityLiveRegion="polite">
          <Text style={styles.detailTitle}>{HOME_COPY.monthDay(detail.date)}</Text>
          {detail.lines.length ? (
            detail.lines.map((line) => (
              <Text key={line} style={styles.detailLine}>
                {line}
              </Text>
            ))
          ) : (
            <Text style={styles.detailLine}>{HOME_COPY.monthNothing}</Text>
          )}
        </View>
      ) : null}
    </Section>
  );
}

const styles = StyleSheet.create({
  body: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 10 },
  week: { flexDirection: 'row' },
  weekday: { ...font.semibold, flex: 1, textAlign: 'center', fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  day: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dayPast: { borderWidth: 1.5, borderColor: colors.divider, backgroundColor: colors.surfaceSecondary },
  fill: { borderRadius: 22, backgroundColor: colors.warm },
  daySelected: { borderWidth: 3, borderColor: colors.primary },
  dayText: { ...font.semibold, fontSize: 14, color: colors.textPrimary },
  dayToday: { ...font.extrabold, textDecorationLine: 'underline' },
  detail: { backgroundColor: colors.surfaceSecondary, borderRadius: 18, padding: 14, marginTop: 12 },
  detailTitle: { ...font.bold, fontSize: 16, color: colors.textPrimary, marginBottom: 6 },
  detailLine: { ...font.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
