import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { Garden } from '@/components/garden/Garden';
import { colors, stateColors } from '@/constants/colors';
import { CHANGES_COPY, MOOD_COPY } from '@/constants/copy';
import { gardenState } from '@/domain/garden/garden';
import { flowersByWeek, weeklyChanges } from '@/domain/garden/changes';
import { startOfLocalDay } from '@/domain/garden/days';
import { useGardenStore } from '@/store/gardenStore';

const MONTH_DAYS = 28;

/** What the user's activity is changing: plain sentences, then and now, the mood flowerbed. */
export default function ChangesScreen() {
  const checkIns = useGardenStore((s) => s.checkIns);
  const water = useGardenStore((s) => s.water);
  const workouts = useGardenStore((s) => s.workouts);
  const stepsToday = useGardenStore((s) => s.stepsToday);
  const loaded = useGardenStore((s) => s.loaded);
  const load = useGardenStore((s) => s.load);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const now = new Date();
  const input = { checkIns, water, workouts, stepsToday };
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - MONTH_DAYS);
  const lines = weeklyChanges(input, now);
  const weeks = flowersByWeek(checkIns, now);

  return (
    <Screen>
      <Header tag={CHANGES_COPY.tag} title={CHANGES_COPY.title} />

      <Card style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">{CHANGES_COPY.linesTitle}</Text>
        {lines.map((l) => (
          <Text key={l.kind} testID="change-line" style={styles.line}>
            🌿 {l.text}
          </Text>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">{CHANGES_COPY.compareTitle}</Text>
        <View style={styles.compare}>
          <View style={styles.half} testID="garden-then">
            <View style={styles.mini}>
              <Garden still state={gardenState({ ...input, stepsToday: null }, monthAgo)} />
            </View>
            <Text style={styles.caption}>{CHANGES_COPY.then}</Text>
          </View>
          <View style={styles.half} testID="garden-now">
            <View style={styles.mini}>
              <Garden still state={gardenState(input, now)} />
            </View>
            <Text style={styles.caption}>{CHANGES_COPY.now}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">{CHANGES_COPY.flowerbedTitle}</Text>
        {weeks.map((w) => {
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
                  <View key={f.day} testID="bed-flower" style={[styles.flower, { backgroundColor: stateColors[f.mood].tint }]} />
                ))}
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  line: { fontSize: 15, lineHeight: 22, color: colors.textPrimary, marginBottom: 6 },
  compare: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, alignItems: 'center' },
  mini: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  caption: { fontSize: 13, color: colors.textSecondary, marginTop: 6, fontWeight: '600' },
  week: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  weekLabel: { width: 110, fontSize: 13, color: colors.textSecondary },
  bed: { flex: 1, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  flower: { width: 18, height: 18, borderRadius: 9 },
});
