import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { startOfWeek } from 'date-fns';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { BarChart } from '@/components/BarChart';
import { InsightCard } from '@/components/InsightCard';
import { RhythmWave } from '@/components/RhythmWave';
import { colors } from '@/constants/colors';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import { percentChange, weeklyMinutes, weeklyReflectionTrend, activitiesInWeek } from '@/utils/analytics';
import { computeRhythmScore, weeklySessionCounts } from '@/utils/rhythmScore';
import { WEEK_OPTIONS } from '@/utils/date';
import { ACTIVITY_BY_TYPE } from '@/constants/activities';
import type { Activity, ActivityType } from '@/types';

export default function ProgressScreen() {
  const activities = useActivityStore((s) => s.activities);
  const reflections = useReflectionStore((s) => s.reflections);
  const rhythmScore = useMemo(() => computeRhythmScore(activities), [activities]);
  const waveData = useMemo(() => weeklySessionCounts(activities, 12), [activities]);
  const minutes = useMemo(() => weeklyMinutes(activities, 4), [activities]);
  const energy = useMemo(() => weeklyReflectionTrend(reflections, 'energy', 4), [reflections]);
  const recovery = useMemo(() => weeklyReflectionTrend(reflections, 'recovery', 4), [reflections]);

  const minutesChange = percentChange(minutes.map((d) => d.minutes));
  const energyChange = percentChange(energy.map((d) => d.value));

  return (
    <Screen>
      <Header tag="Your movement story" title="Progress" />

      {/* Rhythm Score hero */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTag}>28-day rhythm</Text>
              <Text style={styles.heroScore}>{rhythmScore.percentage}%</Text>
              <Text style={styles.heroLabel}>{rhythmScore.label}</Text>
            </View>
            <Text style={styles.heroDays}>{rhythmScore.activeDays} active days</Text>
          </View>
          <RhythmWave weeks={waveData} />
          <Text style={styles.waveCaption}>12-week movement wave</Text>
        </View>
      </Animated.View>

      {/* Weekly minutes trend */}
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <Card style={styles.chartCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendName}>Weekly movement minutes</Text>
            <Text style={[styles.trendChange, { color: minutesChange >= 0 ? colors.sageDark : colors.muted }]}>
              {minutesChange >= 0 ? `↑ +${minutesChange}%` : `↓ ${minutesChange}%`}
            </Text>
          </View>
          <BarChart
            data={minutes.map((d) => ({ label: d.label, value: d.minutes }))}
            color={colors.sageMid}
            highlightColor={colors.sageDark}
            unit="min"
          />
        </Card>
      </Animated.View>

      {/* Energy trend */}
      <Animated.View entering={FadeInDown.delay(140).springify()}>
        <Card style={styles.chartCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendName}>Energy trend</Text>
            <Text style={[styles.trendChange, { color: energyChange >= 0 ? colors.sageDark : colors.muted }]}>
              {energyChange === 0 ? 'stable' : energyChange > 0 ? `↑ +${energyChange}%` : `↓ ${energyChange}%`}
            </Text>
          </View>
          <BarChart
            data={energy.map((d) => ({ label: d.label, value: d.value }))}
            color={colors.blush}
            highlightColor={colors.blushAccent}
            max={10}
          />
        </Card>
      </Animated.View>

      {/* Recovery trend */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Card style={styles.chartCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendName}>Recovery trend</Text>
            <Text style={[styles.trendChange, { color: colors.muted }]}>
              {recovery.every((d) => d.value === 0) ? 'no data yet' : 'stable'}
            </Text>
          </View>
          <BarChart
            data={recovery.map((d) => ({ label: d.label, value: d.value }))}
            color={colors.sky}
            highlightColor={colors.skyAccent}
            max={10}
          />
        </Card>
      </Animated.View>

      {/* This week's activity mix — no scoring, no zeroes */}
      <Animated.View entering={FadeInDown.delay(260).springify()}>
        <Card style={styles.chartCard}>
          <Text style={styles.scoreLabel}>This week's movement</Text>
          <WeeklyMix activities={activities} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).springify()}>
        <InsightCard
          tone="sky"
          label="Progress insight"
          body={
            minutesChange > 0
              ? `Movement up ${minutesChange}% from last week. Patterns like this are what actually create change.`
              : minutesChange < 0
              ? 'Quieter week than last. Rest adapts the body — returning is what matters.'
              : 'Consistent with last week. Steady rhythm is the goal.'
          }
        />
      </Animated.View>
    </Screen>
  );
}

function WeeklyMix({ activities }: { activities: Activity[] }) {
  const typeEntries = useMemo(() => {
    const weekStart = startOfWeek(new Date(), WEEK_OPTIONS);
    const thisWeek = activitiesInWeek(activities, weekStart);
    const map = new Map<ActivityType, { count: number; minutes: number }>();
    for (const a of thisWeek) {
      const key = a.type as ActivityType;
      const existing = map.get(key) ?? { count: 0, minutes: 0 };
      map.set(key, { count: existing.count + 1, minutes: existing.minutes + a.duration_minutes });
    }
    return [...map.entries()];
  }, [activities]);

  if (typeEntries.length === 0) {
    return <Text style={mix.empty}>No sessions logged this week yet.</Text>;
  }

  return (
    <View style={mix.row}>
      {typeEntries.map(([type, { count, minutes }]) => {
        const def = ACTIVITY_BY_TYPE[type];
        return (
          <View key={type} style={mix.item}>
            <Text style={mix.emoji}>{def?.emoji ?? '🏃'}</Text>
            <Text style={mix.name}>{def?.label ?? type}</Text>
            <Text style={mix.sub}>{count}× · {minutes}min</Text>
          </View>
        );
      })}
    </View>
  );
}

const mix = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  item: { alignItems: 'center', minWidth: 64 },
  emoji: { fontSize: 22, marginBottom: 3 },
  name: { fontSize: 12, fontWeight: '500', color: colors.ink },
  sub: { fontSize: 10, color: colors.muted, marginTop: 2 },
  empty: { fontSize: 13, color: colors.hint, marginTop: 6 },
});

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: colors.ink,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTag: {
    fontSize: 10,
    color: colors.sage,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroScore: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.sageDark,
    lineHeight: 44,
  },
  heroLabel: {
    fontSize: 13,
    color: colors.sage,
    fontWeight: '500',
  },
  heroDays: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '500',
    marginTop: 4,
  },
  waveCaption: {
    fontSize: 10,
    color: colors.hint,
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  chartCard: { marginBottom: 10 },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendName: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  trendChange: { fontSize: 12, fontWeight: '600' },
  scoreLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
