import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { parkColors } from '@/constants/colors';
import type { ParkObject, Rect } from '@/domain/park/layout';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface Props {
  object: ParkObject;
  rect: Rect;
  label: string;
  hint: string;
  /** Not yet tended today: a soft glow that breathes (a still glow with Reduce Motion). */
  shimmer: boolean;
  onPress: (o: ParkObject) => void;
}

/** An invisible, accessible button laid over a park object. The drawing is the visual. */
export function Hotspot({ object, rect, label, hint, shimmer, onPress }: Props) {
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0.06)).current;

  useEffect(() => {
    if (!shimmer || reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.26, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.06, duration: 2200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer, reduce, pulse]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={() => onPress(object)}
      style={[styles.target, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}
    >
      {shimmer && (
        <Animated.View
          testID={`shimmer-${object}`}
          pointerEvents="none"
          style={[styles.glow, { opacity: reduce ? 0.18 : pulse }]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  // A soft halo of light, not an outline: the object glows gently as if catching the sun.
  glow: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    backgroundColor: parkColors.shimmer,
    shadowColor: parkColors.shimmer,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
});
