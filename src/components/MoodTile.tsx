import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, stateColors } from '@/constants/colors';
import { MOOD_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { Icon, type IconName } from '@/components/Icon';
import type { UserState } from '@/types';

const MOOD_ICON: Record<UserState, IconName> = {
  overloaded: 'weather-night',
  recovering: 'sprout-outline',
  regulated: 'white-balance-sunny',
  activated: 'lightning-bolt-outline',
};

interface Props {
  mood: UserState;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}

/** One tap = one check-in. Pastel fill, an icon in a white circle, a tick once chosen. */
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
        { backgroundColor: c.soft, borderColor: selected ? c.ink : 'transparent' },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Icon name={MOOD_ICON[mood]} size={20} color={c.ink} />
        </View>
        {selected ? (
          <Icon name="check" size={20} color={c.ink} />
        ) : (
          <Text style={[styles.flavor, { color: c.ink }]}>{copy.flavor}</Text>
        )}
      </View>
      <Text style={[styles.label, { color: c.ink }]}>{copy.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 112, borderRadius: 20, borderWidth: 2, padding: 14, justifyContent: 'space-between' },
  pressed: { transform: [{ scale: 0.97 }] },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flavor: { ...font.medium, fontSize: 13 },
  label: { ...font.bold, fontSize: 16, lineHeight: 21, marginTop: 10 },
});
