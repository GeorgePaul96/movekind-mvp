import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { type Pt, sampleSpline } from '@/domain/park/shapes';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useLoop } from './Motion';

/** Paintings from design/park/layers 2 (magenta keyed out). */
const CAT_WALK = [
  require('../../../assets/park/cat-walk-0.png'), require('../../../assets/park/cat-walk-1.png'),
  require('../../../assets/park/cat-walk-2.png'), require('../../../assets/park/cat-walk-3.png'),
  require('../../../assets/park/cat-walk-4.png'), require('../../../assets/park/cat-walk-5.png'),
  require('../../../assets/park/cat-walk-6.png'), require('../../../assets/park/cat-walk-7.png'),
  require('../../../assets/park/cat-walk-8.png'), require('../../../assets/park/cat-walk-9.png'),
  require('../../../assets/park/cat-walk-10.png'), require('../../../assets/park/cat-walk-11.png'),
];
const CAT_SIT = { src: require('../../../assets/park/cat-sit.png'), w: 182, h: 256 };
const CAT_SLEEP = { src: require('../../../assets/park/cat-sleep.png'), w: 239, h: 256 };
const WALK_ASPECT = 512 / 688; // height / width of a walk frame
const BUTTERFLY = [
  require('../../../assets/park/butterfly-0.png'), require('../../../assets/park/butterfly-1.png'),
  require('../../../assets/park/butterfly-2.png'), require('../../../assets/park/butterfly-3.png'),
];

/** Steps through sprite frames on a light timer (only this small image re-renders). */
function useFrame(count: number, ms: number, enabled: boolean): number {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setF((v) => (v + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, ms, enabled]);
  return f;
}

interface CatProps {
  /** The footpath's centre line (world pixels). */
  path: Pt[];
  worldH: number;
  /** Night or a resting park: the cat curls up asleep. */
  asleep: boolean;
}

/**
 * A tabby that strolls down the footpath toward you and back up again, small in the distance
 * and larger up close. It sleeps at night and sits still when the phone asks for less motion.
 */
export function Cat({ path, worldH, asleep }: CatProps) {
  const reduce = useReduceMotion();
  const walking = !asleep && !reduce;
  const frame = useFrame(CAT_WALK.length, 85, walking);
  const t = useRef(new Animated.Value(0)).current;

  // The visible stretch of the path, sampled; the walk goes down it (0..1) then back up (1..2).
  const pts = useMemo(() => sampleSpline(path, 6).filter(([, y]) => y > worldH * 0.42 && y < worldH * 0.93), [path, worldH]);
  const near = (y: number) => 0.45 + 0.75 * Math.min(1, Math.max(0, (y - worldH * 0.42) / (worldH * 0.5)));
  const baseW = 84;

  useEffect(() => {
    if (!walking) return;
    const loop = Animated.loop(Animated.timing(t, { toValue: 2, duration: 70000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => {
      loop.stop();
      t.setValue(0);
    };
  }, [t, walking]);

  const rest = pts[Math.floor(pts.length * 0.35)] ?? path[0]!;
  if (!walking) {
    const art = asleep ? CAT_SLEEP : CAT_SIT;
    const w = baseW * near(rest[1]) * (asleep ? 0.75 : 0.5);
    const h = (w * art.h) / art.w;
    return (
      <Image
        testID={asleep ? 'cat-sleeping' : 'cat-sitting'}
        source={art.src}
        style={[styles.abs, { left: rest[0] - w / 2 + 30, top: rest[1] - h * 0.92, width: w, height: h }]}
      />
    );
  }

  const route = [...pts, ...pts.slice(0, -1).reverse()]; // down, then back up
  const input = route.map((_, i) => (i / (route.length - 1)) * 2);
  const x = t.interpolate({ inputRange: input, outputRange: route.map(([px]) => px) });
  const y = t.interpolate({ inputRange: input, outputRange: route.map(([, py]) => py) });
  const scale = t.interpolate({ inputRange: input, outputRange: route.map(([, py]) => near(py)) });
  // Face the way it is walking: compare each point with the next one along the route.
  const faceIn: number[] = [];
  const faceOut: number[] = [];
  route.forEach((p, i) => {
    const next = route[Math.min(i + 1, route.length - 1)]!;
    const prev = route[Math.max(i - 1, 0)]!;
    const dx = i < route.length - 1 ? next[0] - p[0] : p[0] - prev[0];
    faceIn.push(input[i]!);
    faceOut.push(dx >= 0 ? 1 : -1);
  });
  const face = t.interpolate({ inputRange: faceIn, outputRange: faceOut, extrapolate: 'clamp' });
  const h = baseW * WALK_ASPECT;

  return (
    <Animated.View
      testID="cat-walking"
      pointerEvents="none"
      style={[
        styles.abs,
        { left: -baseW / 2, top: -h * 0.92, width: baseW, height: h, transformOrigin: 'bottom' },
        { transform: [{ translateX: x }, { translateY: y }, { scale }, { scaleX: face }] },
      ]}
    >
      <Image source={CAT_WALK[frame]} style={{ width: baseW, height: h }} />
    </Animated.View>
  );
}

/** Figure-of-eight points around a centre, for a lazy flight. */
function eight(cx: number, cy: number, rx: number, ry: number, phase: number): Pt[] {
  return Array.from({ length: 13 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + phase;
    return [cx + Math.sin(a) * rx, cy + Math.sin(a * 2) * ry - ry * 0.6] as Pt;
  });
}

function Butterfly({ path, size, period }: { path: Pt[]; size: number; period: number }) {
  const reduce = useReduceMotion();
  const frame = useFrame(BUTTERFLY.length, 110, !reduce);
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: period, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t, reduce, period]);
  const input = path.map((_, i) => i / (path.length - 1));
  const x = reduce ? path[0]![0] : t.interpolate({ inputRange: input, outputRange: path.map(([px]) => px) });
  const y = reduce ? path[0]![1] : t.interpolate({ inputRange: input, outputRange: path.map(([, py]) => py) });
  return (
    <Animated.Image
      testID="butterfly"
      source={BUTTERFLY[frame]}
      style={[styles.abs, { left: -size / 2, top: -size / 2, width: size, height: size, transform: [{ translateX: x }, { translateY: y }] }]}
    />
  );
}

/** Two butterflies drifting over the flowerbed: "check in here". */
export function Butterflies({ cx, cy, spread }: { cx: number; cy: number; spread: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Butterfly path={eight(cx, cy, spread * 0.5, spread * 0.22, 0)} size={26} period={9000} />
      <Butterfly path={eight(cx + 8, cy - 6, spread * 0.38, spread * 0.18, Math.PI)} size={20} period={7000} />
    </View>
  );
}

/** Something floating that bobs very gently, like a duck on the water. */
export function Bob({ children, x, y }: { children: React.ReactNode; x: number; y: number }) {
  const t = useLoop(2600);
  const dy = t.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });
  return <Animated.View style={[styles.abs, { left: x, top: y, transform: [{ translateY: dy }] }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
