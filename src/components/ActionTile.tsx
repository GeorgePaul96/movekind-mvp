import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  emoji: string;
  label: string;
  detail: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

/**
 * A big, square-ish logging button (the garden's Water / Workout / Steps): white tile, green
 * outline, dark text. All three look alike so none reads as more important or hard to read.
 */
export function ActionTile({ emoji, label, detail, onPress, accessibilityLabel, accessibilityHint, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.tile, pressed && !disabled && styles.pressed]}
    >
      <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
        {emoji}
      </Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  pressed: { backgroundColor: colors.primarySoft, transform: [{ scale: 0.97 }] },
  emoji: { fontSize: 24, marginBottom: 2 },
  label: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  detail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
