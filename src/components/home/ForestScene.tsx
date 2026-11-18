import React, { useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { gardenColors } from '@/constants/colors';
import { FOREST_SKIES, FOREST_SPRITES } from '@/constants/forestArt';
import { HOME_COPY } from '@/constants/copy';
import { skyPhase } from '@/domain/garden/sky';
import { forestScene, forestSky } from '@/domain/home/forest';
import type { CareKind } from '@/domain/home/care';

const HEIGHT = 190;
const GROUND = 0.62; // where the grass starts, as a share of the height

/**
 * Today's forest clearing, drawn from Kenney's low-poly models (CC0). Purely decorative for
 * sight; one accessibility label says what is in it. It only ever gains things during a day.
 */
export function ForestScene({
  done,
  goodThing,
  closed,
  dayKey,
  now,
}: {
  done: Record<CareKind, boolean>;
  goodThing: boolean;
  closed: boolean;
  dayKey: string;
  now: Date;
}) {
  const [width, setWidth] = useState(0);
  const placed = forestScene({ done, goodThing, closed, dayKey });
  const sky = forestSky(skyPhase(now), closed);
  const groundTop = HEIGHT * GROUND;
  const groundDepth = HEIGHT - groundTop - 10;
  const night = sky === 'night';
  const label = HOME_COPY.forestA11y(placed.filter((p) => p.reason !== 'always').map((p) => HOME_COPY.forestThings[p.id] ?? ''));

  return (
    <View
      style={styles.scene}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Image source={FOREST_SKIES[sky]} style={styles.sky} resizeMode="cover" />
      <View style={[styles.hillBack, { top: groundTop - 22, backgroundColor: night ? gardenColors.hillBackRest : gardenColors.hillBack }]} />
      <View style={[styles.ground, { top: groundTop, backgroundColor: night ? gardenColors.hillFrontRest : gardenColors.hillFront }]} />
      {width > 0
        ? placed.map((p, k) => {
            const art = FOREST_SPRITES[p.id];
            const h = p.size * HEIGHT * (0.78 + 0.22 * p.depth);
            const w = (h * art.w) / art.h;
            const bottom = groundTop + p.depth * groundDepth;
            return (
              <Image
                key={`${p.id}-${k}`}
                source={art.src}
                style={{
                  position: 'absolute',
                  width: w,
                  height: h,
                  left: p.x * width - w / 2,
                  top: bottom - h,
                  opacity: night && p.reason === 'always' ? 0.82 : 1,
                }}
                resizeMode="contain"
              />
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { height: HEIGHT, borderRadius: 24, overflow: 'hidden', marginBottom: 14 },
  sky: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  hillBack: { position: 'absolute', left: -40, right: -40, height: 80, borderTopLeftRadius: 200, borderTopRightRadius: 200 },
  ground: { position: 'absolute', left: -20, right: -20, bottom: 0, borderTopLeftRadius: 60, borderTopRightRadius: 60 },
});
