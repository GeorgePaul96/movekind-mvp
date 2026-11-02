import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { Pt } from '@/domain/park/shapes';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { ButterflyArt, CatArt } from './art/CrittersArt';

interface CatProps {
  clock: SharedValue<number>;
  path: Pt[];
  worldH: number;
  asleep: boolean;
}

/**
 * Cartoon tabby cat. At night or when resting it curls up asleep. By day it strolls a short stretch
 * and sits calmly, driven entirely by the shared UI clock without JS timers.
 */
export function Cat({ clock, path, asleep }: CatProps) {
  const reduce = useReduceMotion();
  const anchor = path[2] ?? path[0] ?? [180, 460];

  const moveStyle = useAnimatedStyle(() => {
    if (asleep || reduce) return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    const cycle = clock.value % 24;
    const p = cycle > 12 ? 0 : Math.sin((cycle / 12) * Math.PI);
    return {
      transform: [{ translateX: p * 16 }, { translateY: p * 10 }, { scaleX: cycle > 6 && cycle <= 12 ? -1 : 1 }],
    };
  });
  const walkA = useAnimatedStyle(() => ({ opacity: clock.value % 24 <= 12 && clock.value % 0.8 < 0.4 ? 1 : 0 }));
  const walkB = useAnimatedStyle(() => ({ opacity: clock.value % 24 <= 12 && clock.value % 0.8 >= 0.4 ? 1 : 0 }));
  const sit = useAnimatedStyle(() => ({ opacity: clock.value % 24 > 12 ? 1 : 0 }));

  if (asleep || reduce) {
    return (
      <View
        testID={asleep ? 'cat-sleeping' : 'cat-sitting'}
        pointerEvents="none"
        style={[styles.abs, { left: anchor[0] - 24, top: anchor[1] - 28 }]}
      >
        <CatArt pose={asleep ? 'sleep' : 'sit'} size={48} />
      </View>
    );
  }

  return (
    <Animated.View
      testID="cat-walking"
      pointerEvents="none"
      style={[styles.abs, { left: anchor[0] - 24, top: anchor[1] - 32 }, moveStyle]}
    >
      <Animated.View style={walkA}>
        <CatArt pose="walkA" size={48} />
      </Animated.View>
      <Animated.View style={[styles.abs, walkB]}>
        <CatArt pose="walkB" size={48} />
      </Animated.View>
      <Animated.View style={[styles.abs, sit]}>
        <CatArt pose="sit" size={48} />
      </Animated.View>
    </Animated.View>
  );
}

function OrbitButterfly({
  clock,
  cx,
  cy,
  rx,
  ry,
  phase,
  size,
}: {
  clock: SharedValue<number>;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  phase: number;
  size: number;
}) {
  const reduce = useReduceMotion();
  const style = useAnimatedStyle(() => {
    if (reduce) return { transform: [{ translateX: cx }, { translateY: cy }] };
    const a = clock.value * 0.9 + phase;
    const x = cx + Math.sin(a) * rx;
    const y = cy + Math.sin(a * 2) * ry;
    return { transform: [{ translateX: x }, { translateY: y }] };
  });

  return (
    <Animated.View
      testID="butterfly"
      style={[styles.abs, { left: -size / 2, top: -size / 2 }, style]}
    >
      <ButterflyArt size={size} />
    </Animated.View>
  );
}

/** Gentle butterflies circling an untended flowerbed. */
export function Butterflies({
  clock,
  cx,
  cy,
  spread,
}: {
  clock: SharedValue<number>;
  cx: number;
  cy: number;
  spread: number;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <OrbitButterfly clock={clock} cx={cx} cy={cy - 10} rx={spread * 0.34} ry={12} phase={0} size={24} />
      <OrbitButterfly clock={clock} cx={cx + 6} cy={cy - 16} rx={spread * 0.26} ry={9} phase={2.4} size={20} />
    </View>
  );
}

/** Gentle 2pt vertical bob on the water driven by the shared UI clock. */
export function Bob({
  clock,
  x,
  y,
  children,
}: {
  clock: SharedValue<number>;
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  const reduce = useReduceMotion();
  const style = useAnimatedStyle(() => {
    const dy = reduce ? 0 : Math.sin(clock.value * 2.4) * 2;
    return { transform: [{ translateY: dy }] };
  });
  return (
    <Animated.View style={[styles.abs, { left: x, top: y }, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
