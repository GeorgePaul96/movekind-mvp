import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props<T extends string> {
  object: T;
  rect: Rect;
  label: string;
  hint: string;
  focused?: boolean;
  onPress: (o: T) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * An invisible, accessible button laid over a yard object. The drawing is the visual, and the
 * object's own movement is the "tap me" cue.
 */
export function Hotspot<T extends string>({ object, rect, label, hint, focused, onPress }: Props<T>) {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPressIn={() => {
        scale.value = withSpring(1.03, { damping: 15, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 260 });
      }}
      onPress={() => onPress(object)}
      style={[
        styles.target,
        { left: rect.x, top: rect.y, width: rect.w, height: rect.h },
        focused && styles.focused,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  target: { position: 'absolute', borderRadius: 24 },
  focused: { borderWidth: 2, borderColor: colors.primarySoft },
});
