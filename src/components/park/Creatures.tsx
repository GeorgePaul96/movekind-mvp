import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Pt } from '@/domain/park/shapes';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { ButterflyArt, CatArt, CraneBodyArt, CraneDropletsArt, CraneNeckArt } from './art/CrittersArt';

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

interface CraneProps {
  clock: SharedValue<number>;
  feet: Pt;
  cue: boolean;
  asleep: boolean;
  watered: number;
  size?: number;
}

/**
 * A wading crane on the right bank of the river. Periodically dips its neck to take two small sips
 * from the stream (every 6s when untended, 12s normally), and gives a happy stretch with water
 * droplets whenever a glass of water is logged.
 */
export function Crane({ clock, feet, cue, asleep, watered, size = 90 }: CraneProps) {
  const reduce = useReduceMotion();
  const celebrate = useSharedValue(0);
  const drops = useSharedValue(0);
  const blend = useSharedValue(0); // eases into and out of the logged drink, from whatever the neck was doing
  const lastWatered = React.useRef(watered);

  useEffect(() => {
    const grew = watered > lastWatered.current;
    lastWatered.current = watered;
    if (!grew || reduce || asleep) return;
    blend.value = withSequence(withTiming(1, { duration: 200 }), withTiming(1, { duration: 900 }), withTiming(0, { duration: 300 }));
    celebrate.value = withSequence(
      withTiming(-45, { duration: 240 }),
      withTiming(-34, { duration: 120 }),
      withTiming(-45, { duration: 120 }),
      withTiming(11, { duration: 260 }),
      withSpring(0, { damping: 12, stiffness: 180 }),
    );
    drops.value = withSequence(
      withTiming(0, { duration: 420 }),
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 260 }),
      withTiming(0, { duration: 220 }),
    );
  }, [asleep, blend, celebrate, drops, reduce, watered]);

  const period = cue ? 6 : 12;
  const neckStyle = useAnimatedStyle(() => {
    if (reduce || asleep) return { transform: [{ rotate: '0deg' }] };
    const t = clock.value % period;
    let dip = 0;
    if (t < 0.7) {
      dip = -44 * Math.sin(((t / 0.7) * Math.PI) / 2);
    } else if (t < 1.05) {
      dip = -44 + 11 * Math.sin(((t - 0.7) / 0.35) * Math.PI);
    } else if (t < 1.4) {
      dip = -44 + 11 * Math.sin(((t - 1.05) / 0.35) * Math.PI);
    } else if (t < 2.2) {
      dip = -44 * Math.cos((((t - 1.4) / 0.8) * Math.PI) / 2);
    }
    // The sway fades out as the neck dips, so nothing jumps where the two meet.
    const idle = dip + Math.sin(clock.value * 1.4) * 1.2 * (1 + dip / 44);
    const deg = idle * (1 - blend.value) + celebrate.value * blend.value;
    return { transform: [{ rotate: `${deg}deg` }] };
  });

  const dropStyle = useAnimatedStyle(() => ({
    opacity: reduce || asleep ? 0 : drops.value,
    transform: [{ translateY: -drops.value * 6 }],
  }));

  const left = feet[0] - size * 0.64;
  const top = feet[1] - size * 0.9;

  if (asleep) {
    return (
      <View
        testID="crane-sleeping"
        pointerEvents="none"
        style={[styles.abs, { left, top, width: size, height: size }]}
      >
        <CraneBodyArt asleep size={size} />
      </View>
    );
  }

  return (
    <View
      testID={cue ? 'cue-river' : undefined}
      pointerEvents="none"
      style={[styles.abs, { left, top, width: size, height: size }]}
    >
      <View testID="crane" style={{ width: size, height: size }}>
        <Animated.View
          style={[
            styles.abs,
            { left: 0, top: 0, width: size, height: size, transformOrigin: '52% 54%' },
            neckStyle,
          ]}
        >
          <CraneNeckArt size={size} />
        </Animated.View>
        <View style={[styles.abs, { left: 0, top: 0 }]}>
          <CraneBodyArt size={size} />
        </View>
        {!reduce && (
          <Animated.View style={[styles.abs, { left: 0, top: 0, width: size, height: size }, dropStyle]}>
            <CraneDropletsArt size={size} />
          </Animated.View>
        )}
      </View>
    </View>
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
