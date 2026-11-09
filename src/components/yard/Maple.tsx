import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors, yardColors } from '@/constants/colors';
import type { Point } from '@/domain/yard/layout';
import { frustratedCloudOpacity, mapleMoodPose } from '@/domain/yard/moods';
import { type DogAction, walkDurationMs } from '@/domain/yard/script';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import type { YardMood } from '@/types';

const S = yardColors.outline;

interface Props {
  clock: SharedValue<number>;
  spot: Point;
  size: number;
  mood: YardMood | null;
  action: DogAction;
  resting: boolean;
  petCount: number;
  hopCount: number;
}

export function Maple({
  clock,
  spot,
  size,
  mood,
  action,
  resting,
  petCount,
  hopCount,
}: Props) {
  const reduce = useReduceMotion();
  const effectiveMood: YardMood | null = resting ? 'tired' : mood;
  const pose = mapleMoodPose(effectiveMood);
  const cloudOpacity = frustratedCloudOpacity(effectiveMood, petCount);

  const posX = useSharedValue(spot.x);
  const posY = useSharedValue(spot.y);
  const flipX = useSharedValue(1);
  const hopY = useSharedValue(0);
  const petHeartY = useSharedValue(0);
  const petHeartOpacity = useSharedValue(0);
  const lastSpot = React.useRef<Point>(spot);
  const lastPet = React.useRef(petCount);
  const lastHop = React.useRef(hopCount);

  useEffect(() => {
    const prev = lastSpot.current;
    const dx = spot.x - prev.x;
    if (Math.abs(dx) > 2) {
      // Default side-view art faces left (1); flip (-1) when walking right
      flipX.value = dx > 0 ? -1 : 1;
    } else if (action === 'idle') {
      flipX.value = 1;
    }
    const ms = walkDurationMs(prev, spot, reduce);
    lastSpot.current = spot;
    if (ms === 0) {
      posX.value = spot.x;
      posY.value = spot.y;
    } else {
      posX.value = withTiming(spot.x, { duration: ms });
      posY.value = withTiming(spot.y, { duration: ms });
    }
  }, [action, flipX, posX, posY, reduce, spot]);

  useEffect(() => {
    if (petCount <= lastPet.current) return;
    lastPet.current = petCount;
    if (reduce) {
      petHeartOpacity.value = 1;
      petHeartY.value = -16;
      return;
    }
    petHeartY.value = 0;
    petHeartOpacity.value = 1;
    petHeartY.value = withTiming(-28, { duration: 750 });
    petHeartOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 600 }),
    );
  }, [petCount, petHeartOpacity, petHeartY, reduce]);

  useEffect(() => {
    if (hopCount <= lastHop.current) return;
    lastHop.current = hopCount;
    if (reduce) return;
    hopY.value = withSequence(
      withTiming(-18, { duration: 180 }),
      withSpring(0, { damping: 10, stiffness: 220 }),
    );
  }, [hopCount, hopY, reduce]);

  const containerStyle = useAnimatedStyle(() => {
    const t = clock.value;
    const breathe = reduce ? 0 : Math.sin(t * pose.breatheRate) * 0.022;
    const walkBob = !reduce && action === 'walk' ? Math.abs(Math.sin(t * 14)) * -5 : 0;
    const playBounce = !reduce && action === 'play' ? Math.sin(t * 11) * -7 : 0;
    const buzzBounce = !reduce && action === 'idle' && pose.bounceAmp > 0 ? Math.sin(t * 8) * -pose.bounceAmp : 0;

    return {
      transform: [
        { translateX: posX.value - size * 0.55 },
        { translateY: posY.value - size * 0.78 + hopY.value + walkBob + playBounce + buzzBounce },
        { scaleX: flipX.value * (1 - breathe * 0.5) },
        { scaleY: 1 + breathe },
      ],
    };
  });

  const heartStyle = useAnimatedStyle(() => ({
    opacity: petHeartOpacity.value,
    transform: [{ translateY: petHeartY.value }],
  }));

  const isWalking = action === 'walk' || action === 'play';
  const isDipping = action === 'drink' || action === 'eat';
  const isLying = pose.posture === 'lying' && action === 'idle';
  const showTongue = pose.tongue || action === 'drink' || action === 'play';
  const c = yardColors.maple;

  return (
    <Animated.View
      testID="maple-dog"
      pointerEvents="none"
      style={[styles.wrap, { width: size * 1.1, height: size }, containerStyle]}
    >
      <Svg width={size * 1.1} height={size} viewBox="-70 -110 140 125">
        {/* Ground Shadow */}
        <Ellipse cx={0} cy={6} rx={44} ry={9} fill={yardColors.shadow} />

        {/* Fluffy Golden Tail */}
        <G transform={`translate(28, ${isLying ? -8 : -18}) rotate(${action === 'play' ? 16 : 6})`}>
          <Path
            d="M0 0 Q26 -14 36 2 Q24 16 2 6 Z"
            fill={c.coat}
            stroke={S}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Path d="M8 3 Q22 10 30 2" stroke={c.chest} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>

        {isLying ? (
          /* Tired Lying Pose (side-view loaf with chin resting on front paws) */
          <G stroke={S} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Ellipse cx={18} cy={-6} rx={22} ry={12} fill={c.coatShade} />
            <Ellipse cx={4} cy={-12} rx={34} ry={18} fill={c.coat} />
            <Path d="M-24 -16 Q-34 -4 -22 2 Q-10 4 -6 -6 Z" fill={c.chest} />
            <Ellipse cx={-30} cy={1} rx={12} ry={5} fill={c.chest} />
            <Ellipse cx={-16} cy={3} rx={12} ry={5} fill={c.chest} />
          </G>
        ) : (
          /* Side-View Body with Four Legs (Sitting three-quarter at home, Trotting when walking) */
          <G stroke={S} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            {/* Far-side hind & front legs */}
            <Rect
              x={16}
              y={-22}
              width={11}
              height={24}
              rx={5.5}
              fill={c.coatShade}
              transform={isWalking ? 'rotate(-14 21 -20)' : undefined}
            />
            <Rect
              x={-10}
              y={-24}
              width={10}
              height={26}
              rx={5}
              fill={c.coatShade}
              transform={isWalking ? 'rotate(14 -5 -22)' : undefined}
            />

            {/* Side-view torso */}
            <Path
              d="M-20 -36 Q8 -40 30 -20 Q36 -2 18 2 L-16 2 Q-30 -10 -20 -36 Z"
              fill={c.coat}
            />
            {/* Cream chest ruff */}
            <Path d="M-22 -34 Q-34 -18 -22 -4 Q-12 0 -6 -12 Q-10 -26 -22 -34 Z" fill={c.chest} />

            {/* Near-side hind & front legs */}
            <Rect
              x={10}
              y={-20}
              width={12}
              height={24}
              rx={6}
              fill={c.coat}
              transform={isWalking ? 'rotate(16 16 -18)' : undefined}
            />
            <Ellipse cx={14} cy={3} rx={8} ry={4} fill={c.chest} />
            <Rect
              x={-18}
              y={-22}
              width={11}
              height={26}
              rx={5.5}
              fill={c.coat}
              transform={isWalking ? 'rotate(-16 -12 -20)' : undefined}
            />
            <Ellipse cx={-13} cy={3} rx={8} ry={4} fill={c.chest} />
          </G>
        )}

        {/* Deep-Green Collar (colors.primary) & Gold Tag */}
        <Path
          d={isLying ? 'M-24 -18 Q-12 -10 -6 -18' : 'M-24 -36 Q-10 -28 -2 -38'}
          stroke={c.collar}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <Circle
          cx={-14}
          cy={isLying ? -11 : -29}
          r={4}
          fill={c.tag}
          stroke={c.tagStroke}
          strokeWidth={1.5}
        />

        {/* Three-Quarter Turned Head (shows both eyes at home, dips when drinking/eating) */}
        <G
          transform={`translate(-20, ${
            isLying ? -24 : isDipping ? -34 : -54 + pose.headDropY
          }) rotate(${isDipping ? -24 : pose.headTiltDeg})`}
        >
          {/* Back Ear */}
          <Path
            d="M-14 -16 Q-28 -12 -26 8 Q-18 14 -12 2 Z"
            fill={c.ear}
            stroke={S}
            strokeWidth={2.2}
            transform={`rotate(${-pose.earAngleDeg} -14 -12)`}
          />
          {/* Head Base */}
          <Ellipse cx={0} cy={-4} rx={22} ry={19} fill={c.coat} stroke={S} strokeWidth={2.5} />
          {/* Cream Muzzle */}
          <Ellipse cx={-10} cy={4} rx={13} ry={9} fill={c.chest} stroke={S} strokeWidth={2.2} />

          {/* Pink Tongue */}
          {showTongue && (
            <Path
              d="M-12 10 Q-14 21 -7 21 Q-2 21 -4 10 Z"
              fill={c.tongue}
              stroke={S}
              strokeWidth={1.8}
            />
          )}

          {/* Both Eyes Visible (Three-Quarter Turn) */}
          {pose.eyelids === 'half' || isDipping ? (
            <G stroke={S} strokeWidth={2.4} strokeLinecap="round" fill="none">
              <Path d="M-16 -5 Q-12 -1 -8 -5" />
              <Path d="M-3 -5 Q1 -1 5 -5" />
            </G>
          ) : (
            <G>
              <Circle cx={-12} cy={-6 + pose.pupilOffsetY} r={3.3} fill={S} />
              <Circle cx={-13} cy={-7.2 + pose.pupilOffsetY} r={1.1} fill={colors.surface} />
              <Circle cx={1} cy={-6 + pose.pupilOffsetY} r={3.3} fill={S} />
              <Circle cx={0} cy={-7.2 + pose.pupilOffsetY} r={1.1} fill={colors.surface} />
            </G>
          )}

          {/* Worried Brows for Frustrated Mood */}
          {pose.brows === 'worried' && (
            <G stroke={S} strokeWidth={2.2} strokeLinecap="round">
              <Path d="M-17 -11 L-8 -14" />
              <Path d="M7 -11 L-2 -14" />
            </G>
          )}

          {/* Dark Nose & Smile */}
          <Ellipse cx={-18} cy={1} rx={5} ry={3.6} fill={c.nose} />
          <Path
            d={pose.smile ? 'M-15 7 Q-9 11 -3 6' : 'M-14 8 Q-9 7 -4 8'}
            stroke={S}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />

          {/* Front Floppy Ear */}
          <Path
            d="M8 -14 Q24 -10 22 10 Q14 18 6 6 Z"
            fill={c.coatShade}
            stroke={S}
            strokeWidth={2.2}
            transform={`rotate(${pose.earAngleDeg} 10 -10)`}
          />
        </G>

        {/* Buzzing Twinkles */}
        {pose.twinkles && action === 'idle' && (
          <G fill={c.twinkle}>
            <Path d="M-48 -78 l2 -5 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 Z" />
            <Path d="M18 -82 l2 -5 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 Z" />
          </G>
        )}

        {/* Frustrated Drifting Scribble Cloud (No lightning, no flashing; softens on pet) */}
        {cloudOpacity > 0 && action === 'idle' && (
          <G testID="maple-scribble-cloud" opacity={cloudOpacity} transform="translate(-16, -92)">
            <Ellipse cx={0} cy={0} rx={22} ry={10} fill={c.cloudFill} />
            <Path
              d="M-14 2 C-10 -6 -4 6 0 -2 C4 -8 10 6 14 -1"
              stroke={c.cloudStroke}
              strokeWidth={2.2}
              fill="none"
              strokeLinecap="round"
            />
          </G>
        )}
      </Svg>

      {/* One Floating Heart on Pet (Never a counter or ring) */}
      <Animated.View pointerEvents="none" style={[styles.heart, heartStyle]}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M12 21s-7-4.5-9.5-8.5C.5 9 2.5 5 6.5 5c2.2 0 3.9 1.2 5.5 3 1.6-1.8 3.3-3 5.5-3 4 0 6 4 4 7.5C19 16.5 12 21 12 21z"
            fill={c.heart}
            stroke={S}
            strokeWidth={1.8}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0 },
  heart: { position: 'absolute', top: -8, left: '38%' },
});