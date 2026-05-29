import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { ACTIVITIES } from '@/constants/activities';
import type { Activity } from '@/types';
import type { MovementMode } from '@/utils/movementState';

interface Props {
  lastActivity: Activity | null;
  mode: MovementMode;
  onLog: (type: Activity['type'], durationMinutes: number, effort: number) => Promise<void>;
}

interface LogConfig {
  emoji: string;
  label: string;
  detail: string;
  type: Activity['type'];
  duration: number;
  effort: number;
}

function buildConfig(mode: MovementMode, lastActivity: Activity | null): LogConfig | null {
  if (mode === 'resting') return null;

  if (mode === 'inactive') {
    return {
      emoji: '🌱',
      label: 'Start small',
      detail: '5 min of anything',
      type: 'walk',
      duration: 5,
      effort: 3,
    };
  }

  if (mode === 'returning') {
    const def = lastActivity ? ACTIVITIES.find((a) => a.type === lastActivity.type) : null;
    return {
      emoji: def?.emoji ?? '🚶',
      label: 'Ease back in',
      detail: `${Math.min(lastActivity?.duration_minutes ?? 10, 15)} min${def ? ` of ${def.label}` : ''}`,
      type: lastActivity?.type ?? 'walk',
      duration: Math.min(lastActivity?.duration_minutes ?? 10, 15),
      effort: Math.min(lastActivity?.effort ?? 3, 4),
    };
  }

  // building / steady — normal repeat behavior
  if (!lastActivity) return null;
  const def = ACTIVITIES.find((a) => a.type === lastActivity.type);
  return {
    emoji: def?.emoji ?? '🏃',
    label: 'Quick log',
    detail: `${Math.min(lastActivity.duration_minutes, 60)} min of ${def?.label ?? lastActivity.type}`,
    type: lastActivity.type,
    duration: Math.min(lastActivity.duration_minutes, 60),
    effort: lastActivity.effort,
  };
}

export function QuickLogBar({ lastActivity, mode, onLog }: Props) {
  const [loading, setLoading] = useState(false);

  const config = buildConfig(mode, lastActivity);
  if (!config) return null;

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await onLog(config.type, config.duration, config.effort);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={handlePress} disabled={loading} style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View>
          <Text style={styles.label}>{config.label}</Text>
          <Text style={styles.detail}>{config.detail}</Text>
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
