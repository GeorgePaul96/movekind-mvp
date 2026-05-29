import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import type { MovementState } from '@/utils/movementState';
import { type RhythmScore } from '@/utils/rhythmScore';

interface Props {
  state: MovementState;
  rhythmScore: RhythmScore;
  onQuickLog?: () => void;
}

const PALETTE_STYLES = {
  sage: {
    bg: colors.sageLight,
    border: colors.sageMid,
    headline: colors.sageDark,
    subline: colors.sage,
    chipBg: colors.selectedBg,
    chipText: colors.sageDark,
  },
  sky: {
    bg: colors.skyLight,
    border: colors.sky,
    headline: colors.skyDark,
    subline: colors.skyAccent,
    chipBg: '#D4E6F8',
    chipText: colors.skyDark,
  },
  warm: {
    bg: colors.warmLight,
    border: colors.warm,
    headline: colors.warmDark,
    subline: colors.warmAccent,
    chipBg: colors.warm,
    chipText: colors.warmDark,
  },
} as const;

const MODE_LABEL: Record<MovementState['mode'], string> = {
  inactive: 'Away',
  returning: 'Back',
  resting: 'Resting',
  building: 'Building',
  steady: 'In rhythm',
};

export function MovementStateCard({ state, rhythmScore, onQuickLog }: Props) {
  const p = PALETTE_STYLES[state.palette];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.card, { backgroundColor: p.bg, borderColor: p.border }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.chip, { backgroundColor: p.chipBg }]}>
          <Text style={[styles.chipText, { color: p.chipText }]}>
            {state.emoji} {MODE_LABEL[state.mode]}
          </Text>
        </View>
        {state.thisWeekCount > 0 && (
          <Text style={[styles.countLabel, { color: p.subline }]}>
            {state.thisWeekCount} this week
          </Text>
        )}
      </View>

      <Text style={[styles.headline, { color: p.headline }]}>{state.headline}</Text>
      <Text style={[styles.subline, { color: p.subline }]}>{state.subline}</Text>

      <View style={styles.rhythmRow}>
        <Text style={[styles.rhythmPct, { color: p.headline }]}>
          {rhythmScore.percentage}%
        </Text>
        <Text style={[styles.rhythmLabel, { color: p.subline }]}>
          {rhythmScore.label} · 28 days
        </Text>
      </View>

      {state.mode === 'inactive' && state.cta && onQuickLog && (
        <Pressable
          onPress={onQuickLog}
          style={[styles.ctaBtn, { borderColor: p.border }]}
        >
          <Text style={[styles.ctaText, { color: p.headline }]}>{state.cta}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#1F2A22',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  countLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  headline: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 5,
  },
  subline: {
    fontSize: 13,
    lineHeight: 19,
  },
  ctaBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rhythmRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  rhythmPct: {
    fontSize: 16,
    fontWeight: '700',
  },
  rhythmLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
