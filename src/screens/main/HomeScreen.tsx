import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { QuoteCard } from '@/components/QuoteCard';
import { WeekStrip } from '@/components/WeekStrip';
import { SectionLabel } from '@/components/SectionLabel';
import { ScoreCard } from '@/components/ScoreCard';
import { InsightCard } from '@/components/InsightCard';
import { ActivityRow } from '@/components/ActivityRow';
import { colors } from '@/constants/colors';
import { QUOTES, FALLBACK_INSIGHTS } from '@/constants/copy';
import { pickRandom } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { useActivityStore } from '@/store/activityStore';
import { useScores } from '@/hooks/useScores';
import { generateAndStoreInsight, getLatestInsight } from '@/services/ai';
import { useReflectionStore } from '@/store/reflectionStore';
import { weekStartIso } from '@/utils/date';
import type { AIInsight } from '@/types';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const activities = useActivityStore((s) => s.activities);
  const reflections = useReflectionStore((s) => s.reflections);
  const scores = useScores();

  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [quote] = useState(() => pickRandom(QUOTES));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadInsight = async () => {
      const latest = await getLatestInsight(user.id);
      if (!cancelled && latest) setInsight(latest);

      const fresh = await generateAndStoreInsight(user.id, {
        scores,
        recentActivities: activities,
        latestReflection:
          reflections.find((r) => r.week_start === weekStartIso()) ?? null,
      });
      if (!cancelled) setInsight(fresh);
    };
    loadInsight().catch(() => {
      if (!cancelled) {
        setInsight({
          id: 'fallback',
          user_id: user.id,
          body: pickRandom(FALLBACK_INSIGHTS),
          source: 'fallback',
          created_at: new Date().toISOString(),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, activities.length, reflections.length, scores.overall]); // eslint-disable-line react-hooks/exhaustive-deps

  const recent = useMemo(() => activities.slice(0, 5), [activities]);

  return (
    <Screen>
      <Header tag="Good morning" title={`How are you\nmoving today?`} />
      <QuoteCard quote={quote} />
      <WeekStrip activities={activities} />

      <SectionLabel>Your scores this week</SectionLabel>
      <View style={styles.grid}>
        <ScoreCard emoji="🔥" label="Consistency" value={scores.consistency} palette="sage" />
        <ScoreCard emoji="🏋️" label="Strength" value={scores.strength} palette="blush" />
      </View>
      <View style={styles.grid}>
        <ScoreCard emoji="🏃" label="Endurance" value={scores.endurance} palette="sky" />
        <ScoreCard emoji="🌙" label="Recovery" value={scores.recovery} palette="warm" />
      </View>

      <View style={{ height: 12 }} />
      <InsightCard body={insight?.body ?? FALLBACK_INSIGHTS[0]!} />

      <SectionLabel>Recent activities</SectionLabel>
      {recent.length === 0 ? (
        <Text style={styles.empty}>
          No activities yet. Tap Log to add your first one — even five minutes counts.
        </Text>
      ) : (
        recent.map((a) => <ActivityRow key={a.id} activity={a} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  empty: {
    color: colors.muted,
    fontSize: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    borderRadius: 14,
    lineHeight: 20,
  },
});
