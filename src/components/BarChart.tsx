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
 * Pure RN views — no native chart deps required for first render.
 */
export function BarChart({ data, color, highlightColor, max, unit }: Props) {
  const computedMax = Math.max(max ?? 0, ...data.map((d) => d.value), 1);
  return (
    <View>
      <View style={styles.chart}>
        {data.map((d, i) => {
          const ratio = Math.max(0.04, d.value / computedMax);
          const isLast = i === data.length - 1;
          const bg = isLast && highlightColor ? highlightColor : color;
          return (
            <View key={d.label} style={styles.col}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${ratio * 100}%`,
                    backgroundColor: bg,
                  },
                ]}
              />
              <Text style={styles.label}>{d.label}</Text>
            </View>
          );
        })}
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
  col: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
  label: {
    fontSize: 9,
    color: colors.hint,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  unit: {
    fontSize: 10,
    color: colors.hint,
    marginTop: 4,
    textAlign: 'right',
  },
});
