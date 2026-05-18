import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { BarChart } from '@/components/BarChart';
import { InsightCard } from '@/components/InsightCard';
import { colors } from '@/constants/colors';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import {
  percentChange,
  weeklyMinutes,
  weeklyReflectionTrend,
} from '@/utils/analytics';
import { useScores } from '@/hooks/useScores';

export default function ProgressScreen() {
  const activities = useActivityStore((s) => s.activities);
  const reflections = useReflectionStore((s) => s.reflections);
  const scores = useScores();

  const minutes = useMemo(() => weeklyMinutes(activities, 4), [activities]);
  const energy = useMemo(
    () => weeklyReflectionTrend(reflections, 'energy', 4),
    [reflections],
  );
  const recovery = useMemo(
    () => weeklyReflectionTrend(reflections, 'recovery', 4),
    [reflections],
  );

  const streakDays = useMemo(() => {
    const days = new Set(
      activities.map((a) => new Date(a.performed_at).toDateString()),
    );
    let count = 0;
    const cur = new Date();
    cur.setHours(0, 0, 0, 0);
    while (days.has(cur.toDateString())) {
      count += 1;
      cur.setDate(cur.getDate() - 1);
    }
    return count;
  }, [activities]);

  const minutesChange = percentChange(minutes.map((d) => d.minutes));
  const energyChange = percentChange(energy.map((d) => d.value));

  return (
    <Screen>
      <Header tag="4-week overview" title="Your progress story" />

      <View style={styles.streakStrip}>
        <Text style={{ fontSize: 28 }}>🌿</Text>
        <View>
          <Text style={styles.streakValue}>{streakDays} days</Text>
          <Text style={styles.streakDesc}>of consistent movement</Text>
        </View>
      </View>

      <Card style={{ marginBottom: 10 }}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendName}>Weekly minutes</Text>
          <Text
            style={[
              styles.trendChange,
              { color: minutesChange >= 0 ? colors.sage : colors.muted },
            ]}
          >
            {minutesChange >= 0 ? `↑ +${minutesChange}%` : `↓ ${minutesChange}%`}
          </Text>
        </View>
        <BarChart
          data={minutes}
          color={colors.sageMid}
          highlightColor={colors.sage}
          unit="minutes"
        />
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendName}>Energy trend</Text>
          <Text
            style={[
              styles.trendChange,
              { color: energyChange >= 0 ? colors.sage : colors.muted },
            ]}
          >
            {energyChange === 0
              ? 'stable'
              : energyChange > 0
                ? `↑ +${energyChange}%`
                : `↓ ${energyChange}%`}
          </Text>
        </View>
        <BarChart
          data={energy.map((d) => ({ label: d.label, value: d.value }))}
          color={colors.blush}
          highlightColor="#D08070"
          max={10}
        />
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendName}>Recovery score</Text>
          <Text style={[styles.trendChange, { color: colors.muted }]}>stable</Text>
        </View>
        <BarChart
          data={recovery.map((d) => ({ label: d.label, value: d.value }))}
          color={colors.sky}
          highlightColor="#7AADCC"
          max={10}
        />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.scoreTitle}>Overall progress score</Text>
        <Text style={styles.scoreValue}>{scores.overall}</Text>
        <Text style={styles.scoreSub}>
          Consistency {scores.consistency} · Strength {scores.strength} · Endurance{' '}
          {scores.endurance} · Recovery {scores.recovery}
        </Text>
      </Card>

      <InsightCard
        tone="sky"
        label="Progress insight"
        body={
          minutesChange > 0
            ? 'You are building a strong foundation. Small, consistent changes are working — keep going at your own pace.'
            : 'This week is a little quieter than last. That is okay — your body adapts when it rests, too.'
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  streakStrip: {
    backgroundColor: colors.warmLight,
    borderColor: colors.warm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  streakValue: { fontSize: 22, fontWeight: '500', color: colors.warmDark },
  streakDesc: { fontSize: 12, color: colors.warmAccent, marginTop: 2 },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trendName: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  trendChange: { fontSize: 12, fontWeight: '500' },
  scoreTitle: {
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '500',
    color: colors.sageDark,
    marginVertical: 4,
  },
  scoreSub: { fontSize: 12, color: colors.muted },
});
