import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

interface Bar {
  label: string;
  value: number;
}

interface Props {
  data: Bar[];
  color: string;
  highlightColor?: string;
  max?: number;
  unit?: string;
}

/**
 * Minimal, dependency-free bar chart that matches the prototype.
 * Pure RN views, no native chart deps required for first render.
 */
export function BarChart({ data, color, highlightColor, max, unit }: Props) {
  const computedMax = Math.max(max ?? 0, ...data.map((d) => d.value), 1);
  return (
    <View>
      {/* Bars live in a fixed-height plot; labels sit in their own row below it, so a
          full-height bar can never push a label into the text underneath the chart. */}
      <View style={styles.chart} testID="bar-plot">
        {data.map((d, i) => {
          const ratio = Math.min(1, Math.max(0.04, d.value / computedMax));
          const isLast = i === data.length - 1;
          const bg = isLast && highlightColor ? highlightColor : color;
          return (
            <View key={d.label} style={styles.col}>
              <View testID="bar" style={[styles.bar, { height: `${ratio * 100}%`, backgroundColor: bg }]} />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d) => (
          <Text key={d.label} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
  labels: { flexDirection: 'row', gap: 6, marginTop: 4 },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  unit: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },
});
