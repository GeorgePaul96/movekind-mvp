import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';
import { parkColors as p } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import type { ParkLayout } from '@/domain/park/layout';
import {
  fawnSpot,
  grassTufts,
  parkCourses,
  pathWidthAt,
  type Pt,
  ribbonPath,
  rabbitSpot,
  riverWidthAt,
  smoothPath,
} from '@/domain/park/shapes';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { ParkLight } from './ParkLayers';
import { ParkTree } from './ParkTree';
import { SwayWrap, usePopOnChange } from './Motion';
import { Bob, Butterflies, Fawn, Rabbit } from './Creatures';
import { BedBaseArt, TulipArt } from './art/FlowerbedArt';
import { HammockArt } from './art/HammockArt';
import { DuckArt } from './art/CrittersArt';

const PER_ROW = 7;
const ROW_Y = [0, -0.45, 0.45];

interface Props {
  clock: SharedValue<number>;
  layout: ParkLayout;
  state: GardenState;
  light: ParkLight;
  untended?: Set<string>;
  /** Workouts logged so far: each new one makes the tree pop. */
  logged?: number;
  /** Glasses of water logged so far: each new one makes the fawn drink and stretch. */
  watered?: number;
}

const StaticGroundSvg = React.memo(function StaticGroundSvg({
  W,
  H,
  light,
  grass,
  sourcePt,
  riverBankD,
  riverRibbonD,
  walkBankD,
  walkRibbonD,
  tufts,
}: {
  W: number;
  H: number;
  light: ParkLight;
  grass: number;
  sourcePt: Pt;
  riverBankD: string;
  riverRibbonD: string;
  walkBankD: string;
  walkRibbonD: string;
  tufts: Pt[];
}) {
  const g = p.ground[light];
  const f = p.foliage[light];
  const rock = p.rock[light];
  const tuftH = 6 + grass * 3.5;
  const hillY = H * 0.43;
  const [sx, sy] = sourcePt;

  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
      <G testID="ground-art">
        {/* Rolling hillside contour */}
        <Path
          d={`M-60 ${hillY} Q${W * 0.36} ${hillY - 44} ${W + 60} ${hillY + 10} L${W + 60} ${H + 80} L-60 ${H + 80} Z`}
          fill={g.back}
        />
        {/* Rolling mid-ground S-swell instead of a flat horizontal band */}
        <Path
          d={`M-60 ${H * 0.65} C${W * 0.28} ${H * 0.54} ${W * 0.68} ${H * 0.69} ${W + 60} ${H * 0.59} L${W + 60} ${H + 80} L-60 ${H + 80} Z`}
          fill={g.front}
        />
        {/* The near grass, dark enough for the drawer's light arrow to read on it. */}
        <Path
          d={`M-60 ${H * 0.88} C${W * 0.35} ${H * 0.82} ${W * 0.72} ${H * 0.9} ${W + 60} ${H * 0.85} L${W + 60} ${H + 80} L-60 ${H + 80} Z`}
          fill={g.fore}
        />

        {/* Intentional rounded bush cluster tucked on the left ridge clear of the tree trunk */}
        <Circle cx={W * 0.04} cy={hillY + 12} r={18} fill={f.shade} />
        <Circle cx={W * 0.1} cy={hillY + 8} r={22} fill={f.leaf} />
        <Circle cx={W * 0.08} cy={hillY + 2} r={12} fill={f.light} />

        {/* Footpath bank and perspective ribbon starting naturally at the foot of the tree */}
        <Path d={walkBankD} fill={p.pathBank[light]} />
        <Path d={walkRibbonD} fill={p.path[light]} />

        {/* River bank and perspective water ribbon widening from the hillside spring */}
        <Path d={riverBankD} fill={p.river[light].bank} />
        <Path d={riverRibbonD} fill={p.river[light].water} />

        {/* Hillside spring rocks nestled around the river source */}
        <Ellipse cx={sx} cy={sy - 7} rx={12} ry={8} fill={rock.base} />
        <Ellipse cx={sx - 2} cy={sy - 10} rx={7} ry={4} fill={rock.light} />
        <Ellipse cx={sx - 13} cy={sy - 1} rx={8} ry={6} fill={rock.base} />
        <Ellipse cx={sx - 14} cy={sy - 3} rx={4.5} ry={2.8} fill={rock.light} />
        <Ellipse cx={sx + 13} cy={sy} rx={8} ry={5.5} fill={rock.base} />
        <Ellipse cx={sx + 12} cy={sy - 2} rx={4.5} ry={2.6} fill={rock.light} />
        {/* The spring itself, where the water comes out of the ground */}
        <Ellipse cx={sx} cy={sy} rx={7.5} ry={3.6} fill={p.river[light].water} />

        {/* Grass tufts on the meadow and river banks, never touching water or footpath */}
        {tufts.map(([x, base], i) => (
          <G key={i}>
            <Line x1={x} y1={base} x2={x - 4} y2={base - tuftH} stroke={f.shade} strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={x} y1={base} x2={x + 4} y2={base - tuftH * 0.85} stroke={f.shade} strokeWidth={2.5} strokeLinecap="round" />
          </G>
        ))}
      </G>
    </Svg>
  );
});

