import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { ACTIVITIES } from '@/constants/activities';
import type { Activity } from '@/types';

interface Props {
  lastActivity: Activity | null;
  onLog: (type: Activity['type'], durationMinutes: number) => Promise<void>;
}

export function QuickLogBar({ lastActivity, onLog }: Props) {
  const [loading, setLoading] = useState(false);

  if (!lastActivity) return null;

  const actDef = ACTIVITIES.find((a) => a.type === lastActivity.type);
  const emoji = actDef?.emoji ?? '🏃';
  const label = actDef?.label ?? lastActivity.type;
  const duration = Math.min(lastActivity.duration_minutes, 60);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await onLog(lastActivity.type, duration);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={handlePress} disabled={loading} style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View>
          <Text style={styles.label}>Quick log</Text>
          <Text style={styles.detail}>
            {duration} min of {label}
          </Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.sageDark} />
      ) : (
        <Text style={styles.cta}>Log →</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.sageMid,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: colors.ink,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 22 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detail: { fontSize: 14, fontWeight: '500', color: colors.ink, marginTop: 1 },
  cta: { fontSize: 13, fontWeight: '600', color: colors.sageDark },
});
