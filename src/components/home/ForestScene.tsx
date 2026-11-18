import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { colors, gardenColors } from '@/constants/colors';
import { FOREST_SKIES, FOREST_SPRITES } from '@/constants/forestArt';
import { Icon } from '@/components/Icon';
import { HOME_COPY } from '@/constants/copy';
import { font } from '@/constants/typography';
import { skyPhase } from '@/domain/garden/sky';
import { GROUND_LINE, forestHeight, forestScene, forestSky, type Placed } from '@/domain/home/forest';
import type { CareKind } from '@/domain/home/care';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { playSound } from '@/services/sound';

interface Props {
  done: Record<CareKind, boolean>;
  goodThing: boolean;
  closed: boolean;
  dayKey: string;
  now: Date;
  /** Extra height added on top, for the space under the status bar. */
  topInset?: number;
  /** Tapping a care spot opens that check-in page. */
  onOpen?: (kind: CareKind) => void;
  /** A fixed height (below the top inset), for the full-screen home. Otherwise sized from the width. */
  height?: number;
  /** Space kept clear at the bottom for the panel laid over the forest. */
  bottomReserve?: number;
  /** Drawn over the forest (the greeting and the panel). */
  children?: React.ReactNode;
}

const ease = Easing.inOut(Easing.sin);

/** A tree or a tuft of grass moving in a light breeze, rooted at its base. */
function Sway({ seed, reduce, children, rustle }: { seed: number; reduce: boolean; children: React.ReactNode; rustle: number }) {
  const angle = useSharedValue(0);
  const amplitude = 1.2 + (seed % 5) * 0.35; // degrees
  const duration = 2600 + (seed % 7) * 380;
  useEffect(() => {
    if (reduce) {
      angle.value = 0;
      return;
    }
    angle.value = withRepeat(
      withSequence(withTiming(amplitude, { duration, easing: ease }), withTiming(-amplitude, { duration, easing: ease })),
      -1,
      true,
    );
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  // A tap gives the leaves a brief, bigger shake, then the breeze carries on.
  useEffect(() => {
    if (!rustle || reduce) return;
    angle.value = withSequence(
      withTiming(6, { duration: 120 }),
      withTiming(-5, { duration: 160 }),
      withTiming(3, { duration: 180 }),
      withRepeat(withSequence(withTiming(amplitude, { duration, easing: ease }), withTiming(-amplitude, { duration, easing: ease })), -1, true),
    );
  }, [rustle]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  return <Animated.View style={[styles.fill, styles.rooted, style]}>{children}</Animated.View>;
}

/** An animal that gives a small hop now and then, and a bigger one when tapped. */
function Hop({ reduce, children, bump }: { reduce: boolean; children: React.ReactNode; bump: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    y.value = withRepeat(withSequence(withTiming(0, { duration: 3400 }), withTiming(-7, { duration: 170 }), withTiming(0, { duration: 230 })), -1, false);
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!bump || reduce) return;
    y.value = withSequence(
      withTiming(-16, { duration: 180 }),
      withTiming(0, { duration: 260 }),
      withRepeat(withSequence(withTiming(0, { duration: 3400 }), withTiming(-7, { duration: 170 }), withTiming(0, { duration: 230 })), -1, false),
    );
  }, [bump]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

/** Fireflies at night: a few soft lights drifting and glowing. */
function Firefly({ x, y, seed, reduce }: { x: number; y: number; seed: number; reduce: boolean }) {
  const glow = useSharedValue(0.6);
  const drift = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 900 + seed * 130 }), withTiming(0.25, { duration: 1100 + seed * 90 })), -1, true);
    drift.value = withRepeat(withTiming(8 + seed, { duration: 3000 + seed * 400, easing: ease }), -1, true);
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ translateX: drift.value }, { translateY: -drift.value / 2 }] }));
  return <Animated.View pointerEvents="none" style={[styles.firefly, { left: x, top: y }, style]} />;
}

/**
 * Today's forest clearing, edge to edge, sized to the screen. It breathes: trees and grass sway,
 * the visitor hops, fireflies come out at night (all still when the phone asks for reduced
 * motion). Tap a tree to rustle it, tap the visitor to say hello, and tap anything today's care
 * brought (the pond, the tent, the mushrooms, the flowers, the deer) to open that page.
 */
