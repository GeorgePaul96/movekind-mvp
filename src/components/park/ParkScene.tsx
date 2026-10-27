import React, { useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { PARK_COPY } from '@/constants/copy';
import type { GardenState } from '@/domain/garden/garden';
import type { SkyPhase } from '@/domain/garden/sky';
import { PARALLAX, parkLayout, type ParkObject } from '@/domain/park/layout';
import { HillLayer, RainLayer, SkyLayer, type ParkLight } from './ParkLayers';
import { ParkWorld } from './ParkWorld';
import { Hotspot } from './Hotspot';
import { useLoop } from './Motion';

/** What the tour needs from the park's scroll view. */
export interface ParkScrollHandle {
  scrollTo(options: { x: number; y?: number; animated?: boolean }): void;
}

/** Painted clouds (design/park/layers 2/clouds.jpg) that drift across the sky by day. */
const CLOUDS = require('../../../assets/park/clouds.png');

const OBJECTS: ParkObject[] = ['flowerbed', 'tree', 'river', 'path', 'hammock'];

interface Props {
  state: GardenState;
  phase: SkyPhase;
  untended: Set<string>;
  onObject: (o: ParkObject) => void;
  width: number;
  height: number;
  scrollRef?: React.RefObject<ParkScrollHandle | null>;
}

/**
 * The full-screen park. The foreground world scrolls horizontally; sky and hill layers follow
 * the scroll at slower speeds (parallax, on the native thread), so panning feels deep and calm.
 */
export function ParkScene({ state, phase, untended, onObject, width, height, scrollRef }: Props) {
  const layout = useMemo(() => parkLayout(width, height), [width, height]);
  const scrollX = useRef(new Animated.Value(layout.startX)).current;
  const light: ParkLight = state.resting || phase === 'night' ? 'night' : state.weather === 'rain' ? 'rain' : phase;
  const range = Math.max(1, layout.worldW - width);
  const breeze = useLoop(40000); // the sky drifts a few points over forty seconds
  const clouds = useLoop(90000); // and the clouds a little further, more slowly

  /** A background layer `factor` as fast as the foreground: wide enough to cover its travel. */
  const layer = (factor: number) => ({
    width: width + range * factor,
    style: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      transform: [
        { translateX: scrollX.interpolate({ inputRange: [0, range], outputRange: [0, -range * factor], extrapolate: 'clamp' }) },
      ],
    },
  });
  const sky = layer(PARALLAX.sky);
  const far = layer(PARALLAX.far);
  const mid = layer(PARALLAX.mid);

  return (
    <View style={{ width, height }} accessibilityLabel={PARK_COPY.sceneLabel}>
      <Animated.View style={sky.style} pointerEvents="none">
        <Animated.View style={{ marginLeft: -20, transform: [{ translateX: breeze.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }) }] }}>
          <SkyLayer width={sky.width + 40} height={height} light={light} />
        </Animated.View>
        {light !== 'night' && (
          <Animated.Image
            testID="clouds"
            source={CLOUDS}
            style={{
              position: 'absolute',
              left: -40,
              top: -height * 0.06,
              width: sky.width + 80,
              height: sky.width + 80,
              opacity: light === 'rain' ? 0.55 : 0.9,
              transform: [{ translateX: clouds.interpolate({ inputRange: [0, 1], outputRange: [-36, 36] }) }],
            }}
          />
        )}
      </Animated.View>
      <Animated.View style={far.style} pointerEvents="none">
        <HillLayer width={far.width} height={height} light={light} depth="far" />
      </Animated.View>
      <Animated.View style={mid.style} pointerEvents="none">
        <HillLayer width={mid.width} height={height} light={light} depth="mid" />
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef as React.Ref<never>}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: layout.startX, y: 0 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        style={StyleSheet.absoluteFill}
      >
        <View testID="park-world" style={{ width: layout.worldW, height }}>
          <ParkWorld layout={layout} state={state} light={light} untended={untended} />
          {OBJECTS.map((o) => (
            <Hotspot
              key={o}
              object={o}
              rect={layout.objects[o]}
              label={PARK_COPY.objects[o].label}
              hint={PARK_COPY.objects[o].hint}
              onPress={onObject}
            />
          ))}
        </View>
      </Animated.ScrollView>

      {state.weather === 'rain' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <RainLayer width={width} height={height} />
        </View>
      )}
    </View>
  );
}
