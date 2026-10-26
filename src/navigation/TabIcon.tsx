import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { font } from '@/constants/typography';
import { Icon, type IconName } from '@/components/Icon';

interface Props {
  focused: boolean;
  icon: IconName;
  label: string;
}

/** A tab in the floating bar: icon + label, sitting in a soft green pill when active. */
export function TabIcon({ focused, icon, label }: Props) {
  return (
    <View style={[styles.pill, focused && styles.active]}>
      <Icon name={icon} size={22} color={focused ? colors.primary : colors.textMuted} />
      <Text style={[styles.label, { color: focused ? colors.primary : colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { minWidth: 92, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center' },
  active: { backgroundColor: colors.primarySoft },
  label: { ...font.semibold, fontSize: 13, marginTop: 2 },
});
