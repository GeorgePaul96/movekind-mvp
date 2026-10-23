import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { gardenColors as c, stateColors } from '@/constants/colors';
import { GARDEN_COPY } from '@/constants/copy';
import type { GardenState } from '@/domain/garden/garden';
import { useReduceMotion } from '@/hooks/useReduceMotion';

const TICK_MS = 100; // gentle motion only: 10 updates a second is plenty
const BLADES = 24;
const MAX_FLOWERS = 28;

interface Props {
  state: GardenState;
  height?: number;
}

/**
 * The garden, drawn in code. Every part answers to one input: stream (water), grass
 * (steps), tree (workouts), flowers (moods). It only grows or rests; resting swaps the
 * sun for a moon and changes nothing else. Holds still when the phone asks for less motion.
 */
export function Garden({ state, height = 250 }: Props) {
  const reduceMotion = useReduceMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setPhase((p) => p + TICK_MS / 1000), TICK_MS);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const t = reduceMotion ? 0 : phase;
  const bladeHeight = 6 + state.grass * 5;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={GARDEN_COPY.a11ySummary(state)}>
      <Svg width="100%" height={height} viewBox="0 0 290 250" preserveAspectRatio="xMidYMid slice">
        <Rect width="290" height="250" fill={state.resting ? c.skyRest : c.sky} />
        {state.resting ? (
          <G testID="moon">
            <Circle cx="240" cy="48" r="16" fill={c.moon} />
            <Circle cx="247" cy="43" r="13" fill={c.skyRest} />
          </G>
        ) : (
          <Circle testID="sun" cx="240" cy="48" r="20" fill={c.sun} />
        )}

        <Path d="M0 165 Q80 130 160 155 T290 145 V250 H0Z" fill={c.hillBack} />
        <Path d="M0 195 Q90 175 180 193 T290 185 V250 H0Z" fill={c.hillFront} />

        {/* Stream: never dry. Level 0 is a thin trickle; each glass widens it. */}
        <G testID="stream">
          <Path
            d="M300 172 Q230 186 180 204 T40 252"
            stroke={c.stream}
            strokeWidth={3 + state.stream * 3}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M300 172 Q230 186 180 204 T40 252"
            stroke={c.streamDeep}
            strokeWidth={1.5}
            strokeDasharray="6 12"
            strokeDashoffset={-t * 8}
            fill="none"
          />
        </G>
        {state.ducks && (
          <>
            <Duck x={150} y={214} />
            {state.stream >= 3 && <Duck x={196} y={198} />}
          </>
        )}

        <Tree stage={state.tree} />
        {state.birds && (
          <>
            <Path testID="bird" d="M58 82 l6 -4 l6 4" stroke={c.bird} strokeWidth="2" fill="none" />
            <Path testID="bird" d="M196 70 l6 -4 l6 4" stroke={c.bird} strokeWidth="2" fill="none" />
          </>
        )}

        {Array.from({ length: BLADES }, (_, i) => {
          const x = 6 + i * 12;
          const base = 250 - (i % 2) * 3;
          const sway = Math.sin(t * 0.8 + i * 0.6) * 1.6;
          return (
            <Line
              key={i}
              testID="grass-blade"
              x1={x}
              y1={base}
              x2={x + 2 + sway}
              y2={base - bladeHeight}
              stroke={c.grass}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}

        {state.flowers.slice(-MAX_FLOWERS).map((f, i) => {
          const x = 14 + (i % 14) * 19.5;
          const y = 228 + Math.floor(i / 14) * 12 + (i % 2) * 3;
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
      <Path d={`M${x + 9} ${y - 4} l3 1 l-3 1z`} fill={c.fruit} />
    </G>
  );
}

/** Sprout → sapling → tree → (birds) → blossom → fruit → a second tree. */
function Tree({ stage }: { stage: GardenState['tree'] }) {
  if (stage === 0) {
    return (
      <G testID="sprout">
        <Line x1="132" y1="192" x2="132" y2="178" stroke={c.leaf} strokeWidth="3" strokeLinecap="round" />
        <Ellipse cx="126" cy="178" rx="6" ry="3" fill={c.leafLight} />
        <Ellipse cx="138" cy="176" rx="6" ry="3" fill={c.leafLight} />
      </G>
    );
  }
  if (stage === 1) {
    return (
      <G testID="sapling">
        <Rect x="130" y="166" width="5" height="26" rx="2" fill={c.trunk} />
        <Circle cx="132" cy="160" r="13" fill={c.leafLight} />
      </G>
    );
  }
  return (
    <>
      {stage >= 6 && (
        <G testID="second-tree">
          <Rect x="58" y="150" width="7" height="45" rx="3" fill={c.trunk} />
          <Circle cx="61" cy="142" r="20" fill={c.leafLight} />
          <Circle testID="fruit" cx="54" cy="138" r="3.5" fill={c.fruit} />
          <Circle testID="fruit" cx="68" cy="146" r="3.5" fill={c.fruit} />
        </G>
      )}
      <G testID="tree">
        <Rect x="128" y="118" width="10" height="74" rx="4" fill={c.trunk} />
        <Circle cx="133" cy="110" r="34" fill={c.leaf} />
        <Circle cx="111" cy="124" r="22" fill={c.leafLight} />
        <Circle cx="156" cy="122" r="24" fill={c.leafLight} />
      </G>
      {stage >= 4 &&
        [
          [118, 98],
          [146, 92],
          [133, 120],
          [104, 126],
          [160, 116],
        ].map(([x, y]) => <Circle key={`b${x}`} testID="blossom" cx={x} cy={y} r={3} fill={c.blossom} />)}
      {stage >= 5 &&
        [
          [122, 106],
          [148, 110],
          [136, 90],
          [112, 128],
        ].map(([x, y]) => <Circle key={`f${x}`} testID="fruit" cx={x} cy={y} r={4.5} fill={c.fruit} />)}
    </>
  );
}
