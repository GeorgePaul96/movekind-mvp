import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, yardColors } from '@/constants/colors';
import { fontFamilies } from '@/constants/typography';
import type { Point } from '@/domain/yard/layout';
import { walkDurationMs } from '@/domain/yard/script';
import { useReduceMotion } from '@/hooks/useReduceMotion';

const S = yardColors.outline;

export type PuddingMode = 'sleep' | 'snore' | 'wake' | 'walk' | 'eat';

interface Props {
  clock: SharedValue<number>;
  spot: Point;
  size: number;
  mode: PuddingMode;
  rollTrigger: number;
}

export function Pudding({ clock, spot, size, mode, rollTrigger }: Props) {
  const reduce = useReduceMotion();
  const [bellyUp, setBellyUp] = useState(false);

  const posX = useSharedValue(spot.x);
  const posY = useSharedValue(spot.y);
  const lastSpot = React.useRef<Point>(spot);
  const lastRoll = React.useRef(rollTrigger);

  const isAwake = mode === 'wake' || mode === 'walk' || mode === 'eat';

  // Automatic roll between belly-down and belly-up every 8 to 14 seconds while asleep
  useEffect(() => {
    if (isAwake || reduce) return;
    const delay = 8000 + Math.round(Math.random() * 6000);
    const timer = setTimeout(() => {
      setBellyUp((prev) => !prev);
    }, delay);
    return () => clearTimeout(timer);
  }, [bellyUp, isAwake, reduce]);

  // Roll when a sleep log is saved
  useEffect(() => {
    if (rollTrigger <= lastRoll.current) return;
    lastRoll.current = rollTrigger;
    setBellyUp((prev) => !prev);
  }, [rollTrigger]);

  useEffect(() => {
    const prev = lastSpot.current;
    const ms = walkDurationMs(prev, spot, reduce);
    lastSpot.current = spot;
    if (ms === 0) {
      posX.value = spot.x;
      posY.value = spot.y;
    } else {
      posX.value = withTiming(spot.x, { duration: Math.min(1400, Math.round(ms * 1.15)) });
      posY.value = withTiming(spot.y, { duration: Math.min(1400, Math.round(ms * 1.15)) });
    }
  }, [posX, posY, reduce, spot]);

  const animStyle = useAnimatedStyle(() => {
    const t = clock.value;
    const breathe = reduce ? 0 : Math.sin(t * 1.4) * 0.03;
    const waddle = !reduce && mode === 'walk' ? Math.sin(t * 16) * 4 : 0;
    return {
      transform: [
        { translateX: posX.value - size * 0.55 },
        { translateY: posY.value - size * 0.65 },
        { rotate: `${waddle}deg` },
        { scaleX: 1 + breathe * 0.6 },
        { scaleY: 1 + breathe },
      ],
    };
  });

  const c = yardColors.pudding;

  return (
    <Animated.View
      testID={`pudding-${isAwake ? 'awake' : bellyUp ? 'belly-up' : 'belly-down'}`}
      pointerEvents="none"
      style={[styles.wrap, { width: size * 1.1, height: size * 0.85 }, animStyle]}
    >
      <Svg width={size * 1.1} height={size * 0.85} viewBox="-65 -75 130 90">
        <Ellipse cx={4} cy={4} rx={44} ry={7} fill={yardColors.shadow} />

        {isAwake ? (
          /* Awake Pose: Standing/Waddling/Eating at the Food Bowl */
          <G stroke={S} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={38} cy={-30} r={5} fill={c.fawn} />
            <Rect x={-26} y={-18} width={9} height={18} rx={4.5} fill={c.fawn} />
            <Rect x={-13} y={-18} width={9} height={18} rx={4.5} fill={c.fawn} />
            <Rect x={14} y={-18} width={9} height={18} rx={4.5} fill={c.fawn} />
            <Rect x={26} y={-18} width={9} height={18} rx={4.5} fill={c.fawn} />
            <Ellipse cx={6} cy={-26} rx={32} ry={17} fill={c.fawn} />
            <Ellipse cx={-16} cy={-22} rx={12} ry={11} fill={c.white} />
            <Path d="M-18 -36 Q-8 -18 -14 -10" stroke={c.collar} strokeWidth={5} fill="none" />
            {/* Squat Awake Head (dips when eating) */}
            <G transform={`translate(-30, ${mode === 'eat' ? -24 : -36}) rotate(${mode === 'eat' ? -18 : 0})`}>
              <Ellipse cx={0} cy={0} rx={20} ry={17} fill={c.fawn} />
              <Path d="M6 -14 Q14 -22 16 -10 Z" fill={c.ear} />
              <Ellipse cx={-8} cy={6} rx={13} ry={9} fill={c.white} />
              <Circle cx={-5} cy={-4} r={3.4} fill={S} />
              <Circle cx={-6} cy={-5} r={1.2} fill={colors.surface} />
              <Ellipse cx={-16} cy={1} rx={4.5} ry={3.2} fill={c.nose} />
            </G>
          </G>
        ) : bellyUp ? (
          /* Asleep Pose B: Belly Up with Paws in Air, Pink Toe Beans, and Tongue Out */
          <G stroke={S} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Ellipse cx={6} cy={-12} rx={36} ry={16} fill={c.fawn} />
            <Ellipse cx={6} cy={-16} rx={26} ry={10} fill={c.belly} />
            {/* Four Paws in the Air with Pink Toe Beans */}
            <Path d="M-10 -22 L-14 -38" stroke={c.fawn} strokeWidth={8} />
            <Path d="M2 -24 L4 -40" stroke={c.fawn} strokeWidth={8} />
            <Path d="M22 -24 L26 -38" stroke={c.fawn} strokeWidth={8} />
            <Path d="M32 -20 L38 -34" stroke={c.fawn} strokeWidth={8} />
            <Circle cx={-14} cy={-39} r={4.5} fill={c.white} />
            <Circle cx={4} cy={-41} r={4.5} fill={c.white} />
            <Circle cx={26} cy={-39} r={4.5} fill={c.white} />
            <Circle cx={38} cy={-35} r={4.5} fill={c.white} />
            {/* Pink Toe Beans */}
            <Circle cx={-14} cy={-39} r={2} fill={c.toeBean} stroke="none" />
            <Circle cx={4} cy={-41} r={2} fill={c.toeBean} stroke="none" />
            <Circle cx={26} cy={-39} r={2} fill={c.toeBean} stroke="none" />
            <Circle cx={38} cy={-35} r={2} fill={c.toeBean} stroke="none" />
            {/* Upside-down Squat Head with Flopped Tongue */}
            <G transform="translate(-30, -14)">
              <Ellipse cx={0} cy={0} rx={20} ry={16} fill={c.fawn} />
              <Path d="M-10 4 Q-12 16 -5 16 Q0 16 -2 4 Z" fill={c.tongue} />
              <Ellipse cx={-8} cy={-4} rx={12} ry={8} fill={c.white} />
              <Path d="M-8 2 Q-4 -2 0 2" fill="none" />
              <Ellipse cx={-16} cy={-1} rx={4.5} ry={3.2} fill={c.nose} />
            </G>
          </G>
        ) : (
          /* Asleep Pose A: Belly-Down Frog-Legged Sploot with Pink Toe Beans */
          <G stroke={S} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            {/* Splooted Hind Leg & Pink Toe Beans */}
            <Ellipse cx={42} cy={-4} rx={13} ry={6} fill={c.fawnShade} />
            <Circle cx={50} cy={-4} r={2} fill={c.toeBean} stroke="none" />
            <Circle cx={48} cy={-1} r={2} fill={c.toeBean} stroke="none" />
            <Circle cx={42} cy={-22} r={5} fill={c.fawn} />
            {/* Plump Body & Saddle Spot */}
            <Ellipse cx={8} cy={-16} rx={35} ry={18} fill={c.fawn} />
            <Ellipse cx={16} cy={-26} rx={14} ry={7} fill={c.spot} stroke="none" />
            {/* Red Collar */}
            <Path d="M-18 -28 Q-10 -10 -16 -2" stroke={c.collar} strokeWidth={5} fill="none" />
            <Circle cx={-15} cy={-2} r={3.5} fill={c.tag} />
            {/* Front Paws */}
            <Ellipse cx={-34} cy={-2} rx={10} ry={4} fill={c.white} />
            <Ellipse cx={-20} cy={-1} rx={10} ry={4} fill={c.white} />
            {/* Sleeping Squat Head with Jowls */}
            <G transform="translate(-28, -18)">
              <Path d="M6 -14 Q14 -20 18 -11 Z" fill={c.ear} />
              <Ellipse cx={0} cy={0} rx={21} ry={17} fill={c.fawn} />
              <Ellipse cx={-10} cy={6} rx={13} ry={9} fill={c.white} />
              <Path d="M-8 -3 Q-4 1 0 -3" fill="none" />
              <Ellipse cx={-17} cy={1} rx={4.5} ry={3.2} fill={c.nose} />
            </G>
          </G>
        )}

        {/* Rising Zzz Bubbles (not poppable, pure sleep cue) */}
        {!isAwake && (
          <G pointerEvents="none">
            <SvgText
              x={-32}
              y={-44}
              fontFamily={fontFamilies.extrabold}
              fontSize={mode === 'snore' ? 15 : 13}
              fill={S}
            >
              z
            </SvgText>
            <SvgText
              x={-22}
              y={-56}
              fontFamily={fontFamilies.extrabold}
              fontSize={mode === 'snore' ? 18 : 15}
              fill={S}
            >
              z
            </SvgText>
            <SvgText
              x={-10}
              y={-68}
              fontFamily={fontFamilies.extrabold}
              fontSize={mode === 'snore' ? 21 : 18}
              fill={S}
            >
              Z
            </SvgText>
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0 },
});