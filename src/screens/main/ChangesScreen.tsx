import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Garden } from '@/components/garden/Garden';
import { colors, stateColors } from '@/constants/colors';
import { CHANGES_COPY, MOOD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { gardenState } from '@/domain/garden/garden';
import { treeCaption } from '@/domain/garden/badges';
import { flowersByWeek, weeklyChanges } from '@/domain/garden/changes';
import { MOODS } from '@/domain/checkin/moods';
import { startOfLocalDay } from '@/domain/garden/days';
import { useGardenStore } from '@/store/gardenStore';

const MONTH_DAYS = 28;

function CardTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleIcon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.cardTitle} accessibilityRole="header">{title}</Text>
    </View>
  );
}

/** What the user's activity is changing: plain sentences, then and now, the mood flowerbed. */
export default function ChangesScreen() {
  const checkIns = useGardenStore((s) => s.checkIns);
  const water = useGardenStore((s) => s.water);
  const workouts = useGardenStore((s) => s.workouts);
  const stepsToday = useGardenStore((s) => s.stepsToday);
  const stepsByDay = useGardenStore((s) => s.stepsByDay);
  const stepsStatus = useGardenStore((s) => s.stepsStatus);
  const loaded = useGardenStore((s) => s.loaded);
  const load = useGardenStore((s) => s.load);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const now = new Date();
  const input = { checkIns, water, workouts, stepsToday };
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - MONTH_DAYS);
  const lines = weeklyChanges({ ...input, stepsByDay: stepsStatus === 'granted' ? stepsByDay : undefined }, now);
  const weeksNewestFirst = [...flowersByWeek(checkIns, now)].reverse();
  const then = gardenState({ ...input, stepsToday: null }, monthAgo);
  const today = gardenState(input, now);

  return (
    <Screen>
      <Header tag={CHANGES_COPY.tag} title={CHANGES_COPY.title} subtitle={CHANGES_COPY.subtitle} />

      <Card style={styles.card}>
        <CardTitle icon="sprout" title={CHANGES_COPY.linesTitle} />
        {lines.map((l) => (
          <Text key={l.kind} testID="change-line" style={styles.line}>
            {l.text}
          </Text>
        ))}
      </Card>

      <Card style={styles.card}>
        <CardTitle icon="creation" title={CHANGES_COPY.compareTitle} />
        <View style={styles.compare}>
          <View style={styles.half} testID="garden-then">
            <View style={styles.mini}>
              <Garden still state={then} />
            </View>
            <Text style={styles.when}>{CHANGES_COPY.then}</Text>
            <Text style={styles.caption}>{treeCaption(then.tree)}</Text>
          </View>
          <View style={styles.half} testID="garden-now">
            <View style={styles.mini}>
              <Garden still state={today} />
            </View>
            <Text style={[styles.when, { color: colors.primary }]}>{CHANGES_COPY.now}</Text>
            <Text style={styles.caption}>{treeCaption(today.tree)}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <CardTitle icon="flower-outline" title={CHANGES_COPY.flowerbedTitle} />
        {weeksNewestFirst.map((w) => {
          const [y, m, d] = w.weekStart.split('-').map(Number);
          const label = CHANGES_COPY.weekOf(startOfLocalDay(new Date(y!, m! - 1, d!)));
          return (
            <View
              key={w.weekStart}
              style={styles.week}
              accessible
              accessibilityLabel={`${label}: ${
                w.flowers.length ? w.flowers.map((f) => MOOD_COPY[f.mood].label).join(', ') : CHANGES_COPY.emptyWeek
              }`}
            >
              <Text style={styles.weekLabel}>{label}</Text>
              <View style={styles.bed}>
                {w.flowers.map((f) => (
                  <View key={f.day} testID="bed-flower" style={[styles.dot, { backgroundColor: stateColors[f.mood].tint }]} />
                ))}
              </View>
            </View>
          );
        })}
        <View style={styles.legend} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {MOODS.map((m) => (
            <View key={m} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: stateColors[m].tint }]} />
              <Text style={styles.legendText}>{MOOD_COPY[m].label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.pace}>
        <Icon name="heart-outline" size={20} color={colors.primary} />
        <Text style={styles.paceText}>{CHANGES_COPY.paceNote}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  titleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...font.bold, fontSize: 19, color: colors.textPrimary },
  line: { ...font.regular, fontSize: 16, lineHeight: 24, color: colors.textPrimary, marginBottom: 6 },
  compare: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, alignItems: 'center' },
  mini: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  when: { ...font.bold, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textSecondary, marginTop: 10 },
  caption: { ...font.regular, fontSize: 14, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  week: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  weekLabel: { ...font.medium, width: 116, fontSize: 14, color: colors.textSecondary },
  bed: { flex: 1, flexDirection: 'row', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' },
  dot: { width: 20, height: 20, borderRadius: 10 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { ...font.medium, fontSize: 13, color: colors.textSecondary },
  pace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    padding: 16,
  },
  paceText: { ...font.medium, flex: 1, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
});
