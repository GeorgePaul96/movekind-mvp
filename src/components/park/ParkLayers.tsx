import React, { useEffect, useState } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Image, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { parkColors as p } from '@/constants/colors';
import { useReduceMotion } from '@/hooks/useReduceMotion';

export type ParkLight = 'dawn' | 'day' | 'dusk' | 'night' | 'rain';

const TICK_MS = 120; // the drifting layers only; the world drawing itself never re-renders on a timer

/** A slow clock for gentle drift. Frozen at 0 when the phone asks for less motion. */
export function useDrift(): number {
  const reduce = useReduceMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setT((v) => v + TICK_MS / 1000), TICK_MS);
    return () => clearInterval(timer);
  }, [reduce]);
  return reduce ? 0 : t;
}

/** The painted daytime sky (design/park/layers/layer 1.jpg). Night keeps its own stars and moon. */
const SKY_ART = require('../../../assets/park/sky.png');
/** Painted distant ranges (design/park/layers 2), and where their ridgelines sit in the image. */
const HILL_ART = {
  far: { src: require('../../../assets/park/far.png'), ridge: 0.28, at: 0.15, fade: 0.52 },
  mid: { src: require('../../../assets/park/mid.png'), ridge: 0.2, at: 0.25, fade: 0.7 },
};

const STARS = Array.from({ length: 26 }, (_, i) => [((i * 97) % 100) / 100, ((i * 53) % 45) / 100] as const);

/** The painted sky (tinted for dawn, dusk and rain), or a starry night sky. Slowest parallax layer. */
export function SkyLayer({ width, height, light }: { width: number; height: number; light: ParkLight }) {
  const t = useDrift();
  if (light !== 'night') {
    const tint = light === 'day' ? null : p.tint[light];
    const drift = Math.sin(t * 0.08) * 10;
    return (
      <Svg width={width} height={height}>
        <Image testID="sky-art" href={SKY_ART} x={0} y={0} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
        {tint && <Rect width={width} height={height} fill={tint.color} opacity={tint.opacity} />}
        {light === 'rain' && (
          <G transform={`translate(${drift} 0)`} opacity={0.9}>
            <Ellipse cx={width * 0.18} cy={height * 0.12} rx={70} ry={10} fill={p.far.rain} />
            <Ellipse cx={width * 0.5} cy={height * 0.08} rx={90} ry={9} fill={p.far.rain} />
            <Ellipse cx={width * 0.82} cy={height * 0.17} rx={60} ry={8} fill={p.far.rain} />
          </G>
        )}
      </Svg>
    );
  }
  const sky = p.sky.night;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="park-sky-night" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={sky.top} />
          <Stop offset="0.6" stopColor={sky.low} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#park-sky-night)" />
      {STARS.map(([fx, fy], i) => (
        <Circle key={i} cx={fx * width} cy={fy * height} r={i % 4 === 0 ? 1.6 : 1} fill={p.star} opacity={0.5 + 0.5 * Math.abs(Math.sin(t * 0.5 + i))} />
      ))}
      <G testID="moon">
        <Circle cx={width * 0.72} cy={height * 0.12} r={16} fill={p.moon} />
        <Circle cx={width * 0.72 + 7} cy={height * 0.12 - 5} r={14} fill={sky.top} />
      </G>
    </Svg>
  );
}

/** One band of rolling hills with a soft mist drifting in front of it. */
export function HillLayer({
  width,
  height,
  light,
  depth,
}: {
  width: number;
  height: number;
  light: ParkLight;
  depth: 'far' | 'mid';
}) {
  const t = useDrift();
  const art = HILL_ART[depth];
  // The square painting spans the layer's width; its ridgeline lands at `at` of the screen height,
  // above the painted hilltop of the ground (about 0.32 to 0.38).
  const size = width;
  const imgY = height * art.at - size * art.ridge;
  const top = art.at + 0.06;
  const tint = light === 'day' ? null : p.tint[light];
  // The wash fades in below the peaks and out where the painting fades, so it leaves no edges.
  const tintTop = height * (art.at - 0.04);
  const tintBottom = imgY + size * art.fade;
  const mistShift = Math.sin(t * 0.3 + (depth === 'far' ? 0 : 1.7)) * 6;
  const mistId = `park-mist-${depth}-${light}`;
  const mistY = height * (top + 0.04);
  return (
    <Svg width={width} height={height}>
      <Defs>
        {tint && (
          <LinearGradient id={`${mistId}-tint`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tint.color} stopOpacity={0} />
            <Stop offset="0.3" stopColor={tint.color} stopOpacity={tint.opacity} />
            <Stop offset="0.85" stopColor={tint.color} stopOpacity={tint.opacity} />
            <Stop offset="1" stopColor={tint.color} stopOpacity={0} />
          </LinearGradient>
        )}
        <LinearGradient id={mistId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.mistTint} stopOpacity={0} />
          <Stop offset="0.5" stopColor={p.mistTint} stopOpacity={p.mist[light]} />
          <Stop offset="1" stopColor={p.mistTint} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Image testID={`${depth}-art`} href={art.src} x={0} y={imgY} width={size} height={size} />
      {tint && <Rect x={0} y={tintTop} width={width} height={tintBottom - tintTop} fill={`url(#${mistId}-tint)`} />}
      <G testID="mist" transform={`translate(${mistShift} 0)`}>
        <Rect x={-20} y={mistY} width={width + 40} height={height * 0.09} fill={`url(#${mistId})`} />
      </G>
    </Svg>
  );
}

/** Gentle rain over the whole screen (does not pan). */
export function RainLayer({ width, height }: { width: number; height: number }) {
  const t = useDrift();
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <G testID="rain">
        {Array.from({ length: 36 }, (_, i) => {
          const x = ((i * 61) % 100) / 100 * width;
          const y = (((i * 37) % 100) / 100 * height + t * 90) % height;
          return <Line key={i} x1={x} y1={y} x2={x - 3} y2={y + 12} stroke={p.river.rain.water} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />;
        })}
      </G>
    </Svg>
  );
}
