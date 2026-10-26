import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { font } from '@/constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'link';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * The only button in the app. Three kinds, each unmistakable:
 * - primary   — solid deep green, white label (the one main action on a screen)
 * - secondary — white with a 2px green outline (the alternative)
 * - link      — underlined green text, still a full 44pt touch target
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = !!(disabled || loading);

  const style = [
    styles.base,
    size === 'sm' && styles.sm,
    variant === 'primary' && styles.primary,
    variant === 'primary' && pressed && !isDisabled && styles.primaryPressed,
    variant === 'secondary' && styles.secondary,
    variant === 'secondary' && pressed && !isDisabled && styles.secondaryPressed,
    variant === 'link' && styles.link,
    variant === 'link' && pressed && !isDisabled && styles.linkPressed,
    isDisabled && styles.disabled,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={style}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
        ) : (
          <Text
            style={[
              styles.label,
              size === 'sm' && styles.labelSm,
              variant === 'primary' && { color: colors.onPrimary },
              variant !== 'primary' && { color: colors.primary },
              variant === 'link' && styles.linkLabel,
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
  base: { borderRadius: 999, paddingVertical: 15, paddingHorizontal: 22, minHeight: 54, justifyContent: 'center' },
  sm: { paddingVertical: 10, minHeight: 44 },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary },
  secondaryPressed: { backgroundColor: colors.surface },
  link: { backgroundColor: 'transparent', minHeight: 44, paddingVertical: 10 },
  linkPressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
  inner: { alignItems: 'center', justifyContent: 'center' },
  label: { ...font.bold, fontSize: 16 },
  labelSm: { fontSize: 15 },
  linkLabel: { ...font.semibold, textDecorationLine: 'underline' },
});
