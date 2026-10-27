import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import { parkColors } from '@/constants/colors';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * Gentle loops for the park, all on the native driver so panning never stutters. Every one
 * holds still when the phone asks for less motion.
 */
export function useLoop(period: number, enabled = true): Animated.Value {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce || !enabled) {
      v.setValue(0);
      return;
    }
    const half = period / 2;
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: half, easing: ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: half, easing: ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, period, enabled, reduce]);
  return v;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A painting that sways from its base, like a tree in a breeze. Untended things sway more. */
export function Sway({ source, box, degrees, period, testID }: { source: ImageSourcePropType; box: Box; degrees: number; period: number; testID?: string }) {
  const t = useLoop(period);
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: [`${-degrees}deg`, `${degrees}deg`] });
  return (
    <Animated.Image
      testID={testID}
      source={source}
      resizeMode="stretch"
      style={[styles.abs, { left: box.x, top: box.y, width: box.width, height: box.height, transformOrigin: 'bottom', transform: [{ rotate }] }]}
    />
  );
}

/** Soft rings spreading on the water: "something to do here". A still ring with Reduce Motion. */
export function Ripple({ x, y, size, testID }: { x: number; y: number; size: number; testID?: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v, reduce]);
  const ring = (delay: number) => {
    const p = Animated.modulo(Animated.add(v, delay), 1);
    return {
      opacity: reduce ? 0.45 : p.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
      transform: [{ scaleX: reduce ? 1 : p.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.4] }) }, { scaleY: reduce ? 0.4 : p.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.55] }) }],
    };
  };
  return (
    <View testID={testID} pointerEvents="none" style={[styles.abs, { left: x - size / 2, top: y - size / 2, width: size, height: size }]}>
      <Animated.View style={[styles.ring, ring(0)]} />
      {!reduce && <Animated.View style={[styles.ring, ring(0.5)]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  ring: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 999, borderWidth: 3, borderColor: parkColors.shimmer },
});
