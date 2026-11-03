import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors, stateColors } from '@/constants/colors';
import type { PipMood } from '@/domain/park/pip';
import type { ParkLight } from '../ParkLayers';

const S = parkColors.outline;

/**
 * Pip: a round honey seed with a two-leaf sprout. Cheering opens its mouth and sparkles; in the
 * rain the sprout becomes a big leaf umbrella; asleep its eyes close and a few z's drift up.
 */
export const PipArt = React.memo(function PipArt({
  mood,
  light,
  size = 56,
}: {
  mood: PipMood;
  light: ParkLight;
  size?: number;
}) {
  const c = parkColors.pip;
  const f = parkColors.foliage[light === 'night' ? 'day' : light];

  return (
    <Svg width={size} height={(size * 124) / 120} viewBox="0 0 120 124">
      <Ellipse cx="60" cy="116" rx="34" ry="6" fill={parkColors.shadow} />
      <G stroke={S} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {mood === 'rainy' ? (
          <>
            <Path d="M60 40 L60 16" fill="none" />
            <Path d="M10 30 C26 -2 94 -2 110 30 C96 24 74 22 60 28 C46 22 24 24 10 30 Z" fill={f.leaf} />
            <Path d="M8 50 l-3 8 M112 46 l-3 8 M20 66 l-3 8" stroke={gardenColors.rain} fill="none" />
          </>
        ) : (
          <>
            <Path d="M60 38 C60 30 60 24 60 16" fill="none" />
            <Path d="M60 22 C50 10 36 10 32 20 C42 28 54 28 60 22 Z" fill={f.leaf} />
            <Path d="M60 18 C70 4 86 4 90 14 C80 24 66 24 60 18 Z" fill={f.light} />
          </>
        )}
        <Ellipse cx="44" cy="112" rx="9" ry="5" fill={c.feet} />
        <Ellipse cx="76" cy="112" rx="9" ry="5" fill={c.feet} />
        <Path d="M60 36 C90 36 106 58 106 80 C106 102 88 112 60 112 C32 112 14 102 14 80 C14 58 30 36 60 36 Z" fill={c.body} />
      </G>
      <Path d="M34 58 C40 48 50 44 58 44" stroke={c.shine} strokeWidth="5" strokeLinecap="round" fill="none" />

      {mood === 'sleepy' ? (
        <>
          <Path d="M39 78 Q45 84 51 78 M69 78 Q75 84 81 78" stroke={S} strokeWidth="3" strokeLinecap="round" fill="none" />
          <Path
            d="M92 34 h10 l-10 12 h10 M104 14 h7 l-7 8 h7"
            stroke={parkColors.moon}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <Ellipse cx="45" cy="76" rx="5.5" ry="7.5" fill={S} />
          <Ellipse cx="75" cy="76" rx="5.5" ry="7.5" fill={S} />
          <Circle cx="47" cy="73" r="2.2" fill={parkColors.shimmer} />
          <Circle cx="77" cy="73" r="2.2" fill={parkColors.shimmer} />
        </>
      )}

      <Ellipse cx="34" cy="88" rx="7.5" ry="4.5" fill={c.cheek} />
      <Ellipse cx="86" cy="88" rx="7.5" ry="4.5" fill={c.cheek} />

      {mood === 'cheer' && (
        <>
          <Path d="M49 87 Q60 104 71 87 Z" fill={stateColors.activated.ink} stroke={S} strokeWidth="3" strokeLinejoin="round" />
          <Path
            d="M14 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z M104 52 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"
            fill={parkColors.firefly}
            stroke={S}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </>
      )}
      {(mood === 'happy' || mood === 'rainy') && (
        <Path d="M52 89 Q60 97 68 89" stroke={S} strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {mood === 'sleepy' && <Ellipse cx="60" cy="92" rx="3.5" ry="2.5" fill={S} />}
    </Svg>
  );
});
