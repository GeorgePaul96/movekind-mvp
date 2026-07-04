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
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#fff' : colors.sage}
          />
        ) : (
          <Text
            style={[
              styles.label,
              variant === 'primary' && { color: '#fff' },
              variant === 'ghost' && { color: colors.muted },
              variant === 'sage-soft' && { color: colors.sageDark },
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
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.sage },
  ghost: { backgroundColor: 'transparent' },
  soft: { backgroundColor: colors.sageLight },
  inner: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '500' },
});
