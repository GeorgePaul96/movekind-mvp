import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVITY_BY_TYPE, PALETTE } from '@/constants/activities';
import { colors } from '@/constants/colors';
import type { Activity } from '@/types';
import { formatDuration } from '@/utils/format';

export function ActivityRow({ activity }: { activity: Activity }) {
  const meta = ACTIVITY_BY_TYPE[activity.type];
  const palette = PALETTE[meta.palette];

  const points = Math.round(
    activity.duration_minutes * 0.3 + activity.effort * 1.2,
  );

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: palette.bg }]}>
        <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{`${meta.label} session`}</Text>
        <Text style={styles.meta}>
          {`${formatDuration(activity.duration_minutes)} · Effort ${activity.effort}/10`}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: palette.bg }]}>
        <Text style={[styles.badgeText, { color: palette.text }]}>{`+${points}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '500', color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '500' },
});
