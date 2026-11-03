import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { gardenColors, parkColors, stateColors } from '@/constants/colors';

const S = parkColors.outline;
const SHINE = parkColors.shimmer;

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

/**
 * A butterfly seen from above: shaped upper and lower wings with spots and a shine, a striped
 * body, and curled antennae with round tips.
 */
export const ButterflyArt = React.memo(function ButterflyArt({ size = 24 }: { size?: number }) {
  const upper = stateColors.overloaded.tint;
  const lower = stateColors.overloaded.soft;
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Path d="M17 10 Q14 4 10.5 3.5 M19 10 Q22 4 25.5 3.5" stroke={S} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Circle cx="10.5" cy="3.5" r="1.5" fill={S} />
      <Circle cx="25.5" cy="3.5" r="1.5" fill={S} />
      <G stroke={S} strokeWidth="2.4" strokeLinejoin="round">
        <Path d="M17 19 C11 19 6.5 25 9.5 29.5 C12.5 33 17 26.5 17 21 Z" fill={lower} />
        <Path d="M19 19 C25 19 29.5 25 26.5 29.5 C23.5 33 19 26.5 19 21 Z" fill={lower} />
        <Path d="M17 17 C11 3.5 1.5 5.5 3.5 14 C5 20.5 12 20.5 17 18.5 Z" fill={upper} />
        <Path d="M19 17 C25 3.5 34.5 5.5 32.5 14 C31 20.5 24 20.5 19 18.5 Z" fill={upper} />
      </G>
      <Circle cx="9.5" cy="12.5" r="2.6" fill={parkColors.firefly} stroke={S} strokeWidth="1.2" />
      <Circle cx="26.5" cy="12.5" r="2.6" fill={parkColors.firefly} stroke={S} strokeWidth="1.2" />
      <Circle cx="5.6" cy="15.6" r="1" fill={SHINE} />
      <Circle cx="30.4" cy="15.6" r="1" fill={SHINE} />
      <Circle cx="12.4" cy="26.4" r="1.5" fill={upper} />
      <Circle cx="23.6" cy="26.4" r="1.5" fill={upper} />
      <Path d="M6.5 9.5 Q8.5 7 11.5 7.2" stroke={SHINE} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <Ellipse cx="18" cy="19.5" rx="2.4" ry="7.6" fill={S} />
      <Path d="M16.4 18 h3.2 M16.4 21 h3.2 M16.6 24 h2.8" stroke={stateColors.overloaded.soft} strokeWidth="0.9" />
      <Circle cx="18" cy="11" r="2.6" fill={S} />
    </Svg>
  );
});

/**
 * A cream rabbit with pink inner ears, a fluffy tail, whiskers and a glint in its eye; `eyesClosed`
 * is how the shared clock makes it blink.
 */
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
  const hy = sleeping ? 6 : 0; // curled up, the head rests lower
  const by = sleeping ? 44 : hopping ? 39 : 42; // the body's centre
  const tailY = hopping ? 40 : 45;
  const ears = sleeping ? 'rotate(-18 36 26)' : hopping ? 'rotate(-8 36 26)' : undefined;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="55" rx={hopping ? 15 : 20} ry="5" fill={parkColors.shadow} />
      <G stroke={S} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="14" cy={tailY} r="6.5" fill={r.body} />
        <G transform={ears}>
          <Path d="M31 24 C27 8 35 4 37 18 L36 25 Z" fill={r.body} />
          <Path d="M39 24 C38 6 47 5 46 20 L44 26 Z" fill={r.body} />
        </G>
        <Ellipse cx="29" cy={by} rx="15" ry={sleeping ? 10.5 : 12} fill={r.body} />
        {!sleeping && (
          <>
            <Ellipse cx={hopping ? 19 : 23} cy={hopping ? 49 : 52} rx="6.5" ry="3.8" fill={r.body} />
            <Ellipse cx={hopping ? 42 : 39} cy={hopping ? 47 : 52} rx="4.8" ry="3.5" fill={r.body} />
          </>
        )}
        <Circle cx="40" cy={31 + hy} r="11.5" fill={r.body} />
      </G>

      <G transform={ears}>
        <Path d="M32.6 21.5 C30.8 12.5 33.8 10 35.2 18.5 Z" fill={r.earInner} />
        <Path d="M41.2 21.5 C40.6 10.5 44.4 10.5 43.8 19.5 Z" fill={r.earInner} />
      </G>
      <Circle cx="13" cy={tailY - 1.5} r="3" fill={SHINE} />
      <Ellipse cx="30" cy={by + 3} rx="6.5" ry="4.2" fill={SHINE} />
      <Path d={`M18 ${by - 5} Q21.5 ${by - 8.5} 27 ${by - 9.5}`} stroke={SHINE} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <Path d={`M33 ${25 + hy} Q35.5 ${22 + hy} 39 ${22 + hy}`} stroke={SHINE} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {pose === 'sit' && (
        <Path d="M37.5 50.5 v2.4 M40.5 50.5 v2.4" stroke={S} strokeWidth="1.3" strokeLinecap="round" />
      )}

      <Ellipse cx="44.5" cy={35 + hy} rx="3.6" ry="2.1" fill={parkColors.blush} />
      <Path
        d={`M52 ${33.6 + hy} l6 -2.2 M52 ${35.4 + hy} l6.4 0.6 M51.6 ${37 + hy} l5.4 2.4`}
        stroke={S}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity={0.8}
      />
      <Path d={`M48.6 ${32.4 + hy} h3.4 l-1.7 2.2 Z`} fill={r.nose} stroke={S} strokeWidth="1" strokeLinejoin="round" />
      <Path d={`M50.3 ${34.8 + hy} Q49.6 ${36.8 + hy} 47.8 ${36.4 + hy}`} stroke={S} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {closed ? (
        <Path d={sleeping ? 'M41 34 Q44 36.5 46.5 34' : 'M41 28 Q44 30.5 46.5 28'} stroke={S} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <Ellipse cx="44" cy="28" rx="2.5" ry="3.1" fill={S} />
          <Circle cx="44.9" cy="26.9" r="1" fill={SHINE} />
        </>
      )}
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
      <Path d="M43.5 15 C46.5 12 49.5 13 47 17.5 Z" fill={parkColors.blush} stroke="none" />
      <Path d="M44 20 C44 12 34 10 30 14 C25 16 21 22 22 26 C23 30 32 31 38 29 C42 28 44 25 44 20 Z" fill={f.body} />
      <Ellipse cx="27" cy="25" rx="5" ry="3.6" fill={f.under} stroke="none" />
      <Ellipse cx="34.5" cy="25" rx="3.3" ry="1.9" fill={parkColors.blush} stroke="none" />
      <Path d="M31 14.6 Q34.6 12.4 38.6 13" stroke={f.spot} strokeWidth="1.8" fill="none" opacity={0.8} />
      <Ellipse cx="22.6" cy="24.4" rx="2.8" ry="2.2" fill={f.nose} stroke="none" />
      <Circle cx="21.8" cy="23.6" r="0.7" fill={f.spot} stroke="none" />
      <Path d="M23.5 27.6 Q25.6 29.2 28 28.2" stroke={S} strokeWidth="1.4" fill="none" />
      {asleep ? (
        <Path d="M30 19.5 Q33 22 36 19.5" stroke={S} strokeWidth="2.2" fill="none" />
      ) : (
        <>
          <Ellipse cx="33" cy="19" rx="2.3" ry="2.8" fill={S} stroke="none" />
          <Circle cx="33.8" cy="18" r="0.9" fill={f.spot} stroke="none" />
          <Path d="M35 16.6 L36.6 15.4" stroke={S} strokeWidth="1.2" fill="none" />
        </>
      )}
    </>
  );
}

