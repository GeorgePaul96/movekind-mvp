import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors, stateColors } from '@/constants/colors';

const S = parkColors.outline;

export const DuckArt = React.memo(function DuckArt({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.78} viewBox="0 0 60 46">
      <Ellipse cx="30" cy="40" rx="22" ry="4.5" fill={parkColors.shimmer} opacity={0.65} />
      <G stroke={S} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M46 18 L55 20 L46 23 Z" fill={gardenColors.beak} />
        <Path
          d="M12 28 C10 38 42 40 44 28 C45 22 36 22 30 24 C22 25 16 20 12 28 Z"
          fill={gardenColors.duck}
        />
        <Circle cx="38" cy="18" r="10" fill={gardenColors.duck} />
        <Circle cx="40" cy="16" r="2" fill={S} stroke="none" />
      </G>
    </Svg>
  );
});

export const RobinsArt = React.memo(function RobinsArt({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 64 44">
      <G stroke={S} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="20" cy="24" r="10" fill={gardenColors.bird} />
        <Circle cx="22" cy="26" r="6" fill={stateColors.activated.tint} stroke="none" />
        <Path d="M29 22 L34 24 L29 26 Z" fill={gardenColors.beak} />
        <Circle cx="44" cy="22" r="9" fill={gardenColors.bird} />
        <Path d="M35 21 L31 23 L35 25 Z" fill={gardenColors.beak} />
      </G>
    </Svg>
  );
});

export const ButterflyArt = React.memo(function ButterflyArt({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <G stroke={S} strokeWidth="3" strokeLinejoin="round">
        <Circle cx="12" cy="14" r="8" fill={stateColors.overloaded.tint} />
        <Circle cx="24" cy="14" r="8" fill={stateColors.overloaded.tint} />
        <Circle cx="14" cy="23" r="6" fill={stateColors.regulated.soft} />
        <Circle cx="22" cy="23" r="6" fill={stateColors.regulated.soft} />
        <Path d="M18 10 L18 27" stroke={S} strokeWidth="3.5" strokeLinecap="round" />
      </G>
    </Svg>
  );
});

export const CatArt = React.memo(function CatArt({
  pose,
  size = 46,
}: {
  pose: 'sit' | 'sleep' | 'walkA' | 'walkB';
  size?: number;
}) {
  const fur = stateColors.regulated.tint;
  if (pose === 'sleep') {
    return (
      <Svg width={size} height={size * 0.75} viewBox="0 0 60 45">
        <Ellipse cx="30" cy="36" rx="22" ry="6" fill={parkColors.shadow} />
        <G stroke={S} strokeWidth="4" strokeLinejoin="round">
          <Ellipse cx="30" cy="28" rx="18" ry="11" fill={fur} />
          <Circle cx="20" cy="26" r="9" fill={fur} />
          <Path d="M14 20 L17 13 L22 18 Z" fill={fur} />
        </G>
      </Svg>
    );
  }
  const stride = pose === 'walkA' ? 4 : pose === 'walkB' ? -4 : 0;
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 60 54">
      <Ellipse cx="30" cy="48" rx="18" ry="5" fill={parkColors.shadow} />
      <G stroke={S} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14 32 Q6 22 10 16" fill="none" stroke={fur} strokeWidth="6" />
        <Path d="M14 32 Q6 22 10 16" fill="none" />
        <LineLegs stride={stride} />
        <Ellipse cx="28" cy="32" rx="14" ry="10" fill={fur} />
        <Circle cx="40" cy="22" r="10" fill={fur} />
        <Path d="M33 14 L36 7 L41 13 Z" fill={fur} />
        <Path d="M41 13 L46 7 L48 15 Z" fill={fur} />
      </G>
    </Svg>
  );
});

function LineLegs({ stride }: { stride: number }) {
  return (
    <>
      <Path d={`M20 38 L${20 - stride} 47`} />
      <Path d={`M25 38 L${25 + stride} 47`} />
      <Path d={`M34 38 L${34 - stride} 47`} />
      <Path d={`M39 38 L${39 + stride} 47`} />
    </>
  );
}
