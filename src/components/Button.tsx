import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'sage-soft';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'sage-soft' && styles.soft,
        variant === 'primary' && pressed && !isDisabled && { backgroundColor: colors.primaryPressed },
        pressed && !isDisabled && variant !== 'primary' && { opacity: 0.7 },
        isDisabled && { opacity: 0.45 },
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.onPrimary : colors.primary}
          />
        ) : (
          <Text
            style={[
              styles.label,
              variant === 'primary' && { color: colors.onPrimary },
              variant === 'ghost' && { color: colors.textSecondary },
              variant === 'sage-soft' && { color: colors.secondaryText },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ghost: { backgroundColor: 'transparent' },
  soft: { backgroundColor: colors.primarySoft },
  inner: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '600' },
});