export function ForestScene({ done, goodThing, closed, dayKey, now, topInset = 0, onOpen, height: fixedHeight, bottomReserve = 6, children }: Props) {
  const reduce = useReduceMotion();
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width);
  const [rustled, setRustled] = useState<Record<string, number>>({});
  const [hello, setHello] = useState(0);
  const helloTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (helloTimer.current) clearTimeout(helloTimer.current);
  }, []);

  const height = fixedHeight ?? forestHeight(width);
  const total = height + topInset;
  // Tall screens put the horizon a little higher, leaving a deep clearing to tap in.
  const groundTop = topInset + height * (fixedHeight ? 0.4 : GROUND_LINE);
  const groundDepth = total - groundTop - bottomReserve;
  // Pictures are sized from this, so a tall screen gets a deeper clearing, not giant trees.
  const unit = Math.min(height, width * 0.9);
  const sky = forestSky(skyPhase(now), closed);
  const night = sky === 'night';
  const placed = forestScene({ done, goodThing, closed, dayKey, width });
  const visitor = placed.find((p) => p.role === 'visitor');

  const sayHello = () => {
    playSound('pluck');
    setHello((n) => n + 1);
    if (helloTimer.current) clearTimeout(helloTimer.current);
    helloTimer.current = setTimeout(() => setHello(0), 2600);
  };

  const box = (p: Placed) => {
    const art = FOREST_SPRITES[p.id];
    const h = p.size * unit * (0.8 + 0.35 * p.depth);
    const w = (h * art.w) / art.h;
    const bottom = groundTop + p.depth * groundDepth;
    return { w, h, left: p.x * width - w / 2, top: bottom - h };
  };

  const summary = HOME_COPY.forestA11y(
    placed
      .filter((p) => (p.role === 'care' && p.noted) || p.role === 'good' || p.role === 'visitor' || p.role === 'night')
      .map((p) => HOME_COPY.forestThings[p.id] ?? ''),
  );

  return (
    <View style={[styles.scene, { height: total }]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <Image source={FOREST_SKIES[sky]} style={styles.sky} resizeMode="cover" accessible accessibilityRole="image" accessibilityLabel={summary} />
      {/* Soft hills behind the clearing. */}
      <View style={[styles.hill, { top: groundTop - 30, left: -width * 0.2, width: width * 0.8, backgroundColor: night ? gardenColors.hillBackRest : gardenColors.hillBack }]} />
      <View style={[styles.hill, { top: groundTop - 22, left: width * 0.35, width: width * 0.9, backgroundColor: night ? gardenColors.hillBackRest : gardenColors.hillBack }]} />
      <View style={[styles.ground, { top: groundTop, backgroundColor: night ? gardenColors.hillFrontRest : gardenColors.hillFront }]} />

      {placed.map((p, k) => {
        const b = box(p);
        const image = (
          <Image
            source={FOREST_SPRITES[p.id].src}
            style={[
              styles.fill,
              p.flip && styles.flip,
              night && (p.role === 'backdrop' || p.role === 'frame') && styles.dim,
              p.role === 'care' && !p.noted && styles.waiting,
            ]}
            resizeMode="contain"
          />
        );
        const frame = { position: 'absolute' as const, left: b.left, top: b.top, width: b.w, height: b.h };

        if (p.role === 'care' && !onOpen) {
          // Without a way to open pages (a closed day), only what was noted is shown.
          if (!p.noted) return null;
          return (
            <View key={p.key} style={frame} pointerEvents="none">
              {image}
            </View>
          );
        }
        if (p.kind && onOpen) {
          const kind = p.kind;
          const label = p.noted
            ? HOME_COPY.forestOpen(HOME_COPY.forestThings[p.id] || HOME_COPY.care[kind], HOME_COPY.care[kind])
            : HOME_COPY.forestWaiting(HOME_COPY.forestSpot[kind], HOME_COPY.care[kind]);
          return (
            <Pressable
              key={p.key}
              style={frame}
              accessibilityRole="button"
              accessibilityLabel={label}
              hitSlop={10}
              onPress={() => {
                playSound('tap');
                onOpen(kind);
              }}
            >
              {image}
              {!p.noted ? (
                <View style={styles.plus}>
                  <Icon name="plus" size={16} color={colors.onPrimary} />
                </View>
              ) : null}
            </Pressable>
          );
        }
        if (p.role === 'visitor' || p.role === 'night') {
          return (
            <Pressable
              key={p.key}
              style={frame}
              accessibilityRole="button"
              accessibilityLabel={HOME_COPY.forestHelloA11y(HOME_COPY.forestThings[p.id] ?? '')}
              onPress={sayHello}
            >
              <Hop reduce={reduce} bump={hello}>
                {image}
              </Hop>
            </Pressable>
          );
        }
        if (p.role === 'frame') {
          return (
            <Pressable
              key={p.key}
              style={frame}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              onPress={() => {
                playSound('tap');
                setRustled((r) => ({ ...r, [p.key]: (r[p.key] ?? 0) + 1 }));
              }}
            >
              <Sway seed={k} reduce={reduce} rustle={rustled[p.key] ?? 0}>
                {image}
              </Sway>
            </Pressable>
          );
        }
        return (
          <View key={p.key} style={frame} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {p.sways ? (
              <Sway seed={k} reduce={reduce} rustle={0}>
                {image}
              </Sway>
            ) : (
              image
            )}
          </View>
        );
      })}

      {night
        ? [0, 1, 2, 3, 4, 5].map((n) => (
            <Firefly key={n} seed={n} reduce={reduce} x={width * (0.12 + n * 0.15)} y={groundTop - 20 + ((n * 37) % 60)} />
          ))
        : null}

      {children}

      {hello && visitor ? (
        <View pointerEvents="none" style={[styles.bubble, { left: Math.max(12, box(visitor).left - 30), top: box(visitor).top - 44 }]}>
          <Text style={styles.bubbleText} accessibilityLiveRegion="polite">
            {HOME_COPY.forestHello[(hello - 1) % HOME_COPY.forestHello.length]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { overflow: 'hidden' },
  sky: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  hill: { position: 'absolute', height: 120, borderTopLeftRadius: 400, borderTopRightRadius: 400 },
  ground: { position: 'absolute', left: -20, right: -20, bottom: 0 },
  fill: { width: '100%', height: '100%' },
  rooted: { transformOrigin: 'bottom' },
  flip: { transform: [{ scaleX: -1 }] },
  dim: { opacity: 0.8 },
  // A care spot not yet noted today: present and inviting, just quieter.
  waiting: { opacity: 0.45 },
  plus: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firefly: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: gardenColors.sunGlow },
  bubble: {
    position: 'absolute',
    maxWidth: 220,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleText: { ...font.semibold, fontSize: 14, color: colors.textPrimary },
});
