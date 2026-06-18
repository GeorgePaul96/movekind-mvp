import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { BEHAVIORAL_FALLBACK } from '@/constants/copy';
import type { BehavioralProfile } from '@/domain/behavioral';

export function BehavioralBanner({ profile }: { profile: BehavioralProfile | null }) {
  if (!profile) return null;

  const topWin = profile.wins[0] ?? null;
  const message = topWin ? topWin.observation : BEHAVIORAL_FALLBACK[profile.recovery.signal].message;
  const insight = profile.gaps.observation ?? profile.rhythm.observation ?? null;

  return (
    <Card style={styles.card} testID="behavioral-banner">
      <Text style={styles.message}>{message}</Text>
      {insight ? <Text style={styles.insight}>{insight}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.sageLight,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  message: { fontSize: 15, fontWeight: '600', color: colors.sageDark, lineHeight: 20 },
  insight: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 16 },
});
