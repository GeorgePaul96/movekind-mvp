import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { PALETTE } from '@/constants/activities';

interface Props {
  emoji: string;
  value: number;
  label: string;
  palette: keyof typeof PALETTE;
}

export function ScoreCard({ emoji, value, label, palette }: Props) {
  const p = PALETTE[palette];
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: p.bg }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: p.fg },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    color: colors.ink,
    fontWeight: '500',
    lineHeight: 24,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  track: {
    height: 4,
    backgroundColor: colors.bg,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
});
