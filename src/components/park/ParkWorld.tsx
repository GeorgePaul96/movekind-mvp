import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image as Picture } from 'react-native';
import Svg, { Circle, G, Image, Line, Path } from 'react-native-svg';
import { parkColors as p } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import type { UserState } from '@/types';
import type { ParkLayout } from '@/domain/park/layout';
import { parkCourses, smoothPath } from '@/domain/park/shapes';
import type { ParkLight } from './ParkLayers';
import { ParkTree } from './ParkTree';
import { Ripple, Sway, useLoop } from './Motion';
import { Bob, Butterflies, Cat } from './Creatures';

/** Paintings from design/park/layers (checkerboard cut out, resized). */
const GROUND = require('../../../assets/park/ground.png');
const BED = { src: require('../../../assets/park/bed.png'), w: 768, h: 399 };
const HAMMOCK = require('../../../assets/park/hammock.png');
const DUCK = { src: require('../../../assets/park/duck.png'), w: 256, h: 120 };
/** One painted flower per mood, matched to the mood's colour. */
const FLOWER: Record<UserState, { src: number; w: number; h: number }> = {
  overloaded: { src: require('../../../assets/park/flower-0.png'), w: 49, h: 96 }, // lilac
  regulated: { src: require('../../../assets/park/flower-1.png'), w: 75, h: 96 }, // gold
  activated: { src: require('../../../assets/park/flower-2.png'), w: 75, h: 96 }, // coral
  recovering: { src: require('../../../assets/park/flower-3.png'), w: 49, h: 96 }, // teal
};

const PER_ROW = 7;
/** The middle row fills first, then the back, then the front (fractions of the soil's depth). */
const ROW_Y = [0, -0.5, 0.5];

interface Props {
  layout: ParkLayout;
  state: GardenState;
  light: ParkLight;
  /** Objects not yet tended today: each one moves a little to invite a tap. */
  untended?: Set<string>;
}

/** Two dashed glints on the river that cross-fade, so the water seems to flow. */
function RiverGlint({ d, W, H, color, strength, fast }: { d: string; W: number; H: number; color: string; strength: number; fast: boolean }) {
  const t = useLoop(fast ? 1600 : 2800);
  const layer = (offset: number, opacity: Animated.AnimatedInterpolation<number>) => (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width={W} height={H}>
        <Path d={d} stroke={color} strokeWidth={2.5} strokeDasharray="6 26" strokeDashoffset={offset} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
  return (
    <View testID="river-glint" pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: strength }]}>
      {layer(0, t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] }))}
      {layer(16, t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }))}
    </View>
  );
}

/**
 * The foreground: the painted ground with its river and footpath, the tree, the flowerbed and the
 * hammock pines, placed from the shared layout. Everything breathes a little (trees sway, water
 * glints); untended things move more. Daylight paintings, washed toward dawn, dusk, night or rain
 * by one tint. All motion runs on the native driver, so panning stays smooth.
 */
