import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors, stateColors } from '@/constants/colors';

const S = parkColors.outline;

export const DuckArt = React.memo(function DuckArt({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.78} viewBox="0 0 60 46">
      <Ellipse cx="30" cy="40" rx="22" ry="4.5" fill={parkColors.shimmer} opacity={0.65} />
      <G stroke={S} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
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
      <G stroke={S} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
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
        <G stroke={S} strokeWidth="3.4" strokeLinejoin="round">
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
      <G stroke={S} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14 32 Q6 22 10 16" fill="none" stroke={fur} strokeWidth="5.5" />
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

/**
 * Static body and legs of the wading crane (facing left). The shoulder sits at (52, 54) in the
 * 100x100 viewBox so `CraneNeckArt` can rotate around it cleanly without redrawing the SVG.
 */
export const CraneBodyArt = React.memo(function CraneBodyArt({
  asleep = false,
  size = 90,
}: {
  asleep?: boolean;
  size?: number;
}) {
  const c = parkColors.crane;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="64" cy="91" rx="22" ry="5.5" fill={parkColors.shadow} />
      <G stroke={S} strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round">
        {/* Long thin wading legs; at night one leg tucks up */}
        <Path d="M62 64 L60 90 M55 90 L65 90" stroke={c.leg} />
        {asleep ? (
          <Path d="M68 64 L71 76 L64 78" stroke={c.leg} fill="none" />
        ) : (
          <Path d="M69 64 L72 89 M67 89 L76 89" stroke={c.leg} />
        )}

        {/* Chubby rounded crane body with dark tail plume */}
        <Path
          d="M46 54 C46 42 78 42 84 56 C86 64 72 68 56 66 C48 65 46 60 46 54 Z"
          fill={c.body}
        />
        <Path d="M52 58 C60 63 73 63 80 57" stroke={c.shade} strokeWidth="3" fill="none" />
        <Path d="M76 50 C84 49 90 55 87 62 C82 62 77 58 76 50 Z" fill={c.plume} />

        {/* Tucked sleeping head at night */}
        {asleep && (
          <G>
            <Circle cx="51" cy="47" r="8.5" fill={c.body} />
            <Path d="M46 40 Q51 37 55 41" stroke={c.crown} strokeWidth="3.5" fill="none" />
            <Path d="M47 47 Q49 49 52 47" stroke={S} strokeWidth="2.2" fill="none" />
          </G>
        )}
      </G>
    </Svg>
  );
});

/**
 * Neck, red-crowned head, and pointed beak of the crane. Pivots around shoulder (52, 54), and is
 * drawn under the body so the joint never shows. Counter-clockwise rotation (-44 deg) dips the
 * beak tip (17, 25) down into the river water; `CRANE_BEAK_DIP` in shapes.ts is where that lands.
 */
export const CraneNeckArt = React.memo(function CraneNeckArt({ size = 90 }: { size?: number }) {
  const c = parkColors.crane;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G stroke={S} strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round">
        {/* Graceful neck rising from shoulder (52, 54) to head (40, 24) */}
        <Path
          d="M54 56 C45 43 42 33 44 24 L36 24 C34 35 37 48 50 62 Z"
          fill={c.body}
        />
        {/* Dark neck band */}
        <Path d="M37 35 L43 34" stroke={c.plume} strokeWidth="3.5" />
        {/* Pointed beak reaching left */}
        <Path d="M33 22 L17 25 L33 27 Z" fill={gardenColors.beak} />
        {/* Chubby head and red crown patch */}
        <Circle cx="39" cy="23" r="8" fill={c.body} />
        <Path d="M36 15 Q41 13 44 17" stroke={c.crown} strokeWidth="3.8" fill="none" />
        <Circle cx="37" cy="22" r="1.8" fill={S} stroke="none" />
      </G>
    </Svg>
  );
});

/** Small water droplets near the crane's beak when celebrating a logged glass of water. */
export const CraneDropletsArt = React.memo(function CraneDropletsArt({ size = 90 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="13" cy="22" r="2.6" fill={parkColors.shimmer} stroke={S} strokeWidth="1.6" />
      <Circle cx="18" cy="14" r="2.2" fill={parkColors.shimmer} stroke={S} strokeWidth="1.6" />
      <Circle cx="24" cy="19" r="2" fill={parkColors.shimmer} stroke={S} strokeWidth="1.6" />
    </Svg>
  );
});
