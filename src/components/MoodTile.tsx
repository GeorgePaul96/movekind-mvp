import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { stateColors } from '@/constants/colors';
import { MOOD_COPY } from '@/constants/copy';
import type { UserState } from '@/types';

interface Props {
  mood: UserState;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}

/** One tap = one check-in. Pastel fill, but a dark ink border so it always reads as tappable. */
export function MoodTile({ mood, onPress, selected, disabled }: Props) {
  const c = stateColors[mood];
  const copy = MOOD_COPY[mood];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={copy.label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: c.soft, borderColor: c.ink },
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.emoji} importantForAccessibility="no" accessibilityElementsHidden>
        {copy.emoji}
      </Text>
      <Text style={[styles.label, { color: c.ink }]}>{copy.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 104, borderRadius: 18, borderWidth: 1.5, padding: 14, justifyContent: 'flex-end' },
  selected: { borderWidth: 3 },
  pressed: { transform: [{ scale: 0.97 }] },
  emoji: { fontSize: 28, marginBottom: 6 },
  label: { fontSize: 15, fontWeight: '700', lineHeight: 19 },
});
