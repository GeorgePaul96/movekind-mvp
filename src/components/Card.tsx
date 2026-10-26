import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors, elevation } from '@/constants/colors';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 'soft' = pale sage fill for secondary content; default = white. */
  tone?: 'default' | 'soft';
}

/** A pebble-soft card: big rounded corners and a faint green ring instead of a hard border. */
export function Card({ children, style, tone = 'default' }: Props) {
  return <View style={[styles.card, tone === 'soft' && styles.soft, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.ring,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    ...elevation.card,
  },
  soft: { backgroundColor: colors.surfaceSecondary, shadowOpacity: 0, elevation: 0 },
});
