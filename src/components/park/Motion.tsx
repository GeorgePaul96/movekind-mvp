import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { parkColors } from '@/constants/colors';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * Single shared clock on the UI thread (counts seconds, 0 to 3600, then restarts). Every gentle
 * motion in the park derives from it with phase offsets. An hour long because at the restart any
 * motion whose period doesn't divide it jumps, and sways of a few seconds rarely do.
 */
export function useParkClock(): SharedValue<number> {
  const reduce = useReduceMotion();
  const clock = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      clock.value = 0;
      return;
    }
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(3600, { duration: 3600000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [clock, reduce]);

  return clock;
}

/** A squash-and-stretch pop when `dep` grows, that is, when something was logged for this object. */
export function usePopOnChange(dep: number) {
  const reduce = useReduceMotion();
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const last = React.useRef(dep);

  useEffect(() => {
    const grew = dep > last.current;
    last.current = dep;
    if (!grew || reduce) return;
    scaleX.value = withSequence(
      withTiming(1.1, { duration: 110 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    scaleY.value = withSequence(
      withTiming(0.92, { duration: 110 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
  }, [dep, reduce, scaleX, scaleY]);

  return useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }, { scaleY: scaleY.value }],
  }));
}

/** Gentle sway wrapper driven by the shared UI clock. */
export function SwayWrap({
  clock,
  degrees,
  periodSec,
  phase = 0,
  originY = 'bottom',
  style,
  testID,
  children,
}: {
  clock: SharedValue<number>;
  degrees: number;
  periodSec: number;
  phase?: number;
  originY?: 'bottom' | 'center';
  style?: object;
  testID?: string;
  children: React.ReactNode;
}) {
  const reduce = useReduceMotion();
  const animStyle = useAnimatedStyle(() => {
    if (reduce || degrees === 0) return { transform: [{ rotate: '0deg' }] };
    const angle = Math.sin(((clock.value + phase) / periodSec) * Math.PI * 2) * degrees;
    return { transform: [{ rotate: `${angle}deg` }] };
  });

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.abs,
        style,
        { transformOrigin: originY === 'bottom' ? '50% 90%' : '50% 50%' },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Soft expanding water rings on untended river. */
export function Ripple({
  clock,
  x,
  y,
  size,
  testID,
}: {
  clock: SharedValue<number>;
  x: number;
  y: number;
  size: number;
  testID?: string;
}) {
  const reduce = useReduceMotion();
  const ringA = useAnimatedStyle(() => {
    const p = reduce ? 0.5 : (clock.value * 0.45) % 1;
    return {
      opacity: reduce ? 0.45 : (1 - p) * 0.7,
      transform: [{ scaleX: 0.35 + p * 1.05 }, { scaleY: 0.16 + p * 0.38 }],
    };
  });
  const ringB = useAnimatedStyle(() => {
    const p = ((clock.value * 0.45) + 0.5) % 1;
    return {
      opacity: reduce ? 0 : (1 - p) * 0.7,
      transform: [{ scaleX: 0.35 + p * 1.05 }, { scaleY: 0.16 + p * 0.38 }],
    };
  });

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[styles.abs, { left: x - size / 2, top: y - size / 2, width: size, height: size }]}
    >
      <Animated.View style={[styles.ring, ringA]} />
      {!reduce && <Animated.View style={[styles.ring, ringB]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  ring: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: parkColors.shimmer,
  },
});