function RiverGlint({
  clock,
  d,
  W,
  H,
  color,
  strength,
}: {
  clock: SharedValue<number>;
  d: string;
  W: number;
  H: number;
  color: string;
  strength: number;
}) {
  const reduce = useReduceMotion();
  const glintA = useAnimatedStyle(() => ({
    opacity: reduce ? 0.6 : 0.3 + 0.65 * Math.abs(Math.sin(clock.value * 1.8)),
  }));
  const glintB = useAnimatedStyle(() => ({
    opacity: reduce ? 0.3 : 0.3 + 0.65 * Math.abs(Math.cos(clock.value * 1.8)),
  }));

  return (
    <View testID="river-glint" pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: strength }]}>
      <Animated.View style={[StyleSheet.absoluteFill, glintA]}>
        <Svg width={W} height={H}>
          <Path d={d} stroke={color} strokeWidth={2.6} strokeDasharray="8 30" strokeDashoffset={0} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, glintB]}>
        <Svg width={W} height={H}>
          <Path d={d} stroke={color} strokeWidth={2.6} strokeDasharray="8 30" strokeDashoffset={19} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function ParkWorld({ clock, layout, state, light, untended = new Set(), logged = 0, watered = 0 }: Props) {
  const { worldW: W, worldH: H, objects } = layout;
  const courses = useMemo(() => parkCourses(layout), [layout]);
  const riverBankD = useMemo(() => ribbonPath(courses.river, (t) => riverWidthAt(t) + 6), [courses]);
  const riverRibbonD = useMemo(() => ribbonPath(courses.river, riverWidthAt), [courses]);
  const walkBankD = useMemo(() => ribbonPath(courses.walkway, (t) => pathWidthAt(t) + 4), [courses]);
  const walkRibbonD = useMemo(() => ribbonPath(courses.walkway, pathWidthAt), [courses]);
  // Glints start slightly downstream of the spring rocks so they stay well inside the narrow channel
  const glintD = useMemo(() => smoothPath(courses.river.slice(1)), [courses]);
  const tufts = useMemo(() => grassTufts(layout, courses), [layout, courses]);
  const spots = useMemo(() => fawnSpot(layout, courses), [layout, courses]);
  const night = light === 'night';

  const tree = objects.tree;
  const hm = objects.hammock;
  const fb = objects.flowerbed;
  const rv = objects.river;

  const bedW = fb.w * 1.15;
  const bedH = bedW * 0.5;
  const bedX = fb.x + fb.w / 2 - bedW / 2;
  const bedY = fb.y + fb.h / 2 - bedH / 2;

  const flowers = state.flowers.slice(-(ROW_Y.length * PER_ROW));
  const flowerPop = usePopOnChange(state.flowers.length);
  const riverPop = usePopOnChange(state.stream);
  const tint = light === 'day' ? null : p.tint[light];
  const riverCue = untended.has('river');

  return (
    <View style={{ width: W, height: H }} pointerEvents="none">
      <StaticGroundSvg
        W={W}
        H={H}
        light={light}
        grass={state.grass}
        sourcePt={courses.river[0]!}
        riverBankD={riverBankD}
        riverRibbonD={riverRibbonD}
        walkBankD={walkBankD}
        walkRibbonD={walkRibbonD}
        tufts={tufts}
      />

      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [rv.x + rv.w / 2, rv.y + rv.h / 2, 0] }, riverPop]}>
        <RiverGlint clock={clock} d={glintD} W={W} H={H} color={p.river[light].flow} strength={Math.min(0.25 + state.stream * 0.16, 0.9)} />
      </Animated.View>

      {state.ducks && (
        <Bob clock={clock} x={spots.duck[0] - 23} y={spots.duck[1] - 26}>
          <View testID="duck">
            <DuckArt size={46} />
          </View>
        </Bob>
      )}

      <Fawn
        clock={clock}
        feet={spots.feet}
        cue={riverCue}
        asleep={night || state.resting}
        watered={watered}
        size={spots.size}
      />

      <View testID={untended.has('hammock') ? 'cue-hammock' : undefined} style={StyleSheet.absoluteFill}>
        <SwayWrap
          testID="hammock"
          clock={clock}
          degrees={untended.has('hammock') ? 1.5 : 0.4}
          periodSec={untended.has('hammock') ? 3.6 : 6.2}
          style={{ left: hm.x - 10, top: hm.y - 18, width: hm.w + 20, height: hm.h + 24 }}
        >
          <HammockArt width={hm.w + 20} height={hm.h + 24} light={light} />
        </SwayWrap>
      </View>

      <ParkTree
        clock={clock}
        stage={state.tree}
        logged={logged}
        birds={state.birds}
        asleep={night || state.resting}
        cue={untended.has('tree')}
        light={light}
        x={tree.x + tree.w / 2}
        y={tree.y + tree.h}
        width={Math.min(W * 0.72, tree.h * 1.3)}
      />

      <Animated.View
        testID={untended.has('flowerbed') ? 'cue-flowerbed' : undefined}
        style={[StyleSheet.absoluteFill, { transformOrigin: [fb.x + fb.w / 2, fb.y + fb.h / 2, 0] }, flowerPop]}
      >
        <View testID="flowerbed-art" style={{ position: 'absolute', left: bedX, top: bedY, width: bedW, height: bedH }}>
          <BedBaseArt width={bedW} height={bedH} light={light} />
        </View>
        {flowers.map((f, i) => {
          const row = Math.floor(i / PER_ROW);
          const col = i % PER_ROW;
          const fx = bedX + bedW * 0.5 + (col / (PER_ROW - 1) - 0.5) * bedW * 0.56;
          const fy = bedY + bedH * 0.46 + ROW_Y[row]! * bedH * 0.22;
          return (
            <View key={f.day} testID="flower" style={{ position: 'absolute', left: fx - 12, top: fy - 26 }}>
              <TulipArt mood={f.mood} light={light} size={24} />
            </View>
          );
        })}
        {untended.has('flowerbed') && <Butterflies clock={clock} cx={bedX + bedW / 2} cy={bedY + bedH * 0.35} spread={bedW} />}
      </Animated.View>

      <Rabbit clock={clock} {...rabbitSpot(layout)} asleep={night || state.resting} />

      {tint && (
        <View
          testID="light-tint"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: tint.color, opacity: tint.opacity }]}
        />
      )}

      {night && (
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          {Array.from({ length: 12 }, (_, i) => (
            <Circle
              key={i}
              cx={(((i * 83) % 90) / 100 + 0.05) * W}
              cy={H * (0.46 + ((i * 29) % 38) / 100)}
              r={2.2}
              fill={p.firefly}
              opacity={0.88}
            />
          ))}
        </Svg>
      )}
    </View>
  );
}
