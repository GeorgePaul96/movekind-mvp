import React, { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { parkColors } from '@/constants/colors';
import { PARK_COPY } from '@/constants/copy';
import type { GardenState } from '@/domain/garden/garden';
import type { SkyPhase } from '@/domain/garden/sky';
import { PARALLAX, parkLayout, type ParkObject } from '@/domain/park/layout';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { CloudsLayer, HillLayer, RainLayer, SkyLayer, type ParkLight } from './ParkLayers';
import { ParkWorld } from './ParkWorld';
import { Hotspot } from './Hotspot';
import { useParkClock } from './Motion';

export interface ParkScrollHandle {
  scrollTo(options: { x: number; y?: number; animated?: boolean }): void;
  focusObject?(o: ParkObject | null): void;
}

const OBJECTS: ParkObject[] = ['flowerbed', 'tree', 'river', 'path', 'hammock'];
const PAD = 32; // Oversize buffer (> 2x max 20pt parallax offset)

interface Props {
  state: GardenState;
  phase: SkyPhase;
  untended: Set<string>;
  /** Workouts logged so far: each new one makes the tree pop. */
  logged?: number;
  /** Glasses of water logged so far: each new one makes the fawn drink and stretch. */
  watered?: number;
  onObject: (o: ParkObject) => void;
  width: number;
  height: number;
  scrollRef?: React.RefObject<ParkScrollHandle | null>;
}

/**
 * The full-screen park, one screen wide. The ground and everything on it stay put; a horizontal
 * drag only nudges the sky and hills a few points for depth, then they spring back.
 */
export function ParkScene({ state, phase, untended, logged, watered, onObject, width, height, scrollRef }: Props) {
  const reduce = useReduceMotion();
  const clock = useParkClock();
  const layout = useMemo(() => parkLayout(width, height), [width, height]);
  const light: ParkLight =
    state.resting || phase === 'night' ? 'night' : state.weather === 'rain' ? 'rain' : phase;

  const dragX = useSharedValue(0);
  const fade = useSharedValue(reduce ? 1 : 0);
  const [focused, setFocused] = useState<ParkObject | null>(null);

  useEffect(() => {
    fade.value = reduce ? 1 : withTiming(1, { duration: 400 });
  }, [fade, reduce]);

  useImperativeHandle(scrollRef, () => ({
    scrollTo: () => {},
    focusObject: (o) => setFocused(o),
  }));

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          if (reduce) return;
          dragX.value = Math.max(-1, Math.min(1, e.translationX / (width * 0.45)));
        })
        .onEnd(() => {
          dragX.value = withSpring(0, { damping: 18, stiffness: 160 });
        })
        .onFinalize(() => {
          dragX.value = withSpring(0, { damping: 18, stiffness: 160 });
        }),
    [dragX, reduce, width],
  );

  const skyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -dragX.value * PARALLAX.sky }],
  }));
  const farStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -dragX.value * PARALLAX.far }],
  }));
  const midStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -dragX.value * PARALLAX.mid }],
  }));
  const rootFade = useAnimatedStyle(() => ({ opacity: fade.value }));

  const layerW = width + PAD * 2;
  const layerH = height + PAD;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.container,
          { width, height, backgroundColor: parkColors.ground[light].front },
          rootFade,
        ]}
        accessibilityLabel={PARK_COPY.sceneLabel}
      >
        <Animated.View style={[styles.oversized, skyStyle]} pointerEvents="none">
          <SkyLayer width={layerW} height={layerH} light={light} />
          <CloudsLayer clock={clock} width={layerW} height={layerH} light={light} />
        </Animated.View>

        <Animated.View style={[styles.oversized, farStyle]} pointerEvents="none">
          <HillLayer width={layerW} height={layerH} light={light} depth="far" />
        </Animated.View>

        <Animated.View style={[styles.oversized, midStyle]} pointerEvents="none">
          <HillLayer width={layerW} height={layerH} light={light} depth="mid" />
        </Animated.View>

        <View testID="park-world" style={{ width, height }}>
          <ParkWorld
            clock={clock}
            layout={layout}
            state={state}
            light={light}
            untended={untended}
            logged={logged}
            watered={watered}
          />
          {OBJECTS.map((o) => (
            <Hotspot
              key={o}
              object={o}
              rect={layout.objects[o]}
              label={PARK_COPY.objects[o].label}
              hint={PARK_COPY.objects[o].hint}
              focused={focused === o}
              onPress={onObject}
            />
          ))}
        </View>

        {state.weather === 'rain' && <RainLayer clock={clock} width={width} height={height} />}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  oversized: { position: 'absolute', left: -PAD, top: 0 },
});
