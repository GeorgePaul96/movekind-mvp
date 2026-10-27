import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
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
  const pulse = useRef(new Animated.Value(0.2)).current;
  const glow = Math.min(rect.w, rect.h); // a round halo, whatever the object's shape

  useEffect(() => {
    if (!shimmer || reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.2, duration: 2200, useNativeDriver: true }),
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
          style={{ width: glow, height: glow, opacity: reduce ? 0.5 : pulse }}
        >
          <Svg width={glow} height={glow}>
            <Defs>
              <RadialGradient id={`glow-${object}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={parkColors.shimmer} stopOpacity={0.7} />
                <Stop offset="0.5" stopColor={parkColors.shimmer} stopOpacity={0.25} />
                <Stop offset="1" stopColor={parkColors.shimmer} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill={`url(#glow-${object})`} />
          </Svg>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
