import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { gardenColors as c, stateColors } from '@/constants/colors';
import { GARDEN_COPY } from '@/constants/copy';
import type { GardenState } from '@/domain/garden/garden';
import { useReduceMotion } from '@/hooks/useReduceMotion';

const TICK_MS = 100; // gentle motion only: 10 updates a second is plenty
const TUFTS = 20;
const MAX_FLOWERS = 28;
const VIEW_W = 290;
const VIEW_H = 250;

/** The stream winds in from behind the far hill and out past the bottom-left corner. */
const STREAM_PATH = 'M298 150 C262 160 246 178 214 186 S150 190 128 204 S78 232 40 262';
const STARS = [
  [24, 22], [62, 48], [104, 18], [148, 40], [186, 16], [272, 30], [204, 62], [40, 78], [120, 70],
] as const;

interface Props {
  state: GardenState;
  /** No motion at all (small previews, e.g. the Changes then-and-now pair). */
  still?: boolean;
}

/**
 * The garden, drawn in code. Every part answers to one input: stream (water), grass
 * (steps), tree (workouts), flowers (moods). It only grows or rests; resting turns day into a
 * quiet starry night and changes nothing that has grown. Holds still when asked for less motion.
 */
export function Garden({ state, still = false }: Props) {
  const reduceMotion = useReduceMotion() || still;
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setPhase((p) => p + TICK_MS / 1000), TICK_MS);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const t = reduceMotion ? 0 : phase;
  const night = state.resting;
  const tuftHeight = 5 + state.grass * 4;
  const cloudDrift = Math.sin(t * 0.25) * 4;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={GARDEN_COPY.a11ySummary(state)}
      style={{ width: '100%', aspectRatio: VIEW_W / VIEW_H }}
    >
      {/* Keeps the scene's own proportions so nothing (sun, grass, flowers) is ever cropped. */}
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          {/* Named by day/night: several gardens on one screen then share identical gradients. */}
          <LinearGradient id={night ? "skyNight" : "skyDay"} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={night ? c.skyRest : c.sky} />
            <Stop offset="1" stopColor={night ? c.skyRestLow : c.skyLow} />
          </LinearGradient>
        </Defs>
        <Rect width={VIEW_W} height={VIEW_H} fill={night ? "url(#skyNight)" : "url(#skyDay)"} />

        {night ? (
          <>
            {STARS.map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1.1} fill={c.star} opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 0.6 + i))} />
            ))}
            <G testID="moon">
              <Circle cx="236" cy="58" r="17" fill={c.moon} />
              <Circle cx="244" cy="52" r="14" fill={c.skyRest} />
            </G>
          </>
        ) : (
          <>
            <Circle cx="232" cy="58" r="32" fill={c.sunGlow} opacity={0.7} />
            <Circle testID="sun" cx="232" cy="58" r="20" fill={c.sun} />
            <G transform={`translate(${cloudDrift} 0)`}>
              <Ellipse cx="62" cy="52" rx="22" ry="10" fill={c.cloud} />
              <Ellipse cx="78" cy="46" rx="14" ry="10" fill={c.cloud} />
            </G>
            <G transform={`translate(${-cloudDrift} 0)`}>
              <Ellipse cx="160" cy="34" rx="16" ry="7" fill={c.cloud} opacity={0.9} />
            </G>
          </>
        )}

        <Path d="M0 150 C60 128 120 136 170 150 S250 140 290 132 V250 H0Z" fill={night ? c.hillBackRest : c.hillBack} />
        <Path d="M0 186 C70 168 140 174 200 186 S262 180 290 172 V250 H0Z" fill={night ? c.hillFrontRest : c.hillFront} />

        {/* Stream: never dry. Level 0 is a thin trickle; each glass widens it. */}
        <G testID="stream">
          <Path d={STREAM_PATH} stroke={c.stream} strokeWidth={4 + state.stream * 3} strokeLinecap="round" fill="none" />
          <Path
            d={STREAM_PATH}
            stroke={c.streamDeep}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="10 14"
            strokeDashoffset={-t * 8}
            fill="none"
          />
        </G>
        {state.ducks && (
          <>
            <Duck x={168} y={190} />
            {state.stream >= 3 && <Duck x={110} y={213} />}
          </>
        )}

        <Tree stage={state.tree} />
        {state.birds && (
          <>
            <Bird x={70} y={92} asleep={night} />
            <Bird x={98} y={96} asleep={night} flip />
          </>
        )}

        {Array.from({ length: TUFTS }, (_, i) => {
          const x = 8 + i * 14.5;
          const base = 248 - (i % 2) * 4;
          const sway = Math.sin(t * 0.8 + i * 0.6) * 1.5;
          return (
            <G key={i}>
              <Line testID="grass-blade" x1={x} y1={base} x2={x - 3 + sway} y2={base - tuftHeight} stroke={c.grass} strokeWidth={2} strokeLinecap="round" />
              <Line x1={x} y1={base} x2={x + 3 + sway} y2={base - tuftHeight * 0.85} stroke={c.grass} strokeWidth={2} strokeLinecap="round" />
            </G>
          );
        })}

        {state.flowers.slice(-MAX_FLOWERS).map((f, i) => {
          const x = 14 + (i % 14) * 19.5;
          const y = 226 + Math.floor(i / 14) * 12 + (i % 2) * 3;
          return (
            <G key={f.day} testID="flower">
              <Line x1={x} y1={y} x2={x} y2={y + 12} stroke={c.grass} strokeWidth={1.5} />
              <Circle cx={x} cy={y} r={5} fill={stateColors[f.mood].tint} />
              <Circle cx={x} cy={y} r={2} fill={c.flowerHeart} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function Duck({ x, y }: { x: number; y: number }) {
  return (
    <G testID="duck">
      <Ellipse cx={x} cy={y} rx={7} ry={4} fill={c.duck} />
      <Circle cx={x + 6} cy={y - 4} r={3} fill={c.duck} />
      <Path d={`M${x + 9} ${y - 4} l3 1 l-3 1z`} fill={c.beak} />
    </G>
  );
}

/** A small round bird perched on the canopy; eyes closed at night. */
function Bird({ x, y, asleep, flip }: { x: number; y: number; asleep?: boolean; flip?: boolean }) {
  const d = flip ? -1 : 1;
  return (
    <G testID="bird">
      <Circle cx={x} cy={y} r={6} fill={c.bird} />
      <Ellipse cx={x - 1.5 * d} cy={y + 1} rx={3.5} ry={2.5} fill={c.birdWing} />
      <Path d={`M${x + 5.5 * d} ${y - 1} l${3 * d} 1.2 l${-3 * d} 1.2z`} fill={c.beak} />
      {asleep ? (
        <Path d={`M${x + 1 * d} ${y - 2} q${1.4 * d} 1 ${2.8 * d} 0`} stroke={c.skyRest} strokeWidth={0.9} fill="none" />
      ) : (
        <Circle cx={x + 2.3 * d} cy={y - 1.6} r={1} fill={c.skyRest} />
      )}
    </G>
  );
}

/** Sprout → sapling → tree → (birds) → blossom → fruit → a second tree. */
function Tree({ stage }: { stage: GardenState['tree'] }) {
  if (stage === 0) {
    return (
      <G testID="sprout" transform="translate(84 196) scale(1.7) translate(-84 -196)">
        <Ellipse cx="84" cy="196" rx="14" ry="3" fill={c.grass} opacity={0.35} />
        <Path d="M84 196 C84 188 85 182 86 176" stroke={c.leaf} strokeWidth="3" strokeLinecap="round" fill="none" />
        <Path d="M86 180 C78 176 74 178 72 182 C78 184 82 184 86 180Z" fill={c.leaf} />
        <Path d="M86 177 C92 170 98 171 100 174 C95 178 90 179 86 177Z" fill={c.leafLight} />
      </G>
    );
  }
  if (stage === 1) {
    return (
      <G testID="sapling">
        <Rect x="82" y="168" width="5" height="28" rx="2" fill={c.trunk} />
        <Circle cx="84" cy="160" r="15" fill={c.leaf} />
        <Circle cx="92" cy="156" r="9" fill={c.leafLight} />
      </G>
    );
  }
  return (
    <>
      {stage >= 6 && (
        <G testID="second-tree">
          <Rect x="236" y="148" width="7" height="44" rx="3" fill={c.trunk} />
          <Circle cx="240" cy="138" r="21" fill={c.leaf} />
          <Circle cx="250" cy="132" r="12" fill={c.leafLight} />
          <Circle testID="fruit" cx="232" cy="134" r="3.5" fill={c.fruit} />
          <Circle testID="fruit" cx="246" cy="146" r="3.5" fill={c.fruit} />
        </G>
      )}
      <G testID="tree">
        <Rect x="79" y="118" width="10" height="80" rx="4" fill={c.trunk} />
        <Circle cx="84" cy="112" r="36" fill={c.leaf} />
        <Circle cx="62" cy="124" r="22" fill={c.leaf} />
        <Circle cx="104" cy="122" r="24" fill={c.leaf} />
        <Circle cx="96" cy="98" r="18" fill={c.leafLight} />
      </G>
      {stage >= 4 &&
        [
          [66, 108],
          [96, 104],
          [84, 128],
          [56, 128],
          [110, 120],
        ].map(([x, y]) => <Circle key={`b${x}`} testID="blossom" cx={x} cy={y} r={3} fill={c.blossom} />)}
      {stage >= 5 &&
        [
          [72, 116],
          [100, 112],
          [86, 92],
          [60, 132],
          [110, 132],
        ].map(([x, y]) => <Circle key={`f${x}`} testID="fruit" cx={x} cy={y} r={4.5} fill={c.fruit} />)}
    </>
  );
}