export function ParkWorld({ layout, state, light, untended = new Set() }: Props) {
  const { worldW: W, worldH: H, objects } = layout;
  const courses = useMemo(() => parkCourses(layout), [layout]);
  const night = light === 'night';
  const duck = courses.river[6]!;

  const tree = objects.tree;
  const hm = objects.hammock;
  const hmW = hm.w * 2.6;

  const fb = objects.flowerbed;
  const bedW = fb.w * 1.2;
  const bedH = (bedW * BED.h) / BED.w;
  const bed = { x: fb.x + fb.w / 2 - bedW / 2, y: fb.y + fb.h / 2 - bedH / 2, width: bedW, height: bedH };
  // The soil inside the stones, as found in the painting (bed-local coordinates).
  const soil = { cx: bedW * 0.5, cy: bedH * 0.46, rx: bedW * 0.34, ry: bedH * 0.24 };
  const flowers = state.flowers.slice(-(ROW_Y.length * PER_ROW));
  const tuftH = 5 + state.grass * 3;
  const tint = light === 'day' ? null : p.tint[light];
  const riverCue = untended.has('river');

  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Image testID="ground-art" href={GROUND} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />
        {/* A fringe of grass along the near edge, taller with more steps. */}
        {Array.from({ length: Math.round(W / 22) }, (_, i) => {
          const x = 8 + i * 22;
          const base = H * 0.985 - (i % 3) * 6;
          return (
            <G key={i} opacity={0.7}>
              <Line x1={x} y1={base} x2={x - 3} y2={base - tuftH} stroke={p.foliage[light].shade} strokeWidth={1.6} strokeLinecap="round" />
              <Line x1={x} y1={base} x2={x + 3} y2={base - tuftH * 0.85} stroke={p.foliage[light].shade} strokeWidth={1.6} strokeLinecap="round" />
            </G>
          );
        })}
      </Svg>

      {/* More water, more light dancing on the river. */}
      <RiverGlint d={smoothPath(courses.river.slice(3))} W={W} H={H} color={p.river[light].flow} strength={Math.min(0.15 + state.stream * 0.15, 0.8)} fast={riverCue} />
      {riverCue && <Ripple testID="cue-river" x={duck[0]} y={duck[1] + 6} size={70} />}
      {state.ducks && (
        <Bob x={duck[0] - 30} y={duck[1] - 22}>
          <Picture testID="duck" source={DUCK.src} style={{ width: 60, height: (60 * DUCK.h) / DUCK.w }} />
        </Bob>
      )}

      <ParkTree stage={state.tree} birds={state.birds} asleep={night || state.resting} cue={untended.has('tree')} x={tree.x + tree.w / 2} y={tree.y + tree.h} width={tree.h * 1.4} />

      {/* The hammock pines: tall, a little further up the hill, swaying slowly. */}
      <View testID={untended.has('hammock') ? 'cue-hammock' : undefined} pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Sway
          testID="hammock"
          source={HAMMOCK}
          box={{ x: Math.min(hm.x + hm.w / 2 - hmW * 0.48, W - hmW), y: hm.y + hm.h - hmW * 0.92, width: hmW, height: hmW }}
          degrees={untended.has('hammock') ? 1.6 : 0.5}
          period={untended.has('hammock') ? 3600 : 6400}
        />
      </View>

      <View testID={untended.has('flowerbed') ? 'cue-flowerbed' : undefined} pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Picture testID="flowerbed-art" source={BED.src} style={{ position: 'absolute', left: bed.x, top: bed.y, width: bed.width, height: bed.height }} />
        {flowers.map((f, i) => {
          const row = Math.floor(i / PER_ROW);
          const col = i % PER_ROW;
          const x = soil.cx + (col / (PER_ROW - 1) - 0.5) * soil.rx * (row ? 1.4 : 1.7) + (row % 2 ? soil.rx * 0.08 : 0);
          const y = soil.cy + ROW_Y[row]! * soil.ry;
          const art = FLOWER[f.mood];
          const fh = 22;
          const fw = (fh * art.w) / art.h;
          return <Picture key={f.day} testID="flower" source={art.src} style={{ position: 'absolute', left: bed.x + x - fw / 2, top: bed.y + y - fh * 0.85, width: fw, height: fh }} />;
        })}
        {untended.has('flowerbed') && <Butterflies cx={bed.x + soil.cx} cy={bed.y + soil.cy - 14} spread={bed.width} />}
      </View>

      <Cat path={courses.walkway} worldH={H} asleep={night || state.resting} />

      {tint && <View testID="light-tint" pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint.color, opacity: tint.opacity }]} />}

      {/* Fireflies glow above the night wash. */}
      {night && (
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          {Array.from({ length: 14 }, (_, i) => (
            <Circle key={i} cx={((i * 83) % 100) / 100 * W} cy={H * (0.45 + ((i * 29) % 45) / 100)} r={1.8} fill={p.firefly} opacity={0.85} />
          ))}
        </Svg>
      )}
    </View>
  );
}
