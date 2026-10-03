import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, stateColors } from '@/constants/colors';
import { CHECKIN_COPY } from '@/constants/copy';
import type { WeekComparison } from '@/domain/insights/weekCompare';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_HEIGHT: Record<string, number> = { overloaded: 0.35, recovering: 0.55, regulated: 0.8, activated: 1 };

function trend(now: number, before: number): { arrow: string; word: string } {
  if (now > before) return { arrow: '↑', word: 'up' };
  if (now < before) return { arrow: '↓', word: 'down' };
  return { arrow: '=', word: 'same' };
}

function Row({ label, now, before }: { label: string; now: number; before: number }) {
  const t = trend(now, before);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${now} this week, ${before} last week, ${t.word}`}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {now} <Text style={styles.rowBefore}>vs {before}</Text> {t.arrow}
      </Text>
    </View>
  );
}

/** This week vs last. A low-energy day still gets a bar: showing up is what's counted. */
export function WeekCard({ week }: { week: WeekComparison | null }) {
  return (
    <Card>
      <Text style={styles.title} accessibilityRole="header">{CHECKIN_COPY.weekTitle}</Text>
      {!week ? (
        <Text style={styles.empty}>{CHECKIN_COPY.weekEmpty}</Text>
      ) : (
        <>
          <Row label={CHECKIN_COPY.checkIns} now={week.thisWeek.days} before={week.lastWeek.days} />
          <Row label={CHECKIN_COPY.minutes} now={week.thisWeek.minutes} before={week.lastWeek.minutes} />
          <View style={styles.bars} importantForAccessibility="no-hide-descendants">
            {week.daily.map((mood, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  {mood && (
                    <View
                      style={[styles.bar, { height: `${BAR_HEIGHT[mood]! * 100}%`, backgroundColor: stateColors[mood].tint }]}
                    />
                  )}
                </View>
                <Text style={styles.day}>{DAY_LETTERS[i]}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  empty: { fontSize: 14, color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { fontSize: 14, color: colors.textSecondary },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.success },
  rowBefore: { fontWeight: '500', color: colors.textMuted },
  bars: { flexDirection: 'row', gap: 6, marginTop: 12 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { height: 52, width: '100%', justifyContent: 'flex-end', borderRadius: 6, backgroundColor: colors.surfaceSecondary },
  bar: { width: '100%', borderRadius: 6 },
  day: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
