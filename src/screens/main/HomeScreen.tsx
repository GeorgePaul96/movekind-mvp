import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { QuoteCard } from '@/components/QuoteCard';
import { WeekStrip } from '@/components/WeekStrip';
import { SectionLabel } from '@/components/SectionLabel';
import { InsightCard } from '@/components/InsightCard';
import { ActivityRow } from '@/components/ActivityRow';
import { MovementStateCard } from '@/components/MovementStateCard';
import { TinyWins } from '@/components/TinyWins';
import { QuickLogBar } from '@/components/QuickLogBar';
import { colors } from '@/constants/colors';
import { QUOTES, FALLBACK_INSIGHTS } from '@/constants/copy';
import { pickRandom } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { useActivityStore } from '@/store/activityStore';
import { useReflectionStore } from '@/store/reflectionStore';
import { useScores } from '@/hooks/useScores';
import { generateAndStoreInsight, getLatestInsight } from '@/services/ai';
import { computeMovementState } from '@/utils/movementState';
import { computeRhythmScore } from '@/utils/rhythmScore';
import { weekStartIso } from '@/utils/date';
import type { Activity, AIInsight } from '@/types';
import type { TabParamList } from '@/navigation/types';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

type Nav = BottomTabNavigationProp<TabParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const activities = useActivityStore((s) => s.activities);
  const reflections = useReflectionStore((s) => s.reflections);
  // scores are still needed for the AI coaching context — just not displayed as cards
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
        latestReflection: reflections.find((r) => r.week_start === weekStartIso()) ?? null,
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
    return () => { cancelled = true; };
  }, [user, activities.length, reflections.length, scores.overall]); // eslint-disable-line react-hooks/exhaustive-deps

  const movementState = useMemo(
    () => computeMovementState(activities, reflections),
    [activities, reflections],
  );

  const rhythmScore = useMemo(
    () => computeRhythmScore(activities),
    [activities],
  );

  const recent = useMemo(() => activities.slice(0, 5), [activities]);

  const handleQuickLog = async (type: Activity['type'], durationMinutes: number) => {
    if (!user) return;
    await useActivityStore.getState().add(user.id, {
      type,
      duration_minutes: durationMinutes,
      effort: 4,
      moods: [],
      notes: null,
      performed_at: new Date().toISOString(),
    });
  };

  return (
    <Screen>
      <Header tag={getGreeting()} title="How are you\nmoving today?" />

      {/* Daily quote */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <QuoteCard quote={quote} />
      </Animated.View>

      {/* Week at a glance */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <WeekStrip activities={activities} />
      </Animated.View>

      {/* Quick log — one tap to repeat last activity */}
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <QuickLogBar
          lastActivity={activities[0] ?? null}
          onLog={handleQuickLog}
        />
      </Animated.View>

      {/* Movement state — replaces identity card + rhythm strip + 4 score cards */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <MovementStateCard
          state={movementState}
          rhythmScore={rhythmScore}
          onQuickLog={() => navigation.navigate('Log')}
        />
      </Animated.View>

      {/* Tiny win — only renders when a win is detected */}
      <Animated.View entering={FadeInDown.delay(130).springify()}>
        <TinyWins activities={activities} reflections={reflections} />
      </Animated.View>

      {/* AI coach insight */}
      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <InsightCard body={insight?.body ?? FALLBACK_INSIGHTS[0]!} />
      </Animated.View>

      {/* Recent activity log */}
      <SectionLabel>Recent</SectionLabel>
      {recent.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>
            No activities yet. Tap Log to add your first — even five minutes counts.
          </Text>
        </View>
      ) : (
        recent.map((a, i) => (
          <Animated.View key={a.id} entering={FadeInDown.delay(i * 40).springify()}>
            <ActivityRow activity={a} />
          </Animated.View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: { fontSize: 28 },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