/**
 * Static body and legs of the fawn on the bank (facing left). The shoulder sits at (54, 56) in the
 * 100x100 viewBox so `FawnNeckArt` can rotate around it cleanly without redrawing the SVG. Asleep,
 * it lies down with its head resting on its side. The far legs are a shade darker, behind.
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
          <Circle cx="57" cy="67" r="2.4" fill={f.spot} stroke="none" />
          <Circle cx="78" cy="69" r="2.2" fill={f.spot} stroke="none" />
          <Path d="M46 70 Q54 64.5 63 64" stroke={f.spot} strokeWidth="2.4" fill="none" opacity={0.75} />
          <G transform="translate(12, 52)">
            <FawnHead asleep />
          </G>
        </G>
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="62" cy="92" rx="26" ry="5.5" fill={parkColors.shadow} />
      <G strokeLinecap="round">
        <Path d="M59 62 L60 89 M77 61 L78 89" stroke={S} strokeWidth="9" fill="none" />
        <Path d="M59 62 L60 89 M77 61 L78 89" stroke={f.far} strokeWidth="4" fill="none" />
        <Path d="M60 88 L60 90 M78 88 L78 90" stroke={f.nose} strokeWidth="5" fill="none" />
        <Path d="M55 62 L54 89 M72 62 L73 89" stroke={S} strokeWidth="9" fill="none" />
        <Path d="M55 62 L54 89 M72 62 L73 89" stroke={f.body} strokeWidth="4" fill="none" />
        <Path d="M54 88 L54 90 M73 88 L73 90" stroke={f.nose} strokeWidth="5" fill="none" />
      </G>
      <G stroke={S} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M81 45 C88 43 89 52 83 54 Z" fill={f.under} />
        <Ellipse cx="64" cy="54" rx="20" ry="14" fill={f.body} />
        <Ellipse cx="62" cy="60" rx="12" ry="6.5" fill={f.under} stroke="none" />
        <Ellipse cx="49.5" cy="56" rx="4" ry="6.5" fill={f.under} stroke="none" />
        <Circle cx="56" cy="47" r="4" fill={f.spot} stroke="none" />
        <Circle cx="67" cy="46" r="3.6" fill={f.spot} stroke="none" />
        <Circle cx="75" cy="53" r="3.2" fill={f.spot} stroke="none" />
        <Circle cx="61" cy="42.5" r="2.2" fill={f.spot} stroke="none" />
        <Circle cx="72" cy="46" r="2.2" fill={f.spot} stroke="none" />
        <Circle cx="79" cy="49" r="2" fill={f.spot} stroke="none" />
        <Path d="M52 46 Q58 41.5 66 41" stroke={f.spot} strokeWidth="2.4" fill="none" opacity={0.75} />
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
        <Path d="M40 30 C40.5 41 44 51 49.5 58" stroke={f.under} strokeWidth="3.4" fill="none" />
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
