import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, elevation } from '@/constants/colors';
import { font } from '@/constants/typography';
import { Icon, type IconName } from '@/components/Icon';

interface Props {
  icon: IconName;
  /** Small heading ("Water"). */
  title: string;
  /** The big line ("4", "Log one", "3,240"). */
  value: string;
  /** Under the big line ("glasses"). */
  unit?: string;
  /** A soft green note ("Stream flowing"). */
  note?: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

/** A big logging card (Water / Workout / Steps): white, softly ringed, dark readable text. */
export function ActionTile({ icon, title, value, unit, note, onPress, accessibilityLabel, accessibilityHint, disabled }: Props) {
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
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {unit ? <Text style={styles.unit} numberOfLines={1}>{unit}</Text> : null}
      {note ? <Text style={styles.note} numberOfLines={1}>{note}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 132,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ring,
    backgroundColor: colors.surface,
    padding: 12,
    ...elevation.card,
  },
  pressed: { backgroundColor: colors.primarySoft, transform: [{ scale: 0.97 }] },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...font.semibold, fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  value: { ...font.bold, fontSize: 22, color: colors.textPrimary },
  unit: { ...font.regular, fontSize: 13, color: colors.textSecondary },
  note: { ...font.semibold, fontSize: 13, color: colors.primary, marginTop: 4 },
});
