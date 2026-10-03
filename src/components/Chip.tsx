import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** A small selectable option in a row (e.g. sleep quality). Outlined until chosen, solid once chosen. */
export function Chip({ label, selected, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selected: { backgroundColor: colors.primary },
  label: { fontSize: 14, fontWeight: '600', color: colors.primary },
  labelSelected: { color: colors.onPrimary },
});
