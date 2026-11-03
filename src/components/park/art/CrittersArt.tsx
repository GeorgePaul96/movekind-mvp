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

/** A cream rabbit with soft pink ears; `eyesClosed` is how the shared clock makes it blink. */
export const RabbitArt = React.memo(function RabbitArt({
  pose,
  eyesClosed = false,
  size = 48,
}: {
  pose: 'sit' | 'sleep' | 'hop';
  eyesClosed?: boolean;
  size?: number;
}) {
  const r = parkColors.rabbit;
  const sleeping = pose === 'sleep';
  const hopping = pose === 'hop';
  const closed = sleeping || eyesClosed;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="55" rx={hopping ? 15 : 20} ry="5" fill={parkColors.shadow} />
      <G stroke={S} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="14" cy={hopping ? 40 : 45} r="6.5" fill={r.body} />
        <G transform={sleeping ? 'rotate(-18 36 26)' : hopping ? 'rotate(-8 36 26)' : undefined}>
          <Path d="M31 24 C27 8 35 4 37 18 L36 25 Z" fill={r.body} />
          <Path d="M32.5 21 C30.5 11 34.5 9 35.5 19" stroke={r.earInner} strokeWidth="2.8" fill="none" />
          <Path d="M39 24 C38 6 47 5 46 20 L44 26 Z" fill={r.body} />
          <Path d="M41 21 C40.5 10 44.5 10 44 20" stroke={r.earInner} strokeWidth="2.8" fill="none" />
        </G>
        <Ellipse cx="29" cy={sleeping ? 44 : hopping ? 39 : 42} rx="15" ry={sleeping ? 10.5 : 12} fill={r.body} />
        {!sleeping && (
          <>
            <Ellipse cx={hopping ? 19 : 23} cy={hopping ? 49 : 52} rx="6.5" ry="3.8" fill={r.body} />
            <Ellipse cx={hopping ? 42 : 39} cy={hopping ? 47 : 52} rx="4.8" ry="3.5" fill={r.body} />
          </>
        )}
        <Circle cx="40" cy={sleeping ? 37 : 31} r="11.5" fill={r.body} />
        <Circle cx="44" cy={sleeping ? 40 : 34} r="2.8" fill={r.earInner} stroke="none" />
        <Circle cx="50" cy={sleeping ? 40 : 34} r="2" fill={r.nose} stroke="none" />
        {closed ? (
          <Path d={sleeping ? 'M41 34 Q44 36.5 46.5 34' : 'M41 28 Q44 30.5 46.5 28'} stroke={S} strokeWidth="2.6" fill="none" />
        ) : (
          <Circle cx="44" cy="28" r="2.3" fill={S} stroke="none" />
        )}
      </G>
    </Svg>
  );
});

/** The fawn's head, facing left, with its nose at (22, 25). */
function FawnHead({ asleep = false }: { asleep?: boolean }) {
  const f = parkColors.fawn;
  return (
    <>
      <Path d="M31 12 C30 8 30 6 32 3 M30.5 8 L27 6 M38 11 C38 7 39 5 41 3 M38.4 7 L42 6" stroke={f.antler} strokeWidth="2.6" fill="none" />
      <Path d="M41 15 C47 8 53 11 48 20 Z" fill={f.body} />
      <Path d="M43.5 15 C46.5 12 49.5 13 47 17.5 Z" fill={f.under} stroke="none" />
      <Path d="M44 20 C44 12 34 10 30 14 C25 16 21 22 22 26 C23 30 32 31 38 29 C42 28 44 25 44 20 Z" fill={f.body} />
      <Ellipse cx="27" cy="25" rx="5" ry="3.6" fill={f.under} stroke="none" />
      <Circle cx="22.5" cy="24.5" r="2.4" fill={f.nose} stroke="none" />
      {asleep ? (
        <Path d="M30 19.5 Q33 22 36 19.5" stroke={S} strokeWidth="2.2" fill="none" />
      ) : (
        <Circle cx="33" cy="19" r="2.2" fill={S} stroke="none" />
      )}
    </>
  );
}

/**
 * Static body and legs of the fawn on the bank (facing left). The shoulder sits at (54, 56) in the
 * 100x100 viewBox so `FawnNeckArt` can rotate around it cleanly without redrawing the SVG. Asleep,
 * it lies down with its head resting on its side.
 */
export const FawnBodyArt = React.memo(function FawnBodyArt({
  asleep = false,
  size = 90,
}: {
  asleep?: boolean;
  size?: number;
}) {
  const f = parkColors.fawn;
  if (asleep) {
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Ellipse cx="58" cy="91" rx="30" ry="5.5" fill={parkColors.shadow} />
        <G stroke={S} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M81 68 C87 66 88 74 83 76 Z" fill={f.under} />
          <Ellipse cx="60" cy="76" rx="25" ry="14" fill={f.body} />
          <Ellipse cx="58" cy="82" rx="14" ry="6" fill={f.under} stroke="none" />
          <Circle cx="66" cy="69" r="3.8" fill={f.spot} stroke="none" />
          <Circle cx="74" cy="76" r="3.2" fill={f.spot} stroke="none" />
          <G transform="translate(12, 52)">
            <FawnHead asleep />
          </G>
        </G>
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="62" cy="92" rx="24" ry="5.5" fill={parkColors.shadow} />
      <G strokeLinecap="round">
        <Path d="M55 62 L54 89 M72 62 L73 89" stroke={S} strokeWidth="9" fill="none" />
        <Path d="M55 62 L54 89 M72 62 L73 89" stroke={f.body} strokeWidth="4" fill="none" />
        <Path d="M54 89 L54 90 M73 89 L73 90" stroke={f.nose} strokeWidth="5" fill="none" />
      </G>
      <G stroke={S} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M81 45 C88 43 89 52 83 54 Z" fill={f.under} />
        <Ellipse cx="64" cy="54" rx="20" ry="14" fill={f.body} />
        <Ellipse cx="62" cy="60" rx="12" ry="6.5" fill={f.under} stroke="none" />
        <Circle cx="56" cy="47" r="4" fill={f.spot} stroke="none" />
        <Circle cx="67" cy="46" r="3.6" fill={f.spot} stroke="none" />
        <Circle cx="75" cy="53" r="3.2" fill={f.spot} stroke="none" />
      </G>
    </Svg>
  );
});

/**
 * Neck and head of the fawn. Pivots around shoulder (54, 56), and is drawn under the body so the
 * joint never shows. Counter-clockwise rotation (-42 deg) dips the nose (22, 25) down into the
 * river water; `FAWN_NOSE_DIP` in shapes.ts is where that lands.
 */
export const FawnNeckArt = React.memo(function FawnNeckArt({ size = 90 }: { size?: number }) {
  const f = parkColors.fawn;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G stroke={S} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M56 56 C47 44 45 32 46 22 L36 24 C33 35 37 48 49 62 Z" fill={f.body} />
        <FawnHead />
      </G>
    </Svg>
  );
});

/** Small water droplets near the fawn's nose when celebrating a logged glass of water. */
export const FawnDropletsArt = React.memo(function FawnDropletsArt({ size = 90 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="12" cy="24" r="2.6" fill={parkColors.shimmer} stroke={S} strokeWidth="1.6" />
      <Circle cx="17" cy="16" r="2.2" fill={parkColors.shimmer} stroke={S} strokeWidth="1.6" />
      <Circle cx="23" cy="10" r="2" fill={parkColors.shimmer} stroke={S} strokeWidth="1.6" />
    </Svg>
  );
});
