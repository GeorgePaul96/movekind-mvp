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
import { ButterflyArt, FawnBodyArt, FawnDropletsArt, FawnNeckArt, RabbitArt } from './art/CrittersArt';

interface RabbitProps {
  clock: SharedValue<number>;
  /** The middle of its figure of eight, on open grass. */
  at: Pt;
  rx: number;
  ry: number;
  asleep: boolean;
}

/**
 * A cream rabbit on the meadow. At night or when resting it curls up asleep. By day it hops an
 * invisible figure of eight, sits for a while, and blinks every few seconds, driven entirely by the
 * shared UI clock without JS timers.
 */
export function Rabbit({ clock, at, rx, ry, asleep }: RabbitProps) {
  const reduce = useReduceMotion();
  const left = at[0] - 24;
  const top = at[1] - 42;

  const moveStyle = useAnimatedStyle(() => {
    if (asleep || reduce) return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    const cycle = clock.value % 18;
    if (cycle > 12) return { transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1 }] };
    const a = (cycle / 12) * Math.PI * 2;
    const hop = -Math.abs(Math.sin(a * 3)) * 9;
    return {
      transform: [
        { translateX: Math.sin(a) * rx },
        { translateY: Math.sin(a * 2) * ry + hop },
        { scaleX: Math.cos(a) >= 0 ? 1 : -1 },
      ],
    };
  });
  const hopOpen = useAnimatedStyle(() => ({ opacity: clock.value % 18 <= 12 && clock.value % 3.2 >= 0.2 ? 1 : 0 }));
  const hopShut = useAnimatedStyle(() => ({ opacity: clock.value % 18 <= 12 && clock.value % 3.2 < 0.2 ? 1 : 0 }));
  const sitOpen = useAnimatedStyle(() => ({ opacity: clock.value % 18 > 12 && clock.value % 3.2 >= 0.2 ? 1 : 0 }));
  const sitShut = useAnimatedStyle(() => ({ opacity: clock.value % 18 > 12 && clock.value % 3.2 < 0.2 ? 1 : 0 }));

  if (asleep || reduce) {
    return (
      <View
        testID={asleep ? 'rabbit-sleeping' : 'rabbit-sitting'}
        pointerEvents="none"
        style={[styles.abs, { left, top }]}
      >
        <RabbitArt pose={asleep ? 'sleep' : 'sit'} size={48} />
      </View>
    );
  }

  return (
    <Animated.View testID="rabbit-hopping" pointerEvents="none" style={[styles.abs, { left, top }, moveStyle]}>
      <Animated.View style={hopOpen}>
        <RabbitArt pose="hop" size={48} />
      </Animated.View>
      <Animated.View style={[styles.abs, hopShut]}>
        <RabbitArt pose="hop" eyesClosed size={48} />
      </Animated.View>
      <Animated.View style={[styles.abs, sitOpen]}>
        <RabbitArt pose="sit" size={48} />
      </Animated.View>
      <Animated.View style={[styles.abs, sitShut]}>
        <RabbitArt pose="sit" eyesClosed size={48} />
      </Animated.View>
    </Animated.View>
  );
}

interface FawnProps {
  clock: SharedValue<number>;
  feet: Pt;
  cue: boolean;
  asleep: boolean;
  watered: number;
  size?: number;
}

/**
 * A fawn on the right bank of the river. Periodically dips its neck to take two small sips
 * from the stream (every 6s when untended, 12s normally), and gives a happy stretch with water
 * droplets whenever a glass of water is logged.
 */
export function Fawn({ clock, feet, cue, asleep, watered, size = 90 }: FawnProps) {
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
      withTiming(-42, { duration: 240 }),
      withTiming(-32, { duration: 120 }),
      withTiming(-42, { duration: 120 }),
      withTiming(10, { duration: 260 }),
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
      dip = -42 * Math.sin(((t / 0.7) * Math.PI) / 2);
    } else if (t < 1.05) {
      dip = -42 + 10 * Math.sin(((t - 0.7) / 0.35) * Math.PI);
    } else if (t < 1.4) {
      dip = -42 + 10 * Math.sin(((t - 1.05) / 0.35) * Math.PI);
    } else if (t < 2.2) {
      dip = -42 * Math.cos((((t - 1.4) / 0.8) * Math.PI) / 2);
    }
    // The sway fades out as the neck dips, so nothing jumps where the two meet.
    const idle = dip + Math.sin(clock.value * 1.4) * 1.2 * (1 + dip / 42);
    const deg = idle * (1 - blend.value) + celebrate.value * blend.value;
    return { transform: [{ rotate: `${deg}deg` }] };
  });

  const dropStyle = useAnimatedStyle(() => ({
    opacity: reduce || asleep ? 0 : drops.value,
    transform: [{ translateY: -drops.value * 6 }],
  }));

  const left = feet[0] - size * 0.62;
  const top = feet[1] - size * 0.88;

  if (asleep) {
    return (
      <View
        testID="fawn-sleeping"
        pointerEvents="none"
        style={[styles.abs, { left, top, width: size, height: size }]}
      >
        <FawnBodyArt asleep size={size} />
      </View>
    );
  }

  return (
    <View
      testID={cue ? 'cue-river' : undefined}
      pointerEvents="none"
      style={[styles.abs, { left, top, width: size, height: size }]}
    >
      <View testID="fawn" style={{ width: size, height: size }}>
        <Animated.View
          style={[
            styles.abs,
            { left: 0, top: 0, width: size, height: size, transformOrigin: '54% 56%' },
            neckStyle,
          ]}
        >
          <FawnNeckArt size={size} />
        </Animated.View>
        <View style={[styles.abs, { left: 0, top: 0 }]}>
          <FawnBodyArt size={size} />
        </View>
        {!reduce && (
          <Animated.View style={[styles.abs, { left: 0, top: 0, width: size, height: size }, dropStyle]}>
            <FawnDropletsArt size={size} />
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
