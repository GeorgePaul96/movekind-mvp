import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { parkColors as p } from '@/constants/colors';
import type { GardenState } from '@/domain/garden/garden';
import type { ParkLayout } from '@/domain/park/layout';
import { parkCourses, smoothPath } from '@/domain/park/shapes';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { ParkLight } from './ParkLayers';
import { ParkTree } from './ParkTree';
import { Ripple, SwayWrap, usePopOnChange } from './Motion';
import { Bob, Butterflies, Cat } from './Creatures';
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
}

const StaticGroundSvg = React.memo(function StaticGroundSvg({
  W,
  H,
  light,
  grass,
  riverPath,
  walkPath,
}: {
  W: number;
  H: number;
  light: ParkLight;
  grass: number;
  riverPath: string;
  walkPath: string;
}) {
  const g = p.ground[light];
  const f = p.foliage[light];
  const tuftH = 6 + grass * 3.5;
  const hillY = H * 0.43;

  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
      <G testID="ground-art">
        <Path
          d={`M-60 ${hillY} Q${W * 0.48} ${hillY - 46} ${W + 60} ${hillY + 8} L${W + 60} ${H + 80} L-60 ${H + 80} Z`}
          fill={g.back}
        />
        <Path
          d={`M-60 ${H * 0.62} Q${W * 0.55} ${H * 0.56} ${W + 60} ${H * 0.66} L${W + 60} ${H + 80} L-60 ${H + 80} Z`}
          fill={g.front}
        />
        {/* The near grass, dark enough for the drawer's light arrow to read on it. */}
        <Path
          d={`M-60 ${H * 0.87} Q${W * 0.45} ${H * 0.84} ${W + 60} ${H * 0.88} L${W + 60} ${H + 80} L-60 ${H + 80} Z`}
          fill={g.fore}
        />
        <Circle cx={W * 0.05} cy={hillY + 26} r={20} fill={f.leaf} />
        <Circle cx={W * 0.13} cy={hillY + 18} r={26} fill={f.leaf} />
        <Circle cx={W * 0.21} cy={hillY + 28} r={17} fill={f.leaf} />
        <Circle cx={W * 0.11} cy={hillY + 12} r={10} fill={f.light} />

        <Path d={walkPath} stroke={p.path[light]} strokeWidth={28} strokeLinecap="round" fill="none" />
        <Path d={riverPath} stroke={p.river[light].water} strokeWidth={34} strokeLinecap="round" fill="none" />

        {Array.from({ length: Math.round(W / 28) }, (_, i) => {
          const x = 14 + i * 28;
          const base = H * 0.89 - (i % 3) * 8;
          return (
            <G key={i}>
              <Line x1={x} y1={base} x2={x - 4} y2={base - tuftH} stroke={f.shade} strokeWidth={2.5} strokeLinecap="round" />
              <Line x1={x} y1={base} x2={x + 4} y2={base - tuftH * 0.85} stroke={f.shade} strokeWidth={2.5} strokeLinecap="round" />
            </G>
          );
        })}
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
          <Path d={d} stroke={color} strokeWidth={3.5} strokeDasharray="10 32" strokeDashoffset={0} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, glintB]}>
        <Svg width={W} height={H}>
          <Path d={d} stroke={color} strokeWidth={3.5} strokeDasharray="10 32" strokeDashoffset={21} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function ParkWorld({ clock, layout, state, light, untended = new Set(), logged = 0 }: Props) {
  const { worldW: W, worldH: H, objects } = layout;
  const courses = useMemo(() => parkCourses(layout), [layout]);
  const riverD = useMemo(() => smoothPath(courses.river), [courses]);
  const walkD = useMemo(() => smoothPath(courses.walkway), [courses]);
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
      <StaticGroundSvg W={W} H={H} light={light} grass={state.grass} riverPath={riverD} walkPath={walkD} />

      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [rv.x + rv.w / 2, rv.y + rv.h / 2, 0] }, riverPop]}>
        <RiverGlint clock={clock} d={riverD} W={W} H={H} color={p.river[light].flow} strength={Math.min(0.25 + state.stream * 0.16, 0.9)} />
      </Animated.View>

      {riverCue && <Ripple testID="cue-river" clock={clock} x={rv.x + rv.w / 2} y={rv.y + rv.h / 2} size={68} />}
      {state.ducks && (
        <Bob clock={clock} x={rv.x + rv.w / 2 - 23} y={rv.y + rv.h / 2 - 30}>
          <View testID="duck">
            <DuckArt size={46} />
          </View>
        </Bob>
      )}

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

      <Cat clock={clock} path={courses.walkway} worldH={H} asleep={night || state.resting} />

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
